"use client";

import Image from "next/image";
import { Handle, Position, type NodeProps } from "reactflow";

import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import type {
  AttackGraphNodeSize,
  getAttackGraphNodeMergedStateConfig,
} from "../model/attack-graph-node-config";

export type AttackGraphNodeVisualState = ReturnType<
  typeof getAttackGraphNodeMergedStateConfig
>;

export interface AttackGraphNodeData {
  id: string;
  label: string;
  labelTooltip: string;
  entityLabel: string;
  image: string;
  color: string;
  glow: string;
  size: AttackGraphNodeSize;
  activeState: AttackGraphNodeVisualState;
  selectedState: AttackGraphNodeVisualState;
  evidenceHit: boolean;
  missingFromResponse: boolean;
}

export const ATTACK_GRAPH_NODE_HALO_PADDING = 12;
export const ATTACK_GRAPH_NODE_LABEL_GAP = 8;
export const ATTACK_GRAPH_NODE_LABEL_HEIGHT = 22;
export const ATTACK_GRAPH_NODE_TILE_WIDTH = 112;
export const ATTACK_GRAPH_DEFAULT_NODE_HEIGHT = 112;

export function AttackGraphNode({
  data,
  selected,
}: NodeProps<AttackGraphNodeData>) {
  const ringState = selected ? data.selectedState : data.activeState;
  const tileHeight = getAttackGraphNodeVisualHeight(data.size);
  const handleY = ATTACK_GRAPH_NODE_HALO_PADDING + data.size.icon / 2;

  return (
    <div
      className="relative"
      style={{
        width: ATTACK_GRAPH_NODE_TILE_WIDTH,
        height: tileHeight,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{
          left: 0,
          top: handleY,
          transform: "translate(-50%, -50%)",
        }}
      />
      <button
        type="button"
        aria-pressed={selected}
        className={cn(
          "group flex h-full w-full min-w-0 flex-col items-center justify-start border-0 bg-transparent px-0 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          selected ? "text-slate-950" : "text-slate-900",
        )}
        style={{
          opacity: data.missingFromResponse ? 0.5 : 1,
        }}
      >
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full bg-white ring-1 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110",
            selected ? "scale-125 ring-slate-300" : "ring-slate-200",
          )}
          style={{
            width: data.size.icon,
            height: data.size.icon,
            marginTop: ATTACK_GRAPH_NODE_HALO_PADDING,
            boxShadow: selected
              ? `0 0 0 ${Math.min(8, Math.max(4, ringState.haloLineWidth / 3))}px ${toRgba(
                  data.color,
                  Math.min(0.3, ringState.haloStrokeOpacity),
                )}, 0 18px 30px ${toRgba("#0f172a", 0.24)}, 0 3px 8px ${toRgba("#0f172a", 0.14)}, inset 0 1px 0 ${toRgba("#ffffff", 0.9)}`
              : `0 0 0 ${Math.min(5, Math.max(2, ringState.haloLineWidth / 4))}px ${toRgba(
                  data.color,
                  Math.min(0.18, ringState.haloStrokeOpacity),
                )}, 0 10px 16px ${toRgba(data.glow, 0.1)}`,
          }}
        >
          <Image
            src={data.image}
            alt={data.entityLabel}
            width={Math.max(24, data.size.icon - 18)}
            height={Math.max(24, data.size.icon - 18)}
            className="h-auto w-auto max-w-[68%]"
          />
          {data.evidenceHit ? (
            <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-amber-500 shadow-[0_4px_10px_rgba(245,158,11,0.34)]" />
          ) : null}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-block max-w-full truncate text-sm font-semibold leading-5"
              style={{ marginTop: ATTACK_GRAPH_NODE_LABEL_GAP }}
            >
              {data.label}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="center"
            sideOffset={8}
            className="max-w-[420px] whitespace-pre-wrap break-all rounded-lg border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-slate-700 shadow-lg"
          >
            {data.labelTooltip || data.label}
          </TooltipContent>
        </Tooltip>
      </button>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{
          right: 0,
          top: handleY,
          transform: "translate(50%, -50%)",
        }}
      />
    </div>
  );
}

export function getAttackGraphNodeVisualHeight(size: AttackGraphNodeSize) {
  return (
    size.icon +
    ATTACK_GRAPH_NODE_HALO_PADDING * 2 +
    ATTACK_GRAPH_NODE_LABEL_GAP +
    ATTACK_GRAPH_NODE_LABEL_HEIGHT
  );
}

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return `rgba(15, 23, 42, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default AttackGraphNode;
