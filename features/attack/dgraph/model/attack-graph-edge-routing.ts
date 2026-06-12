import type { AttackGraphEdgeModel } from "./attack-graph-data";

export interface AttackGraphRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AttackGraphEdgeEndpointGeometry {
  centerX: number;
  centerY: number;
  radius: number;
}

export interface AttackGraphNodeEdgeGeometry
  extends AttackGraphEdgeEndpointGeometry {
  id: string;
  bounds: AttackGraphRect;
}

export type AttackGraphSelfLoopSide = "top" | "right" | "bottom" | "left";

export type AttackGraphEdgeRouteData =
  | {
      fanoutCount: number;
      fanoutIndex: number;
      fanoutOffset: number;
      kind: "relation";
    }
  | {
      count: number;
      index: number;
      kind: "self-loop";
      side: AttackGraphSelfLoopSide;
    };

export interface AttackGraphEdgeGeometryData {
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
  route: AttackGraphEdgeRouteData;
}

type AttackGraphEndpointSide = AttackGraphSelfLoopSide;

const SELF_LOOP_SIDES: AttackGraphSelfLoopSide[] = [
  "top",
  "bottom",
  "right",
  "left",
];
const SELF_LOOP_SIDE_PREFERENCE: Record<AttackGraphSelfLoopSide, number> = {
  top: 0,
  bottom: 2,
  right: 6,
  left: 8,
};

export function buildAttackGraphEdgeRoutes(
  edges: AttackGraphEdgeModel[],
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
): Map<string, AttackGraphEdgeRouteData> {
  const routesByEdgeId = new Map<string, AttackGraphEdgeRouteData>();
  const endpointSideUsageByNodeId = buildEndpointSideUsage(
    edges,
    nodeGeometryById,
  );
  const relationSegments = buildRelationSegments(edges, nodeGeometryById);

  for (const edgeGroup of groupEdgesBySource(edges)) {
    const routedEdges = edgeGroup
      .filter((edge) => edge.source !== edge.target)
      .sort((left, right) =>
        compareEdgesForFanout(left, right, nodeGeometryById),
      );

    const count = routedEdges.length;
    routedEdges.forEach((edge, index) => {
      const fanoutIndex = index - (count - 1) / 2;
      routesByEdgeId.set(edge.id, {
        fanoutCount: count,
        fanoutIndex,
        fanoutOffset: getFanoutOffset(fanoutIndex, count),
        kind: "relation",
      });
    });
  }

  const assignedLoopSideCounts = new Map<
    string,
    Partial<Record<AttackGraphSelfLoopSide, number>>
  >();
  for (const edgeGroup of groupSelfLoopEdgesByNode(edges)) {
    const nodeGeometry = nodeGeometryById.get(edgeGroup.nodeId);
    if (!nodeGeometry) {
      continue;
    }

    const sortedEdges = [...edgeGroup.edges].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    for (const edge of sortedEdges) {
      const sideCounts =
        assignedLoopSideCounts.get(edgeGroup.nodeId) ?? createSelfLoopSideCounts();
      const side = chooseSelfLoopSide({
        endpointSideUsage:
          endpointSideUsageByNodeId.get(edgeGroup.nodeId) ?? new Map(),
        nodeGeometry,
        nodeGeometryById,
        relationSegments,
        sideCounts,
      });
      const sideIndex = sideCounts[side] ?? 0;

      sideCounts[side] = sideIndex + 1;
      assignedLoopSideCounts.set(edgeGroup.nodeId, sideCounts);
      routesByEdgeId.set(edge.id, {
        count: sortedEdges.length,
        index: sideIndex,
        kind: "self-loop",
        side,
      });
    }
  }

  return routesByEdgeId;
}

function createSelfLoopSideCounts() {
  return {} as Partial<Record<AttackGraphSelfLoopSide, number>>;
}

function groupEdgesBySource(edges: AttackGraphEdgeModel[]) {
  const groups = new Map<string, AttackGraphEdgeModel[]>();
  for (const edge of edges) {
    groups.set(edge.source, [...(groups.get(edge.source) ?? []), edge]);
  }
  return [...groups.values()];
}

function groupSelfLoopEdgesByNode(edges: AttackGraphEdgeModel[]) {
  const groups = new Map<string, AttackGraphEdgeModel[]>();
  for (const edge of edges) {
    if (edge.source !== edge.target) {
      continue;
    }
    groups.set(edge.source, [...(groups.get(edge.source) ?? []), edge]);
  }

  return [...groups.entries()].map(([nodeId, groupEdges]) => ({
    edges: groupEdges,
    nodeId,
  }));
}

function compareEdgesForFanout(
  left: AttackGraphEdgeModel,
  right: AttackGraphEdgeModel,
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
) {
  const leftTarget = nodeGeometryById.get(left.target);
  const rightTarget = nodeGeometryById.get(right.target);
  const leftSource = nodeGeometryById.get(left.source);
  const rightSource = nodeGeometryById.get(right.source);
  const leftY = leftTarget?.centerY ?? leftSource?.centerY ?? 0;
  const rightY = rightTarget?.centerY ?? rightSource?.centerY ?? 0;

  if (leftY !== rightY) {
    return leftY - rightY;
  }

  const leftX = leftTarget?.centerX ?? 0;
  const rightX = rightTarget?.centerX ?? 0;
  if (leftX !== rightX) {
    return leftX - rightX;
  }

  return left.id.localeCompare(right.id);
}

function getFanoutOffset(fanoutIndex: number, fanoutCount: number) {
  if (fanoutCount <= 1) {
    return 0;
  }

  const step = fanoutCount <= 3 ? 18 : fanoutCount <= 6 ? 15 : 12;
  return clamp(fanoutIndex * step, -54, 54);
}

function buildEndpointSideUsage(
  edges: AttackGraphEdgeModel[],
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
) {
  const usageByNodeId = new Map<string, Map<AttackGraphEndpointSide, number>>();

  for (const edge of edges) {
    if (edge.source === edge.target) {
      continue;
    }

    const sourceGeometry = nodeGeometryById.get(edge.source);
    const targetGeometry = nodeGeometryById.get(edge.target);
    if (!sourceGeometry || !targetGeometry) {
      continue;
    }

    incrementSideUsage(
      usageByNodeId,
      edge.source,
      getEndpointSide(sourceGeometry, targetGeometry),
    );
    incrementSideUsage(
      usageByNodeId,
      edge.target,
      getEndpointSide(targetGeometry, sourceGeometry),
    );
  }

  return usageByNodeId;
}

function incrementSideUsage(
  usageByNodeId: Map<string, Map<AttackGraphEndpointSide, number>>,
  nodeId: string,
  side: AttackGraphEndpointSide,
) {
  const usage = usageByNodeId.get(nodeId) ?? new Map();
  usage.set(side, (usage.get(side) ?? 0) + 1);
  usageByNodeId.set(nodeId, usage);
}

function getEndpointSide(
  from: AttackGraphNodeEdgeGeometry,
  to: AttackGraphNodeEdgeGeometry,
): AttackGraphEndpointSide {
  const deltaX = to.centerX - from.centerX;
  const deltaY = to.centerY - from.centerY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? "right" : "left";
  }

  return deltaY >= 0 ? "bottom" : "top";
}

function buildRelationSegments(
  edges: AttackGraphEdgeModel[],
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
) {
  return edges.flatMap((edge) => {
    if (edge.source === edge.target) {
      return [];
    }

    const sourceGeometry = nodeGeometryById.get(edge.source);
    const targetGeometry = nodeGeometryById.get(edge.target);
    if (!sourceGeometry || !targetGeometry) {
      return [];
    }

    return [
      {
        x1: sourceGeometry.centerX,
        x2: targetGeometry.centerX,
        y1: sourceGeometry.centerY,
        y2: targetGeometry.centerY,
      },
    ];
  });
}

function chooseSelfLoopSide({
  endpointSideUsage,
  nodeGeometry,
  nodeGeometryById,
  relationSegments,
  sideCounts,
}: {
  endpointSideUsage: Map<AttackGraphEndpointSide, number>;
  nodeGeometry: AttackGraphNodeEdgeGeometry;
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>;
  relationSegments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  sideCounts: Partial<Record<AttackGraphSelfLoopSide, number>>;
}) {
  let bestSide: AttackGraphSelfLoopSide = "top";
  let bestScore = Number.POSITIVE_INFINITY;

  for (const side of SELF_LOOP_SIDES) {
    const loopBounds = getSelfLoopBounds(nodeGeometry, side);
    const endpointUsage = endpointSideUsage.get(side) ?? 0;
    const loopCount = sideCounts[side] ?? 0;
    const obstacleCount = countSelfLoopObstacles({
      loopBounds,
      nodeGeometry,
      nodeGeometryById,
    });
    const crossingCount = relationSegments.filter((segment) =>
      segmentIntersectsRect(segment, loopBounds),
    ).length;
    const score =
      endpointUsage * 120 +
      loopCount * 72 +
      obstacleCount * 56 +
      crossingCount * 28 +
      SELF_LOOP_SIDE_PREFERENCE[side];

    if (score < bestScore) {
      bestScore = score;
      bestSide = side;
    }
  }

  return bestSide;
}

function getSelfLoopBounds(
  nodeGeometry: AttackGraphNodeEdgeGeometry,
  side: AttackGraphSelfLoopSide,
): AttackGraphRect {
  const span = nodeGeometry.radius + 50;
  const depth = nodeGeometry.radius + 76;
  const centerX = nodeGeometry.centerX;
  const centerY = nodeGeometry.centerY;

  if (side === "top") {
    return {
      x: centerX - span,
      y: centerY - depth,
      width: span * 2,
      height: depth - nodeGeometry.radius,
    };
  }
  if (side === "bottom") {
    return {
      x: centerX - span,
      y: centerY + nodeGeometry.radius,
      width: span * 2,
      height: depth - nodeGeometry.radius,
    };
  }
  if (side === "left") {
    return {
      x: centerX - depth,
      y: centerY - span,
      width: depth - nodeGeometry.radius,
      height: span * 2,
    };
  }
  return {
    x: centerX + nodeGeometry.radius,
    y: centerY - span,
    width: depth - nodeGeometry.radius,
    height: span * 2,
  };
}

function countSelfLoopObstacles({
  loopBounds,
  nodeGeometry,
  nodeGeometryById,
}: {
  loopBounds: AttackGraphRect;
  nodeGeometry: AttackGraphNodeEdgeGeometry;
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>;
}) {
  let count = 0;
  const expandedLoopBounds = expandRect(loopBounds, 10);

  for (const otherNodeGeometry of nodeGeometryById.values()) {
    if (otherNodeGeometry.id === nodeGeometry.id) {
      continue;
    }

    if (rectsIntersect(expandedLoopBounds, expandRect(otherNodeGeometry.bounds, 8))) {
      count += 1;
    }
  }

  return count;
}

function expandRect(rect: AttackGraphRect, padding: number): AttackGraphRect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function rectsIntersect(left: AttackGraphRect, right: AttackGraphRect) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function segmentIntersectsRect(
  segment: { x1: number; y1: number; x2: number; y2: number },
  rect: AttackGraphRect,
) {
  const expandedRect = expandRect(rect, 6);
  if (
    pointInRect(segment.x1, segment.y1, expandedRect) ||
    pointInRect(segment.x2, segment.y2, expandedRect)
  ) {
    return true;
  }

  const left = expandedRect.x;
  const right = expandedRect.x + expandedRect.width;
  const top = expandedRect.y;
  const bottom = expandedRect.y + expandedRect.height;

  return (
    lineSegmentsIntersect(segment, { x1: left, y1: top, x2: right, y2: top }) ||
    lineSegmentsIntersect(segment, {
      x1: right,
      y1: top,
      x2: right,
      y2: bottom,
    }) ||
    lineSegmentsIntersect(segment, {
      x1: right,
      y1: bottom,
      x2: left,
      y2: bottom,
    }) ||
    lineSegmentsIntersect(segment, { x1: left, y1: bottom, x2: left, y2: top })
  );
}

function pointInRect(x: number, y: number, rect: AttackGraphRect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

function lineSegmentsIntersect(
  first: { x1: number; y1: number; x2: number; y2: number },
  second: { x1: number; y1: number; x2: number; y2: number },
) {
  const d1 = direction(second.x1, second.y1, second.x2, second.y2, first.x1, first.y1);
  const d2 = direction(second.x1, second.y1, second.x2, second.y2, first.x2, first.y2);
  const d3 = direction(first.x1, first.y1, first.x2, first.y2, second.x1, second.y1);
  const d4 = direction(first.x1, first.y1, first.x2, first.y2, second.x2, second.y2);

  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

function direction(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
