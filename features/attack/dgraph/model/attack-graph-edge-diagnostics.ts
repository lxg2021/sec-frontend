import type {
  AttackGraphEdgeDiagnostics,
  AttackGraphEdgeModel,
} from "./attack-graph-data";
import type {
  AttackGraphEdgeRouteData,
  AttackGraphNodeEdgeGeometry,
  AttackGraphRect,
} from "./attack-graph-edge-routing";

interface AttackGraphPoint {
  x: number;
  y: number;
}

interface SampledEdgePath {
  edge: AttackGraphEdgeModel;
  points: AttackGraphPoint[];
  route: AttackGraphEdgeRouteData;
}

const SAMPLE_COUNT = 18;
const NODE_BLOCK_PADDING = 8;
const MARKER_END_GAP = 7;

export function buildAttackGraphEdgeDiagnostics(
  edges: AttackGraphEdgeModel[],
  routesByEdgeId: Map<string, AttackGraphEdgeRouteData>,
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
): AttackGraphEdgeDiagnostics {
  const sampledEdges = edges.flatMap((edge) => {
    const route = routesByEdgeId.get(edge.id);
    const source = nodeGeometryById.get(edge.source);
    const target = nodeGeometryById.get(edge.target);
    if (!route || !source || !target) {
      return [];
    }

    return [
      {
        edge,
        points: sampleEdgePath({
          obstacle:
            route.kind === "skip"
              ? nodeGeometryById.get(route.obstacleId)
              : undefined,
          route,
          source,
          target,
        }),
        route,
      },
    ];
  });
  const blockedNodeIdsByEdgeId = new Map<string, Set<string>>();

  for (const sampledEdge of sampledEdges) {
    const blockedNodeIds = getBlockedNodeIds(sampledEdge, nodeGeometryById);
    if (blockedNodeIds.size > 0) {
      blockedNodeIdsByEdgeId.set(sampledEdge.edge.id, blockedNodeIds);
    }
  }

  const crossingPairCount = countCrossingPairs(sampledEdges);
  const blockedCounts = [...blockedNodeIdsByEdgeId.values()].map(
    (nodeIds) => nodeIds.size,
  );

  return {
    blockedEdgeCount: blockedNodeIdsByEdgeId.size,
    crossingPairCount,
    detourEdgeCount: [...routesByEdgeId.values()].filter(
      (route) => route.kind === "detour",
    ).length,
    edgeCount: edges.length,
    maxBlockedNodeCount: Math.max(0, ...blockedCounts),
    relationEdgeCount: edges.filter((edge) => edge.source !== edge.target).length,
    selfLoopEdgeCount: edges.filter((edge) => edge.source === edge.target).length,
    skipEdgeCount: [...routesByEdgeId.values()].filter(
      (route) => route.kind === "skip",
    ).length,
    suspiciousEdgeIds: [...blockedNodeIdsByEdgeId.keys()].slice(0, 12),
  };
}

function sampleEdgePath({
  route,
  source,
  target,
  obstacle,
}: {
  obstacle?: AttackGraphNodeEdgeGeometry;
  route: AttackGraphEdgeRouteData;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  if (route.kind === "self-loop") {
    return sampleSelfLoopPath(source, route);
  }

  if (route.kind === "elk") {
    return normalizePolylinePoints(route.points);
  }

  if (route.kind === "skip") {
    return sampleSkipPath({ obstacle, route, source, target });
  }

  if (route.kind === "detour") {
    return sampleDetourPath({ route, source, target });
  }

  if (
    route.kind === "linear-chain" ||
    route.kind === "single-source-fanout" ||
    route.kind === "multi-source-fanin" ||
    route.kind === "tree"
  ) {
    return sampleSimpleTopologyPath({ route, source, target });
  }

  if (route.kind === "overview") {
    return sampleOverviewPath({ route, source, target });
  }

  if (route.kind === "stress") {
    return sampleStressPath({ route, source, target });
  }

  return sampleRelationPath({ route, source, target });
}

function sampleRelationPath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "relation" }>;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const flowDirection: 1 | -1 = deltaX >= 0 ? 1 : -1;
  const targetDirection: 1 | -1 = flowDirection === 1 ? -1 : 1;
  const sourceShift = clamp(
    deltaY * 0.1 + route.fanoutOffset * 0.4,
    -source.radius * 0.56,
    source.radius * 0.56,
  );
  const targetShift = clamp(
    -deltaY * 0.1 + route.fanoutOffset * 0.4,
    -target.radius * 0.56,
    target.radius * 0.56,
  );
  const sourcePoint = getSideAnchorPoint(source, flowDirection, sourceShift);
  const targetPoint = getSideAnchorPoint(
    target,
    targetDirection,
    targetShift,
    MARKER_END_GAP,
  );
  const endpointDistance = distance(sourcePoint, targetPoint);
  const controlDistance = clamp(endpointDistance * 0.38, 38, 280);
  const sourceControl = {
    x: sourcePoint.x + flowDirection * controlDistance,
    y: sourcePoint.y + deltaY * 0.25 + route.fanoutOffset * 0.6,
  };
  const targetControl = {
    x: targetPoint.x - flowDirection * controlDistance,
    y: targetPoint.y - deltaY * 0.25 + route.fanoutOffset * 0.6,
  };

  return sampleCubic(sourcePoint, sourceControl, targetControl, targetPoint);
}

function sampleSimpleTopologyPath({
  route,
  source,
  target,
}: {
  route: Extract<
    AttackGraphEdgeRouteData,
    {
      kind:
        | "linear-chain"
        | "single-source-fanout"
        | "multi-source-fanin"
        | "tree";
    }
  >;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const flowDirection: 1 | -1 = deltaX >= 0 ? 1 : -1;
  const targetDirection: 1 | -1 = flowDirection === 1 ? -1 : 1;
  const sourceShift =
    route.kind === "single-source-fanout"
      ? clamp(deltaY * 0.08, -source.radius * 0.5, source.radius * 0.5)
      : 0;
  const targetShift =
    route.kind === "multi-source-fanin"
      ? clamp(-deltaY * 0.08, -target.radius * 0.5, target.radius * 0.5)
      : 0;
  const sourcePoint = getSideAnchorPoint(source, flowDirection, sourceShift);
  const targetPoint = getSideAnchorPoint(
    target,
    targetDirection,
    targetShift,
    MARKER_END_GAP,
  );
  const endpointDistance = distance(sourcePoint, targetPoint);
  const horizontalLead = clamp(endpointDistance * 0.18, 30, 74);
  const bendLift = clamp(deltaY * 0.08, -18, 18);
  const sourceControl = {
    x: sourcePoint.x + flowDirection * horizontalLead,
    y: sourcePoint.y + bendLift,
  };
  const targetControl = {
    x: targetPoint.x - flowDirection * horizontalLead,
    y: targetPoint.y - bendLift,
  };

  return sampleCubic(sourcePoint, sourceControl, targetControl, targetPoint);
}

function sampleOverviewPath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "overview" }>;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const flowDirection: 1 | -1 = deltaX >= 0 ? 1 : -1;
  const targetDirection: 1 | -1 = flowDirection === 1 ? -1 : 1;
  const fanoutShift = clamp(
    route.fanoutOffset,
    -source.radius * 0.7,
    source.radius * 0.7,
  );
  const sourceShift = clamp(
    deltaY * 0.08 + fanoutShift * 0.45,
    -source.radius * 0.64,
    source.radius * 0.64,
  );
  const targetShift = clamp(
    -deltaY * 0.08 + fanoutShift * 0.45,
    -target.radius * 0.64,
    target.radius * 0.64,
  );
  const sourcePoint = getSideAnchorPoint(source, flowDirection, sourceShift);
  const targetPoint = getSideAnchorPoint(
    target,
    targetDirection,
    targetShift,
    MARKER_END_GAP,
  );
  const endpointDistance = distance(sourcePoint, targetPoint);
  const controlDistance = clamp(endpointDistance * 0.34, 56, 260);
  const verticalBias = clamp(deltaY * 0.12, -46, 46);
  const fanoutBias = route.fanoutOffset * 0.8;
  const sourceControl = {
    x: sourcePoint.x + flowDirection * controlDistance,
    y: sourcePoint.y + verticalBias + fanoutBias,
  };
  const targetControl = {
    x: targetPoint.x - flowDirection * controlDistance,
    y: targetPoint.y - verticalBias + fanoutBias,
  };

  return sampleCubic(sourcePoint, sourceControl, targetControl, targetPoint);
}

function sampleStressPath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  if (route.parallelPair) {
    return sampleParallelPairStressPath({
      route,
      source,
      target,
    });
  }

  const vector = normalizeVector(
    target.centerX - source.centerX,
    target.centerY - source.centerY,
  );
  const normal = { x: -vector.y, y: vector.x };
  const endpointDistance = Math.hypot(
    target.centerX - source.centerX,
    target.centerY - source.centerY,
  );
  const sourcePoint = getRadialAnchorPoint(
    source,
    vector,
    route.fanoutOffset * 0.22 + (route.sourceFanoutOffset ?? 0),
  );
  const targetPoint = getRadialAnchorPoint(
    target,
    { x: -vector.x, y: -vector.y },
    route.fanoutOffset * 0.22 + (route.targetFanoutOffset ?? 0),
    MARKER_END_GAP,
  );
  const bend = getStressBendAmount(endpointDistance, route);
  const controlDistance = clamp(endpointDistance * 0.18, 32, 118);
  const sourceControl = {
    x: sourcePoint.x + vector.x * controlDistance + normal.x * bend * 0.42,
    y: sourcePoint.y + vector.y * controlDistance + normal.y * bend * 0.42,
  };
  const targetControl = {
    x: targetPoint.x - vector.x * controlDistance + normal.x * bend * 0.42,
    y: targetPoint.y - vector.y * controlDistance + normal.y * bend * 0.42,
  };

  return sampleCubic(sourcePoint, sourceControl, targetControl, targetPoint);
}

function sampleParallelPairStressPath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  const vector = normalizeVector(
    target.centerX - source.centerX,
    target.centerY - source.centerY,
  );
  const normal = { x: -vector.y, y: vector.x };
  const endpointDistance = Math.hypot(
    target.centerX - source.centerX,
    target.centerY - source.centerY,
  );
  const parallelOffset = getParallelPairOffset(route);
  const sourcePoint = getRadialAnchorPoint(source, vector, parallelOffset);
  const targetPoint = getRadialAnchorPoint(
    target,
    { x: -vector.x, y: -vector.y },
    -parallelOffset,
    MARKER_END_GAP,
  );
  const bend = getParallelPairBendAmount(endpointDistance, route);
  const controlDistance = clamp(endpointDistance * 0.18, 28, 92);
  const sourceControl = {
    x: sourcePoint.x + vector.x * controlDistance + normal.x * bend,
    y: sourcePoint.y + vector.y * controlDistance + normal.y * bend,
  };
  const targetControl = {
    x: targetPoint.x - vector.x * controlDistance + normal.x * bend,
    y: targetPoint.y - vector.y * controlDistance + normal.y * bend,
  };

  return sampleCubic(sourcePoint, sourceControl, targetControl, targetPoint);
}


function sampleSkipPath({
  obstacle,
  route,
  source,
  target,
}: {
  obstacle?: AttackGraphNodeEdgeGeometry;
  route: Extract<AttackGraphEdgeRouteData, { kind: "skip" }>;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const flowDirection: 1 | -1 = deltaX >= 0 ? 1 : -1;
  const targetDirection: 1 | -1 = flowDirection === 1 ? -1 : 1;
  const sourcePoint = getSideAnchorPoint(source, flowDirection, 0);
  const targetPoint = getSideAnchorPoint(
    target,
    targetDirection,
    0,
    MARKER_END_GAP,
  );
  const obstacleBounds = getObstacleBounds(obstacle);
  const detourSign = route.detourSide === "above" ? -1 : 1;
  const detourY =
    route.detourSide === "above"
      ? obstacleBounds.y - 34
      : obstacleBounds.y + obstacleBounds.height + 34;
  const endpointDistance = distance(sourcePoint, targetPoint);
  const controlDistance = clamp(endpointDistance * 0.38, 38, 280);
  const controlY = getCubicControlYForMidpoint(
    sourcePoint.y,
    targetPoint.y,
    detourY + detourSign * Math.abs(route.fanoutOffset) * 0.35,
  );
  const sourceControl = {
    x: sourcePoint.x + flowDirection * controlDistance,
    y: controlY + deltaY * 0.08,
  };
  const targetControl = {
    x: targetPoint.x - flowDirection * controlDistance,
    y: controlY - deltaY * 0.08,
  };

  return sampleCubic(sourcePoint, sourceControl, targetControl, targetPoint);
}

function sampleDetourPath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "detour" }>;
  source: AttackGraphNodeEdgeGeometry;
  target: AttackGraphNodeEdgeGeometry;
}) {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const flowDirection: 1 | -1 = deltaX >= 0 ? 1 : -1;
  const targetDirection: 1 | -1 = flowDirection === 1 ? -1 : 1;
  const sourcePoint = getSideAnchorPoint(
    source,
    flowDirection,
    clamp(route.fanoutOffset * 0.34, -source.radius * 0.45, source.radius * 0.45),
  );
  const targetPoint = getSideAnchorPoint(
    target,
    targetDirection,
    clamp(route.fanoutOffset * 0.34, -target.radius * 0.45, target.radius * 0.45),
    MARKER_END_GAP,
  );
  const endpointDistance = distance(sourcePoint, targetPoint);
  const detourSign = route.detourSide === "above" ? -1 : 1;
  const detourLift =
    detourSign *
    clamp(Math.abs(deltaY) * 0.42 + endpointDistance * 0.16, 76, 180);
  const controlDistance = clamp(endpointDistance * 0.35, 72, 320);
  const sourceControl = {
    x: sourcePoint.x + flowDirection * controlDistance,
    y: sourcePoint.y + detourLift + route.fanoutOffset * 0.5,
  };
  const targetControl = {
    x: targetPoint.x - flowDirection * controlDistance,
    y: targetPoint.y + detourLift + route.fanoutOffset * 0.5,
  };

  return sampleCubic(sourcePoint, sourceControl, targetControl, targetPoint);
}

function sampleSelfLoopPath(
  node: AttackGraphNodeEdgeGeometry,
  route: Extract<AttackGraphEdgeRouteData, { kind: "self-loop" }>,
) {
  const radius = node.radius;
  const loopDepth = radius + 54 + route.index * 18;
  const startAngle = getSelfLoopStartAngle(route.side);
  const endAngle = getSelfLoopEndAngle(route.side);
  const controlAngle = getSelfLoopControlAngle(route.side);
  const startPoint = pointFromCenter(node, startAngle, radius);
  const endPoint = pointFromCenter(node, endAngle, radius + MARKER_END_GAP);
  const firstControl = pointFromCenter(node, controlAngle - 0.36, loopDepth);
  const secondControl = pointFromCenter(node, controlAngle + 0.36, loopDepth);

  return sampleCubic(startPoint, firstControl, secondControl, endPoint);
}

function getObstacleBounds(
  obstacle: AttackGraphNodeEdgeGeometry | undefined,
): AttackGraphRect {
  if (obstacle?.bounds) {
    return obstacle.bounds;
  }

  const radius = obstacle?.radius ?? 33;
  const centerX = obstacle?.centerX ?? 0;
  const centerY = obstacle?.centerY ?? 0;
  return {
    x: centerX - radius,
    y: centerY - radius,
    width: radius * 2,
    height: radius * 2,
  };
}

function getCubicControlYForMidpoint(
  sourceY: number,
  targetY: number,
  midpointY: number,
) {
  return (midpointY - 0.125 * (sourceY + targetY)) / 0.75;
}

function sampleCubic(
  start: AttackGraphPoint,
  firstControl: AttackGraphPoint,
  secondControl: AttackGraphPoint,
  end: AttackGraphPoint,
) {
  const points: AttackGraphPoint[] = [];
  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    points.push(
      getCubicPoint(
        start,
        firstControl,
        secondControl,
        end,
        index / SAMPLE_COUNT,
      ),
    );
  }
  return points;
}

function getBlockedNodeIds(
  sampledEdge: SampledEdgePath,
  nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>,
) {
  const blockedNodeIds = new Set<string>();

  for (const node of nodeGeometryById.values()) {
    if (node.id === sampledEdge.edge.source || node.id === sampledEdge.edge.target) {
      continue;
    }

    const blockBounds =
      sampledEdge.route.kind === "elk" ||
      sampledEdge.route.kind === "overview" ||
      sampledEdge.route.kind === "stress"
        ? getElkNodeBlockBounds(node)
        : node.bounds;
    const expandedBounds = expandRect(blockBounds, NODE_BLOCK_PADDING);
    if (polylineIntersectsRect(sampledEdge.points, expandedBounds)) {
      blockedNodeIds.add(node.id);
    }
  }

  return blockedNodeIds;
}

function normalizePolylinePoints(points: AttackGraphPoint[]) {
  const normalized: AttackGraphPoint[] = [];

  for (const point of points) {
    const previous = normalized[normalized.length - 1];
    if (
      previous &&
      Math.abs(previous.x - point.x) < 0.5 &&
      Math.abs(previous.y - point.y) < 0.5
    ) {
      continue;
    }
    normalized.push(point);
  }

  return normalized;
}

function getElkNodeBlockBounds(
  node: AttackGraphNodeEdgeGeometry,
): AttackGraphRect {
  return {
    height: node.radius * 2,
    width: node.radius * 2,
    x: node.centerX - node.radius,
    y: node.centerY - node.radius,
  };
}

function countCrossingPairs(sampledEdges: SampledEdgePath[]) {
  let count = 0;
  for (let leftIndex = 0; leftIndex < sampledEdges.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < sampledEdges.length;
      rightIndex += 1
    ) {
      if (shareEndpoint(sampledEdges[leftIndex].edge, sampledEdges[rightIndex].edge)) {
        continue;
      }
      if (
        equivalentPolylines(
          sampledEdges[leftIndex].points,
          sampledEdges[rightIndex].points,
        )
      ) {
        continue;
      }
      if (polylinesIntersect(sampledEdges[leftIndex].points, sampledEdges[rightIndex].points)) {
        count += 1;
      }
    }
  }
  return count;
}

function polylineIntersectsRect(points: AttackGraphPoint[], rect: AttackGraphRect) {
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    if (
      pointInRect(start, rect) ||
      pointInRect(end, rect) ||
      segmentIntersectsRect(start, end, rect)
    ) {
      return true;
    }
  }
  return false;
}

function polylinesIntersect(
  left: AttackGraphPoint[],
  right: AttackGraphPoint[],
) {
  for (let leftIndex = 1; leftIndex < left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex < right.length; rightIndex += 1) {
      if (
        lineSegmentsIntersect(
          left[leftIndex - 1],
          left[leftIndex],
          right[rightIndex - 1],
          right[rightIndex],
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function equivalentPolylines(
  left: AttackGraphPoint[],
  right: AttackGraphPoint[],
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((point, index) => {
    const otherPoint = right[index];
    return (
      Math.abs(point.x - otherPoint.x) < 0.5 &&
      Math.abs(point.y - otherPoint.y) < 0.5
    );
  });
}

function segmentIntersectsRect(
  start: AttackGraphPoint,
  end: AttackGraphPoint,
  rect: AttackGraphRect,
) {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  return (
    lineSegmentsIntersect(start, end, { x: left, y: top }, { x: right, y: top }) ||
    lineSegmentsIntersect(start, end, { x: right, y: top }, { x: right, y: bottom }) ||
    lineSegmentsIntersect(start, end, { x: right, y: bottom }, { x: left, y: bottom }) ||
    lineSegmentsIntersect(start, end, { x: left, y: bottom }, { x: left, y: top })
  );
}

function shareEndpoint(left: AttackGraphEdgeModel, right: AttackGraphEdgeModel) {
  return (
    left.source === right.source ||
    left.source === right.target ||
    left.target === right.source ||
    left.target === right.target
  );
}

function expandRect(rect: AttackGraphRect, padding: number): AttackGraphRect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function pointInRect(point: AttackGraphPoint, rect: AttackGraphRect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function lineSegmentsIntersect(
  firstStart: AttackGraphPoint,
  firstEnd: AttackGraphPoint,
  secondStart: AttackGraphPoint,
  secondEnd: AttackGraphPoint,
) {
  const d1 = direction(secondStart, secondEnd, firstStart);
  const d2 = direction(secondStart, secondEnd, firstEnd);
  const d3 = direction(firstStart, firstEnd, secondStart);
  const d4 = direction(firstStart, firstEnd, secondEnd);

  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

function direction(
  start: AttackGraphPoint,
  end: AttackGraphPoint,
  point: AttackGraphPoint,
) {
  return (point.x - start.x) * (end.y - start.y) -
    (point.y - start.y) * (end.x - start.x);
}

function getSideAnchorPoint(
  circle: AttackGraphNodeEdgeGeometry,
  side: 1 | -1,
  yShift: number,
  radiusOutset = 0,
) {
  const radius = circle.radius + radiusOutset;
  const safeShift = clamp(yShift, -radius * 0.72, radius * 0.72);
  const xOffset = Math.sqrt(Math.max(radius * radius - safeShift * safeShift, 0));

  return {
    x: circle.centerX + side * xOffset,
    y: circle.centerY + safeShift,
  };
}

function getRadialAnchorPoint(
  circle: AttackGraphNodeEdgeGeometry,
  direction: AttackGraphPoint,
  normalOffset = 0,
  radiusOutset = 0,
) {
  const normal = { x: -direction.y, y: direction.x };
  const radius = circle.radius + radiusOutset;
  const safeOffset = clamp(normalOffset, -radius * 0.58, radius * 0.58);
  const radialDistance = Math.sqrt(
    Math.max(radius * radius - safeOffset * safeOffset, 0),
  );

  return {
    x: circle.centerX + direction.x * radialDistance + normal.x * safeOffset,
    y: circle.centerY + direction.y * radialDistance + normal.y * safeOffset,
  };
}

function normalizeVector(x: number, y: number): AttackGraphPoint {
  const vectorLength = Math.hypot(x, y);
  if (vectorLength < 0.001) {
    return { x: 1, y: 0 };
  }

  return {
    x: x / vectorLength,
    y: y / vectorLength,
  };
}

function getStressEdgeNormal(
  vector: AttackGraphPoint,
  fanoutIndex: number,
) {
  const normal = { x: -vector.y, y: vector.x };
  if (fanoutIndex < 0) {
    return { x: -normal.x, y: -normal.y };
  }

  return normal;
}

function getStressBendAmount(
  edgeDistance: number,
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>,
) {
  if (route.fanoutCount <= 1) {
    return clamp(edgeDistance * 0.028, 6, 18);
  }

  const baseBend = clamp(edgeDistance * 0.032, 8, 20);
  return (
    route.fanoutOffset * 0.72 +
    Math.sign(route.fanoutIndex || 1) * baseBend
  );
}

function getParallelPairOffset(
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>,
) {
  if (typeof route.parallelOffset === "number") {
    return route.parallelOffset;
  }
  if (route.fanoutCount <= 1) {
    return 0;
  }

  const step = route.fanoutCount <= 3 ? 22 : route.fanoutCount <= 6 ? 17 : 13;
  return clamp(route.fanoutIndex * step, -44, 44);
}

function getParallelPairBendAmount(
  edgeDistance: number,
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>,
) {
  const offset = getParallelPairOffset(route);
  if (route.fanoutIndex === 0) {
    return 0;
  }

  const maxBend = Math.max(18, Math.min(42, edgeDistance * 0.24));
  return clamp(offset * 0.72, -maxBend, maxBend);
}

function getCubicPoint(
  start: AttackGraphPoint,
  firstControl: AttackGraphPoint,
  secondControl: AttackGraphPoint,
  end: AttackGraphPoint,
  t: number,
) {
  const inv = 1 - t;
  const inv2 = inv * inv;
  const inv3 = inv2 * inv;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x:
      inv3 * start.x +
      3 * inv2 * t * firstControl.x +
      3 * inv * t2 * secondControl.x +
      t3 * end.x,
    y:
      inv3 * start.y +
      3 * inv2 * t * firstControl.y +
      3 * inv * t2 * secondControl.y +
      t3 * end.y,
  };
}

function pointFromCenter(
  circle: AttackGraphNodeEdgeGeometry,
  angle: number,
  distanceFromCenter: number,
) {
  return {
    x: circle.centerX + Math.cos(angle) * distanceFromCenter,
    y: circle.centerY + Math.sin(angle) * distanceFromCenter,
  };
}

function getSelfLoopStartAngle(side: string) {
  if (side === "top") return degreesToRadians(240);
  if (side === "bottom") return degreesToRadians(60);
  if (side === "left") return degreesToRadians(150);
  return degreesToRadians(330);
}

function getSelfLoopEndAngle(side: string) {
  if (side === "top") return degreesToRadians(300);
  if (side === "bottom") return degreesToRadians(120);
  if (side === "left") return degreesToRadians(210);
  return degreesToRadians(30);
}

function getSelfLoopControlAngle(side: string) {
  if (side === "top") return degreesToRadians(270);
  if (side === "bottom") return degreesToRadians(90);
  if (side === "left") return degreesToRadians(180);
  return 0;
}

function distance(left: AttackGraphPoint, right: AttackGraphPoint) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function degreesToRadians(value: number) {
  return (value / 180) * Math.PI;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
