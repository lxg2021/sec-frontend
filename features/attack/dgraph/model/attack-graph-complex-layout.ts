import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutSession,
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
} from "./attack-graph-data";
import {
  getAttackGraphEdgeLayoutRole,
  type AttackGraphEdgeLayoutRole,
} from "./attack-graph-edge-config";
import {
  alignAttackGraphMainChains,
  isForwardNearLayerEdge,
} from "./attack-graph-main-chain-alignment";
import { ATTACK_GRAPH_NODE_KIND_CONFIG } from "./attack-graph-node-config";

export interface AttackGraphComplexLayoutOptions {
  nodeHeight: number;
  nodeWidth: number;
  rankGap: number;
  rowGap: number;
  session?: AttackGraphLayoutSession | null;
}

export interface AttackGraphComplexLayoutResult {
  nodes: AttackGraphNodeModel[];
  stableCenterNodeId?: string;
}

interface NodeScore {
  degree: number;
  inDegree: number;
  outDegree: number;
  priority: number;
}

interface PositionedAttachmentNode {
  anchorId: string;
  nodeId: string;
  position: AttackGraphPoint;
}

const GRAPH_PADDING = 40;
const MAX_RELAXATION_PASSES = 5;
const ATTACHMENT_NODE_GAP = 20;

export function processComplexLayeredLayout(
  graph: AttackGraphModel,
  options: AttackGraphComplexLayoutOptions,
): AttackGraphComplexLayoutResult {
  if (graph.nodes.length === 0) {
    return createEmptyComplexLayout();
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const relationEdges = graph.edges.filter(
    (edge) => edge.source !== edge.target && nodeById.has(edge.source) && nodeById.has(edge.target),
  );
  const layoutEdges = getPrimaryLayoutEdges(relationEdges);
  const scoreByNodeId = computeNodeScores(graph.nodes, layoutEdges);
  const layerByNodeId = assignNodeLayers(graph.nodes, layoutEdges, scoreByNodeId);
  const layers = buildOrderedLayers({
    edges: layoutEdges,
    layerByNodeId,
    nodes: graph.nodes,
    scoreByNodeId,
    session: options.session,
  });
  const positionedById = new Map<string, AttackGraphPoint>();
  const maxLayerHeight = Math.max(...layers.map((layer) => layer.length), 1);
  const graphContentHeight =
    maxLayerHeight * options.nodeHeight +
    Math.max(0, maxLayerHeight - 1) * options.rowGap;

  layers.forEach((layer, layerIndex) => {
    const layerHeight =
      layer.length * options.nodeHeight +
      Math.max(0, layer.length - 1) * options.rowGap;
    const layerTop = GRAPH_PADDING + Math.max(0, (graphContentHeight - layerHeight) / 2);
    const x = GRAPH_PADDING + layerIndex * (options.nodeWidth + options.rankGap);

    layer.forEach((node, rowIndex) => {
      positionedById.set(node.id, {
        x,
        y: layerTop + rowIndex * (options.nodeHeight + options.rowGap),
      });
    });
  });
  balanceFanoutGroups({
    layoutEdges,
    options,
    positionedById,
  });
  alignAttackGraphMainChains({
    ignoredCollisionNodeIds: getLocalLayoutNodeIds({
      graph,
      layoutEdges,
      relationEdges,
    }),
    layoutEdges,
    options,
    positionedById,
  });
  placeAttachmentNodes({
    graph,
    layoutEdges,
    options,
    positionedById,
    relationEdges,
  });

  const nodes = graph.nodes.map((node) => ({
    ...node,
    position: positionedById.get(node.id) ?? { x: GRAPH_PADDING, y: GRAPH_PADDING },
  }));

  return {
    nodes,
    stableCenterNodeId: chooseComplexCenterNodeId(graph.nodes, scoreByNodeId),
  };
}

function createEmptyComplexLayout(): AttackGraphComplexLayoutResult {
  return {
    nodes: [],
  };
}

function getPrimaryLayoutEdges(edges: AttackGraphEdgeModel[]) {
  return edges.filter((edge) => {
    const role = getAttackGraphEdgeLayoutRole(edge.relationType);
    return role === "primary" || role === "action";
  });
}

function balanceFanoutGroups({
  layoutEdges,
  options,
  positionedById,
}: {
  layoutEdges: AttackGraphEdgeModel[];
  options: AttackGraphComplexLayoutOptions;
  positionedById: Map<string, AttackGraphPoint>;
}) {
  const outgoingByNodeId = new Map<string, AttackGraphEdgeModel[]>();
  const incomingCountByNodeId = new Map<string, number>();

  for (const edge of layoutEdges) {
    outgoingByNodeId.set(edge.source, [
      ...(outgoingByNodeId.get(edge.source) ?? []),
      edge,
    ]);
    incomingCountByNodeId.set(
      edge.target,
      (incomingCountByNodeId.get(edge.target) ?? 0) + 1,
    );
  }

  const fanoutGroups = [...outgoingByNodeId.entries()]
    .map(([sourceId, edges]) => ({
      edges: edges.filter((edge) => isForwardNearLayerEdge(edge, positionedById, options)),
      sourceId,
    }))
    .filter((group) => group.edges.length >= 2)
    .sort((left, right) => {
      const leftPosition = positionedById.get(left.sourceId);
      const rightPosition = positionedById.get(right.sourceId);
      return (leftPosition?.x ?? 0) - (rightPosition?.x ?? 0);
    });

  for (const group of fanoutGroups) {
    const sourcePosition = positionedById.get(group.sourceId);
    if (!sourcePosition) {
      continue;
    }

    const targetPositions = group.edges
      .map((edge) => positionedById.get(edge.target))
      .filter((position): position is AttackGraphPoint => Boolean(position));
    if (targetPositions.length < 2) {
      continue;
    }

    const targetCenterY =
      targetPositions.reduce(
        (total, position) => total + position.y + options.nodeHeight / 2,
        0,
      ) / targetPositions.length;
    const desiredY = targetCenterY - options.nodeHeight / 2;
    const incomingCount = incomingCountByNodeId.get(group.sourceId) ?? 0;
    const balanceStrength = incomingCount > 0 ? 0.58 : 1;
    const nextY =
      sourcePosition.y + (desiredY - sourcePosition.y) * balanceStrength;

    positionedById.set(group.sourceId, {
      ...sourcePosition,
      y: Math.max(GRAPH_PADDING, nextY),
    });
  }
}

function placeAttachmentNodes({
  graph,
  layoutEdges,
  options,
  positionedById,
  relationEdges,
}: {
  graph: AttackGraphModel;
  layoutEdges: AttackGraphEdgeModel[];
  options: AttackGraphComplexLayoutOptions;
  positionedById: Map<string, AttackGraphPoint>;
  relationEdges: AttackGraphEdgeModel[];
}) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const primaryNodeIds = new Set(
    layoutEdges.flatMap((edge) => [edge.source, edge.target]),
  );
  const placedAttachments: PositionedAttachmentNode[] = [];

  for (const edge of relationEdges) {
    const role = getAttackGraphEdgeLayoutRole(edge.relationType);
    if (!isLocalLayoutRole(role)) {
      continue;
    }

    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const sourcePosition = positionedById.get(edge.source);
    const targetPosition = positionedById.get(edge.target);
    if (!sourceNode || !targetNode || !sourcePosition || !targetPosition) {
      continue;
    }

    const attachment = chooseAttachmentEndpoint({
      primaryNodeIds,
      sourceNode,
      targetNode,
    });
    if (!attachment) {
      continue;
    }

    const anchorPosition = positionedById.get(attachment.anchor.id);
    if (!anchorPosition) {
      continue;
    }

    const nextPosition = chooseAttachmentPosition({
      anchorNode: attachment.anchor,
      anchorPosition,
      attachmentNode: attachment.node,
      graph,
      layoutEdges,
      options,
      placedAttachments,
      positionedById,
    });
    positionedById.set(attachment.node.id, nextPosition);
    placedAttachments.push({
      anchorId: attachment.anchor.id,
      nodeId: attachment.node.id,
      position: nextPosition,
    });
  }
}

function isLocalLayoutRole(role: AttackGraphEdgeLayoutRole) {
  return role === "attachment" || role === "reference" || role === "backlink";
}

function getLocalLayoutNodeIds({
  graph,
  layoutEdges,
  relationEdges,
}: {
  graph: AttackGraphModel;
  layoutEdges: AttackGraphEdgeModel[];
  relationEdges: AttackGraphEdgeModel[];
}) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const primaryNodeIds = new Set(
    layoutEdges.flatMap((edge) => [edge.source, edge.target]),
  );
  const localNodeIds = new Set<string>();

  for (const edge of relationEdges) {
    const role = getAttackGraphEdgeLayoutRole(edge.relationType);
    if (!isLocalLayoutRole(role)) {
      continue;
    }

    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    if (!sourceNode || !targetNode) {
      continue;
    }

    const attachment = chooseAttachmentEndpoint({
      primaryNodeIds,
      sourceNode,
      targetNode,
    });
    if (attachment) {
      localNodeIds.add(attachment.node.id);
    }
  }

  return localNodeIds;
}

function chooseAttachmentEndpoint({
  primaryNodeIds,
  sourceNode,
  targetNode,
}: {
  primaryNodeIds: Set<string>;
  sourceNode: AttackGraphNodeModel;
  targetNode: AttackGraphNodeModel;
}) {
  const sourceIsPrimary = primaryNodeIds.has(sourceNode.id);
  const targetIsPrimary = primaryNodeIds.has(targetNode.id);
  if (sourceIsPrimary && targetIsPrimary) {
    return null;
  }
  if (sourceIsPrimary && !targetIsPrimary) {
    return {
      anchor: sourceNode,
      node: targetNode,
    };
  }
  if (targetIsPrimary && !sourceIsPrimary) {
    return {
      anchor: targetNode,
      node: sourceNode,
    };
  }

  const sourceWeight = getNodeLayoutAnchorWeight(sourceNode);
  const targetWeight = getNodeLayoutAnchorWeight(targetNode);
  if (sourceWeight !== targetWeight) {
    return sourceWeight > targetWeight
      ? { anchor: sourceNode, node: targetNode }
      : { anchor: targetNode, node: sourceNode };
  }

  return sourceNode.id.localeCompare(targetNode.id) <= 0
    ? { anchor: targetNode, node: sourceNode }
    : { anchor: sourceNode, node: targetNode };
}

function getNodeLayoutAnchorWeight(node: AttackGraphNodeModel) {
  switch (node.presentationKind) {
    case "process":
      return 100;
    case "service":
    case "task":
    case "powershell":
      return 82;
    case "host":
    case "host-ref":
    case "device":
    case "net-endpoint":
      return 72;
    case "account":
    case "credential-theft":
    case "token-impersonation":
      return 64;
    case "file":
    case "file-stream":
    case "registry":
    case "dns-name":
    case "net-address":
    case "url-resource":
      return 42;
    case "case":
    case "case-group":
    case "case-instance":
    case "evidence":
      return 18;
    default:
      return 30;
  }
}

function chooseAttachmentPosition({
  anchorNode,
  anchorPosition,
  attachmentNode,
  graph,
  layoutEdges,
  options,
  placedAttachments,
  positionedById,
}: {
  anchorNode: AttackGraphNodeModel;
  anchorPosition: AttackGraphPoint;
  attachmentNode: AttackGraphNodeModel;
  graph: AttackGraphModel;
  layoutEdges: AttackGraphEdgeModel[];
  options: AttackGraphComplexLayoutOptions;
  placedAttachments: PositionedAttachmentNode[];
  positionedById: Map<string, AttackGraphPoint>;
}) {
  const candidatePositions = buildAttachmentCandidatePositions({
    anchorNode,
    anchorPosition,
    attachmentNode,
    options,
    placedAttachments,
  });
  const occupiedRects = graph.nodes
    .filter((node) => node.id !== attachmentNode.id)
    .flatMap((node) => {
      const position = positionedById.get(node.id);
      return position
        ? [
            {
              nodeId: node.id,
              x: position.x,
              y: position.y,
              width: options.nodeWidth,
              height: options.nodeHeight,
            },
          ]
        : [];
    });
  const layoutCorridors = buildLayoutEdgeCorridors({
    edges: layoutEdges,
    options,
    positionedById,
  });

  return candidatePositions
    .map((position) => ({
      position,
      score: scoreAttachmentPosition({
        anchorPosition,
        layoutCorridors,
        occupiedRects,
        options,
        position,
      }),
    }))
    .sort((left, right) => left.score - right.score)[0]?.position ??
    attachmentNode.position ??
    anchorPosition;
}

function buildAttachmentCandidatePositions({
  anchorNode,
  anchorPosition,
  attachmentNode,
  options,
  placedAttachments,
}: {
  anchorNode: AttackGraphNodeModel;
  anchorPosition: AttackGraphPoint;
  attachmentNode: AttackGraphNodeModel;
  options: AttackGraphComplexLayoutOptions;
  placedAttachments: PositionedAttachmentNode[];
}) {
  const sameAnchorCount = placedAttachments.filter(
    (item) => item.anchorId === anchorNode.id,
  ).length;
  const verticalStep = Math.max(options.nodeHeight * 0.62, 68);
  const nearbyOffset = sameAnchorCount * verticalStep;
  const horizontalGap = Math.max(ATTACHMENT_NODE_GAP, options.nodeWidth * 0.26);
  const side = getPreferredAttachmentSide(anchorNode, attachmentNode);
  const xOffset = options.nodeWidth + horizontalGap;
  const leftX = anchorPosition.x - xOffset;
  const rightX = anchorPosition.x + xOffset;
  const sameColumnX = anchorPosition.x;
  const y = anchorPosition.y + nearbyOffset;
  const aboveY = anchorPosition.y - options.nodeHeight - ATTACHMENT_NODE_GAP - nearbyOffset;
  const belowY = anchorPosition.y + options.nodeHeight + ATTACHMENT_NODE_GAP + nearbyOffset;

  const primarySideX = side === "left" ? leftX : rightX;
  const secondarySideX = side === "left" ? rightX : leftX;

  return [
    { x: primarySideX, y },
    { x: primarySideX, y: y - verticalStep },
    { x: primarySideX, y: y + verticalStep },
    { x: primarySideX, y: y - verticalStep * 2 },
    { x: primarySideX, y: y + verticalStep * 2 },
    { x: secondarySideX, y },
    { x: secondarySideX, y: y - verticalStep },
    { x: secondarySideX, y: y + verticalStep },
    { x: secondarySideX, y: y - verticalStep * 2 },
    { x: secondarySideX, y: y + verticalStep * 2 },
    { x: sameColumnX, y: aboveY },
    { x: sameColumnX, y: belowY },
  ].map((position) => ({
    x: Math.max(GRAPH_PADDING, position.x),
    y: Math.max(GRAPH_PADDING, position.y),
  }));
}

function getPreferredAttachmentSide(
  anchorNode: AttackGraphNodeModel,
  attachmentNode: AttackGraphNodeModel,
): "left" | "right" {
  if (
    anchorNode.presentationKind === "net-endpoint" &&
    attachmentNode.presentationKind === "net-address"
  ) {
    return "left";
  }
  if (
    attachmentNode.presentationKind === "file" ||
    attachmentNode.presentationKind === "file-stream" ||
    attachmentNode.presentationKind === "registry"
  ) {
    return "right";
  }
  return "left";
}

function scoreAttachmentPosition({
  anchorPosition,
  layoutCorridors,
  occupiedRects,
  options,
  position,
}: {
  anchorPosition: AttackGraphPoint;
  layoutCorridors: Array<{
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  }>;
  occupiedRects: Array<{
    height: number;
    nodeId: string;
    width: number;
    x: number;
    y: number;
  }>;
  options: AttackGraphComplexLayoutOptions;
  position: AttackGraphPoint;
}) {
  const candidateRect = {
    x: position.x,
    y: position.y,
    width: options.nodeWidth,
    height: options.nodeHeight,
  };
  const overlapPenalty = occupiedRects.filter((rect) =>
    rectsIntersect(expandRect(candidateRect, 10), expandRect(rect, 10)),
  ).length * 10000;
  const corridorPenalty = layoutCorridors.filter((corridor) =>
    segmentIntersectsRect(corridor, expandRect(candidateRect, 12)),
  ).length * 3600;
  const distancePenalty =
    Math.abs(position.x - anchorPosition.x) * 0.8 +
    Math.abs(position.y - anchorPosition.y) * 1.2;
  const topPenalty = position.y <= GRAPH_PADDING ? 1200 : 0;

  return overlapPenalty + corridorPenalty + distancePenalty + topPenalty;
}

function buildLayoutEdgeCorridors({
  edges,
  options,
  positionedById,
}: {
  edges: AttackGraphEdgeModel[];
  options: AttackGraphComplexLayoutOptions;
  positionedById: Map<string, AttackGraphPoint>;
}) {
  return edges.flatMap((edge) => {
    const sourcePosition = positionedById.get(edge.source);
    const targetPosition = positionedById.get(edge.target);
    if (!sourcePosition || !targetPosition) {
      return [];
    }

    return [
      {
        x1: sourcePosition.x + options.nodeWidth / 2,
        y1: sourcePosition.y + options.nodeHeight / 2,
        x2: targetPosition.x + options.nodeWidth / 2,
        y2: targetPosition.y + options.nodeHeight / 2,
      },
    ];
  });
}

function expandRect(
  rect: { height: number; width: number; x: number; y: number },
  padding: number,
) {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function rectsIntersect(
  left: { height: number; width: number; x: number; y: number },
  right: { height: number; width: number; x: number; y: number },
) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function segmentIntersectsRect(
  segment: { x1: number; y1: number; x2: number; y2: number },
  rect: { height: number; width: number; x: number; y: number },
) {
  if (
    pointInRect(segment.x1, segment.y1, rect) ||
    pointInRect(segment.x2, segment.y2, rect)
  ) {
    return true;
  }

  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  return (
    lineSegmentsIntersect(segment, { x1: left, y1: top, x2: right, y2: top }) ||
    lineSegmentsIntersect(segment, { x1: right, y1: top, x2: right, y2: bottom }) ||
    lineSegmentsIntersect(segment, { x1: right, y1: bottom, x2: left, y2: bottom }) ||
    lineSegmentsIntersect(segment, { x1: left, y1: bottom, x2: left, y2: top })
  );
}

function pointInRect(
  x: number,
  y: number,
  rect: { height: number; width: number; x: number; y: number },
) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

function lineSegmentsIntersect(
  first: { x1: number; y1: number; x2: number; y2: number },
  second: { x1: number; y1: number; x2: number; y2: number },
) {
  const d1 = direction(second.x1, second.y1, second.x2, second.y2, first.x1, first.y1);
  const d2 = direction(second.x1, second.y1, second.x2, second.y2, first.x2, first.y2);
  const d3 = direction(first.x1, first.y1, first.x2, first.y2, second.x1, second.y1);
  const d4 = direction(first.x1, first.y1, first.x2, first.y2, second.x2, second.y2);

  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

function direction(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax);
}

function assignNodeLayers(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
  scoreByNodeId: Map<string, NodeScore>,
) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incomingCountByNodeId = new Map(nodes.map((node) => [node.id, 0]));
  const outgoingByNodeId = new Map<string, string[]>(
    nodes.map((node) => [node.id, []]),
  );
  const layerByNodeId = new Map<string, number>();

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }
    incomingCountByNodeId.set(
      edge.target,
      (incomingCountByNodeId.get(edge.target) ?? 0) + 1,
    );
    outgoingByNodeId.set(edge.source, [
      ...(outgoingByNodeId.get(edge.source) ?? []),
      edge.target,
    ]);
  }

  const queue = nodes
    .filter((node) => (incomingCountByNodeId.get(node.id) ?? 0) === 0)
    .sort((left, right) => compareNodesByScore(left, right, scoreByNodeId));

  for (const node of queue) {
    layerByNodeId.set(node.id, 0);
  }

  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++];
    const currentLayer = layerByNodeId.get(current.id) ?? 0;

    for (const childId of outgoingByNodeId.get(current.id) ?? []) {
      layerByNodeId.set(childId, Math.max(layerByNodeId.get(childId) ?? 0, currentLayer + 1));
      incomingCountByNodeId.set(childId, (incomingCountByNodeId.get(childId) ?? 0) - 1);
      if (incomingCountByNodeId.get(childId) === 0) {
        const child = nodes.find((node) => node.id === childId);
        if (child) {
          queue.push(child);
        }
      }
    }
  }

  const unresolved = nodes
    .filter((node) => !layerByNodeId.has(node.id))
    .sort((left, right) => compareNodesByScore(left, right, scoreByNodeId));
  const anchorLayer = Math.max(0, ...layerByNodeId.values());
  unresolved.forEach((node, index) => {
    layerByNodeId.set(node.id, anchorLayer + Math.floor(index / 4));
  });

  relaxLayersForward(edges, layerByNodeId);

  return normalizeLayers(layerByNodeId);
}

function relaxLayersForward(
  edges: AttackGraphEdgeModel[],
  layerByNodeId: Map<string, number>,
) {
  for (let pass = 0; pass < MAX_RELAXATION_PASSES; pass += 1) {
    let moved = false;

    for (const edge of edges) {
      const sourceLayer = layerByNodeId.get(edge.source);
      const targetLayer = layerByNodeId.get(edge.target);
      if (sourceLayer === undefined || targetLayer === undefined) {
        continue;
      }
      if (targetLayer <= sourceLayer) {
        layerByNodeId.set(edge.target, sourceLayer + 1);
        moved = true;
      }
    }

    if (!moved) {
      break;
    }
  }
}

function normalizeLayers(layerByNodeId: Map<string, number>) {
  if (layerByNodeId.size === 0) {
    return layerByNodeId;
  }

  const minLayer = Math.min(...layerByNodeId.values());
  return new Map(
    [...layerByNodeId.entries()].map(([nodeId, layer]) => [
      nodeId,
      Math.max(0, layer - minLayer),
    ]),
  );
}

function buildOrderedLayers({
  edges,
  layerByNodeId,
  nodes,
  scoreByNodeId,
  session,
}: {
  edges: AttackGraphEdgeModel[];
  layerByNodeId: Map<string, number>;
  nodes: AttackGraphNodeModel[];
  scoreByNodeId: Map<string, NodeScore>;
  session?: AttackGraphLayoutSession | null;
}) {
  const maxLayer = Math.max(0, ...layerByNodeId.values());
  let layers: AttackGraphNodeModel[][] = Array.from(
    { length: maxLayer + 1 },
    () => [],
  );

  for (const node of nodes) {
    const layer = layerByNodeId.get(node.id) ?? 0;
    layers[layer].push(node);
  }

  layers = layers.map((layer) =>
    layer.sort((left, right) =>
      compareNodesWithinLayer(left, right, scoreByNodeId, session),
    ),
  );

  for (let pass = 0; pass < 3; pass += 1) {
    for (let index = 1; index < layers.length; index += 1) {
      layers[index] = sortByNeighborBarycenter(layers[index], layers[index - 1], edges);
    }
    for (let index = layers.length - 2; index >= 0; index -= 1) {
      layers[index] = sortByNeighborBarycenter(layers[index], layers[index + 1], edges);
    }
  }

  return layers.filter((layer) => layer.length > 0);
}

function sortByNeighborBarycenter(
  layer: AttackGraphNodeModel[],
  neighborLayer: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
) {
  if (layer.length <= 1 || neighborLayer.length === 0) {
    return layer;
  }

  const neighborIndexById = new Map(
    neighborLayer.map((node, index) => [node.id, index]),
  );

  return [...layer].sort((left, right) => {
    const leftBarycenter = getNeighborBarycenter(left.id, edges, neighborIndexById);
    const rightBarycenter = getNeighborBarycenter(right.id, edges, neighborIndexById);

    return (
      leftBarycenter - rightBarycenter ||
      left.displayName.localeCompare(right.displayName) ||
      left.id.localeCompare(right.id)
    );
  });
}

function getNeighborBarycenter(
  nodeId: string,
  edges: AttackGraphEdgeModel[],
  neighborIndexById: Map<string, number>,
) {
  const indexes: number[] = [];
  for (const edge of edges) {
    if (edge.source === nodeId && neighborIndexById.has(edge.target)) {
      indexes.push(neighborIndexById.get(edge.target) ?? 0);
    }
    if (edge.target === nodeId && neighborIndexById.has(edge.source)) {
      indexes.push(neighborIndexById.get(edge.source) ?? 0);
    }
  }

  if (indexes.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return indexes.reduce((total, value) => total + value, 0) / indexes.length;
}

function computeNodeScores(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
) {
  const scoreByNodeId = new Map<string, NodeScore>();
  for (const node of nodes) {
    scoreByNodeId.set(node.id, {
      degree: 0,
      inDegree: 0,
      outDegree: 0,
      priority: ATTACK_GRAPH_NODE_KIND_CONFIG[node.presentationKind]?.priority ?? 0,
    });
  }

  for (const edge of edges) {
    const sourceScore = scoreByNodeId.get(edge.source);
    const targetScore = scoreByNodeId.get(edge.target);
    if (sourceScore) {
      sourceScore.degree += 1;
      sourceScore.outDegree += 1;
    }
    if (targetScore) {
      targetScore.degree += 1;
      targetScore.inDegree += 1;
    }
  }

  return scoreByNodeId;
}

function chooseComplexCenterNodeId(
  nodes: AttackGraphNodeModel[],
  scoreByNodeId: Map<string, NodeScore>,
) {
  return [...nodes].sort((left, right) =>
    compareNodesByScore(left, right, scoreByNodeId),
  )[0]?.id;
}

function compareNodesByScore(
  left: AttackGraphNodeModel,
  right: AttackGraphNodeModel,
  scoreByNodeId: Map<string, NodeScore>,
) {
  const leftScore = scoreByNodeId.get(left.id);
  const rightScore = scoreByNodeId.get(right.id);

  return (
    (rightScore?.degree ?? 0) - (leftScore?.degree ?? 0) ||
    (rightScore?.outDegree ?? 0) - (leftScore?.outDegree ?? 0) ||
    (rightScore?.priority ?? 0) - (leftScore?.priority ?? 0) ||
    left.displayName.localeCompare(right.displayName) ||
    left.id.localeCompare(right.id)
  );
}

function compareNodesWithinLayer(
  left: AttackGraphNodeModel,
  right: AttackGraphNodeModel,
  scoreByNodeId: Map<string, NodeScore>,
  session?: AttackGraphLayoutSession | null,
) {
  const leftPrevious = session?.nodePositionsById.get(left.id);
  const rightPrevious = session?.nodePositionsById.get(right.id);

  return (
    (leftPrevious?.y ?? 0) - (rightPrevious?.y ?? 0) ||
    compareNodesByScore(left, right, scoreByNodeId)
  );
}
