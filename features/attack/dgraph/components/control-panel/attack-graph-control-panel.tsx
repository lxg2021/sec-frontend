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
        "nodrag nopan nowheel pointer-events-auto overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_-12px_rgba(15,23,42,0.26)]",
        className,
      )}
      aria-label="图谱任务控制面板"
      data-attack-graph-control-panel="true"
    >
      <div className="flex min-h-14 items-stretch border-b border-slate-200 bg-slate-50/95">
        <div
          className="flex min-w-0 shrink-0 items-stretch"
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
                  "relative flex min-h-14 min-w-[148px] items-center justify-center gap-2 px-4 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset",
                  tone === "emerald"
                    ? "focus-visible:ring-emerald-500"
                    : "focus-visible:ring-blue-500",
                  selected
                    ? cn(
                        "bg-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                        tone === "emerald"
                          ? "text-emerald-700 after:bg-emerald-600"
                          : "text-blue-700 after:bg-blue-600",
                      )
                    : "text-slate-700 hover:bg-white/70 hover:text-slate-950",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    selected
                      ? tone === "emerald"
                        ? "text-emerald-600"
                        : "text-blue-600"
                      : "text-slate-500",
                  )}
                  aria-hidden="true"
                />
                <span>{plugin.label}</span>
                {typeof plugin.count === "number" ? (
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                      selected
                        ? tone === "emerald"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-700",
                    )}
                  >
                    {plugin.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4">
          <div className="min-w-0 truncate text-xs text-slate-500">
            {activePlugin.headerDescription}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {activePlugin.headerAction}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleExpanded}
              className="h-10 w-10 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
