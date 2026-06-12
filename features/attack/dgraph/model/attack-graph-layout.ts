import ELK, { type ElkNode } from "elkjs/lib/elk.bundled";

import type {
  AttackGraphLayoutSession,
  AttackGraphLayoutOptions,
  AttackGraphLayoutResult,
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
} from "./attack-graph-data";
import { ATTACK_GRAPH_NODE_KIND_CONFIG } from "./attack-graph-node-config";
import { processSemanticLayout } from "./attack-graph-semantic-layout";
import { processStableLayout } from "./attack-graph-stable-layout";

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
  const strategy = options.strategy ?? "lane";
  const previousSession =
    options.session?.caseId === graph.caseId &&
    options.session.strategy === strategy
      ? options.session
      : null;
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
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
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

  const nextLayout =
    strategy === "stable"
      ? {
          mode: "compact" as const,
          ...processStableLayout(
            {
              ...graph,
              edges: graph.edges,
              nodes: layoutedNodes,
            },
            {
              nodeHeight,
              nodeWidth,
              session: previousSession,
            },
          ),
        }
      : processSemanticLayout(
          {
            ...graph,
            edges: graph.edges,
            nodes: layoutedNodes,
          },
          {
            session: previousSession,
          },
        );
  const newNodeIds = getNewNodeIds(graph.nodes, previousSession);
  const layoutedResultNodes = nextLayout.nodes.map((node) => ({
    ...node,
    isNew: newNodeIds.has(node.id),
  }));
  const bounds = computeGraphBounds(layoutedResultNodes, nodeWidth, nodeHeight);
  const layoutSession = buildLayoutSession({
    activeLaneIds: nextLayout.activeLaneIds,
    caseId: graph.caseId,
    hasEnteredLaneMode:
      nextLayout.mode === "lane" ||
      Boolean(previousSession?.hasEnteredLaneMode),
    laneBoundsById: nextLayout.laneBoundsById,
    mode: nextLayout.mode,
    newNodeIds,
    nodeLaneIdById: nextLayout.nodeLaneIdById,
    nodes: layoutedResultNodes,
    stableCenterNodeId: nextLayout.stableCenterNodeId,
    strategy,
  });

  return {
    ...graph,
    edges: graph.edges,
    nodes: layoutedResultNodes,
    width: Math.ceil(bounds.width + DEFAULT_GRAPH_PADDING * 2),
    height: Math.ceil(bounds.height + DEFAULT_GRAPH_PADDING * 2),
    layoutMode: nextLayout.mode,
    layoutSession,
    layoutStrategy: strategy,
  };
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
  activeLaneIds,
  caseId,
  hasEnteredLaneMode,
  laneBoundsById,
  mode,
  newNodeIds,
  nodeLaneIdById,
  nodes,
  stableCenterNodeId,
  strategy,
}: {
  activeLaneIds: string[];
  caseId: string;
  hasEnteredLaneMode: boolean;
  laneBoundsById: AttackGraphLayoutSession["laneBoundsById"];
  mode: AttackGraphLayoutSession["mode"];
  newNodeIds: Set<string>;
  nodeLaneIdById: AttackGraphLayoutSession["nodeLaneIdById"];
  nodes: AttackGraphNodeModel[];
  stableCenterNodeId?: AttackGraphLayoutSession["stableCenterNodeId"];
  strategy: AttackGraphLayoutSession["strategy"];
}): AttackGraphLayoutSession {
  return {
    activeLaneIds,
    caseId,
    hasEnteredLaneMode,
    laneBoundsById,
    mode,
    newNodeIds,
    nodeLaneIdById,
    nodePositionsById: new Map(
      nodes.map((node) => [node.id, node.position ?? { x: 0, y: 0 }]),
    ),
    stableCenterNodeId,
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
