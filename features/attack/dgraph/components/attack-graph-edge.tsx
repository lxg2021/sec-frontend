"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  type EdgeProps,
} from "reactflow";

import { cn } from "@/shared/lib/utils";

import type { AttackGraphEdgeModel } from "../model/attack-graph-data";
import type {
  AttackGraphEdgeInteractionState,
  AttackGraphEdgeVisualData,
} from "../model/attack-graph-edge-config";

export interface AttackGraphEdgeData {
  edge: AttackGraphEdgeModel;
  visual: AttackGraphEdgeVisualData;
  interactionState: AttackGraphEdgeInteractionState;
  sourceColor: string;
  targetColor: string;
}

const NODE_TILE_WIDTH = 176;
const DEFAULT_NODE_HEIGHT = 112;

export function AttackGraphEdge({
  data,
  id,
  source,
  sourcePosition,
  sourceX,
  sourceY,
  target,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<AttackGraphEdgeData>) {
  if (!data) {
    return null;
  }

  const visual = data.visual;
  const state = visual.state[data.interactionState];
  const isSelfLoop = source === target;
  const pathResult = isSelfLoop
    ? getSelfLoopPath(sourceX, sourceY)
    : getGraphEdgePath({
        sourcePosition,
        sourceX,
        sourceY,
        targetPosition,
        targetX,
        targetY,
      });
  const gradientTargetX = isSelfLoop ? pathResult.labelX : targetX;
  const gradientTargetY = isSelfLoop ? pathResult.labelY : targetY;
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
            x1={sourceX}
            x2={gradientTargetX}
            y1={sourceY}
            y2={gradientTargetY}
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
            opacity: data.interactionState === "selected" ? 0.18 : 0.12,
            stroke,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth:
              state.width + (data.interactionState === "selected" ? 5 : 3),
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
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            "nodrag nopan pointer-events-none absolute max-w-[150px] truncate rounded-sm border px-1.5 py-0.5 text-[10px] font-medium leading-4 shadow-sm transition-opacity duration-200",
            data.interactionState === "selected"
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-slate-200/80 bg-white/90 text-slate-800",
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
  sourcePosition,
  sourceX,
  sourceY,
  targetPosition,
  targetX,
  targetY,
}: {
  sourcePosition: Position;
  sourceX: number;
  sourceY: number;
  targetPosition: Position;
  targetX: number;
  targetY: number;
}) {
  const deltaY = Math.abs(targetY - sourceY);
  const deltaX = Math.abs(targetX - sourceX);
  const isCrossLane =
    deltaY > DEFAULT_NODE_HEIGHT * 0.8 && deltaX > NODE_TILE_WIDTH * 0.6;
  const [path, labelX, labelY] = getBezierPath({
    curvature: isCrossLane ? 0.34 : 0.2,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  return { labelX, labelY, path };
}

function getSelfLoopPath(sourceX: number, sourceY: number) {
  const radiusX = 72;
  const radiusY = 46;
  const path = [
    `M ${sourceX} ${sourceY}`,
    `C ${sourceX + radiusX} ${sourceY - radiusY}`,
    `${sourceX + radiusX} ${sourceY + radiusY}`,
    `${sourceX} ${sourceY + radiusY * 1.15}`,
  ].join(" ");

  return {
    labelX: sourceX + radiusX,
    labelY: sourceY,
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
  const markerSize = Math.max(10, Math.min(18, size));
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
          d={`M2,2 L${markerSize - 1},${middle} L2,${markerSize - 2} Z`}
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

export default AttackGraphEdge;
