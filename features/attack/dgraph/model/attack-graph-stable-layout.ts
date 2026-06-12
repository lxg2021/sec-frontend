import type {
  AttackGraphLayoutLaneBounds,
  AttackGraphLayoutSession,
  AttackGraphModel,
  AttackGraphPoint,
} from "./attack-graph-data";
import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "./attack-graph-data";
import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";

export interface AttackGraphStableLayoutOptions {
  nodeHeight: number;
  nodeWidth: number;
  session?: AttackGraphLayoutSession | null;
}

export interface AttackGraphStableLayoutResult {
  activeLaneIds: string[];
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  nodeLaneIdById: Map<string, string>;
  nodes: AttackGraphNodeModel[];
}

type StableResourceZone =
  | "account"
  | "files"
  | "infrastructure"
  | "ipc"
  | "registry"
  | "unknown";

interface StableNodeScore {
  degree: number;
  evidenceBoost: number;
  processRelationDegree: number;
  relationPriority: number;
  score: number;
}

interface StableProcessAnchor {
  node: AttackGraphNodeModel;
  score: StableNodeScore;
}

interface StableResourceAssignment {
  anchorId: string;
  node: AttackGraphNodeModel;
  zone: StableResourceZone;
}

interface StableSlotVector {
  column: number;
  row: number;
  zone: StableResourceZone;
}

const STABLE_LANE_ID = "stable";
const PROCESS_KINDS = new Set<AttackGraphNodePresentationKind>([
  "process",
  "powershell",
  "service",
  "task",
]);
const RESOURCE_ZONE_BY_KIND: Partial<
  Record<AttackGraphNodePresentationKind, StableResourceZone>
> = {
  account: "account",
  "bits": "ipc",
  "case": "unknown",
  "case-group": "unknown",
  "case-instance": "unknown",
  "credential-theft": "account",
  crypto: "account",
  device: "infrastructure",
  "dns-name": "infrastructure",
  evidence: "unknown",
  file: "files",
  "file-stream": "files",
  host: "infrastructure",
  "host-ref": "infrastructure",
  "ipc-object": "ipc",
  mbr: "account",
  "message-hook": "ipc",
  "net-address": "infrastructure",
  "net-endpoint": "infrastructure",
  registry: "registry",
  "token-impersonation": "account",
  "url-resource": "infrastructure",
  volume: "files",
  wmi: "ipc",
  unknown: "unknown",
};
const ZONE_ORDER: StableResourceZone[] = [
  "infrastructure",
  "account",
  "ipc",
  "files",
  "registry",
  "unknown",
];
const PROCESS_LAYER_TOLERANCE = 80;
const PROCESS_X_GAP = 260;
const PROCESS_Y_GAP = 136;
const RESOURCE_X_GAP = 156;
const RESOURCE_Y_GAP = 132;
const RESOURCE_ANCHOR_GAP = 148;

export function processStableLayout(
  layoutResult: AttackGraphModel & {
    edges: AttackGraphEdgeModel[];
    nodes: AttackGraphNodeModel[];
  },
  options: AttackGraphStableLayoutOptions,
): AttackGraphStableLayoutResult {
  const nodes = layoutResult.nodes;
  if (nodes.length === 0) {
    return createEmptyStableLayout();
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const scoreByNodeId = computeStableNodeScores(layoutResult.edges, nodeById);
  const processAnchors = buildProcessAnchors(nodes, scoreByNodeId);

  if (processAnchors.length === 0) {
    return layoutWithoutProcessAnchors(nodes, options);
  }

  const processPositions = placeProcessAnchors(processAnchors, options);
  const resourceAssignments = assignResourcesToAnchors({
    edges: layoutResult.edges,
    nodes,
    processAnchors,
    scoreByNodeId,
  });
  const resourcePositions = placeResources(resourceAssignments, processPositions);
  const placedNodes = normalizePlacedNodes(
    nodes.map((node) => ({
      ...node,
      position:
        processPositions.get(node.id) ??
        resourcePositions.get(node.id) ??
        fallbackPoint(node),
    })),
  );
  const bounds = computeStableBounds(placedNodes, options);

  return {
    activeLaneIds: [STABLE_LANE_ID],
    laneBoundsById: new Map([
      [
        STABLE_LANE_ID,
        {
          height: bounds.height,
          y: 0,
        },
      ],
    ]),
    nodeLaneIdById: new Map(placedNodes.map((node) => [node.id, STABLE_LANE_ID])),
    nodes: placedNodes,
  };
}

function createEmptyStableLayout(): AttackGraphStableLayoutResult {
  return {
    activeLaneIds: [],
    laneBoundsById: new Map(),
    nodeLaneIdById: new Map(),
    nodes: [],
  };
}

function computeStableNodeScores(
  edges: AttackGraphEdgeModel[],
  nodeById: Map<string, AttackGraphNodeModel>,
) {
  const scoreByNodeId = new Map<string, StableNodeScore>();

  for (const node of nodeById.values()) {
    scoreByNodeId.set(node.id, {
      degree: 0,
      evidenceBoost: node.evidenceHit ? 3 : 0,
      processRelationDegree: 0,
      relationPriority: 0,
      score: 0,
    });
  }

  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) {
      continue;
    }

    applyEdgeScore(scoreByNodeId, source.id, edge, source, target);
    applyEdgeScore(scoreByNodeId, target.id, edge, target, source);
  }

  for (const [nodeId, score] of scoreByNodeId) {
    score.score =
      score.processRelationDegree * 2 +
      score.degree +
      score.evidenceBoost +
      score.relationPriority;
    scoreByNodeId.set(nodeId, score);
  }

  return scoreByNodeId;
}

function applyEdgeScore(
  scoreByNodeId: Map<string, StableNodeScore>,
  nodeId: string,
  edge: AttackGraphEdgeModel,
  node: AttackGraphNodeModel,
  otherNode: AttackGraphNodeModel,
) {
  const score = scoreByNodeId.get(nodeId);
  if (!score) {
    return;
  }

  score.degree += 1;
  score.relationPriority += getStableRelationPriority(edge);
  if (isProcessNode(node) || isProcessNode(otherNode)) {
    score.processRelationDegree += 1;
  }
}

function getStableRelationPriority(edge: AttackGraphEdgeModel) {
  if (edge.edgeKind === "process-execution") {
    return 4;
  }
  if (edge.edgeKind === "process-access") {
    return 3;
  }
  if (
    edge.edgeKind === "file-activity" ||
    edge.edgeKind === "registry-activity" ||
    edge.edgeKind === "network-activity"
  ) {
    return 2;
  }
  if (
    edge.edgeKind === "account-activity" ||
    edge.edgeKind === "security-impact" ||
    edge.edgeKind === "persistence"
  ) {
    return 2;
  }
  return 1;
}

function buildProcessAnchors(
  nodes: AttackGraphNodeModel[],
  scoreByNodeId: Map<string, StableNodeScore>,
): StableProcessAnchor[] {
  return nodes
    .filter(isProcessNode)
    .map((node) => ({
      node,
      score: scoreByNodeId.get(node.id) ?? createEmptyScore(node),
    }))
    .sort(compareProcessAnchors);
}

function compareProcessAnchors(
  left: StableProcessAnchor,
  right: StableProcessAnchor,
) {
  return (
    getNodeX(left.node) - getNodeX(right.node) ||
    right.score.score - left.score.score ||
    getNodeY(left.node) - getNodeY(right.node) ||
    left.node.displayName.localeCompare(right.node.displayName) ||
    left.node.id.localeCompare(right.node.id)
  );
}

function placeProcessAnchors(
  processAnchors: StableProcessAnchor[],
  options: AttackGraphStableLayoutOptions,
) {
  const layerGroups = groupProcessAnchorsByLayer(processAnchors);
  const positions = new Map<string, AttackGraphPoint>();

  layerGroups.forEach((layer, layerIndex) => {
    const sortedLayer = [...layer].sort(
      (left, right) =>
        right.score.score - left.score.score ||
        getNodeY(left.node) - getNodeY(right.node) ||
        left.node.id.localeCompare(right.node.id),
    );
    const centerOffset = (sortedLayer.length - 1) / 2;

    sortedLayer.forEach((anchor, index) => {
      positions.set(anchor.node.id, {
        x: layerIndex * PROCESS_X_GAP,
        y: (index - centerOffset) * PROCESS_Y_GAP,
      });
    });
  });

  return preservePreviousStablePositions(positions, options);
}

function groupProcessAnchorsByLayer(processAnchors: StableProcessAnchor[]) {
  const sorted = [...processAnchors].sort(
    (left, right) =>
      getNodeX(left.node) - getNodeX(right.node) ||
      getNodeY(left.node) - getNodeY(right.node) ||
      left.node.id.localeCompare(right.node.id),
  );
  const layers: StableProcessAnchor[][] = [];

  for (const anchor of sorted) {
    const lastLayer = layers[layers.length - 1];
    const firstInLastLayer = lastLayer?.[0];
    if (
      !lastLayer ||
      !firstInLastLayer ||
      Math.abs(getNodeX(anchor.node) - getNodeX(firstInLastLayer.node)) >
        PROCESS_LAYER_TOLERANCE
    ) {
      layers.push([anchor]);
    } else {
      lastLayer.push(anchor);
    }
  }

  return layers;
}

function preservePreviousStablePositions(
  positions: Map<string, AttackGraphPoint>,
  options: AttackGraphStableLayoutOptions,
) {
  if (options.session?.strategy !== "stable") {
    return positions;
  }

  const nextPositions = new Map(positions);
  for (const [nodeId, position] of positions) {
    const previous = options.session.nodePositionsById.get(nodeId);
    if (previous) {
      nextPositions.set(nodeId, previous);
    } else {
      nextPositions.set(nodeId, position);
    }
  }
  return nextPositions;
}

function assignResourcesToAnchors({
  edges,
  nodes,
  processAnchors,
  scoreByNodeId,
}: {
  edges: AttackGraphEdgeModel[];
  nodes: AttackGraphNodeModel[];
  processAnchors: StableProcessAnchor[];
  scoreByNodeId: Map<string, StableNodeScore>;
}): StableResourceAssignment[] {
  const processIds = new Set(processAnchors.map((anchor) => anchor.node.id));
  const processScoreById = new Map(
    processAnchors.map((anchor) => [anchor.node.id, anchor.score]),
  );
  const processTouchesByResourceId = collectProcessTouchesByResourceId({
    edges,
    processIds,
  });
  const fallbackAnchor = processAnchors[0];

  return nodes
    .filter((node) => !processIds.has(node.id))
    .map((node) => {
      const anchorId =
        chooseResourceAnchor({
          fallbackAnchorId: fallbackAnchor.node.id,
          processScoreById,
          touches: processTouchesByResourceId.get(node.id) ?? new Map(),
        }) ?? fallbackAnchor.node.id;

      return {
        anchorId,
        node,
        zone: getStableResourceZone(node),
      };
    })
    .sort((left, right) => {
      const leftScore = scoreByNodeId.get(left.node.id)?.score ?? 0;
      const rightScore = scoreByNodeId.get(right.node.id)?.score ?? 0;
      return (
        left.anchorId.localeCompare(right.anchorId) ||
        ZONE_ORDER.indexOf(left.zone) - ZONE_ORDER.indexOf(right.zone) ||
        rightScore - leftScore ||
        left.node.displayName.localeCompare(right.node.displayName) ||
        left.node.id.localeCompare(right.node.id)
      );
    });
}

function collectProcessTouchesByResourceId({
  edges,
  processIds,
}: {
  edges: AttackGraphEdgeModel[];
  processIds: Set<string>;
}) {
  const touchesByResourceId = new Map<string, Map<string, number>>();

  for (const edge of edges) {
    const sourceIsProcess = processIds.has(edge.source);
    const targetIsProcess = processIds.has(edge.target);
    if (sourceIsProcess === targetIsProcess) {
      continue;
    }

    const processId = sourceIsProcess ? edge.source : edge.target;
    const resourceId = sourceIsProcess ? edge.target : edge.source;
    const touches = touchesByResourceId.get(resourceId) ?? new Map();
    touches.set(
      processId,
      (touches.get(processId) ?? 0) + getStableRelationPriority(edge),
    );
    touchesByResourceId.set(resourceId, touches);
  }

  return touchesByResourceId;
}

function chooseResourceAnchor({
  fallbackAnchorId,
  processScoreById,
  touches,
}: {
  fallbackAnchorId: string;
  processScoreById: Map<string, StableNodeScore>;
  touches: Map<string, number>;
}) {
  let bestAnchorId = "";
  let bestTouchScore = Number.NEGATIVE_INFINITY;
  let bestProcessScore = Number.NEGATIVE_INFINITY;

  for (const [processId, touchScore] of touches) {
    const processScore = processScoreById.get(processId)?.score ?? 0;
    if (
      touchScore > bestTouchScore ||
      (touchScore === bestTouchScore && processScore > bestProcessScore) ||
      (touchScore === bestTouchScore &&
        processScore === bestProcessScore &&
        processId.localeCompare(bestAnchorId) < 0)
    ) {
      bestAnchorId = processId;
      bestTouchScore = touchScore;
      bestProcessScore = processScore;
    }
  }

  return bestAnchorId || fallbackAnchorId;
}

function placeResources(
  resourceAssignments: StableResourceAssignment[],
  processPositions: Map<string, AttackGraphPoint>,
) {
  const positions = new Map<string, AttackGraphPoint>();
  const assignmentsByAnchorAndZone = new Map<string, StableResourceAssignment[]>();

  for (const assignment of resourceAssignments) {
    const key = `${assignment.anchorId}::${assignment.zone}`;
    assignmentsByAnchorAndZone.set(key, [
      ...(assignmentsByAnchorAndZone.get(key) ?? []),
      assignment,
    ]);
  }

  for (const [key, assignments] of assignmentsByAnchorAndZone) {
    const [anchorId, zone] = key.split("::") as [string, StableResourceZone];
    const anchorPosition = processPositions.get(anchorId) ?? { x: 0, y: 0 };
    const sortedAssignments = [...assignments].sort(
      (left, right) =>
        left.node.displayName.localeCompare(right.node.displayName) ||
        left.node.id.localeCompare(right.node.id),
    );

    sortedAssignments.forEach((assignment, index) => {
      const slot = getStableSlotVector(zone, index);
      positions.set(assignment.node.id, {
        x:
          anchorPosition.x +
          slot.column * RESOURCE_X_GAP +
          Math.sign(slot.column) * RESOURCE_ANCHOR_GAP,
        y: anchorPosition.y + slot.row * RESOURCE_Y_GAP,
      });
    });
  }

  return positions;
}

function getStableSlotVector(
  zone: StableResourceZone,
  index: number,
): StableSlotVector {
  const lane = Math.floor(index / 2);
  const side = index % 2 === 0 ? 1 : -1;
  const depth = lane + 1;

  if (zone === "infrastructure") {
    return { column: side, row: -depth, zone };
  }
  if (zone === "account") {
    return { column: -depth, row: -1 - lane, zone };
  }
  if (zone === "ipc") {
    return { column: depth, row: -1 - lane, zone };
  }
  if (zone === "registry") {
    return { column: depth, row: 1 + lane, zone };
  }
  if (zone === "files") {
    return { column: side, row: depth, zone };
  }
  return { column: side, row: 2 + lane, zone };
}

function layoutWithoutProcessAnchors(
  nodes: AttackGraphNodeModel[],
  options: AttackGraphStableLayoutOptions,
): AttackGraphStableLayoutResult {
  const sorted = [...nodes].sort(
    (left, right) =>
      getNodeX(left) - getNodeX(right) ||
      getNodeY(left) - getNodeY(right) ||
      left.displayName.localeCompare(right.displayName) ||
      left.id.localeCompare(right.id),
  );
  const centerOffset = (sorted.length - 1) / 2;
  const placedNodes = normalizePlacedNodes(
    sorted.map((node, index) => ({
      ...node,
      position: {
        x: Math.floor(index / 4) * PROCESS_X_GAP,
        y: (index - centerOffset) * RESOURCE_Y_GAP,
      },
    })),
  );
  const bounds = computeStableBounds(placedNodes, options);

  return {
    activeLaneIds: [STABLE_LANE_ID],
    laneBoundsById: new Map([
      [
        STABLE_LANE_ID,
        {
          height: bounds.height,
          y: 0,
        },
      ],
    ]),
    nodeLaneIdById: new Map(placedNodes.map((node) => [node.id, STABLE_LANE_ID])),
    nodes: placedNodes,
  };
}

function normalizePlacedNodes(nodes: AttackGraphNodeModel[]) {
  if (nodes.length === 0) {
    return nodes;
  }

  const minX = Math.min(...nodes.map((node) => node.position?.x ?? 0));
  const minY = Math.min(...nodes.map((node) => node.position?.y ?? 0));

  return nodes.map((node) => ({
    ...node,
    position: {
      x: (node.position?.x ?? 0) - minX,
      y: (node.position?.y ?? 0) - minY,
    } as AttackGraphPoint,
  }));
}

function computeStableBounds(
  nodes: AttackGraphNodeModel[],
  options: AttackGraphStableLayoutOptions,
) {
  if (nodes.length === 0) {
    return { height: 0, width: 0 };
  }

  const minX = Math.min(...nodes.map((node) => node.position?.x ?? 0));
  const minY = Math.min(...nodes.map((node) => node.position?.y ?? 0));
  const maxX = Math.max(
    ...nodes.map((node) => (node.position?.x ?? 0) + options.nodeWidth),
  );
  const maxY = Math.max(
    ...nodes.map((node) => (node.position?.y ?? 0) + options.nodeHeight),
  );

  return {
    height: maxY - minY,
    width: maxX - minX,
  };
}

function createEmptyScore(node: AttackGraphNodeModel): StableNodeScore {
  return {
    degree: 0,
    evidenceBoost: node.evidenceHit ? 3 : 0,
    processRelationDegree: 0,
    relationPriority: 0,
    score: node.evidenceHit ? 3 : 0,
  };
}

function getStableResourceZone(node: AttackGraphNodeModel): StableResourceZone {
  return RESOURCE_ZONE_BY_KIND[node.presentationKind] ?? "unknown";
}

function isProcessNode(node: AttackGraphNodeModel) {
  return PROCESS_KINDS.has(node.presentationKind);
}

function fallbackPoint(node: AttackGraphNodeModel): AttackGraphPoint {
  return {
    x: getNodeX(node),
    y: getNodeY(node),
  };
}

function getNodeX(node: AttackGraphNodeModel) {
  return node.position?.x ?? 0;
}

function getNodeY(node: AttackGraphNodeModel) {
  return node.position?.y ?? 0;
}
