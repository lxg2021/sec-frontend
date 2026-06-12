"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from "reactflow";

import { cn } from "@/shared/lib/utils";

import type { AttackGraphEdgeModel } from "../model/attack-graph-data";
import type {
  AttackGraphEdgeInteractionState,
  AttackGraphEdgeVisualData,
} from "../model/attack-graph-edge-config";
import type {
  AttackGraphEdgeEndpointGeometry,
  AttackGraphEdgeGeometryData,
  AttackGraphEdgeRouteData,
  AttackGraphSelfLoopSide,
} from "../model/attack-graph-edge-routing";

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
            size={visual.marker.size}
            type={visual.marker.type}
          />
        ) : null}
      </defs>
      {emphasized ? (
        <BaseEdge
          id={`${id}-halo`}
          path={pathResult.path}
          style={{
            fill: "none",
            opacity: data.interactionState === "selected" ? 0.12 : 0.08,
            stroke,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth:
              state.width + (data.interactionState === "selected" ? 3 : 2),
          }}
        />
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
            transform: `translate(-50%, -50%) translate(${pathResult.labelX}px, ${pathResult.labelY}px)`,
          }}
          title={visual.tooltip}
        >
          {visual.label}
        </div>
      </EdgeLabelRenderer>
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
    deltaY * 0.1 + route.fanoutOffset * 0.32,
    -source.radius * 0.56,
    source.radius * 0.56,
  );
  const targetShift = clamp(
    -deltaY * 0.1 + route.fanoutOffset * 0.24,
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
  const controlDistance = getBezierControlDistance({
    deltaX,
    deltaY,
    route,
    sourcePoint,
    targetPoint,
  });
  const controlLift = route.fanoutOffset * 0.12;
  const sourceControl = {
    x: sourcePoint.x + flowDirection * controlDistance,
    y: sourcePoint.y + controlLift,
  };
  const targetControl = {
    x: targetPoint.x - flowDirection * controlDistance,
    y: targetPoint.y + controlLift,
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

  return {
    gradient: {
      x1: sourcePoint.x,
      x2: targetPoint.x,
      y1: sourcePoint.y,
      y2: targetPoint.y,
    },
    labelX: labelPoint.x + normal.x * labelOffset,
    labelY: labelPoint.y + normal.y * labelOffset,
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
  const firstControl = pointFromCenter(node, controlAngle - 0.34, loopDepth);
  const secondControl = pointFromCenter(node, controlAngle + 0.34, loopDepth);
  const labelPoint = pointFromCenter(node, controlAngle, loopDepth + loopSpan * 0.18);
  const path = [
    `M ${formatNumber(startPoint.x)} ${formatNumber(startPoint.y)}`,
    `C ${formatNumber(firstControl.x)} ${formatNumber(firstControl.y)}`,
    `${formatNumber(secondControl.x)} ${formatNumber(secondControl.y)}`,
    `${formatNumber(endPoint.x)} ${formatNumber(endPoint.y)}`,
  ].join(" ");

  return {
    gradient: {
      x1: startPoint.x,
      x2: endPoint.x,
      y1: startPoint.y,
      y2: endPoint.y,
    },
    labelX: labelPoint.x,
    labelY: labelPoint.y,
    path,
  };
}

function AttackGraphEdgeMarker({
  color,
  id,
  opacity,
  size,
  type,
}: {
  color: string;
  id: string;
  opacity: number;
  size: number;
  type: AttackGraphEdgeVisualData["marker"]["type"];
}) {
  const markerSize = Math.max(9, Math.min(13, size));
  const middle = markerSize / 2;

  return (
    <marker
      id={id}
      markerHeight={markerSize}
      markerUnits="userSpaceOnUse"
      markerWidth={markerSize}
      orient="auto"
      refX={type === "diamond" ? middle : markerSize - 1}
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
        />
      ) : (
        <path
          d={`M2,2.5 L${markerSize - 1},${middle} L2,${
            markerSize - 2.5
          } Z`}
          fill={color}
          opacity={opacity}
        />
      )}
    </marker>
  );
}

function getEdgeGradientId(
  edgeId: string,
  state: AttackGraphEdgeInteractionState,
) {
  return `attack-graph-flow-v2-gradient-${toSafeSvgId(edgeId)}-${state}`;
}

function getEdgeMarkerId(
  edgeId: string,
  state: AttackGraphEdgeInteractionState,
) {
  return `attack-graph-flow-v2-marker-${toSafeSvgId(edgeId)}-${state}`;
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

function getBezierControlDistance({
  deltaX,
  deltaY,
  route,
  sourcePoint,
  targetPoint,
}: {
  deltaX: number;
  deltaY: number;
  route: Extract<AttackGraphEdgeRouteData, { kind: "relation" }>;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
}) {
  const endpointDistance = Math.hypot(
    targetPoint.x - sourcePoint.x,
    targetPoint.y - sourcePoint.y,
  );
  const horizontalPull = Math.abs(deltaX) * 0.44 + Math.abs(deltaY) * 0.06;
  const fanoutPull = Math.min(18, Math.abs(route.fanoutIndex) * 4);

  return clamp(
    Math.max(endpointDistance * 0.22, horizontalPull) + fanoutPull,
    76,
    260,
  );
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

function getLabelOffset(fanoutIndex: number, fanoutCount: number) {
  if (fanoutCount <= 1) {
    return 12;
  }

  return 12 + Math.min(10, Math.abs(fanoutIndex) * 2);
}

function getSelfLoopStartAngle(side: AttackGraphSelfLoopSide) {
  if (side === "top") {
    return degreesToRadians(220);
  }
  if (side === "bottom") {
    return degreesToRadians(140);
  }
  if (side === "left") {
    return degreesToRadians(310);
  }
  return degreesToRadians(230);
}

function getSelfLoopEndAngle(side: AttackGraphSelfLoopSide) {
  if (side === "top") {
    return degreesToRadians(320);
  }
  if (side === "bottom") {
    return degreesToRadians(40);
  }
  if (side === "left") {
    return degreesToRadians(50);
  }
  return degreesToRadians(130);
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
