"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import {
  getAttackGraphEdgeDemoItems,
  type AttackGraphEdgeInteractionState,
  type AttackGraphEdgeVisualData,
} from "../model/attack-graph-edge-presentation";

const DEMO_SOURCE_COLOR = "#13a7c5";
const DEMO_TARGET_COLOR = "#f59e0b";

export function AttackGraphEdgeDemoCard() {
  const items = getAttackGraphEdgeDemoItems();
  const [selectedRelationType, setSelectedRelationType] = useState<string | null>(
    null,
  );
  const [hoveredRelationType, setHoveredRelationType] = useState<string | null>(
    null,
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Attack Graph Edge Demo
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {items.length} relation labels with solid / gradient color modes
          </div>
        </div>
        <div className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          label / kind / state
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => (
          <EdgePreviewTile
            key={item.relationType}
            item={item}
            hovered={hoveredRelationType === item.relationType}
            dimmed={
              selectedRelationType !== null &&
              selectedRelationType !== item.relationType
            }
            selected={selectedRelationType === item.relationType}
            onHoverEnd={() => setHoveredRelationType(null)}
            onHoverStart={() => setHoveredRelationType(item.relationType)}
            onSelect={() =>
              setSelectedRelationType((current) =>
                current === item.relationType ? null : item.relationType,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function EdgePreviewTile({
  dimmed,
  hovered,
  item,
  onHoverEnd,
  onHoverStart,
  selected,
  onSelect,
}: {
  dimmed: boolean;
  hovered: boolean;
  item: AttackGraphEdgeVisualData;
  onHoverEnd: () => void;
  onHoverStart: () => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const interactionState = getPreviewInteractionState({
    dimmed,
    hovered,
    selected,
  });
  const state = item.state[interactionState];

  return (
    <button
      type="button"
      aria-pressed={selected}
      data-attack-edge-demo-state={interactionState}
      data-attack-edge-relation={item.relationType}
      onClick={onSelect}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      className={cn(
        "group min-w-0 rounded-md border bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        selected
          ? "border-blue-400 bg-blue-50/40 shadow-[0_0_0_1px_rgba(37,99,235,0.18)]"
          : "border-slate-200",
        dimmed && !hovered ? "border-slate-100 bg-slate-50/40 opacity-60" : "",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <EdgePreviewLine item={item} interactionState={interactionState} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: state.color }}
            />
            <span className="truncate text-sm font-semibold leading-5 text-slate-900">
              {item.label}
            </span>
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] font-medium text-slate-500">
            {item.relationType}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <EdgeMetaPill active={interactionState !== "default"}>
              {interactionState}
            </EdgeMetaPill>
            <EdgeMetaPill>{item.kindLabel}</EdgeMetaPill>
            <EdgeMetaPill>{formatStroke(item)}</EdgeMetaPill>
            <EdgeMetaPill>{formatMarker(item.marker.type)}</EdgeMetaPill>
            <EdgeMetaPill>{item.colorMode}</EdgeMetaPill>
          </div>
        </div>
      </div>
    </button>
  );
}

function EdgePreviewLine({
  interactionState,
  item,
}: {
  interactionState: AttackGraphEdgeInteractionState;
  item: AttackGraphEdgeVisualData;
}) {
  const state = item.state[interactionState];
  const dashArray = state.strokeDasharray || undefined;
  const gradientId = `edge-demo-gradient-${item.relationType}`;
  const markerId = `edge-demo-marker-${item.relationType}`;
  const isEmphasized =
    interactionState === "hover" || interactionState === "selected";
  const sourceColor =
    item.colorMode === "gradient" ? DEMO_SOURCE_COLOR : state.color;
  const targetColor =
    item.colorMode === "gradient" ? DEMO_TARGET_COLOR : state.color;
  const stroke =
    item.colorMode === "gradient" ? `url(#${gradientId})` : state.color;

  return (
    <svg
      aria-hidden="true"
      className="h-12 w-24 shrink-0 overflow-visible"
      viewBox="0 0 96 48"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="8"
          x2="88"
          y1="24"
          y2="24"
        >
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
        {item.marker.type !== "none" ? (
          <marker
            id={markerId}
            markerHeight="10"
            markerWidth="10"
            orient="auto"
            refX={item.marker.type === "diamond" ? "5" : "8"}
            refY="5"
            viewBox="0 0 10 10"
          >
            {item.marker.type === "diamond" ? (
              <path d="M5,0 L10,5 L5,10 L0,5 Z" fill={targetColor} />
            ) : (
              <path d="M0,0 L10,5 L0,10 Z" fill={targetColor} />
            )}
          </marker>
        ) : null}
      </defs>
      {isEmphasized ? (
        <path
          d="M8 24 C28 8, 68 40, 88 24"
          fill="none"
          stroke={stroke}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          strokeWidth={
            state.width + (interactionState === "selected" ? 5 : 3)
          }
          opacity={interactionState === "selected" ? 0.18 : 0.12}
        />
      ) : null}
      <circle
        cx="8"
        cy="24"
        fill={sourceColor}
        opacity={state.opacity}
        r={interactionState === "selected" ? "3.8" : "3"}
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M8 24 C28 8, 68 40, 88 24"
        fill="none"
        markerEnd={
          item.marker.type !== "none" ? `url(#${markerId})` : undefined
        }
        stroke={stroke}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        strokeWidth={state.width}
        opacity={state.opacity}
      />
      <circle
        cx="88"
        cy="24"
        fill={targetColor}
        opacity={state.opacity}
        r={interactionState === "selected" ? "3.8" : "3"}
        stroke="white"
        strokeWidth="1.5"
      />
      <rect
        x="31"
        y="15"
        width="34"
        height="18"
        rx="4"
        className={cn(
          interactionState === "selected"
            ? "fill-blue-50 stroke-blue-200"
            : "fill-white stroke-slate-200",
          interactionState === "hover" ? "stroke-slate-300" : "",
          interactionState === "dimmed" ? "fill-slate-50 stroke-slate-100" : "",
        )}
      />
      <text
        x="48"
        y="27"
        className={cn(
          "text-[8px] font-semibold",
          interactionState === "dimmed" ? "fill-slate-400" : "fill-slate-700",
        )}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {item.label.length > 9 ? `${item.label.slice(0, 8)}.` : item.label}
      </text>
    </svg>
  );
}

function EdgeMetaPill({
  active,
  children,
}: {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-4",
        active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
      )}
    >
      {children}
    </span>
  );
}

function getPreviewInteractionState({
  dimmed,
  hovered,
  selected,
}: {
  dimmed: boolean;
  hovered: boolean;
  selected: boolean;
}): AttackGraphEdgeInteractionState {
  if (selected) {
    return "selected";
  }
  if (hovered) {
    return "hover";
  }
  if (dimmed) {
    return "dimmed";
  }
  return "default";
}

function formatStroke(item: AttackGraphEdgeVisualData) {
  const dash = item.strokeDasharray ? "dash" : "solid";
  return `${dash} ${item.width}`;
}

function formatMarker(markerType: AttackGraphEdgeVisualData["marker"]["type"]) {
  if (markerType === "none") {
    return "no marker";
  }
  return markerType;
}

export default AttackGraphEdgeDemoCard;
