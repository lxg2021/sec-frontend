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
    }
  | {
      fanoutCount: number;
      fanoutIndex: number;
      fanoutOffset: number;
      kind: "skip";
      obstacleId: string;
      detourSide: "above" | "below";
    };

export interface AttackGraphEdgeGeometryData {
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
  route: AttackGraphEdgeRouteData;
  obstacle?: AttackGraphEdgeEndpointGeometry;
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

  for (const edgeGroup of groupEdgesBySourceTarget(edges)) {
    const routedEdges = edgeGroup
      .filter((edge) => edge.source !== edge.target)
      .sort((left, right) =>
        compareEdgesForFanout(left, right, nodeGeometryById),
      );

    const count = routedEdges.length;
    routedEdges.forEach((edge, index) => {
      const magnitude = Math.floor(index / 2) + 1;
      const direction = index % 2 === 0 ? 1 : -1;
      const fanoutIndex = direction * magnitude;
      routesByEdgeId.set(edge.id, {
        fanoutCount: count,
        fanoutIndex,
        fanoutOffset: clamp(fanoutIndex * getFanoutStep(count), -54, 54),
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

  applySkipRouting(routesByEdgeId, edges, nodeGeometryById);

  return routesByEdgeId;
}

function createSelfLoopSideCounts() {
  return {} as Partial<Record<AttackGraphSelfLoopSide, number>>;
}

function groupEdgesBySourceTarget(edges: AttackGraphEdgeModel[]) {
  const groups = new Map<string, AttackGraphEdgeModel[]>();
  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    groups.set(key, [...(groups.get(key) ?? []), edge]);
  }
  return [...groups.values()];
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

function getFanoutStep(fanoutCount: number) {
  if (fanoutCount <= 1) return 0;
  if (fanoutCount <= 3) return 22;
  if (fanoutCount <= 6) return 19;
  return 16;
}

function getFanoutOffset(fanoutIndex: number, fanoutCount: number) {
  if (fanoutCount <= 1) {
    return 0;
  }

  const step = fanoutCount <= 3 ? 22 : fanoutCount <= 6 ? 19 : 16;
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

const RELATION_CORRIDOR_WIDTH = 28;

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
        thickness: RELATION_CORRIDOR_WIDTH,
      },
    ];
  });
}

function getAdjacentSideConflict(
  endpointSideUsage: Map<AttackGraphEndpointSide, number>,
  side: AttackGraphSelfLoopSide,
) {
  const adjacentSides = getAdjacentSides(side);
  let conflict = 0;
  for (const adj of adjacentSides) {
    conflict += endpointSideUsage.get(adj) ?? 0;
  }
  return conflict;
}

function getAdjacentSides(side: AttackGraphSelfLoopSide): AttackGraphEndpointSide[] {
  if (side === "top" || side === "bottom") {
    return ["left", "right"];
  }
  return ["top", "bottom"];
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
    const nextIndex = sideCounts[side] ?? 0;
    const loopBounds = getSelfLoopBounds(nodeGeometry, side, nextIndex);
    const endpointUsage = endpointSideUsage.get(side) ?? 0;
    const loopCount = nextIndex;
    const obstacleCount = countSelfLoopObstacles({
      loopBounds,
      nodeGeometry,
      nodeGeometryById,
    });
    const crossingCount = relationSegments.filter((segment) =>
      segmentIntersectsRect(segment, loopBounds),
    ).length;
    const adjacentConflict = getAdjacentSideConflict(
      endpointSideUsage,
      side,
    );
    const score =
      endpointUsage * 140 +
      loopCount * 72 +
      obstacleCount * 56 +
      crossingCount * 48 +
      adjacentConflict * 36 +
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
  index = 0,
): AttackGraphRect {
  const depthOffset = 54 + index * 18;
  const spanOffset = 34 + index * 10;
  const depth = nodeGeometry.radius + depthOffset + 10;
  const span = nodeGeometry.radius + spanOffset + 8;
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
  segment: { x1: number; y1: number; x2: number; y2: number; thickness?: number },
  rect: AttackGraphRect,
) {
  const halfThickness = (segment.thickness ?? 0) / 2;
  const expandedRect = expandRect(rect, 6 + halfThickness);
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

function applySkipRouting(
  routesByEdgeId: Map<string, AttackGraphEdgeRouteData>,
  edges: AttackGraphEdgeModel[],
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
) {
  for (const edge of edges) {
    if (edge.source === edge.target) continue;

    const route = routesByEdgeId.get(edge.id);
    if (!route || route.kind !== "relation") continue;

    const source = nodeGeometryById.get(edge.source);
    const target = nodeGeometryById.get(edge.target);
    if (!source || !target) continue;

    const obstacle = findObstacleBetween(source, target, nodeGeometryById, edge.source, edge.target);
    if (!obstacle) continue;

    const detourSide = determineDetourSide(source, target, obstacle);

    routesByEdgeId.set(edge.id, {
      fanoutCount: route.fanoutCount,
      fanoutIndex: route.fanoutIndex,
      fanoutOffset: route.fanoutOffset,
      kind: "skip",
      obstacleId: obstacle.id,
      detourSide,
    });
  }
}

function findObstacleBetween(
  source: AttackGraphNodeEdgeGeometry,
  target: AttackGraphNodeEdgeGeometry,
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
  sourceId: string,
  targetId: string,
): AttackGraphNodeEdgeGeometry | null {
  const cx1 = source.centerX;
  const cy1 = source.centerY;
  const cx2 = target.centerX;
  const cy2 = target.centerY;

  let bestObstacle: AttackGraphNodeEdgeGeometry | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const node of nodeGeometryById.values()) {
    if (node.id === sourceId || node.id === targetId) continue;

    const dist = pointToSegmentDist(
      cx1, cy1,
      cx2, cy2,
      node.centerX, node.centerY,
    );

    if (dist < node.radius + 18 && dist < bestDist) {
      bestDist = dist;
      bestObstacle = node;
    }
  }

  return bestObstacle;
}

function determineDetourSide(
  source: AttackGraphNodeEdgeGeometry,
  target: AttackGraphNodeEdgeGeometry,
  obstacle: AttackGraphNodeEdgeGeometry,
): "above" | "below" {
  const midY = (source.centerY + target.centerY) / 2;
  return obstacle.centerY < midY ? "above" : "below";
}

function pointToSegmentDist(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 0.001) {
    return Math.hypot(cx - ax, cy - ay);
  }

  let t = ((cx - ax) * dx + (cy - ay) * dy) / lenSq;
  t = clamp(t, 0, 1);

  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  return Math.hypot(closestX - cx, closestY - cy);
}
