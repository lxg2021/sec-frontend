import dagre from "dagre";

import type {
  AttackGraphLayoutOptions,
  AttackGraphLayoutResult,
  AttackGraphModel,
  AttackGraphNodeModel,
} from "./attack-graph-data";
import { ATTACK_GRAPH_NODE_KIND_CONFIG } from "./attack-graph-node-config";

const DEFAULT_NODE_WIDTH = 208;
const DEFAULT_NODE_HEIGHT = 56;
const DEFAULT_NODE_SEP = 96;
const DEFAULT_RANK_SEP = 132;

export function layoutAttackGraph(
  graph: AttackGraphModel,
  options: AttackGraphLayoutOptions = {},
): AttackGraphLayoutResult {
  const direction = options.direction ?? "LR";
  const nodeWidth = options.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = options.nodeHeight ?? DEFAULT_NODE_HEIGHT;
  const nodeSep = options.nodeSep ?? DEFAULT_NODE_SEP;
  const rankSep = options.rankSep ?? DEFAULT_RANK_SEP;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
  });

  const sortedNodes = [...graph.nodes].sort(compareNodesForLayout);
  for (const node of sortedNodes) {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  }

  for (const edge of graph.edges) {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target, {
        weight: edge.edgeKind === "case-structure" ? 2 : 1,
      });
    }
  }

  dagre.layout(dagreGraph);

  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  const layoutedNodes = graph.nodes.map((node) => {
    const position = dagreGraph.node(node.id);
    const x = position ? position.x - nodeWidth / 2 : 0;
    const y = position ? position.y - nodeHeight / 2 : 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + nodeWidth);
    maxY = Math.max(maxY, y + nodeHeight);
    return {
      ...node,
      position: { x, y },
    };
  });

  return {
    ...graph,
    nodes: layoutedNodes,
    width: Math.ceil(maxX - minX),
    height: Math.ceil(maxY - minY),
  };
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
