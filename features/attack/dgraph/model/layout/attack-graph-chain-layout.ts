import type {
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
} from "../core/attack-graph-data";

export interface AttackGraphChainLayoutOptions {
  nodeHeight: number;
  nodeWidth: number;
  rankGap: number;
}

export interface AttackGraphChainLayoutResult {
  nodes: AttackGraphNodeModel[];
  anchorNodeId?: string;
}

const GRAPH_PADDING = 40;

export function processLinearChainLayout(
  graph: AttackGraphModel,
  topology: {
    nodeIds: string[];
  },
  options: AttackGraphChainLayoutOptions,
): AttackGraphChainLayoutResult {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const orderedNodes = topology.nodeIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is AttackGraphNodeModel => Boolean(node));
  if (orderedNodes.length !== graph.nodes.length) {
    return createFallbackChainLayout(graph.nodes);
  }

  const y = GRAPH_PADDING;
  const positionedById = new Map<string, AttackGraphPoint>();
  orderedNodes.forEach((node, index) => {
    positionedById.set(node.id, {
      x: GRAPH_PADDING + index * (options.nodeWidth + options.rankGap),
      y,
    });
  });

  const nodes = graph.nodes.map((node) => ({
    ...node,
    position: positionedById.get(node.id) ?? { x: GRAPH_PADDING, y },
  }));

  return {
    nodes,
    anchorNodeId: orderedNodes[0]?.id,
  };
}

function createFallbackChainLayout(
  nodes: AttackGraphNodeModel[],
): AttackGraphChainLayoutResult {
  return {
    nodes,
  };
}
