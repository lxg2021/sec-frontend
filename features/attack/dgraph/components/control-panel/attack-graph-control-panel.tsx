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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("pages.attack.drill.controlPanel");
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
        "nodrag nopan nowheel pointer-events-auto relative mx-auto overflow-hidden border backdrop-blur-sm transition-[width,max-width,border-radius,box-shadow] duration-200 ease-out motion-reduce:transition-none",
        resolvedExpanded
          ? "w-[88%] max-w-[1480px] rounded-[36px] border-slate-200 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-1px_0_rgba(148,163,184,0.18),0_18px_46px_rgba(15,23,42,0.20),0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-black/5 before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:z-20 before:h-px before:bg-white after:pointer-events-none after:absolute after:inset-x-5 after:bottom-0 after:z-20 after:h-px after:bg-slate-300/35"
          : "min-w-[380px] w-fit max-w-full rounded-full border-slate-200 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(148,163,184,0.10),0_12px_24px_rgba(15,23,42,0.10),0_2px_4px_rgba(15,23,42,0.06)] ring-1 ring-white/80",
        className,
      )}
      aria-label={t("accessibility.panel")}
      data-expanded={resolvedExpanded}
      data-attack-graph-control-panel="true"
    >
      <div
        className={cn(
          "flex items-center bg-white/95 transition-[height,padding,background-color] duration-200 ease-out motion-reduce:transition-none",
          resolvedExpanded
            ? "h-12 border-b border-slate-200/80 px-5 py-1.5"
            : "h-[60px] border-b border-transparent px-3 py-2.5",
        )}
      >
        <div
          className="flex min-w-0 shrink-0 items-center gap-1.5"
          role="tablist"
          aria-label={t("accessibility.taskTypes")}
        >
          {plugins.map((plugin, pluginIndex) => {
            const Icon = plugin.icon;
            const selected = plugin.id === activePlugin.id;
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
                  "relative flex cursor-pointer items-center justify-center whitespace-nowrap rounded-full border font-semibold outline-none transition-[height,min-width,padding,background-color,border-color,color,box-shadow] duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 motion-reduce:transition-none",
                  resolvedExpanded
                    ? "h-9 min-w-[112px] gap-1.5 px-2.5 text-xs"
                    : "h-10 min-w-[124px] gap-2 px-3 text-[13px]",
                  selected
                    ? "border-slate-950 bg-slate-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-slate-800"
                    : "border-transparent bg-slate-50 text-slate-950 hover:bg-slate-100 hover:text-black",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center transition-colors duration-200 motion-reduce:transition-none",
                    selected ? "text-white" : "text-slate-950",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{plugin.label}</span>
                {typeof plugin.count === "number" ? (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                      selected
                        ? "bg-white text-slate-950"
                        : "bg-slate-200/80 text-slate-950",
                    )}
                  >
                    {plugin.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            "ml-3 flex min-w-0 items-center justify-between gap-2 border-l border-slate-200/80 pl-4 pr-0",
            resolvedExpanded
              ? "flex-1"
              : "shrink-0",
          )}
        >
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {activePlugin.headerAction ? (
              <div>
                {activePlugin.headerAction}
              </div>
            ) : null}
            {activePlugin.headerAction ? (
              <span
                className="mx-1 h-8 w-px shrink-0 bg-slate-200"
                aria-hidden="true"
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleExpanded}
              className={cn(
                "shrink-0 rounded-full border-transparent bg-slate-50 text-slate-950 shadow-none outline-none transition-[height,width,background-color,border-color,color,box-shadow] duration-200 hover:border-transparent hover:bg-slate-100 hover:text-black focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 motion-reduce:transition-none",
                resolvedExpanded ? "h-9 w-9" : "h-10 w-10",
              )}
              aria-controls={`attack-graph-control-panel-${activePlugin.id}`}
              aria-expanded={resolvedExpanded}
              aria-label={
                resolvedExpanded
                  ? t("accessibility.collapsePanel")
                  : t("accessibility.expandPanel")
              }
              title={
                resolvedExpanded
                  ? t("accessibility.collapse")
                  : t("accessibility.expand")
              }
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
          className="h-[300px] min-h-0 animate-in overflow-hidden bg-white px-5 fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
        >
          {activePlugin.content}
        </div>
      ) : null}
    </section>
  );
}
