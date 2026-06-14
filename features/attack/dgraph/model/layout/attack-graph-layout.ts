import ELK, {
  type ElkNode,
} from "elkjs/lib/elk.bundled";

import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutSession,
  AttackGraphLayoutOptions,
  AttackGraphLayoutResult,
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
  AttackGraphTopologyDiagnostics,
} from "../core/attack-graph-data";
import { processLinearChainLayout } from "./attack-graph-chain-layout";
import { processComplexLayeredLayout } from "./attack-graph-complex-layout";
import {
  processMultiSourceFaninLayout,
  processSingleSourceFanoutLayout,
} from "./attack-graph-fanout-layout";
import { ATTACK_GRAPH_NODE_KIND_CONFIG } from "../node/attack-graph-node-config";
import { classifyAttackGraphTopology } from "./attack-graph-topology";
import { processTreeLayout } from "./attack-graph-tree-layout";
import {
  buildAttackGraphEdgeRoutes,
  type AttackGraphEdgeRouteData,
  type AttackGraphNodeEdgeGeometry,
} from "../edge/attack-graph-edge-routing";

const DEFAULT_NODE_WIDTH = 208;
const DEFAULT_NODE_HEIGHT = 56;
const DEFAULT_NODE_SEP = 96;
const DEFAULT_RANK_SEP = 132;
const DEFAULT_GRAPH_PADDING = 40;
const DEFAULT_PORT_SIZE = 1;
const ELK_ICON_NODE_SIZE = 58;
const LARGE_GRAPH_EDGE_LIMIT = 28;
const LARGE_GRAPH_NODE_LIMIT = 20;
const STRESS_ENDPOINT_ANGLE_BUCKET_SIZE = Math.PI / 8;

const elk = new ELK({
  defaultLayoutOptions: {
    "elk.algorithm": "layered",
  },
});

type AttackGraphElkAlgorithm = "layered" | "stress";

export async function layoutAttackGraph(
  graph: AttackGraphModel,
  options: AttackGraphLayoutOptions = {},
): Promise<AttackGraphLayoutResult> {
  const direction = options.direction ?? "LR";
  const nodeWidth = options.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = options.nodeHeight ?? DEFAULT_NODE_HEIGHT;
  const nodeSep = options.nodeSep ?? DEFAULT_NODE_SEP;
  const rankSep = options.rankSep ?? DEFAULT_RANK_SEP;
  const topology = classifyAttackGraphTopology(graph);
  const strategy =
    options.strategy ?? chooseAttackGraphLayoutStrategy(graph, topology);
  const previousSession =
    options.session?.caseId === graph.caseId &&
    options.session.strategy === strategy
      ? options.session
      : null;

  if (strategy === "stress") {
    return layoutStressAttackGraph({
      direction,
      graph,
      newNodeIds: getNewNodeIds(graph.nodes, previousSession),
      nodeHeight,
      nodeSep,
      nodeWidth,
      previousSession,
      rankSep,
      strategy,
      topologyDiagnostics: topology.diagnostics,
      topologyKind: topology.kind,
    });
  }

  return layoutLayeredAttackGraph({
    graph,
    newNodeIds: getNewNodeIds(graph.nodes, previousSession),
    nodeHeight,
    nodeWidth,
    previousSession,
    rankSep,
    strategy,
    topology,
  });
}

function chooseAttackGraphLayoutStrategy(
  graph: AttackGraphModel,
  topology: ReturnType<typeof classifyAttackGraphTopology>,
): AttackGraphLayoutSession["strategy"] {
  if (shouldUseStressLayout(graph, topology)) {
    return "stress";
  }

  return "layered";
}

function shouldUseStressLayout(
  graph: AttackGraphModel,
  topology: ReturnType<typeof classifyAttackGraphTopology>,
) {
  if (
    graph.nodes.length >= LARGE_GRAPH_NODE_LIMIT ||
    graph.edges.length >= LARGE_GRAPH_EDGE_LIMIT
  ) {
    return true;
  }

  const relationEdgeCount = topology.diagnostics.relationEdgeCount;
  const density =
    graph.nodes.length > 0 ? relationEdgeCount / graph.nodes.length : 0;
  return graph.nodes.length >= 12 && density >= 1.65;
}

function layoutLayeredAttackGraph({
  graph,
  newNodeIds,
  nodeHeight,
  nodeWidth,
  previousSession,
  rankSep,
  strategy,
  topology,
}: {
  graph: AttackGraphModel;
  newNodeIds: Set<string>;
  nodeHeight: number;
  nodeWidth: number;
  previousSession: AttackGraphLayoutSession | null;
  rankSep: number;
  strategy: AttackGraphLayoutSession["strategy"];
  topology: ReturnType<typeof classifyAttackGraphTopology>;
}): AttackGraphLayoutResult {
  if (topology.kind === "linear-chain") {
    const nextLayout = {
      mode: "compact" as const,
      ...processLinearChainLayout(graph, topology, {
        nodeHeight,
        nodeWidth,
        rankGap: Math.max(150, rankSep + 40),
      }),
    };
    return buildAttackGraphLayoutResult({
      graph,
      newNodeIds,
      nextLayout,
      nodeHeight,
      nodeWidth,
      previousSession,
      strategy,
      topologyDiagnostics: topology.diagnostics,
      topologyKind: topology.kind,
    });
  }
  if (topology.kind === "single-source-fanout") {
    const nextLayout = {
      mode: "compact" as const,
      ...processSingleSourceFanoutLayout(graph, topology, {
        nodeHeight,
        nodeWidth,
        rankGap: Math.max(150, rankSep + 40),
        targetGap: Math.max(132, nodeHeight + 36),
      }),
    };
    return buildAttackGraphLayoutResult({
      graph,
      newNodeIds,
      nextLayout,
      nodeHeight,
      nodeWidth,
      previousSession,
      strategy,
      topologyDiagnostics: topology.diagnostics,
      topologyKind: topology.kind,
    });
  }
  if (topology.kind === "multi-source-fanin") {
    const nextLayout = {
      mode: "compact" as const,
      ...processMultiSourceFaninLayout(graph, topology, {
        nodeHeight,
        nodeWidth,
        rankGap: Math.max(150, rankSep + 40),
        targetGap: Math.max(132, nodeHeight + 36),
      }),
    };
    return buildAttackGraphLayoutResult({
      graph,
      newNodeIds,
      nextLayout,
      nodeHeight,
      nodeWidth,
      previousSession,
      strategy,
      topologyDiagnostics: topology.diagnostics,
      topologyKind: topology.kind,
    });
  }
  if (topology.kind === "tree") {
    const nextLayout = {
      mode: "compact" as const,
      ...processTreeLayout(graph, topology, {
        nodeHeight,
        nodeWidth,
        rankGap: Math.max(150, rankSep + 40),
        siblingGap: Math.max(76, nodeHeight * 0.72),
      }),
    };
    return buildAttackGraphLayoutResult({
      graph,
      newNodeIds,
      nextLayout,
      nodeHeight,
      nodeWidth,
      previousSession,
      strategy,
      topologyDiagnostics: topology.diagnostics,
      topologyKind: topology.kind,
    });
  }
  const nextLayout = {
    mode: "compact" as const,
    ...processComplexLayeredLayout(graph, {
      nodeHeight,
      nodeWidth,
      rankGap: Math.max(150, rankSep + 42),
      rowGap: Math.max(62, nodeHeight * 0.56),
      session: previousSession,
    }),
  };
  return buildAttackGraphLayoutResult({
    graph,
    newNodeIds,
    nextLayout,
    nodeHeight,
    nodeWidth,
    previousSession,
    strategy,
    topologyDiagnostics: topology.diagnostics,
    topologyKind: topology.kind,
  });
}

async function layoutStressAttackGraph({
  direction,
  graph,
  newNodeIds,
  nodeHeight,
  nodeSep,
  nodeWidth,
  previousSession,
  rankSep,
  strategy,
  topologyDiagnostics,
  topologyKind,
}: {
  direction: "LR" | "TB";
  graph: AttackGraphModel;
  newNodeIds: Set<string>;
  nodeHeight: number;
  nodeSep: number;
  nodeWidth: number;
  previousSession: AttackGraphLayoutSession | null;
  rankSep: number;
  strategy: AttackGraphLayoutSession["strategy"];
  topologyDiagnostics: AttackGraphTopologyDiagnostics;
  topologyKind: string;
}): Promise<AttackGraphLayoutResult> {
  const elkNodeWidth = ELK_ICON_NODE_SIZE;
  const elkNodeHeight = ELK_ICON_NODE_SIZE;
  const elkGraph = buildElkGraph({
    algorithm: "stress",
    direction,
    edgeRouting: false,
    graph,
    nodeHeight: elkNodeHeight,
    nodeSep: Math.max(36, nodeSep),
    nodeWidth: elkNodeWidth,
    portY: elkNodeHeight / 2,
    rankSep: Math.max(132, rankSep),
  });
  const layoutedGraph = await elk.layout(elkGraph);
  const layoutedNodeById = new Map(
    (layoutedGraph.children ?? []).map((node) => [node.id, node]),
  );
  const iconOffset = {
    x: (nodeWidth - elkNodeWidth) / 2,
    y: 12,
  };
  const layoutedNodes = graph.nodes.map((node) => {
    const elkNode = layoutedNodeById.get(node.id);
    return {
      ...node,
      position: {
        x: (elkNode?.x ?? 0) - iconOffset.x,
        y: (elkNode?.y ?? 0) - iconOffset.y,
      },
    };
  });
  const normalizedNodes = normalizeLayoutNodes(layoutedNodes);
  const edgeRoutesById = buildStressEdgeRoutesById(graph, normalizedNodes, {
    nodeHeight,
    nodeWidth,
  });

  return buildAttackGraphLayoutResult({
    edgeRoutesById,
    graph,
    newNodeIds,
    nextLayout: {
      mode: "compact",
      nodes: normalizedNodes,
    },
    nodeHeight,
    nodeWidth,
    previousSession,
    strategy,
    topologyDiagnostics,
    topologyKind,
  });
}

function buildElkGraph({
  algorithm = "layered",
  direction,
  edgeRouting,
  graph,
  nodeHeight,
  nodeSep,
  nodeWidth,
  portY,
  rankSep,
}: {
  algorithm?: AttackGraphElkAlgorithm;
  direction: "LR" | "TB";
  edgeRouting: boolean;
  graph: AttackGraphModel;
  nodeHeight: number;
  nodeSep: number;
  nodeWidth: number;
  portY: number;
  rankSep: number;
}): ElkNode {
  const sortedNodes = [...graph.nodes].sort(compareNodesForLayout);
  const nodeIds = new Set(sortedNodes.map((node) => node.id));

  const children = sortedNodes.map((node) => {
    const child: ElkNode = {
      id: node.id,
      height: nodeHeight,
      width: nodeWidth,
    };

    if (algorithm === "layered") {
      child.layoutOptions = {
        "elk.portConstraints": "FIXED_POS",
      };
      child.ports = [
        {
          id: getTargetPortId(node.id),
          height: DEFAULT_PORT_SIZE,
          layoutOptions: {
            "elk.port.side": "WEST",
          },
          width: DEFAULT_PORT_SIZE,
          x: 0,
          y: portY,
        },
        {
          id: getSourcePortId(node.id),
          height: DEFAULT_PORT_SIZE,
          layoutOptions: {
            "elk.port.side": "EAST",
          },
          width: DEFAULT_PORT_SIZE,
          x: nodeWidth,
          y: portY,
        },
      ];
    }

    return child;
  });

  return {
    id: "attack-graph",
    children,
    edges: graph.edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge) => ({
        id: edge.id,
        sources: [
          isLayeredAlgorithm(algorithm) ? getSourcePortId(edge.source) : edge.source,
        ],
        targets: [
          isLayeredAlgorithm(algorithm) ? getTargetPortId(edge.target) : edge.target,
        ],
      })),
    layoutOptions:
      algorithm === "stress"
        ? {
            "elk.algorithm": "stress",
            "elk.aspectRatio": "1.6",
            "elk.padding": `[top=${DEFAULT_GRAPH_PADDING},left=${DEFAULT_GRAPH_PADDING},bottom=${DEFAULT_GRAPH_PADDING},right=${DEFAULT_GRAPH_PADDING}]`,
            "elk.separateConnectedComponents": "true",
            "elk.spacing.nodeNode": String(Math.max(54, nodeSep * 1.1)),
            "elk.stress.desiredEdgeLength": String(Math.max(140, nodeSep * 2.4)),
            "elk.stress.iterationLimit": "700",
          }
        : {
            "elk.algorithm": "layered",
            "elk.direction": direction === "LR" ? "RIGHT" : "DOWN",
            ...(edgeRouting
              ? {
                  "elk.edgeRouting": "ORTHOGONAL",
                  "elk.layered.crossingMinimization.forceNodeModelOrder": "true",
                }
              : {}),
            "elk.layered.crossingMinimization.semiInteractive": "true",
            "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
            "elk.layered.spacing.edgeNodeBetweenLayers": String(Math.max(24, rankSep / 3)),
            "elk.padding": `[top=${DEFAULT_GRAPH_PADDING},left=${DEFAULT_GRAPH_PADDING},bottom=${DEFAULT_GRAPH_PADDING},right=${DEFAULT_GRAPH_PADDING}]`,
            "elk.spacing.edgeEdge": "18",
            "elk.spacing.edgeNode": "28",
            "elk.spacing.nodeNode": String(nodeSep),
            "elk.layered.spacing.nodeNodeBetweenLayers": String(rankSep),
          },
  };
}

function isLayeredAlgorithm(algorithm: AttackGraphElkAlgorithm) {
  return algorithm === "layered";
}

function buildStressEdgeRoutesById(
  graph: AttackGraphModel,
  nodes: AttackGraphNodeModel[],
  options: {
    nodeHeight: number;
    nodeWidth: number;
  },
): Map<string, AttackGraphEdgeRouteData> {
  const routesById = new Map<string, AttackGraphEdgeRouteData>();
  const nodeGeometryById = buildLayoutNodeGeometryById(nodes, options);
  const endpointOffsetsByEdgeId = buildStressEndpointOffsetsByEdgeId(
    graph,
    nodeGeometryById,
  );
  const selfLoopRoutesById = buildAttackGraphEdgeRoutes(
    graph.edges,
    nodeGeometryById,
  );
  const relationGroups = groupRelationEdgesByNodePair(graph);

  for (const group of relationGroups) {
    const sortedEdges = [...group.edges].sort((left, right) =>
      compareStressEdgesForFanout(left, right, nodeGeometryById),
    );
    const count = sortedEdges.length;

    sortedEdges.forEach((edge, index) => {
      const fanoutIndex = getSymmetricFanoutIndex(index, count);
      const endpointOffsets = endpointOffsetsByEdgeId.get(edge.id);
      const parallelPair = count > 1;
      routesById.set(edge.id, {
        fanoutCount: count,
        fanoutIndex,
        fanoutOffset: getStressFanoutOffset(fanoutIndex, count),
        kind: "stress",
        parallelPair,
        parallelOffset: parallelPair
          ? getStressParallelPairOffset(fanoutIndex, count)
          : undefined,
        sourceFanoutOffset: parallelPair
          ? 0
          : endpointOffsets?.sourceFanoutOffset,
        targetFanoutOffset: parallelPair
          ? 0
          : endpointOffsets?.targetFanoutOffset,
      });
    });
  }

  for (const [edgeId, route] of selfLoopRoutesById) {
    if (route.kind === "self-loop") {
      routesById.set(edgeId, route);
    }
  }

  return routesById;
}

function buildStressEndpointOffsetsByEdgeId(
  graph: AttackGraphModel,
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
) {
  const offsetsByEdgeId = new Map<
    string,
    {
      sourceFanoutOffset: number;
      targetFanoutOffset: number;
    }
  >();
  const outgoingByNodeId = new Map<string, AttackGraphEdgeModel[]>();
  const incomingByNodeId = new Map<string, AttackGraphEdgeModel[]>();

  for (const edge of graph.edges) {
    if (
      edge.source === edge.target ||
      !nodeGeometryById.has(edge.source) ||
      !nodeGeometryById.has(edge.target)
    ) {
      continue;
    }

    outgoingByNodeId.set(edge.source, [
      ...(outgoingByNodeId.get(edge.source) ?? []),
      edge,
    ]);
    incomingByNodeId.set(edge.target, [
      ...(incomingByNodeId.get(edge.target) ?? []),
      edge,
    ]);
  }

  assignStressEndpointOffsets({
    edgeGroupsByNodeId: outgoingByNodeId,
    nodeGeometryById,
    offsetsByEdgeId,
    side: "source",
  });
  assignStressEndpointOffsets({
    edgeGroupsByNodeId: incomingByNodeId,
    nodeGeometryById,
    offsetsByEdgeId,
    side: "target",
  });

  return offsetsByEdgeId;
}

function assignStressEndpointOffsets({
  edgeGroupsByNodeId,
  nodeGeometryById,
  offsetsByEdgeId,
  side,
}: {
  edgeGroupsByNodeId: Map<string, AttackGraphEdgeModel[]>;
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>;
  offsetsByEdgeId: Map<
    string,
    {
      sourceFanoutOffset: number;
      targetFanoutOffset: number;
    }
  >;
  side: "source" | "target";
}) {
  for (const [nodeId, edges] of edgeGroupsByNodeId) {
    if (edges.length <= 1) {
      continue;
    }

    const sortedEdges = [...edges].sort((left, right) =>
      compareStressEndpointEdges(left, right, {
        nodeGeometryById,
        nodeId,
        side,
      }),
    );
    const angleBuckets = groupStressEndpointEdgesByAngle(sortedEdges, {
      nodeGeometryById,
      nodeId,
      side,
    });

    for (const bucketEdges of angleBuckets) {
      const count = bucketEdges.length;
      bucketEdges.forEach((edge, index) => {
        const current = offsetsByEdgeId.get(edge.id) ?? {
          sourceFanoutOffset: 0,
          targetFanoutOffset: 0,
        };
        const offset = getStressEndpointFanoutOffset(index, count);

        offsetsByEdgeId.set(edge.id, {
          ...current,
          [side === "source" ? "sourceFanoutOffset" : "targetFanoutOffset"]:
            offset,
        });
      });
    }
  }
}

function groupStressEndpointEdgesByAngle(
  sortedEdges: AttackGraphEdgeModel[],
  options: {
    nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>;
    nodeId: string;
    side: "source" | "target";
  },
) {
  const buckets: AttackGraphEdgeModel[][] = [];
  for (const edge of sortedEdges) {
    const angle = getStressEndpointPeerAngle(edge, options);
    const currentBucket = buckets[buckets.length - 1];
    const currentBucketAngle = currentBucket?.[0]
      ? getStressEndpointPeerAngle(currentBucket[0], options)
      : null;

    if (
      !currentBucket ||
      currentBucketAngle === null ||
      Math.abs(angle - currentBucketAngle) > STRESS_ENDPOINT_ANGLE_BUCKET_SIZE
    ) {
      buckets.push([edge]);
      continue;
    }

    currentBucket.push(edge);
  }

  return buckets;
}

function compareStressEndpointEdges(
  left: AttackGraphEdgeModel,
  right: AttackGraphEdgeModel,
  options: {
    nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>;
    nodeId: string;
    side: "source" | "target";
  },
) {
  const leftAngle = getStressEndpointPeerAngle(left, options);
  const rightAngle = getStressEndpointPeerAngle(right, options);
  const leftPeer = options.nodeGeometryById.get(
    options.side === "source" ? left.target : left.source,
  );
  const rightPeer = options.nodeGeometryById.get(
    options.side === "source" ? right.target : right.source,
  );

  return (
    leftAngle - rightAngle ||
    (leftPeer?.centerY ?? 0) - (rightPeer?.centerY ?? 0) ||
    (leftPeer?.centerX ?? 0) - (rightPeer?.centerX ?? 0) ||
    left.id.localeCompare(right.id)
  );
}

function getStressEndpointPeerAngle(
  edge: AttackGraphEdgeModel,
  {
    nodeGeometryById,
    nodeId,
    side,
  }: {
    nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>;
    nodeId: string;
    side: "source" | "target";
  },
) {
  const origin = nodeGeometryById.get(nodeId);
  const peer = nodeGeometryById.get(side === "source" ? edge.target : edge.source);
  if (!origin || !peer) {
    return 0;
  }

  return Math.atan2(peer.centerY - origin.centerY, peer.centerX - origin.centerX);
}

function buildLayoutNodeGeometryById(
  nodes: AttackGraphNodeModel[],
  options: {
    nodeHeight: number;
    nodeWidth: number;
  },
) {
  const geometryById = new Map<string, AttackGraphNodeEdgeGeometry>();

  for (const node of nodes) {
    const position = node.position ?? { x: 0, y: 0 };
    geometryById.set(node.id, {
      bounds: {
        height: options.nodeHeight,
        width: options.nodeWidth,
        x: position.x,
        y: position.y,
      },
      centerX: position.x + options.nodeWidth / 2,
      centerY: position.y + 12 + ELK_ICON_NODE_SIZE / 2,
      id: node.id,
      radius: ELK_ICON_NODE_SIZE / 2 + 4,
    });
  }

  return geometryById;
}

function compareStressEdgesForFanout(
  left: AttackGraphEdgeModel,
  right: AttackGraphEdgeModel,
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
) {
  const leftSource = nodeGeometryById.get(left.source);
  const rightSource = nodeGeometryById.get(right.source);
  const leftTarget = nodeGeometryById.get(left.target);
  const rightTarget = nodeGeometryById.get(right.target);
  const leftAngle =
    leftSource && leftTarget
      ? Math.atan2(
          leftTarget.centerY - leftSource.centerY,
          leftTarget.centerX - leftSource.centerX,
        )
      : 0;
  const rightAngle =
    rightSource && rightTarget
      ? Math.atan2(
          rightTarget.centerY - rightSource.centerY,
          rightTarget.centerX - rightSource.centerX,
        )
      : 0;

  return (
    leftAngle - rightAngle ||
    (leftTarget?.centerY ?? 0) - (rightTarget?.centerY ?? 0) ||
    (leftTarget?.centerX ?? 0) - (rightTarget?.centerX ?? 0) ||
    left.id.localeCompare(right.id)
  );
}

function buildAttackGraphLayoutResult({
  edgeRoutesById,
  graph,
  newNodeIds,
  nextLayout,
  nodeHeight,
  nodeWidth,
  previousSession,
  strategy,
  topologyDiagnostics,
  topologyKind,
}: {
  edgeRoutesById?: Map<string, AttackGraphEdgeRouteData>;
  graph: AttackGraphModel;
  newNodeIds: Set<string>;
  nextLayout: {
    mode: AttackGraphLayoutSession["mode"];
    nodes: AttackGraphNodeModel[];
    anchorNodeId?: AttackGraphLayoutSession["anchorNodeId"];
  };
  nodeHeight: number;
  nodeWidth: number;
  previousSession: AttackGraphLayoutSession | null;
  strategy: AttackGraphLayoutSession["strategy"];
  topologyDiagnostics: AttackGraphTopologyDiagnostics;
  topologyKind: string;
}): AttackGraphLayoutResult {
  const layoutedResultNodes = nextLayout.nodes.map((node) => ({
    ...node,
    isNew: newNodeIds.has(node.id),
  }));
  const bounds = computeGraphBounds(layoutedResultNodes, nodeWidth, nodeHeight);
  const layoutSession = buildLayoutSession({
    caseId: graph.caseId,
    mode: nextLayout.mode,
    newNodeIds,
    nodes: layoutedResultNodes,
    anchorNodeId: nextLayout.anchorNodeId,
    strategy,
  });

  return {
    ...graph,
    edges: graph.edges,
    edgeRoutesById,
    nodes: layoutedResultNodes,
    width: Math.ceil(bounds.width + DEFAULT_GRAPH_PADDING * 2),
    height: Math.ceil(bounds.height + DEFAULT_GRAPH_PADDING * 2),
    layoutMode: nextLayout.mode,
    layoutSession,
    layoutStrategy: strategy,
    topologyDiagnostics,
    topologyKind,
  };
}

function getNormalizationOffset(nodes: AttackGraphNodeModel[]): AttackGraphPoint {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: Math.min(...nodes.map((node) => node.position?.x ?? 0)),
    y: Math.min(...nodes.map((node) => node.position?.y ?? 0)),
  };
}

function normalizeLayoutNodes(nodes: AttackGraphNodeModel[]) {
  const offset = getNormalizationOffset(nodes);

  return nodes.map((node) => ({
    ...node,
    position: {
      x: (node.position?.x ?? 0) - offset.x,
      y: (node.position?.y ?? 0) - offset.y,
    },
  }));
}

function spreadLargeGraphRanks(
  nodes: AttackGraphNodeModel[],
  options: {
    maxRowsPerRank: number;
    nodeHeight: number;
    nodeWidth: number;
    rankTolerance: number;
    rowGap: number;
    subColumnGap: number;
  },
) {
  if (nodes.length === 0) {
    return nodes;
  }

  const rankGroups = groupNodesByRank(nodes, options.rankTolerance);
  const subColumnStep = options.nodeWidth + options.subColumnGap;
  const rowStep = options.nodeHeight + options.rowGap;
  const positionedById = new Map<string, AttackGraphPoint>();
  const layoutCenterY = getLayoutCenterY(nodes, options.nodeHeight);
  let accumulatedXShift = 0;

  for (const rank of rankGroups) {
    const sortedRankNodes = [...rank.nodes].sort(compareNodesByRankOrder);
    const rankX = rank.baseX + accumulatedXShift;
    const columnCount = Math.ceil(
      sortedRankNodes.length / options.maxRowsPerRank,
    );
    const rowCount = Math.ceil(sortedRankNodes.length / columnCount);
    const packedHeight =
      rowCount * options.nodeHeight + Math.max(0, rowCount - 1) * options.rowGap;
    const rankTop = layoutCenterY - packedHeight / 2;

    sortedRankNodes.forEach((node, index) => {
      const columnIndex = index % columnCount;
      const rowIndex = Math.floor(index / columnCount);
      positionedById.set(node.id, {
        x: rankX + columnIndex * subColumnStep,
        y: rankTop + rowIndex * rowStep,
      });
    });

    accumulatedXShift += (columnCount - 1) * subColumnStep;
  }

  return nodes.map((node) => {
    const position = positionedById.get(node.id);
    if (!position) {
      return node;
    }

    return {
      ...node,
      position: {
        x: Math.round(position.x),
        y: Math.round(position.y),
      },
    };
  });
}

function groupNodesByRank(
  nodes: AttackGraphNodeModel[],
  rankTolerance: number,
) {
  const sortedNodes = [...nodes].sort((left, right) => {
    const leftPosition = left.position ?? { x: 0, y: 0 };
    const rightPosition = right.position ?? { x: 0, y: 0 };
    return (
      leftPosition.x - rightPosition.x ||
      leftPosition.y - rightPosition.y ||
      left.id.localeCompare(right.id)
    );
  });
  const rankGroups: Array<{
    baseX: number;
    nodes: AttackGraphNodeModel[];
  }> = [];

  for (const node of sortedNodes) {
    const x = node.position?.x ?? 0;
    const currentRank = rankGroups[rankGroups.length - 1];
    if (!currentRank || Math.abs(x - currentRank.baseX) > rankTolerance) {
      rankGroups.push({
        baseX: x,
        nodes: [node],
      });
      continue;
    }

    currentRank.nodes.push(node);
    currentRank.baseX =
      currentRank.nodes.reduce(
        (total, rankNode) => total + (rankNode.position?.x ?? x),
        0,
      ) / currentRank.nodes.length;
  }

  return rankGroups.map((rank) => ({
    ...rank,
    baseX: Math.min(...rank.nodes.map((node) => node.position?.x ?? rank.baseX)),
  }));
}

function compareNodesByRankOrder(
  left: AttackGraphNodeModel,
  right: AttackGraphNodeModel,
) {
  const leftPosition = left.position ?? { x: 0, y: 0 };
  const rightPosition = right.position ?? { x: 0, y: 0 };
  return (
    leftPosition.y - rightPosition.y ||
    leftPosition.x - rightPosition.x ||
    compareNodesForLayout(left, right)
  );
}

function getLayoutCenterY(
  nodes: AttackGraphNodeModel[],
  nodeHeight: number,
) {
  const centers = nodes.map((node) => (node.position?.y ?? 0) + nodeHeight / 2);
  return (Math.min(...centers) + Math.max(...centers)) / 2;
}

function groupRelationEdgesByNodePair(graph: AttackGraphModel) {
  const groups = new Map<string, AttackGraphEdgeModel[]>();
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      continue;
    }

    const [first, second] = [edge.source, edge.target].sort();
    const key = `${first}<->${second}`;
    groups.set(key, [...(groups.get(key) ?? []), edge]);
  }

  return [...groups.values()].map((edges) => ({ edges }));
}

function getSymmetricFanoutIndex(index: number, fanoutCount: number) {
  if (fanoutCount <= 1) {
    return 0;
  }

  if (fanoutCount % 2 === 1 && index === 0) {
    return 0;
  }

  const adjustedIndex = fanoutCount % 2 === 1 ? index - 1 : index;
  const magnitude = Math.floor(adjustedIndex / 2) + 1;
  return adjustedIndex % 2 === 0 ? magnitude : -magnitude;
}

function getStressFanoutOffset(fanoutIndex: number, fanoutCount: number) {
  if (fanoutCount <= 1) {
    return 0;
  }

  const step = fanoutCount <= 3 ? 24 : fanoutCount <= 6 ? 19 : 16;
  return Math.max(-64, Math.min(64, fanoutIndex * step));
}

function getStressParallelPairOffset(
  fanoutIndex: number,
  fanoutCount: number,
) {
  if (fanoutCount <= 1) {
    return 0;
  }

  const step = fanoutCount <= 3 ? 22 : fanoutCount <= 6 ? 17 : 13;
  return Math.max(-44, Math.min(44, fanoutIndex * step));
}

function getStressEndpointFanoutOffset(index: number, fanoutCount: number) {
  if (fanoutCount <= 1) {
    return 0;
  }

  const centeredIndex = index - (fanoutCount - 1) / 2;
  const step = fanoutCount <= 3 ? 6 : fanoutCount <= 6 ? 5 : 4;
  return Math.max(-14, Math.min(14, centeredIndex * step));
}

function getNewNodeIds(
  nodes: AttackGraphNodeModel[],
  previousSession: AttackGraphLayoutSession | null,
) {
  if (!previousSession) {
    return new Set<string>();
  }

  return new Set(
    nodes
      .filter((node) => !previousSession.nodePositionsById.has(node.id))
      .map((node) => node.id),
  );
}

function buildLayoutSession({
  caseId,
  mode,
  newNodeIds,
  nodes,
  anchorNodeId,
  strategy,
}: {
  caseId: string;
  mode: AttackGraphLayoutSession["mode"];
  newNodeIds: Set<string>;
  nodes: AttackGraphNodeModel[];
  anchorNodeId?: AttackGraphLayoutSession["anchorNodeId"];
  strategy: AttackGraphLayoutSession["strategy"];
}): AttackGraphLayoutSession {
  return {
    caseId,
    mode,
    newNodeIds,
    nodePositionsById: new Map(
      nodes.map((node) => [node.id, node.position ?? { x: 0, y: 0 }]),
    ),
    anchorNodeId,
    strategy,
  };
}

function computeGraphBounds(
  nodes: AttackGraphNodeModel[],
  nodeWidth: number,
  nodeHeight: number,
) {
  if (nodes.length === 0) {
    return {
      height: 0,
      width: 0,
    };
  }

  const points = nodes.map((node) => node.position ?? ({ x: 0, y: 0 } as AttackGraphPoint));
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x + nodeWidth));
  const maxY = Math.max(...points.map((point) => point.y + nodeHeight));

  return {
    height: maxY - minY,
    width: maxX - minX,
  };
}

function getSourcePortId(nodeId: string) {
  return `${nodeId}__source`;
}

function getTargetPortId(nodeId: string) {
  return `${nodeId}__target`;
}

function compareNodesForLayout(
  left: AttackGraphNodeModel,
  right: AttackGraphNodeModel,
): number {
  const leftPriority =
    ATTACK_GRAPH_NODE_KIND_CONFIG[left.presentationKind]?.priority ?? 0;
  const rightPriority =
    ATTACK_GRAPH_NODE_KIND_CONFIG[right.presentationKind]?.priority ?? 0;
  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }
  return left.key.localeCompare(right.key);
}
