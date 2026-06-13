"use client";

import { cn } from "@/shared/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { AttackGraphLayoutStrategy } from "../model/attack-graph-data";

export type AttackGraphLayoutStrategyOption = "auto" | AttackGraphLayoutStrategy;

const ATTACK_GRAPH_LAYOUT_STRATEGY_OPTIONS: Array<{
  label: string;
  value: AttackGraphLayoutStrategyOption;
}> = [
  { label: "Auto", value: "auto" },
  { label: "Layered", value: "layered" },
  { label: "Stress", value: "stress" },
];

export function AttackGraphLayoutStrategyToggle({
  value,
  onChange,
  className,
}: {
  value: AttackGraphLayoutStrategyOption;
  onChange: (value: AttackGraphLayoutStrategyOption) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onChange(nextValue as AttackGraphLayoutStrategyOption);
        }
      }}
      className={cn(
        "rounded-md border border-slate-200 bg-white p-1 shadow-sm",
        className,
      )}
      size="sm"
      variant="default"
      aria-label="Attack graph layout mode"
    >
      {ATTACK_GRAPH_LAYOUT_STRATEGY_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={`Use ${option.label} layout`}
          className="h-7 min-w-0 rounded px-2.5 text-xs text-slate-600 data-[state=on]:bg-slate-900 data-[state=on]:text-white"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
