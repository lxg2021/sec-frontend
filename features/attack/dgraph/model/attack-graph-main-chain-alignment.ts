import type {
  AttackGraphEdgeModel,
  AttackGraphPoint,
} from "./attack-graph-data";

export interface AttackGraphMainChainAlignmentOptions {
  nodeHeight: number;
  nodeWidth: number;
  rankGap: number;
}

const GRAPH_PADDING = 40;

export function alignAttackGraphMainChains({
  ignoredCollisionNodeIds,
  layoutEdges,
  options,
  positionedById,
}: {
  ignoredCollisionNodeIds?: ReadonlySet<string>;
  layoutEdges: AttackGraphEdgeModel[];
  options: AttackGraphMainChainAlignmentOptions;
  positionedById: Map<string, AttackGraphPoint>;
}) {
  const forwardNearEdges = layoutEdges.filter((edge) =>
    isForwardNearLayerEdge(edge, positionedById, options),
  );
  const incomingByNodeId = new Map<string, AttackGraphEdgeModel[]>();
  const outgoingByNodeId = new Map<string, AttackGraphEdgeModel[]>();

  for (const edge of forwardNearEdges) {
    outgoingByNodeId.set(edge.source, [
      ...(outgoingByNodeId.get(edge.source) ?? []),
      edge,
    ]);
    incomingByNodeId.set(edge.target, [
      ...(incomingByNodeId.get(edge.target) ?? []),
      edge,
    ]);
  }

  const anchorNodeIds = new Set<string>();
  for (const [nodeId, edges] of outgoingByNodeId) {
    if (edges.length >= 2) {
      anchorNodeIds.add(nodeId);
    }
  }
  for (const [nodeId, edges] of incomingByNodeId) {
    if (edges.length >= 2) {
      anchorNodeIds.add(nodeId);
    }
  }

  const chainEdges = forwardNearEdges.filter((edge) => {
    const sourceOutgoingCount = outgoingByNodeId.get(edge.source)?.length ?? 0;
    const targetIncomingCount = incomingByNodeId.get(edge.target)?.length ?? 0;
    return sourceOutgoingCount === 1 && targetIncomingCount === 1;
  });

  for (const nodeIds of buildEdgeNodeComponents(chainEdges)) {
    const positionedNodeIds = nodeIds.filter((nodeId) =>
      positionedById.has(nodeId),
    );
    if (positionedNodeIds.length < 2) {
      continue;
    }

    const anchorCenterYs = positionedNodeIds
      .filter((nodeId) => anchorNodeIds.has(nodeId))
      .map((nodeId) => getNodeCenterY(nodeId, positionedById, options))
      .filter((value): value is number => value !== null);
    const centerYs =
      anchorCenterYs.length > 0
        ? anchorCenterYs
        : positionedNodeIds
            .map((nodeId) => getNodeCenterY(nodeId, positionedById, options))
            .filter((value): value is number => value !== null);
    if (centerYs.length === 0) {
      continue;
    }

    const targetCenterY =
      centerYs.reduce((total, value) => total + value, 0) / centerYs.length;
    for (const nodeId of positionedNodeIds) {
      if (anchorCenterYs.length > 0 && anchorNodeIds.has(nodeId)) {
        continue;
      }

      const position = positionedById.get(nodeId);
      if (!position) {
        continue;
      }

      const nextY = Math.max(GRAPH_PADDING, targetCenterY - options.nodeHeight / 2);
      if (
        Math.abs(position.y - nextY) < 1 ||
        !canMoveNodeToY({
          ignoredCollisionNodeIds,
          nodeId,
          options,
          positionedById,
          y: nextY,
        })
      ) {
        continue;
      }

      positionedById.set(nodeId, {
        ...position,
        y: nextY,
      });
    }
  }

  alignChainEntrancesToHubs({
    anchorNodeIds,
    forwardNearEdges,
    ignoredCollisionNodeIds,
    incomingByNodeId,
    options,
    outgoingByNodeId,
    positionedById,
  });
}

function alignChainEntrancesToHubs({
  anchorNodeIds,
  forwardNearEdges,
  ignoredCollisionNodeIds,
  incomingByNodeId,
  options,
  outgoingByNodeId,
  positionedById,
}: {
  anchorNodeIds: Set<string>;
  forwardNearEdges: AttackGraphEdgeModel[];
  ignoredCollisionNodeIds?: ReadonlySet<string>;
  incomingByNodeId: Map<string, AttackGraphEdgeModel[]>;
  options: AttackGraphMainChainAlignmentOptions;
  outgoingByNodeId: Map<string, AttackGraphEdgeModel[]>;
  positionedById: Map<string, AttackGraphPoint>;
}) {
  const hubEntranceEdges = forwardNearEdges.filter((edge) => {
    const sourceIncomingCount = incomingByNodeId.get(edge.source)?.length ?? 0;
    const sourceOutgoingCount = outgoingByNodeId.get(edge.source)?.length ?? 0;
    const targetIncomingCount = incomingByNodeId.get(edge.target)?.length ?? 0;
    return (
      anchorNodeIds.has(edge.target) &&
      sourceIncomingCount === 0 &&
      sourceOutgoingCount === 1 &&
      targetIncomingCount === 1
    );
  });

  for (const edge of hubEntranceEdges) {
    const sourcePosition = positionedById.get(edge.source);
    const targetCenterY = getNodeCenterY(edge.target, positionedById, options);
    if (!sourcePosition || targetCenterY === null) {
      continue;
    }

    const nextY = Math.max(GRAPH_PADDING, targetCenterY - options.nodeHeight / 2);
    if (
      Math.abs(sourcePosition.y - nextY) < 1 ||
      !canMoveNodeToY({
        ignoredCollisionNodeIds,
        nodeId: edge.source,
        options,
        positionedById,
        y: nextY,
      })
    ) {
      continue;
    }

    positionedById.set(edge.source, {
      ...sourcePosition,
      y: nextY,
    });
  }
}

export function isForwardNearLayerEdge(
  edge: AttackGraphEdgeModel,
  positionedById: Map<string, AttackGraphPoint>,
  options: AttackGraphMainChainAlignmentOptions,
) {
  const sourcePosition = positionedById.get(edge.source);
  const targetPosition = positionedById.get(edge.target);
  if (!sourcePosition || !targetPosition) {
    return false;
  }

  const deltaX = targetPosition.x - sourcePosition.x;
  const expectedRankGap = options.nodeWidth + options.rankGap;
  return deltaX > options.nodeWidth * 0.6 && deltaX <= expectedRankGap * 1.35;
}

function buildEdgeNodeComponents(edges: AttackGraphEdgeModel[]) {
  const neighborsByNodeId = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!neighborsByNodeId.has(edge.source)) {
      neighborsByNodeId.set(edge.source, new Set());
    }
    if (!neighborsByNodeId.has(edge.target)) {
      neighborsByNodeId.set(edge.target, new Set());
    }
    neighborsByNodeId.get(edge.source)?.add(edge.target);
    neighborsByNodeId.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];
  const nodeIds = [...neighborsByNodeId.keys()].sort();
  for (const nodeId of nodeIds) {
    if (visited.has(nodeId)) {
      continue;
    }

    const component: string[] = [];
    const queue = [nodeId];
    visited.add(nodeId);
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }

      component.push(currentId);
      for (const neighborId of neighborsByNodeId.get(currentId) ?? []) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }
    components.push(component);
  }

  return components;
}

function getNodeCenterY(
  nodeId: string,
  positionedById: Map<string, AttackGraphPoint>,
  options: AttackGraphMainChainAlignmentOptions,
) {
  const position = positionedById.get(nodeId);
  return position ? position.y + options.nodeHeight / 2 : null;
}

function canMoveNodeToY(
  {
    ignoredCollisionNodeIds,
    nodeId,
    options,
    positionedById,
    y,
  }: {
    ignoredCollisionNodeIds?: ReadonlySet<string>;
    nodeId: string;
    options: AttackGraphMainChainAlignmentOptions;
    positionedById: Map<string, AttackGraphPoint>;
    y: number;
  },
) {
  const position = positionedById.get(nodeId);
  if (!position) {
    return false;
  }

  const candidateRect = expandRect(
    {
      height: options.nodeHeight,
      width: options.nodeWidth,
      x: position.x,
      y,
    },
    8,
  );
  for (const [otherNodeId, otherPosition] of positionedById) {
    if (otherNodeId === nodeId || ignoredCollisionNodeIds?.has(otherNodeId)) {
      continue;
    }
    if (
      rectsIntersect(
        candidateRect,
        expandRect(
          {
            height: options.nodeHeight,
            width: options.nodeWidth,
            x: otherPosition.x,
            y: otherPosition.y,
          },
          8,
        ),
      )
    ) {
      return false;
    }
  }

  return true;
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
