import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutLaneBounds,
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
} from "./attack-graph-data";
import { getAttackGraphEdgeLayoutRole } from "./attack-graph-edge-config";
import { alignAttackGraphMainChains } from "./attack-graph-main-chain-alignment";

export interface AttackGraphTreeLayoutOptions {
  nodeHeight: number;
  nodeWidth: number;
  rankGap: number;
  siblingGap: number;
}

export interface AttackGraphTreeLayoutResult {
  activeLaneIds: string[];
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  nodeLaneIdById: Map<string, string>;
  nodes: AttackGraphNodeModel[];
  stableCenterNodeId?: string;
}

const TREE_LANE_ID = "tree";
const GRAPH_PADDING = 40;

export function processTreeLayout(
  graph: AttackGraphModel,
  topology: {
    rootId: string;
    childrenByNodeId: Map<string, string[]>;
  },
  options: AttackGraphTreeLayoutOptions,
): AttackGraphTreeLayoutResult {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  if (!nodeById.has(topology.rootId)) {
    return createFallbackTreeLayout(graph.nodes);
  }

  const positionedById = new Map<string, AttackGraphPoint>();
  let nextLeafIndex = 0;

  const layoutNode = (nodeId: string, depth: number): number => {
    const children = (topology.childrenByNodeId.get(nodeId) ?? []).filter(
      (childId) => nodeById.has(childId),
    );
    const childCenters = children.map((childId) =>
      layoutNode(childId, depth + 1),
    );
    const centerY =
      childCenters.length > 0
        ? (Math.min(...childCenters) + Math.max(...childCenters)) / 2
        : GRAPH_PADDING +
          options.nodeHeight / 2 +
          nextLeafIndex++ * (options.nodeHeight + options.siblingGap);

    positionedById.set(nodeId, {
      x: GRAPH_PADDING + depth * (options.nodeWidth + options.rankGap),
      y: centerY - options.nodeHeight / 2,
    });

    return centerY;
  };

  layoutNode(topology.rootId, 0);
  alignAttackGraphMainChains({
    layoutEdges: getTreeLayoutEdges(graph.edges, nodeById),
    options,
    positionedById,
  });

  const overflowNodes = graph.nodes.filter((node) => !positionedById.has(node.id));
  const overflowDepth = getMaxDepth(positionedById, options) + 1;
  overflowNodes.forEach((node, index) => {
    positionedById.set(node.id, {
      x: GRAPH_PADDING + overflowDepth * (options.nodeWidth + options.rankGap),
      y:
        GRAPH_PADDING +
        index * (options.nodeHeight + options.siblingGap),
    });
  });

  const nodes = graph.nodes.map((node) => ({
    ...node,
    position: positionedById.get(node.id) ?? { x: GRAPH_PADDING, y: GRAPH_PADDING },
  }));
  const bounds = computeTreeBounds(nodes, options);

  return {
    activeLaneIds: [TREE_LANE_ID],
    laneBoundsById: new Map([
      [
        TREE_LANE_ID,
        {
          height: bounds.height,
          y: 0,
        },
      ],
    ]),
    nodeLaneIdById: new Map(nodes.map((node) => [node.id, TREE_LANE_ID])),
    nodes,
    stableCenterNodeId: topology.rootId,
  };
}

function getTreeLayoutEdges(
  edges: AttackGraphEdgeModel[],
  nodeById: Map<string, AttackGraphNodeModel>,
) {
  return edges.filter((edge) => {
    if (
      edge.source === edge.target ||
      !nodeById.has(edge.source) ||
      !nodeById.has(edge.target)
    ) {
      return false;
    }

    const role = getAttackGraphEdgeLayoutRole(edge.relationType);
    return role === "primary" || role === "action";
  });
}

function createFallbackTreeLayout(
  nodes: AttackGraphNodeModel[],
): AttackGraphTreeLayoutResult {
  return {
    activeLaneIds: [TREE_LANE_ID],
    laneBoundsById: new Map([[TREE_LANE_ID, { height: 0, y: 0 }]]),
    nodeLaneIdById: new Map(nodes.map((node) => [node.id, TREE_LANE_ID])),
    nodes,
  };
}

function getMaxDepth(
  positionedById: Map<string, AttackGraphPoint>,
  options: AttackGraphTreeLayoutOptions,
) {
  let maxDepth = 0;
  for (const point of positionedById.values()) {
    const depth = Math.round(
      (point.x - GRAPH_PADDING) / (options.nodeWidth + options.rankGap),
    );
    maxDepth = Math.max(maxDepth, depth);
  }
  return maxDepth;
}

function computeTreeBounds(
  nodes: AttackGraphNodeModel[],
  options: AttackGraphTreeLayoutOptions,
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
