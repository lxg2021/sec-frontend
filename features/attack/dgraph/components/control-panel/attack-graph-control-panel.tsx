"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export interface AttackGraphControlPanelPlugin {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count?: number;
  content: ReactNode;
  headerDescription?: ReactNode;
  headerAction?: ReactNode;
  tone?: "blue" | "emerald";
}

export interface AttackGraphControlPanelProps {
  plugins: readonly AttackGraphControlPanelPlugin[];
  activePluginId?: string;
  className?: string;
  defaultActivePluginId?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onActivePluginChange?: (pluginId: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export function AttackGraphControlPanel({
  plugins,
  activePluginId,
  className,
  defaultActivePluginId,
  defaultExpanded = true,
  expanded,
  onActivePluginChange,
  onExpandedChange,
}: AttackGraphControlPanelProps) {
  const [internalActivePluginId, setInternalActivePluginId] = useState(
    defaultActivePluginId ?? plugins[0]?.id ?? "",
  );
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const resolvedActivePluginId = activePluginId ?? internalActivePluginId;
  const resolvedExpanded = expanded ?? internalExpanded;
  const activePlugin = useMemo(
    () =>
      plugins.find((plugin) => plugin.id === resolvedActivePluginId) ??
      plugins[0],
    [plugins, resolvedActivePluginId],
  );

  useEffect(() => {
    if (!activePlugin && plugins[0]) {
      setInternalActivePluginId(plugins[0].id);
    }
  }, [activePlugin, plugins]);

  if (!activePlugin) {
    return null;
  }

  const selectPlugin = (pluginId: string) => {
    if (activePluginId === undefined) {
      setInternalActivePluginId(pluginId);
    }
    onActivePluginChange?.(pluginId);
  };

  const toggleExpanded = () => {
    const nextExpanded = !resolvedExpanded;
    if (expanded === undefined) {
      setInternalExpanded(nextExpanded);
    }
    onExpandedChange?.(nextExpanded);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    pluginIndex: number,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (pluginIndex + direction + plugins.length) % plugins.length;
    const nextPlugin = plugins[nextIndex];
    if (!nextPlugin) return;

    selectPlugin(nextPlugin.id);
    document
      .getElementById(`attack-graph-control-panel-${nextPlugin.id}-tab`)
      ?.focus();
  };

  return (
    <section
      className={cn(
        "nodrag nopan nowheel pointer-events-auto relative overflow-hidden rounded-[18px] border border-slate-200 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-1px_0_rgba(148,163,184,0.18),0_18px_46px_rgba(15,23,42,0.20),0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur-sm before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:z-20 before:h-px before:bg-white after:pointer-events-none after:absolute after:inset-x-5 after:bottom-0 after:z-20 after:h-px after:bg-slate-300/35",
        className,
      )}
      aria-label="图谱任务控制面板"
      data-attack-graph-control-panel="true"
    >
      <div className="flex min-h-16 items-center border-b border-slate-200/80 bg-white/95 px-2.5 py-2">
        <div
          className="flex min-w-0 shrink-0 items-center gap-1.5"
          role="tablist"
          aria-label="图谱任务类型"
        >
          {plugins.map((plugin, pluginIndex) => {
            const Icon = plugin.icon;
            const selected = plugin.id === activePlugin.id;
            const tone = plugin.tone ?? "blue";
            const panelId = `attack-graph-control-panel-${plugin.id}`;
            const tabId = `${panelId}-tab`;

            return (
              <button
                key={plugin.id}
                id={tabId}
                type="button"
                role="tab"
                aria-controls={panelId}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectPlugin(plugin.id)}
                onKeyDown={(event) => handleTabKeyDown(event, pluginIndex)}
                className={cn(
                  "relative flex h-11 min-w-[146px] cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold outline-none transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-1 motion-reduce:transition-none",
                  tone === "emerald"
                    ? "focus-visible:ring-emerald-500"
                    : "focus-visible:ring-blue-500",
                  selected
                    ? tone === "emerald"
                      ? "border-emerald-200/80 bg-emerald-50/85 text-emerald-700 shadow-[0_4px_12px_-8px_rgba(5,150,105,0.45)]"
                      : "border-blue-200/80 bg-blue-50/90 text-blue-700 shadow-[0_4px_12px_-8px_rgba(37,99,235,0.45)]"
                    : "border-transparent text-slate-700 hover:border-slate-200/80 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 motion-reduce:transition-none",
                    selected
                      ? tone === "emerald"
                        ? "border-emerald-200 bg-white text-emerald-600"
                        : "border-blue-200 bg-white text-blue-600"
                      : "border-slate-200 bg-slate-100/80 text-slate-500",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{plugin.label}</span>
                {typeof plugin.count === "number" ? (
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                      selected
                        ? tone === "emerald"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
                    )}
                  >
                    {plugin.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="ml-2 flex min-w-0 flex-1 items-center justify-between gap-3 border-l border-slate-200/80 pl-5 pr-1">
          <div className="hidden min-w-0 truncate text-xs font-medium text-slate-500 xl:block">
            {activePlugin.headerDescription}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {activePlugin.headerAction}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleExpanded}
              className="h-11 w-11 rounded-xl border-slate-200 bg-white text-slate-600 shadow-[0_2px_8px_-5px_rgba(15,23,42,0.28)] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              aria-controls={`attack-graph-control-panel-${activePlugin.id}`}
              aria-expanded={resolvedExpanded}
              aria-label={resolvedExpanded ? "收起任务控制面板" : "展开任务控制面板"}
              title={resolvedExpanded ? "收起" : "展开"}
            >
              {resolvedExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {resolvedExpanded ? (
        <div
          id={`attack-graph-control-panel-${activePlugin.id}`}
          role="tabpanel"
          aria-labelledby={`attack-graph-control-panel-${activePlugin.id}-tab`}
          className="max-h-[300px] min-h-0 overflow-hidden bg-white"
        >
          {activePlugin.content}
        </div>
      ) : null}
    </section>
  );
}
