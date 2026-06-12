import ELK, { type ElkNode } from "elkjs/lib/elk.bundled";

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
const DEFAULT_GRAPH_PADDING = 40;
const DEFAULT_PORT_SIZE = 1;

const elk = new ELK({
  defaultLayoutOptions: {
    "elk.algorithm": "layered",
  },
});

export async function layoutAttackGraph(
  graph: AttackGraphModel,
  options: AttackGraphLayoutOptions = {},
): Promise<AttackGraphLayoutResult> {
  const direction = options.direction ?? "LR";
  const nodeWidth = options.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = options.nodeHeight ?? DEFAULT_NODE_HEIGHT;
  const portY = options.portY ?? nodeHeight / 2;
  const nodeSep = options.nodeSep ?? DEFAULT_NODE_SEP;
  const rankSep = options.rankSep ?? DEFAULT_RANK_SEP;
  const sortedNodes = [...graph.nodes].sort(compareNodesForLayout);
  const nodeIds = new Set(sortedNodes.map((node) => node.id));
  const elkGraph: ElkNode = {
    id: "attack-graph",
    children: sortedNodes.map((node) => ({
      id: node.id,
      height: nodeHeight,
      layoutOptions: {
        "elk.portConstraints": "FIXED_POS",
      },
      ports: [
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
      ],
      width: nodeWidth,
    })),
    edges: graph.edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge) => ({
        id: edge.id,
        sources: [getSourcePortId(edge.source)],
        targets: [getTargetPortId(edge.target)],
      })),
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction === "LR" ? "RIGHT" : "DOWN",
      "elk.layered.crossingMinimization.semiInteractive": "true",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.spacing.edgeNodeBetweenLayers": String(Math.max(24, rankSep / 3)),
      "elk.padding": `[top=${DEFAULT_GRAPH_PADDING},left=${DEFAULT_GRAPH_PADDING},bottom=${DEFAULT_GRAPH_PADDING},right=${DEFAULT_GRAPH_PADDING}]`,
      "elk.spacing.edgeEdge": "18",
      "elk.spacing.edgeNode": "24",
      "elk.spacing.nodeNode": String(nodeSep),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(rankSep),
    },
  };

  const layoutedGraph = await elk.layout(elkGraph);
  const layoutedNodeById = new Map(
    (layoutedGraph.children ?? []).map((node) => [node.id, node]),
  );
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  const layoutedNodes = graph.nodes.map((node) => {
    const elkNode = layoutedNodeById.get(node.id);
    const x = elkNode?.x ?? 0;
    const y = elkNode?.y ?? 0;
    const width = elkNode?.width ?? nodeWidth;
    const height = elkNode?.height ?? nodeHeight;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
    return {
      ...node,
      position: { x, y },
    };
  });

  return {
    ...graph,
    edges: graph.edges,
    nodes: layoutedNodes,
    width: Math.ceil(layoutedGraph.width ?? maxX - minX),
    height: Math.ceil(layoutedGraph.height ?? maxY - minY),
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
