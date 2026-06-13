import type {
  AttackGraphLayoutLaneBounds,
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
} from "./attack-graph-data";

export interface AttackGraphFanoutLayoutOptions {
  nodeHeight: number;
  nodeWidth: number;
  rankGap: number;
  targetGap: number;
}

export interface AttackGraphFanoutLayoutResult {
  activeLaneIds: string[];
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  nodeLaneIdById: Map<string, string>;
  nodes: AttackGraphNodeModel[];
  stableCenterNodeId?: string;
}

const FANOUT_LANE_ID = "single-source-fanout";
const GRAPH_PADDING = 40;

export function processSingleSourceFanoutLayout(
  graph: AttackGraphModel,
  topology: {
    sourceId: string;
    targetIds: string[];
  },
  options: AttackGraphFanoutLayoutOptions,
): AttackGraphFanoutLayoutResult {
  const sourceNode = graph.nodes.find((node) => node.id === topology.sourceId);
  if (!sourceNode) {
    return createFallbackFanoutLayout(graph.nodes);
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const targetOrderById = new Map(
    topology.targetIds.map((nodeId, index) => [nodeId, index]),
  );
  const targetNodes = topology.targetIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is AttackGraphNodeModel => Boolean(node))
    .sort(
      (left, right) =>
        (targetOrderById.get(left.id) ?? 0) -
        (targetOrderById.get(right.id) ?? 0),
    );
  if (targetNodes.length === 0) {
    return createFallbackFanoutLayout(graph.nodes);
  }

  const targetStartY = GRAPH_PADDING;
  const targetX = GRAPH_PADDING + options.nodeWidth + options.rankGap;
  const sourceX = GRAPH_PADDING;
  const targetCenterY =
    targetStartY +
    ((targetNodes.length - 1) * options.targetGap) / 2 +
    options.nodeHeight / 2;
  const sourceY = targetCenterY - options.nodeHeight / 2;
  const positionedById = new Map<string, AttackGraphPoint>([
    [
      sourceNode.id,
      {
        x: sourceX,
        y: sourceY,
      },
    ],
  ]);

  targetNodes.forEach((node, index) => {
    positionedById.set(node.id, {
      x: targetX,
      y: targetStartY + index * options.targetGap,
    });
  });

  const overflowNodes = graph.nodes
    .filter((node) => !positionedById.has(node.id))
    .sort(compareFanoutTargetNodes);
  overflowNodes.forEach((node, index) => {
    positionedById.set(node.id, {
      x: targetX + options.nodeWidth + options.rankGap,
      y: targetStartY + index * options.targetGap,
    });
  });

  const nodes = graph.nodes.map((node) => ({
    ...node,
    position: positionedById.get(node.id) ?? { x: sourceX, y: sourceY },
  }));
  const bounds = computeFanoutBounds(nodes, options);

  return {
    activeLaneIds: [FANOUT_LANE_ID],
    laneBoundsById: new Map([
      [
        FANOUT_LANE_ID,
        {
          height: bounds.height,
          y: 0,
        },
      ],
    ]),
    nodeLaneIdById: new Map(nodes.map((node) => [node.id, FANOUT_LANE_ID])),
    nodes,
    stableCenterNodeId: sourceNode.id,
  };
}

export function processMultiSourceFaninLayout(
  graph: AttackGraphModel,
  topology: {
    sourceIds: string[];
    targetId: string;
  },
  options: AttackGraphFanoutLayoutOptions,
): AttackGraphFanoutLayoutResult {
  const targetNode = graph.nodes.find((node) => node.id === topology.targetId);
  if (!targetNode) {
    return createFallbackFanoutLayout(graph.nodes);
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const sourceOrderById = new Map(
    topology.sourceIds.map((nodeId, index) => [nodeId, index]),
  );
  const sourceNodes = topology.sourceIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is AttackGraphNodeModel => Boolean(node))
    .sort(
      (left, right) =>
        (sourceOrderById.get(left.id) ?? 0) -
        (sourceOrderById.get(right.id) ?? 0),
    );
  if (sourceNodes.length === 0) {
    return createFallbackFanoutLayout(graph.nodes);
  }

  const sourceStartY = GRAPH_PADDING;
  const sourceX = GRAPH_PADDING;
  const targetX = GRAPH_PADDING + options.nodeWidth + options.rankGap;
  const sourceCenterY =
    sourceStartY +
    ((sourceNodes.length - 1) * options.targetGap) / 2 +
    options.nodeHeight / 2;
  const targetY = sourceCenterY - options.nodeHeight / 2;
  const positionedById = new Map<string, AttackGraphPoint>([
    [
      targetNode.id,
      {
        x: targetX,
        y: targetY,
      },
    ],
  ]);

  sourceNodes.forEach((node, index) => {
    positionedById.set(node.id, {
      x: sourceX,
      y: sourceStartY + index * options.targetGap,
    });
  });

  const nodes = graph.nodes.map((node) => ({
    ...node,
    position: positionedById.get(node.id) ?? { x: targetX, y: targetY },
  }));
  const bounds = computeFanoutBounds(nodes, options);

  return {
    activeLaneIds: [FANOUT_LANE_ID],
    laneBoundsById: new Map([
      [
        FANOUT_LANE_ID,
        {
          height: bounds.height,
          y: 0,
        },
      ],
    ]),
    nodeLaneIdById: new Map(nodes.map((node) => [node.id, FANOUT_LANE_ID])),
    nodes,
    stableCenterNodeId: targetNode.id,
  };
}

function createFallbackFanoutLayout(
  nodes: AttackGraphNodeModel[],
): AttackGraphFanoutLayoutResult {
  return {
    activeLaneIds: [FANOUT_LANE_ID],
    laneBoundsById: new Map([[FANOUT_LANE_ID, { height: 0, y: 0 }]]),
    nodeLaneIdById: new Map(nodes.map((node) => [node.id, FANOUT_LANE_ID])),
    nodes,
  };
}

function compareFanoutTargetNodes(
  left: AttackGraphNodeModel,
  right: AttackGraphNodeModel,
) {
  return (
    left.presentationKind.localeCompare(right.presentationKind) ||
    left.displayName.localeCompare(right.displayName) ||
    left.key.localeCompare(right.key) ||
    left.id.localeCompare(right.id)
  );
}

function computeFanoutBounds(
  nodes: AttackGraphNodeModel[],
  options: AttackGraphFanoutLayoutOptions,
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
