"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from "reactflow";

import { cn } from "@/shared/lib/utils";

import type { AttackGraphEdgeModel } from "../model/core/attack-graph-data";
import type {
  AttackGraphEdgeInteractionState,
  AttackGraphEdgeVisualData,
} from "../model/edge/attack-graph-edge-config";
import type {
  AttackGraphEdgeEndpointGeometry,
  AttackGraphEdgeGeometryData,
  AttackGraphEdgeRouteData,
  AttackGraphNodeEdgeGeometry,
  AttackGraphRect,
  AttackGraphSelfLoopSide,
} from "../model/edge/attack-graph-edge-routing";

export interface AttackGraphEdgeData {
  edge: AttackGraphEdgeModel;
  geometry?: AttackGraphEdgeGeometryData;
  visual: AttackGraphEdgeVisualData;
  interactionState: AttackGraphEdgeInteractionState;
  sourceColor: string;
  targetColor: string;
}

const FALLBACK_NODE_RADIUS = 33;
const MARKER_END_GAP = 7;

export function AttackGraphEdge({
  data,
  id,
  source,
  sourceX,
  sourceY,
  target,
  targetX,
  targetY,
}: EdgeProps<AttackGraphEdgeData>) {
  if (!data) {
    return null;
  }

  const visual = data.visual;
  const state = visual.state[data.interactionState];
  const isSelfLoop = source === target;
  const sourceGeometry =
    data.geometry?.source ??
    getFallbackEndpointGeometry(sourceX, sourceY);
  const targetGeometry =
    data.geometry?.target ??
    getFallbackEndpointGeometry(targetX, targetY);
  const route =
    data.geometry?.route ?? getFallbackEdgeRoute(isSelfLoop);
  const pathResult =
    route.kind === "self-loop"
      ? getSelfLoopPath(sourceGeometry, route)
      : route.kind === "linear-chain"
        ? getSimpleTopologyEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
          })
      : route.kind === "single-source-fanout"
        ? getSimpleTopologyEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
          })
      : route.kind === "multi-source-fanin"
        ? getSimpleTopologyEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
          })
      : route.kind === "tree"
        ? getSimpleTopologyEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
          })
      : route.kind === "stress"
        ? getStressEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
          })
      : route.kind === "skip"
        ? getSkipEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
            obstacle: data.geometry?.obstacle,
          })
      : route.kind === "detour"
        ? getDetourEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
          })
        : getGraphEdgePath({
            route,
            source: sourceGeometry,
            target: targetGeometry,
          });
  const stroke =
    visual.colorMode === "gradient"
      ? `url(#${getEdgeGradientId(id, data.interactionState)})`
      : state.color;
  const sourceColor =
    visual.colorMode === "gradient" ? data.sourceColor : state.color;
  const targetColor =
    visual.colorMode === "gradient" ? data.targetColor : state.color;
  const markerId = getEdgeMarkerId(id, data.interactionState);
  const markerEnd =
    visual.marker.type === "none" ? undefined : `url(#${markerId})`;
  const emphasized =
    data.interactionState === "hover" ||
    data.interactionState === "selected";
  const showLabel =
    route.kind !== "stress" || emphasized;

  return (
    <>
      <defs>
        {visual.colorMode === "gradient" ? (
          <linearGradient
            id={getEdgeGradientId(id, data.interactionState)}
            gradientUnits="userSpaceOnUse"
            x1={pathResult.gradient.x1}
            x2={pathResult.gradient.x2}
            y1={pathResult.gradient.y1}
            y2={pathResult.gradient.y2}
          >
            <stop offset="0%" stopColor={sourceColor} />
            <stop offset="100%" stopColor={targetColor} />
          </linearGradient>
        ) : null}
        {visual.marker.type !== "none" ? (
          <AttackGraphEdgeMarker
            color={targetColor}
            id={markerId}
            opacity={state.opacity}
            strokeWidth={state.width}
            type={visual.marker.type}
          />
        ) : null}
      </defs>
      {emphasized ? (
        <>
          <BaseEdge
            id={`${id}-glow`}
            path={pathResult.path}
            style={{
              fill: "none",
              opacity: data.interactionState === "selected" ? 0.06 : 0.03,
              stroke,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth:
                state.width + (data.interactionState === "selected" ? 8 : 5),
            }}
          />
          <BaseEdge
            id={`${id}-halo`}
            path={pathResult.path}
            style={{
              fill: "none",
              opacity: data.interactionState === "selected" ? 0.14 : 0.08,
              stroke,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth:
                state.width + (data.interactionState === "selected" ? 3 : 2),
            }}
          />
        </>
      ) : null}
      <BaseEdge
        id={id}
        interactionWidth={Math.max(18, state.width + 14)}
        markerEnd={markerEnd}
        path={pathResult.path}
        style={{
          fill: "none",
          opacity: state.opacity,
          stroke,
          strokeDasharray: state.strokeDasharray || undefined,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: state.width,
          transition: "opacity 160ms ease, stroke-width 160ms ease",
          vectorEffect: "non-scaling-stroke",
        }}
      />
      {showLabel ? (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "nodrag nopan pointer-events-none absolute max-w-[160px] truncate rounded-md px-2 py-0.5 text-[10px] font-medium leading-4 transition-opacity duration-200",
              data.interactionState === "selected"
                ? "text-blue-800"
                : "text-slate-800",
              data.interactionState === "dimmed" ? "text-slate-500" : "",
            )}
            data-attack-edge-state={data.interactionState}
            data-attack-edge-type={visual.relationType}
            style={{
              opacity: data.interactionState === "dimmed" ? 0.48 : 1,
              transform: `translate(-50%, -50%) translate(${pathResult.labelX}px, ${pathResult.labelY}px) rotate(${Number.isFinite(pathResult.labelAngle) ? pathResult.labelAngle : 0}deg)`,
            }}
            title={visual.tooltip}
          >
            {visual.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function getGraphEdgePath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "relation" }>;
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
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
  const endpointDistance = Math.hypot(
    targetPoint.x - sourcePoint.x,
    targetPoint.y - sourcePoint.y,
  );
  const controlDistance = clamp(endpointDistance * 0.38, 38, 280);
  const sourceControl = {
    x: sourcePoint.x + flowDirection * controlDistance,
    y: sourcePoint.y + deltaY * 0.25 + route.fanoutOffset * 0.6,
  };
  const targetControl = {
    x: targetPoint.x - flowDirection * controlDistance,
    y: targetPoint.y - deltaY * 0.25 + route.fanoutOffset * 0.6,
  };
  const path = [
    `M ${formatNumber(sourcePoint.x)} ${formatNumber(sourcePoint.y)}`,
    `C ${formatNumber(sourceControl.x)} ${formatNumber(sourceControl.y)}`,
    `${formatNumber(targetControl.x)} ${formatNumber(targetControl.y)}`,
    `${formatNumber(targetPoint.x)} ${formatNumber(targetPoint.y)}`,
  ].join(" ");
  const labelPoint = getCubicPoint(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );
  const normal = getReadableLabelNormal(sourcePoint, targetPoint);
  const labelOffset = getLabelOffset(route.fanoutIndex, route.fanoutCount);
  const labelAngle = getCubicTangentAngle(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );

  return {
    gradient: {
      x1: sourcePoint.x,
      x2: targetPoint.x,
      y1: sourcePoint.y,
      y2: targetPoint.y,
    },
    labelAngle,
    labelX: labelPoint.x + normal.x * labelOffset,
    labelY: labelPoint.y + normal.y * labelOffset,
    path,
  };
}

function getStressEdgePath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>;
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
}) {
  if (route.parallelPair) {
    return getParallelPairStressEdgePath({
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
  const path = [
    `M ${formatNumber(sourcePoint.x)} ${formatNumber(sourcePoint.y)}`,
    `C ${formatNumber(sourceControl.x)} ${formatNumber(sourceControl.y)}`,
    `${formatNumber(targetControl.x)} ${formatNumber(targetControl.y)}`,
    `${formatNumber(targetPoint.x)} ${formatNumber(targetPoint.y)}`,
  ].join(" ");
  const labelPoint = getCubicPoint(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );
  const labelOffset = route.fanoutCount > 1 ? Math.min(18, Math.abs(route.fanoutIndex) * 4) : 0;

  return {
    gradient: {
      x1: sourcePoint.x,
      x2: targetPoint.x,
      y1: sourcePoint.y,
      y2: targetPoint.y,
    },
    labelAngle: 0,
    labelX: labelPoint.x + normal.x * labelOffset,
    labelY: labelPoint.y + normal.y * labelOffset,
    path,
  };
}

function getParallelPairStressEdgePath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>;
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
}) {
  const vector = normalizeVector(
    target.centerX - source.centerX,
    target.centerY - source.centerY,
  );
  const normal = { x: -vector.y, y: vector.x };
  const labelNormal = getStressEdgeNormal(vector, route.fanoutIndex);
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
  const path = [
    `M ${formatNumber(sourcePoint.x)} ${formatNumber(sourcePoint.y)}`,
    `C ${formatNumber(sourceControl.x)} ${formatNumber(sourceControl.y)}`,
    `${formatNumber(targetControl.x)} ${formatNumber(targetControl.y)}`,
    `${formatNumber(targetPoint.x)} ${formatNumber(targetPoint.y)}`,
  ].join(" ");
  const labelPoint = getCubicPoint(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );
  const labelOffset = getLabelOffset(route.fanoutIndex, route.fanoutCount);

  return {
    gradient: {
      x1: sourcePoint.x,
      x2: targetPoint.x,
      y1: sourcePoint.y,
      y2: targetPoint.y,
    },
    labelAngle: 0,
    labelX: labelPoint.x + labelNormal.x * labelOffset,
    labelY: labelPoint.y + labelNormal.y * labelOffset,
    path,
  };
}

function getSimpleTopologyEdgePath({
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
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
}) {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const flowDirection: 1 | -1 = deltaX >= 0 ? 1 : -1;
  const targetDirection: 1 | -1 = flowDirection === 1 ? -1 : 1;
  const sourceShift = getSimpleTopologyEndpointShift({
    route,
    side: "source",
    source,
    target,
  });
  const targetShift = getSimpleTopologyEndpointShift({
    route,
    side: "target",
    source,
    target,
  });
  const sourcePoint = getSideAnchorPoint(source, flowDirection, sourceShift);
  const targetPoint = getSideAnchorPoint(
    target,
    targetDirection,
    targetShift,
    MARKER_END_GAP,
  );
  const endpointDistance = Math.hypot(
    targetPoint.x - sourcePoint.x,
    targetPoint.y - sourcePoint.y,
  );
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
  const path = [
    `M ${formatNumber(sourcePoint.x)} ${formatNumber(sourcePoint.y)}`,
    `C ${formatNumber(sourceControl.x)} ${formatNumber(sourceControl.y)}`,
    `${formatNumber(targetControl.x)} ${formatNumber(targetControl.y)}`,
    `${formatNumber(targetPoint.x)} ${formatNumber(targetPoint.y)}`,
  ].join(" ");
  const labelPoint = getCubicPoint(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );
  const normal = getReadableLabelNormal(sourcePoint, targetPoint);
  const labelOffset = getLabelOffset(route.fanoutIndex, route.fanoutCount);
  const labelAngle = getCubicTangentAngle(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );

  return {
    gradient: {
      x1: sourcePoint.x,
      x2: targetPoint.x,
      y1: sourcePoint.y,
      y2: targetPoint.y,
    },
    labelAngle,
    labelX: labelPoint.x + normal.x * labelOffset,
    labelY: labelPoint.y + normal.y * labelOffset,
    path,
  };
}

function getSimpleTopologyEndpointShift({
  route,
  side,
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
  side: "source" | "target";
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
}) {
  const deltaY = target.centerY - source.centerY;
  if (route.kind === "single-source-fanout") {
    return side === "source"
      ? clamp(deltaY * 0.08, -source.radius * 0.5, source.radius * 0.5)
      : 0;
  }
  if (route.kind === "linear-chain" || route.kind === "tree") {
    return 0;
  }

  return side === "target"
    ? clamp(-deltaY * 0.08, -target.radius * 0.5, target.radius * 0.5)
    : 0;
}

function getSkipEdgePath({
  route,
  source,
  target,
  obstacle,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "skip" }>;
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
  obstacle?: AttackGraphNodeEdgeGeometry;
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

  const endpointDistance = Math.hypot(
    targetPoint.x - sourcePoint.x,
    targetPoint.y - sourcePoint.y,
  );
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

  const path = [
    `M ${formatNumber(sourcePoint.x)} ${formatNumber(sourcePoint.y)}`,
    `C ${formatNumber(sourceControl.x)} ${formatNumber(sourceControl.y)}`,
    `${formatNumber(targetControl.x)} ${formatNumber(targetControl.y)}`,
    `${formatNumber(targetPoint.x)} ${formatNumber(targetPoint.y)}`,
  ].join(" ");

  const labelPoint = getCubicPoint(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );
  const normal = getReadableLabelNormal(sourcePoint, targetPoint);
  const labelAngle = getCubicTangentAngle(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );

  return {
    gradient: {
      x1: sourcePoint.x,
      x2: targetPoint.x,
      y1: sourcePoint.y,
      y2: targetPoint.y,
    },
    labelAngle,
    labelX: labelPoint.x + normal.x * 16,
    labelY: labelPoint.y + normal.y * 16,
    path,
  };
}

function getObstacleBounds(
  obstacle: AttackGraphNodeEdgeGeometry | undefined,
): AttackGraphRect {
  if (obstacle?.bounds) {
    return obstacle.bounds;
  }

  const radius = obstacle?.radius ?? FALLBACK_NODE_RADIUS;
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

function getDetourEdgePath({
  route,
  source,
  target,
}: {
  route: Extract<AttackGraphEdgeRouteData, { kind: "detour" }>;
  source: AttackGraphEdgeEndpointGeometry;
  target: AttackGraphEdgeEndpointGeometry;
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
  const endpointDistance = Math.hypot(
    targetPoint.x - sourcePoint.x,
    targetPoint.y - sourcePoint.y,
  );
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
  const path = [
    `M ${formatNumber(sourcePoint.x)} ${formatNumber(sourcePoint.y)}`,
    `C ${formatNumber(sourceControl.x)} ${formatNumber(sourceControl.y)}`,
    `${formatNumber(targetControl.x)} ${formatNumber(targetControl.y)}`,
    `${formatNumber(targetPoint.x)} ${formatNumber(targetPoint.y)}`,
  ].join(" ");
  const labelPoint = getCubicPoint(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );
  const normal = getReadableLabelNormal(sourcePoint, targetPoint);
  const labelAngle = getCubicTangentAngle(
    sourcePoint,
    sourceControl,
    targetControl,
    targetPoint,
    0.5,
  );

  return {
    gradient: {
      x1: sourcePoint.x,
      x2: targetPoint.x,
      y1: sourcePoint.y,
      y2: targetPoint.y,
    },
    labelAngle,
    labelX: labelPoint.x + normal.x * 18,
    labelY: labelPoint.y + normal.y * 18,
    path,
  };
}

function getSelfLoopPath(
  node: AttackGraphEdgeEndpointGeometry,
  route: Extract<AttackGraphEdgeRouteData, { kind: "self-loop" }>,
) {
  const radius = node.radius;
  const side = route.side;
  const loopDepth = radius + 54 + route.index * 18;
  const loopSpan = radius + 34 + route.index * 10;
  const startAngle = getSelfLoopStartAngle(side);
  const endAngle = getSelfLoopEndAngle(side);
  const controlAngle = getSelfLoopControlAngle(side);
  const startPoint = pointOnCircle(node, startAngle, radius);
  const endPoint = pointOnCircle(node, endAngle, radius + MARKER_END_GAP);
  const firstControl = pointFromCenter(node, controlAngle - 0.36, loopDepth);
  const secondControl = pointFromCenter(node, controlAngle + 0.36, loopDepth);
  const labelPoint = pointFromCenter(node, controlAngle, loopDepth + loopSpan * 0.22);
  const path = [
    `M ${formatNumber(startPoint.x)} ${formatNumber(startPoint.y)}`,
    `C ${formatNumber(firstControl.x)} ${formatNumber(firstControl.y)}`,
    `${formatNumber(secondControl.x)} ${formatNumber(secondControl.y)}`,
    `${formatNumber(endPoint.x)} ${formatNumber(endPoint.y)}`,
  ].join(" ");
  let labelAngle = (controlAngle + Math.PI / 2) * (180 / Math.PI);
  while (labelAngle >= 90) labelAngle -= 180;
  while (labelAngle < -90) labelAngle += 180;

  return {
    gradient: {
      x1: startPoint.x,
      x2: endPoint.x,
      y1: startPoint.y,
      y2: endPoint.y,
    },
    labelAngle,
    labelX: labelPoint.x,
    labelY: labelPoint.y,
    path,
  };
}

function AttackGraphEdgeMarker({
  color,
  id,
  opacity,
  strokeWidth,
  type,
}: {
  color: string;
  id: string;
  opacity: number;
  strokeWidth: number;
  type: AttackGraphEdgeVisualData["marker"]["type"];
}) {
  const markerSize = clamp(8 + strokeWidth * 1.5, 9, 15);
  const middle = markerSize / 2;

  return (
    <marker
      id={id}
      markerHeight={markerSize}
      markerUnits="userSpaceOnUse"
      markerWidth={markerSize}
      orient="auto"
      refX={type === "diamond" ? middle : markerSize - 0.8}
      refY={middle}
      viewBox={`0 0 ${markerSize} ${markerSize}`}
    >
      {type === "diamond" ? (
        <path
          d={`M${middle},1 L${markerSize - 1},${middle} L${middle},${
            markerSize - 1
          } L1,${middle} Z`}
          fill={color}
          opacity={opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d={`M1.5,${middle - markerSize * 0.26} L${
            markerSize - 0.8
          },${middle} L1.5,${middle + markerSize * 0.26} Z`}
          fill={color}
          opacity={opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </marker>
  );
}

function getEdgeGradientId(
  edgeId: string,
  state: AttackGraphEdgeInteractionState,
) {
  return `attack-graph-flow-gradient-${toSafeSvgId(edgeId)}-${state}`;
}

function getEdgeMarkerId(
  edgeId: string,
  state: AttackGraphEdgeInteractionState,
) {
  return `attack-graph-flow-marker-${toSafeSvgId(edgeId)}-${state}`;
}

function toSafeSvgId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  const readable = value.replace(/[^\w-]/g, "_").slice(0, 80);
  return `${readable}_${hash.toString(36)}`;
}

function getFallbackEndpointGeometry(
  x: number,
  y: number,
): AttackGraphEdgeEndpointGeometry {
  return {
    centerX: isFiniteNumber(x) ? x : 0,
    centerY: isFiniteNumber(y) ? y : 0,
    radius: FALLBACK_NODE_RADIUS,
  };
}

function getFallbackEdgeRoute(isSelfLoop: boolean): AttackGraphEdgeRouteData {
  if (isSelfLoop) {
    return {
      count: 1,
      index: 0,
      kind: "self-loop",
      side: "right",
    };
  }

  return {
    fanoutCount: 1,
    fanoutIndex: 0,
    fanoutOffset: 0,
    kind: "relation",
  };
}

function normalizeVector(x: number, y: number) {
  const length = Math.hypot(x, y);
  if (length < 0.001) {
    return { x: 1, y: 0 };
  }
  return {
    x: x / length,
    y: y / length,
  };
}

function getSideAnchorPoint(
  circle: AttackGraphEdgeEndpointGeometry,
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
  circle: AttackGraphEdgeEndpointGeometry,
  direction: { x: number; y: number },
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

function getStressEdgeNormal(
  vector: { x: number; y: number },
  fanoutIndex: number,
) {
  const normal = { x: -vector.y, y: vector.x };
  if (fanoutIndex < 0) {
    return { x: -normal.x, y: -normal.y };
  }

  return normal;
}

function getStressBendAmount(
  distance: number,
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>,
) {
  if (route.fanoutCount <= 1) {
    return clamp(distance * 0.028, 6, 18);
  }

  const baseBend = clamp(distance * 0.032, 8, 20);
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
  distance: number,
  route: Extract<AttackGraphEdgeRouteData, { kind: "stress" }>,
) {
  const offset = getParallelPairOffset(route);
  if (route.fanoutIndex === 0) {
    return 0;
  }

  const maxBend = Math.max(18, Math.min(42, distance * 0.24));
  return clamp(offset * 0.72, -maxBend, maxBend);
}

function getReadableLabelNormal(
  sourcePoint: { x: number; y: number },
  targetPoint: { x: number; y: number },
) {
  const vector = normalizeVector(
    targetPoint.x - sourcePoint.x,
    targetPoint.y - sourcePoint.y,
  );
  const normal = { x: -vector.y, y: vector.x };

  return normal.y > 0 ? { x: -normal.x, y: -normal.y } : normal;
}

function getCubicPoint(
  start: { x: number; y: number },
  firstControl: { x: number; y: number },
  secondControl: { x: number; y: number },
  end: { x: number; y: number },
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

function getCubicTangentAngle(
  start: { x: number; y: number },
  firstControl: { x: number; y: number },
  secondControl: { x: number; y: number },
  end: { x: number; y: number },
  t: number,
) {
  const inv = 1 - t;
  const inv2 = inv * inv;
  const t2 = t * t;
  const tx = 3 * inv2 * (firstControl.x - start.x) + 6 * inv * t * (secondControl.x - firstControl.x) + 3 * t2 * (end.x - secondControl.x);
  const ty = 3 * inv2 * (firstControl.y - start.y) + 6 * inv * t * (secondControl.y - firstControl.y) + 3 * t2 * (end.y - secondControl.y);
  let deg = Math.atan2(ty, tx) * (180 / Math.PI);
  while (deg > 90) deg -= 180;
  while (deg < -90) deg += 180;
  return deg;
}

function getLabelOffset(fanoutIndex: number, fanoutCount: number) {
  if (fanoutCount <= 1) {
    return 12;
  }

  return 12 + Math.min(16, Math.abs(fanoutIndex) * 4);
}

function getSelfLoopStartAngle(side: AttackGraphSelfLoopSide) {
  if (side === "top") {
    return degreesToRadians(240);
  }
  if (side === "bottom") {
    return degreesToRadians(60);
  }
  if (side === "left") {
    return degreesToRadians(150);
  }
  return degreesToRadians(330);
}

function getSelfLoopEndAngle(side: AttackGraphSelfLoopSide) {
  if (side === "top") {
    return degreesToRadians(300);
  }
  if (side === "bottom") {
    return degreesToRadians(120);
  }
  if (side === "left") {
    return degreesToRadians(210);
  }
  return degreesToRadians(30);
}

function getSelfLoopControlAngle(side: AttackGraphSelfLoopSide) {
  if (side === "top") {
    return degreesToRadians(270);
  }
  if (side === "bottom") {
    return degreesToRadians(90);
  }
  if (side === "left") {
    return degreesToRadians(180);
  }
  return 0;
}

function pointOnCircle(
  circle: AttackGraphEdgeEndpointGeometry,
  angle: number,
  radius: number,
) {
  return pointFromCenter(circle, angle, radius);
}

function pointFromCenter(
  circle: AttackGraphEdgeEndpointGeometry,
  angle: number,
  distance: number,
) {
  return {
    x: circle.centerX + Math.cos(angle) * distance,
    y: circle.centerY + Math.sin(angle) * distance,
  };
}

function degreesToRadians(value: number) {
  return (value / 180) * Math.PI;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

export default AttackGraphEdge;
