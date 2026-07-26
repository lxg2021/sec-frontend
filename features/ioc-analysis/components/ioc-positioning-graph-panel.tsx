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
import { Button } from "@/shared/ui/button"

type PositioningGraphStatus = "idle" | "loading" | "success" | "error"

export function IocPositioningGraphPanel({
  className,
  edgeCount,
  error,
  layoutOptions,
  layoutStrategy,
  nodeCount,
  nodeDrillStateByKey,
  onLayoutStrategyChange,
  onMenuAction,
  onResetPositions,
  positionResetKey,
  response,
  status,
}: {
  className?: string
  edgeCount: number
  error: string
  layoutOptions?: AttackGraphLayoutOptions
  layoutStrategy: AttackGraphLayoutStrategyOption
  nodeCount: number
  nodeDrillStateByKey?: AttackGraphNodeDrillStateByKey
  onLayoutStrategyChange: (strategy: AttackGraphLayoutStrategyOption) => void
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>
  onResetPositions: () => void
  positionResetKey: number | string
  response: GraphCaseResponseDto | null
  status: PositioningGraphStatus
}) {
  const hasGraph = Boolean(response && nodeCount > 0)
  const t = useTranslations("pages.iocAnalysis.search.graph")

  return (
    <section className={className}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-950">{t("title")}</h2>
              <p className="mt-1 truncate text-xs text-slate-500">
                {hasGraph ? t("stats", { nodeCount, edgeCount }) : t("description")}
              </p>
            </div>
          </div>

          {hasGraph ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-slate-200 bg-white text-xs"
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
