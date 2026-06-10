"use client";

import type { CSSProperties } from "react";

import { cn } from "@/shared/lib/utils";

import {
  getAttackGraphNodePresentation,
} from "../model/attack-graph-node-presentation";

export interface AttackGraphNodeData {
  key?: string;
  entity_type?: string;
  entityType?: string;
  display_name?: string;
  displayName?: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
  evidenceHit?: boolean;
  evidenceRefs?: unknown[];
}

export interface AttackGraphNodeProps {
  data: AttackGraphNodeData;
  className?: string;
  compact?: boolean;
  muted?: boolean;
  selected?: boolean;
  showEntityType?: boolean;
  style?: CSSProperties;
}

function pickNodeTitle(data: AttackGraphNodeData): string {
  const properties = data.properties ?? {};
  return (
    data.display_name ||
    data.displayName ||
    stringProperty(properties.display_name) ||
    stringProperty(properties.name) ||
    stringProperty(properties.process_name) ||
    stringProperty(properties.computer_name) ||
    stringProperty(properties.service_name) ||
    stringProperty(properties.task_name) ||
    stringProperty(properties.url) ||
    stringProperty(properties.path) ||
    data.key ||
    "Unnamed node"
  );
}

function stringProperty(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function AttackGraphNode({
  data,
  className,
  compact = false,
  muted = false,
  selected = false,
  showEntityType = true,
  style,
}: AttackGraphNodeProps) {
  const entityType = data.entity_type || data.entityType || "";
  const presentation = getAttackGraphNodePresentation(entityType);
  const title = pickNodeTitle(data);
  const evidenceCount = data.evidenceRefs?.length ?? 0;
  const evidenceTitle = evidenceCount
    ? `${evidenceCount} evidence hit${evidenceCount > 1 ? "s" : ""}`
    : "Evidence hit";

  return (
    <div
      className={cn(
        "group relative flex w-[148px] flex-col items-center text-center transition-[opacity,transform] duration-150",
        "hover:-translate-y-0.5",
        muted && "opacity-45",
        className,
      )}
      style={style}
      title={`${presentation.label}: ${title}`}
    >
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80",
          "transition-[box-shadow,transform,ring-color] duration-150 group-hover:scale-110 group-hover:shadow-[0_10px_22px_rgba(15,23,42,0.18)]",
          selected && "ring-2 ring-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]",
        )}
      >
        <img
          src={presentation.image}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 object-contain"
          draggable={false}
        />
        {selected ? (
          <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
        ) : null}
        {data.evidenceHit ? (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-white text-[10px] font-bold leading-none text-rose-600 shadow-[0_2px_6px_rgba(15,23,42,0.18)] ring-1 ring-rose-200/80"
            title={evidenceTitle}
            aria-label={evidenceTitle}
          >
            <span className="-mt-px">!</span>
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 w-full min-w-0">
        <div className="truncate text-[11px] font-medium leading-4 text-slate-800 tracking-normal">
          {title}
        </div>
        {showEntityType && !compact ? (
          <div className="mt-0.5 flex min-w-0 justify-center">
            <span
              className={cn(
                "inline-flex max-w-[128px] items-center rounded-sm bg-white/85 px-1.5 py-0.5 text-[9px] font-medium leading-none text-slate-500 ring-1",
                presentation.badgeClassName,
              )}
            >
              <span className="truncate">
                {entityType || presentation.label}
              </span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AttackGraphNode;
