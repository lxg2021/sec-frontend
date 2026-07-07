"use client"

import type { ReactNode } from "react"
import { Loader2, RotateCcw, Shield } from "lucide-react"
import { useTranslations } from "next-intl"

import { AttackGraphFlow } from "@/features/attack/dgraph/components/attack-graph-flow"
import {
  AttackGraphLayoutStrategyToggle,
  type AttackGraphLayoutStrategyOption,
} from "@/features/attack/dgraph/components/attack-graph-layout-strategy-toggle"
import type { AttackGraphLayoutOptions, GraphCaseResponseDto } from "@/features/attack/dgraph/model/core/attack-graph-data"
import type {
  AttackGraphMenuAction,
  AttackGraphNodeDrillStateByKey,
} from "@/features/attack/dgraph/model/menu/attack-graph-menu-types"
import { IocPanelEmptyState } from "@/features/ioc-analysis/components/ioc-panel-empty-state"
import { localEventSummary, localEventUniqueId, type IocLocalEventSource } from "@/features/ioc-analysis/components/ioc-search-event-utils"
import { Button } from "@/shared/ui/button"

type PositioningGraphStatus = "idle" | "loading" | "success" | "error"

export function IocPositioningGraphPanel({
  className,
  edgeCount,
  error,
  graphScopeId,
  graphScopeType,
  layoutOptions,
  layoutStrategy,
  loadingEvent,
  nodeCount,
  nodeDrillStateByKey,
  onLayoutStrategyChange,
  onMenuAction,
  onResetPositions,
  positionResetKey,
  response,
  selectedEvent,
  status,
}: {
  className?: string
  edgeCount: number
  error: string
  graphScopeId?: string
  graphScopeType?: string
  layoutOptions?: AttackGraphLayoutOptions
  layoutStrategy: AttackGraphLayoutStrategyOption
  loadingEvent?: IocLocalEventSource | null
  nodeCount: number
  nodeDrillStateByKey?: AttackGraphNodeDrillStateByKey
  onLayoutStrategyChange: (strategy: AttackGraphLayoutStrategyOption) => void
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>
  onResetPositions: () => void
  positionResetKey: number | string
  response: GraphCaseResponseDto | null
  selectedEvent?: IocLocalEventSource | null
  status: PositioningGraphStatus
}) {
  const hasGraph = Boolean(response && nodeCount > 0)
  const sourceEvent = selectedEvent || loadingEvent || null
  const t = useTranslations("pages.iocAnalysis.search.graph")

  return (
    <section className={className}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-950">{t("title")}</h2>
                {graphScopeId ? (
                  <span className="rounded bg-blue-50 px-2 py-1 font-mono text-[11px] text-blue-700">
                    {graphScopeType || "positioning"}:{graphScopeId}
                  </span>
                ) : null}
                {hasGraph ? (
                  <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                    {nodeCount} nodes / {edgeCount} edges
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {sourceEvent ? `${sourceEvent.event_name || t("eventFallback")} · ${localEventUniqueId(sourceEvent) || localEventSummary(sourceEvent)}` : t("description")}
              </p>
            </div>
          </div>

          {hasGraph ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-md border-slate-200 bg-white text-xs"
                onClick={onResetPositions}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("reset")}
              </Button>
              <AttackGraphLayoutStrategyToggle
                value={layoutStrategy}
                onChange={onLayoutStrategyChange}
              />
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1">
          {status === "loading" ? (
            <GraphStateMessage
              icon={<Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              title={t("loadingTitle")}
              description={t("loadingDescription")}
            />
          ) : status === "error" ? (
            <GraphStateMessage
              title={t("errorTitle")}
              description={error || t("errorDescription")}
            />
          ) : hasGraph && response ? (
            <AttackGraphFlow
              response={response}
              className="h-full min-h-0"
              fitView
              maxZoom={1.2}
              minZoom={0.4}
              layoutOptions={layoutOptions}
              nodeDrillStateByKey={nodeDrillStateByKey}
              onMenuAction={onMenuAction}
              positionResetKey={positionResetKey}
              showMiniMap
            />
          ) : (
            <GraphStateMessage
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function GraphStateMessage({
  description,
  icon,
  title,
}: {
  description: string
  icon?: ReactNode
  title: string
}) {
  return (
    <IocPanelEmptyState
      title={title}
      description={description}
      icon={icon}
    />
  )
}
