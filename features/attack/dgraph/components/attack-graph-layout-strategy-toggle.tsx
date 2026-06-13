"use client";

import { Layers3, Network, Sparkles, type LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { AttackGraphLayoutStrategy } from "../model/attack-graph-data";

export type AttackGraphLayoutStrategyOption = "auto" | AttackGraphLayoutStrategy;

const ATTACK_GRAPH_LAYOUT_STRATEGY_OPTIONS: Array<{
  icon: LucideIcon;
  label: string;
  value: AttackGraphLayoutStrategyOption;
}> = [
  { icon: Sparkles, label: "Auto", value: "auto" },
  { icon: Layers3, label: "Layered", value: "layered" },
  { icon: Network, label: "Stress", value: "stress" },
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
        "rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm",
        className,
      )}
      size="sm"
      variant="default"
      aria-label="Attack graph layout mode"
    >
      {ATTACK_GRAPH_LAYOUT_STRATEGY_OPTIONS.map((option) => {
        const Icon = option.icon;

        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={`Use ${option.label} layout`}
            className="h-8 min-w-0 rounded-md px-2.5 text-xs font-medium text-slate-500 transition-all hover:bg-white hover:text-slate-800 data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=on]:shadow-sm"
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{option.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
