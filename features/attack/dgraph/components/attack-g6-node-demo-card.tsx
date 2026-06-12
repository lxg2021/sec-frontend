"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/shared/lib/utils";
import {
  getAttackG6NodeDemoItems,
  type AttackG6NodeSize,
} from "./attack-g6-node";

export function AttackG6NodeDemoCard() {
  const items = getAttackG6NodeDemoItems();
  const [selectedKind, setSelectedKind] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            G6 Node Demo
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {items.length} presentation kinds from attack-g6-node.ts
          </div>
        </div>
        <div className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          image / family / size / state
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((item) => (
          <NodePreviewTile
            key={item.kind}
            item={item}
            selected={selectedKind === item.kind}
            onSelect={() =>
              setSelectedKind((current) =>
                current === item.kind ? null : item.kind,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function NodePreviewTile({
  item,
  selected,
  onSelect,
}: {
  item: ReturnType<typeof getAttackG6NodeDemoItems>[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const ringState = selected ? item.selectedState : item.activeState;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group min-w-0 rounded-md border bg-white px-3 py-3 text-left transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        selected ? "border-blue-300 bg-blue-50/30" : "border-slate-200",
      )}
      style={{
        boxShadow: selected
          ? `0 14px 30px ${toRgba(item.glow, 0.18)}`
          : `0 10px 24px ${toRgba(item.glow, 0.1)}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full bg-white ring-1 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110",
            selected
              ? "scale-110 ring-blue-200"
              : "ring-slate-200",
          )}
          style={{
            width: item.size.icon,
            height: item.size.icon,
            boxShadow: `0 0 0 ${Math.min(5, Math.max(2, ringState.haloLineWidth / 4))}px ${toRgba(
              item.color,
              Math.min(selected ? 0.26 : 0.18, ringState.haloStrokeOpacity),
            )}`,
          }}
        >
          <Image
            src={item.image}
            alt={item.label}
            width={Math.max(24, item.size.icon - 18)}
            height={Math.max(24, item.size.icon - 18)}
            className="h-auto w-auto max-w-[68%]"
          />
          {selected ? (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[11px] font-black leading-none text-white shadow-[0_6px_14px_rgba(37,99,235,0.28)]">
              OK
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-h-5 text-sm font-semibold leading-5 text-slate-900">
            {item.label}
          </div>
          <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
            {item.kind}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <NodeMetaPill className="text-slate-600">{item.family}</NodeMetaPill>
            <NodeMetaPill className="text-slate-500">
              {formatSize(item.size)}
            </NodeMetaPill>
            <NodeMetaPill className="text-slate-500">
              A{item.activeState.haloLineWidth}/S
              {item.selectedState.haloLineWidth}
            </NodeMetaPill>
          </div>
        </div>
      </div>
    </button>
  );
}

function NodeMetaPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-sm bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium leading-4",
        className,
      )}
    >
      {children}
    </span>
  );
}

function formatSize(size: AttackG6NodeSize) {
  return `${size.width}x${size.height}/${size.icon}`;
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
