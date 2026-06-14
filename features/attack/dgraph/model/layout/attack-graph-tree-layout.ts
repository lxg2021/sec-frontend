import type {
  AttackGraphEdgeModel,
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
} from "../core/attack-graph-data";
import { getAttackGraphEdgeLayoutRole } from "../edge/attack-graph-edge-config";
import { alignAttackGraphMainChains } from "./attack-graph-main-chain-alignment";

export interface AttackGraphTreeLayoutOptions {
  nodeHeight: number;
  nodeWidth: number;
  rankGap: number;
  siblingGap: number;
}

export interface AttackGraphTreeLayoutResult {
  nodes: AttackGraphNodeModel[];
  anchorNodeId?: string;
}

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

  return {
    nodes,
    anchorNodeId: topology.rootId,
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
