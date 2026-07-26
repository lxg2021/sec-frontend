"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Activity,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  Clock3,
  History,
  LoaderCircle,
  MonitorCog,
  RefreshCw,
  SkipForward,
} from "lucide-react"

import { listDispatchExecutionResults } from "@/features/audit/api"
import type { DispatchExecutionResult, DispatchExecutionStatus } from "@/features/audit/types"
import {
  listControlObjectOperations,
  queryControlObjectAgentOverview,
  type ControlObjectAgentOverview,
  type ControlObjectAgentOverviewPage,
  type ControlObjectAgentOverviewStatistics,
  type ControlObjectDefinition,
  type ControlObjectExecutionStatus,
  type ControlObjectOperation,
  type ControlObjectOperationPage,
  type ControlObjectOperationSnapshot,
} from "@/features/control-object-library/api"
import { controlObjectDisplayNameKey } from "@/features/control-object-library/table-presentation"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

const PAGE_SIZE = 10

const EMPTY_STATISTICS: ControlObjectAgentOverviewStatistics = {
  totalAgents: 0,
  effectiveCount: 0,
  startedCount: 0,
  stoppedCount: 0,
  pendingCount: 0,
  runningCount: 0,
  successCount: 0,
  failedCount: 0,
  uncertainCount: 0,
  skippedCount: 0,
  canceledCount: 0,
}

const EMPTY_OVERVIEW: ControlObjectAgentOverviewPage = {
  items: [],
  statistics: EMPTY_STATISTICS,
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
}

const EMPTY_OPERATIONS: ControlObjectOperationPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
}

const OPERATION_LABEL_KEYS: Record<ControlObjectOperation | "unknown", string> = {
  apply: "deliveryDialog.operations.apply",
  stop: "deliveryDialog.operations.stop",
  remove: "deliveryDialog.operations.remove",
  execute: "deliveryDialog.operations.execute",
  unknown: "deliveryDialog.statuses.unknown",
}

const EXECUTION_PRESENTATION: Record<ControlObjectExecutionStatus, {
  labelKey: string
  icon: typeof Clock3
  iconClassName: string
}> = {
  pending: { labelKey: "deliveryDialog.statuses.pending", icon: Clock3, iconClassName: "text-sky-600" },
  accepted: { labelKey: "deliveryDialog.statuses.accepted", icon: Clock3, iconClassName: "text-blue-600" },
  running: { labelKey: "deliveryDialog.statuses.running", icon: LoaderCircle, iconClassName: "text-cyan-600" },
  success: { labelKey: "deliveryDialog.statuses.success", icon: CheckCircle2, iconClassName: "text-emerald-600" },
  failed: { labelKey: "deliveryDialog.statuses.failed", icon: CircleAlert, iconClassName: "text-rose-600" },
  skipped: { labelKey: "deliveryDialog.statuses.skipped", icon: SkipForward, iconClassName: "text-slate-500" },
  canceled: { labelKey: "deliveryDialog.statuses.canceled", icon: Ban, iconClassName: "text-amber-600" },
  unknown: { labelKey: "deliveryDialog.statuses.unknown", icon: CircleDashed, iconClassName: "text-slate-500" },
}

const AUDIT_EXECUTION_PRESENTATION: Record<DispatchExecutionStatus, {
  labelKey: string
  icon: typeof Clock3
  iconClassName: string
}> = EXECUTION_PRESENTATION

function deliveryErrorMessage(error: unknown, translate: (key: string) => string) {
  const message = error instanceof Error ? error.message.trim() : ""
  if (message === "PMC_OBJECT_AGENT_INVALID") {
    return translate("deliveryDialog.errors.agentMismatch")
  }
  if (message === "PMC_OBJECT_AGENT_LIST_INVALID") {
    return translate("deliveryDialog.errors.agentListInvalid")
  }
  if (message === "PMC_OBJECT_AGENT_STATISTICS_INVALID") {
    return translate("deliveryDialog.errors.statisticsInvalid")
  }
  if (message === "PMC_OBJECT_OPERATION_INVALID") {
    return translate("deliveryDialog.errors.operationMismatch")
  }
  if (message === "PMC_OBJECT_OPERATION_LIST_INVALID") {
    return translate("deliveryDialog.errors.operationListInvalid")
  }
  return message || translate("deliveryDialog.errors.loadFailed")
}

function formatUnixMs(value: number, locale: string) {
  if (!Number.isFinite(value) || value <= 0) return "—"
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function formatIsoDate(value: string | undefined, locale: string) {
  if (!value) return "—"
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? formatUnixMs(timestamp, locale) : "—"
}

function currentStateLabel(value: string, translate: (key: string) => string) {
  const normalized = value.toLowerCase()
  if (normalized === "started" || normalized === "effective") return translate("deliveryDialog.states.started")
  if (normalized === "stopped") return translate("deliveryDialog.states.stopped")
  if (normalized === "removed") return translate("deliveryDialog.states.removed")
  if (normalized === "none" || !normalized) return translate("deliveryDialog.states.notEffective")
  return value
}

function simpleStatusLabel(value: string, translate: (key: string) => string) {
  const normalized = value.toLowerCase()
  if (!normalized) return "—"
  if (normalized === "success" || normalized === "succeeded" || normalized === "completed") return translate("deliveryDialog.statuses.success")
  if (normalized === "failed") return translate("deliveryDialog.statuses.failed")
  if (normalized === "pending") return translate("deliveryDialog.statuses.pending")
  if (normalized === "accepted") return translate("deliveryDialog.statuses.accepted")
  if (normalized === "running") return translate("deliveryDialog.statuses.running")
  if (normalized === "published") return translate("deliveryDialog.statuses.published")
  if (normalized === "publishing") return translate("deliveryDialog.statuses.publishing")
  if (normalized === "canceled" || normalized === "cancelled") return translate("deliveryDialog.statuses.canceled")
  if (normalized === "skipped") return translate("deliveryDialog.statuses.skipped")
  if (normalized === "unknown" || normalized === "uncertain") return translate("deliveryDialog.statuses.uncertain")
  return value
}

function operationResult(operation: ControlObjectOperationSnapshot, translate: (key: string) => string) {
  if (
    operation.pendingCount + operation.runningCount > 0
    || ["created", "pending", "planning", "materializing", "running"].includes(operation.status)
    || ["pending", "planning", "materializing"].includes(operation.planningStatus)
  ) {
    return { label: translate("deliveryDialog.statuses.inProgress"), status: "running" as const }
  }
  if (operation.uncertainCount > 0) {
    return { label: translate("deliveryDialog.statuses.uncertain"), status: "unknown" as const }
  }
  if (operation.failedCount > 0 && operation.successCount > 0) {
    return { label: translate("deliveryDialog.statuses.partiallyFailed"), status: "failed" as const }
  }
  if (operation.failedCount > 0) return { label: translate("deliveryDialog.statuses.failed"), status: "failed" as const }
  if (operation.canceledCount > 0 && operation.successCount === 0) {
    return { label: translate("deliveryDialog.statuses.canceled"), status: "canceled" as const }
  }
  if (operation.totalCount > 0 && operation.successCount + operation.skippedCount >= operation.totalCount) {
    return { label: translate(operation.successCount > 0 ? "deliveryDialog.statuses.success" : "deliveryDialog.statuses.skipped"), status: operation.successCount > 0 ? "success" as const : "skipped" as const }
  }
  if (["no_target", "empty"].includes(operation.outcome)) return { label: translate("deliveryDialog.statuses.noTargets"), status: "skipped" as const }
  if (["no_action", "skipped"].includes(operation.outcome)) return { label: translate("deliveryDialog.statuses.noAction"), status: "skipped" as const }
  if (operation.outcome === "partial") return { label: translate("deliveryDialog.statuses.partiallySucceeded"), status: "unknown" as const }
  return { label: simpleStatusLabel(operation.outcome || operation.status, translate), status: "unknown" as const }
}

export function ControlObjectDeliveryDialog({
  definition,
  onOpenChange,
}: {
  definition: ControlObjectDefinition | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("pages.controlCenter")
  const [tab, setTab] = useState<"overview" | "history">("overview")
  const [overview, setOverview] = useState<ControlObjectAgentOverviewPage>(EMPTY_OVERVIEW)
  const [overviewPage, setOverviewPage] = useState(1)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState("")
  const [operations, setOperations] = useState<ControlObjectOperationPage>(EMPTY_OPERATIONS)
  const [operationPage, setOperationPage] = useState(1)
  const [operationLoading, setOperationLoading] = useState(false)
  const [operationError, setOperationError] = useState("")
  const [selectedOperation, setSelectedOperation] = useState<ControlObjectOperationSnapshot | null>(null)
  const [executionItems, setExecutionItems] = useState<DispatchExecutionResult[]>([])
  const [executionTotal, setExecutionTotal] = useState(0)
  const [executionPage, setExecutionPage] = useState(1)
  const [executionLoading, setExecutionLoading] = useState(false)
  const [executionError, setExecutionError] = useState("")
  const overviewSequence = useRef(0)
  const operationSequence = useRef(0)
  const executionSequence = useRef(0)

  const objectKey = definition
    ? `${definition.objectTypeValue}:${definition.objectId.toLowerCase()}`
    : ""

  useEffect(() => {
    overviewSequence.current += 1
    operationSequence.current += 1
    executionSequence.current += 1
    setTab("overview")
    setOverview(EMPTY_OVERVIEW)
    setOverviewPage(1)
    setOverviewLoading(false)
    setOverviewError("")
    setOperations(EMPTY_OPERATIONS)
    setOperationPage(1)
    setOperationLoading(false)
    setOperationError("")
    setSelectedOperation(null)
    setExecutionItems([])
    setExecutionTotal(0)
    setExecutionPage(1)
    setExecutionLoading(false)
    setExecutionError("")
  }, [objectKey])

  useEffect(() => () => {
    overviewSequence.current += 1
    operationSequence.current += 1
    executionSequence.current += 1
  }, [])

  const loadOverview = useCallback(async () => {
    if (!definition) return
    const sequence = ++overviewSequence.current
    setOverviewLoading(true)
    setOverviewError("")
    try {
      const result = await queryControlObjectAgentOverview(definition, overviewPage, PAGE_SIZE)
      if (sequence === overviewSequence.current) setOverview(result)
    } catch (error) {
      if (sequence !== overviewSequence.current) return
      setOverview(EMPTY_OVERVIEW)
      setOverviewError(deliveryErrorMessage(error, (key) => t(key)))
    } finally {
      if (sequence === overviewSequence.current) setOverviewLoading(false)
    }
  }, [definition, overviewPage, t])

  const loadOperations = useCallback(async () => {
    if (!definition) return
    const sequence = ++operationSequence.current
    setOperationLoading(true)
    setOperationError("")
    try {
      const result = await listControlObjectOperations(definition, operationPage, PAGE_SIZE)
      if (sequence === operationSequence.current) setOperations(result)
    } catch (error) {
      if (sequence !== operationSequence.current) return
      setOperations(EMPTY_OPERATIONS)
      setOperationError(deliveryErrorMessage(error, (key) => t(key)))
    } finally {
      if (sequence === operationSequence.current) setOperationLoading(false)
    }
  }, [definition, operationPage, t])

  const loadExecutions = useCallback(async () => {
    if (!selectedOperation) return
    const sequence = ++executionSequence.current
    setExecutionLoading(true)
    setExecutionError("")
    try {
      const result = await listDispatchExecutionResults(selectedOperation.operationId, executionPage, PAGE_SIZE)
      if (sequence !== executionSequence.current) return
      setExecutionItems(result.items)
      setExecutionTotal(result.total)
    } catch (error) {
      if (sequence !== executionSequence.current) return
      setExecutionItems([])
      setExecutionTotal(0)
      setExecutionError(deliveryErrorMessage(error, (key) => t(key)))
    } finally {
      if (sequence === executionSequence.current) setExecutionLoading(false)
    }
  }, [executionPage, selectedOperation, t])

  useEffect(() => {
    if (definition && tab === "overview") void loadOverview()
  }, [definition, loadOverview, tab])

  useEffect(() => {
    if (definition && tab === "history") void loadOperations()
  }, [definition, loadOperations, tab])

  useEffect(() => {
    if (selectedOperation) void loadExecutions()
  }, [loadExecutions, selectedOperation])

  const selectOperation = (operation: ControlObjectOperationSnapshot) => {
    executionSequence.current += 1
    setSelectedOperation(operation)
    setExecutionItems([])
    setExecutionTotal(0)
    setExecutionPage(1)
    setExecutionError("")
  }

  const returnToHistory = () => {
    executionSequence.current += 1
    setSelectedOperation(null)
    setExecutionItems([])
    setExecutionTotal(0)
    setExecutionPage(1)
    setExecutionLoading(false)
    setExecutionError("")
  }

  const overviewTabLabel = definition?.objectType === "command"
    ? t("deliveryDialog.tabs.recentExecutions")
    : t("deliveryDialog.tabs.currentApplications")
  const displayNameKey = definition ? controlObjectDisplayNameKey(definition) : null
  const displayName = definition
    ? (displayNameKey ? t(displayNameKey) : definition.displayName)
    : ""

  return (
    <Dialog open={Boolean(definition)} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-[2px]"
        closeLabel={t("common.close")}
        className={cn(
          "flex h-[calc(100dvh-2rem)] max-h-[820px] w-[calc(100vw-1.5rem)] max-w-[1180px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:rounded-2xl",
          "[&>button]:right-4 [&>button]:top-3.5 [&>button]:z-20 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-slate-100 [&>button]:hover:text-slate-800 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-cyan-500",
        )}
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 pr-14 text-left sm:px-5 sm:pr-16">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <MonitorCog className="h-4 w-4 shrink-0" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                {t("deliveryDialog.title")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {definition
                  ? t("deliveryDialog.description", { name: displayName, version: definition.version })
                  : t("deliveryDialog.descriptionFallback")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as "overview" | "history")
            if (value !== "history") returnToHistory()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 sm:px-5">
            <TabsList className="h-9 rounded-full border border-slate-200 bg-slate-100 p-1">
              <TabsTrigger value="overview" className="h-7 gap-1.5 rounded-full px-3 text-xs data-[state=active]:text-cyan-700">
                <Activity className="h-3.5 w-3.5 text-cyan-600" aria-hidden="true" />
                {overviewTabLabel}
              </TabsTrigger>
              <TabsTrigger value="history" className="h-7 gap-1.5 rounded-full px-3 text-xs data-[state=active]:text-cyan-700">
                <History className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" />
                {t("deliveryDialog.tabs.history")}
              </TabsTrigger>
            </TabsList>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={tab === "overview" ? overviewLoading : selectedOperation ? executionLoading : operationLoading}
              onClick={() => {
                if (tab === "overview") void loadOverview()
                else if (selectedOperation) void loadExecutions()
                else void loadOperations()
              }}
              className="h-8 shrink-0 rounded-full border-slate-200 px-3 text-xs text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <RefreshCw className={cn(
                "h-3.5 w-3.5 text-cyan-600",
                (overviewLoading || operationLoading || executionLoading) && "animate-spin",
              )} aria-hidden="true" />
              {t("common.refresh")}
            </Button>
          </div>

          <TabsContent value="overview" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <OverviewPanel
              definition={definition}
              result={overview}
              loading={overviewLoading}
              error={overviewError}
              page={overviewPage}
              onPageChange={setOverviewPage}
              onRetry={() => void loadOverview()}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0 min-h-0 flex-1 overflow-hidden">
            {selectedOperation ? (
              <ExecutionDetailPanel
                operation={selectedOperation}
                items={executionItems}
                total={executionTotal}
                page={executionPage}
                loading={executionLoading}
                error={executionError}
                onBack={returnToHistory}
                onPageChange={setExecutionPage}
                onRetry={() => void loadExecutions()}
              />
            ) : (
              <OperationHistoryPanel
                result={operations}
                loading={operationLoading}
                error={operationError}
                page={operationPage}
                onPageChange={setOperationPage}
                onSelect={selectOperation}
                onRetry={() => void loadOperations()}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function OverviewPanel({
  definition,
  result,
  loading,
  error,
  page,
  onPageChange,
  onRetry,
}: {
  definition: ControlObjectDefinition | null
  result: ControlObjectAgentOverviewPage
  loading: boolean
  error: string
  page: number
  onPageChange: (page: number) => void
  onRetry: () => void
}) {
  const t = useTranslations("pages.controlCenter")
  if (loading && result.items.length === 0) return <LoadingState label={t("deliveryDialog.loadingOverview")} />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (!definition) return null

  const command = definition.objectType === "command"
  const statistics = result.statistics
  const metrics = command
    ? [
        { label: t("deliveryDialog.metrics.executionHosts"), value: statistics.totalAgents, color: "text-blue-700" },
        { label: t("deliveryDialog.metrics.success"), value: statistics.successCount, color: "text-emerald-700" },
        { label: t("deliveryDialog.metrics.failed"), value: statistics.failedCount, color: "text-rose-700" },
        { label: t("deliveryDialog.metrics.pendingRunning"), value: statistics.pendingCount + statistics.runningCount, color: "text-cyan-700" },
        { label: t("deliveryDialog.metrics.uncertain"), value: statistics.uncertainCount, color: "text-amber-700" },
        { label: t("deliveryDialog.metrics.skippedCanceled"), value: statistics.skippedCount + statistics.canceledCount, color: "text-slate-700" },
      ]
    : [
        { label: t("deliveryDialog.metrics.associatedHosts"), value: statistics.totalAgents, color: "text-blue-700" },
        { label: t("deliveryDialog.metrics.effective"), value: statistics.effectiveCount, color: "text-emerald-700" },
        { label: t("deliveryDialog.metrics.started"), value: statistics.startedCount, color: "text-cyan-700" },
        { label: t("deliveryDialog.metrics.stopped"), value: statistics.stoppedCount, color: "text-slate-700" },
        { label: t("deliveryDialog.metrics.changing"), value: statistics.pendingCount + statistics.runningCount, color: "text-violet-700" },
        { label: t("deliveryDialog.metrics.uncertain"), value: statistics.uncertainCount, color: "text-amber-700" },
      ]

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:px-5">
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
        {loading && (
          <div className="absolute right-3 top-2.5 z-20 flex items-center gap-1.5 text-xs text-slate-500" role="status">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-600" aria-hidden="true" />
            {t("common.refreshing")}
          </div>
        )}
        {result.items.length === 0 ? (
          <EmptyState label={command ? t("deliveryDialog.empty.commandOverview") : t("deliveryDialog.empty.effectOverview")} />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              {command ? <CommandOverviewTable items={result.items} /> : <EffectOverviewTable items={result.items} />}
            </div>
            <Pagination
              page={page}
              pageSize={result.pageSize}
              total={result.total}
              loading={loading}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}

function EffectOverviewTable({ items }: { items: ControlObjectAgentOverview[] }) {
  const t = useTranslations("pages.controlCenter")
  const locale = useLocale()
  return (
    <table className="w-full min-w-[980px] table-fixed text-left text-xs">
      <colgroup>
        <col className="w-[22%]" />
        <col className="w-[12%]" />
        <col className="w-[11%]" />
        <col className="w-[12%]" />
        <col className="w-[11%]" />
        <col className="w-[13%]" />
        <col className="w-[19%]" />
      </colgroup>
      <TableHeader labels={[
        "Agent ID",
        t("deliveryDialog.columns.currentVersion"),
        t("deliveryDialog.columns.currentEffect"),
        t("deliveryDialog.columns.targetVersion"),
        t("deliveryDialog.columns.changeOperation"),
        t("deliveryDialog.columns.executionStatus"),
        t("deliveryDialog.columns.lastReported"),
      ]} />
      <tbody className="divide-y divide-slate-100">
        {items.map((item) => {
          const change = item.activeChange
          const lastReportAt = Math.max(
            item.currentEffect?.lastReportAtUnixMs ?? 0,
            change?.lastReportAtUnixMs ?? 0,
          )
          return (
            <tr key={item.agentId} className="hover:bg-cyan-50/30">
              <MonoCell value={item.agentId} />
              <MonoCell value={item.currentEffect?.objectVersion || item.objectVersion || "—"} />
              <td className="px-3 py-3 text-slate-700">{currentStateLabel(item.currentEffect?.currentState || "", (key) => t(key))}</td>
              <MonoCell value={change?.targetObjectVersion || "—"} />
              <td className="px-3 py-3 text-slate-700">{change ? t(OPERATION_LABEL_KEYS[change.operation]) : "—"}</td>
              <td className="px-3 py-3">
                {change
                  ? <ExecutionStatus status={change.executionStatus} />
                  : <span className="text-slate-600">{simpleStatusLabel(item.currentEffect?.applyState || "", (key) => t(key))}</span>}
              </td>
              <TimeCell value={formatUnixMs(lastReportAt, locale)} />
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function CommandOverviewTable({ items }: { items: ControlObjectAgentOverview[] }) {
  const t = useTranslations("pages.controlCenter")
  const locale = useLocale()
  return (
    <table className="w-full min-w-[1020px] table-fixed text-left text-xs">
      <colgroup>
        <col className="w-[22%]" />
        <col className="w-[11%]" />
        <col className="w-[12%]" />
        <col className="w-[9%]" />
        <col className="w-[13%]" />
        <col className="w-[18%]" />
        <col className="w-[15%]" />
      </colgroup>
      <TableHeader labels={[
        "Agent ID",
        t("deliveryDialog.columns.latestVersion"),
        t("deliveryDialog.columns.executionStatus"),
        t("deliveryDialog.columns.executionCount"),
        t("deliveryDialog.columns.errorCode"),
        t("deliveryDialog.columns.errorMessage"),
        t("deliveryDialog.columns.lastReported"),
      ]} />
      <tbody className="divide-y divide-slate-100">
        {items.map((item) => {
          const execution = item.latestExecution
          const error = execution?.errorMessage || execution?.reasonMessage || "—"
          return (
            <tr key={item.agentId} className="hover:bg-cyan-50/30">
              <MonoCell value={item.agentId} />
              <MonoCell value={execution?.objectVersion || item.objectVersion || "—"} />
              <td className="px-3 py-3">
                <ExecutionStatus status={execution?.executionStatus ?? "unknown"} />
              </td>
              <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-700">{item.executionCount}</td>
              <td className="px-3 py-3"><div className="truncate font-mono text-[11px] text-slate-600" title={execution?.errorCode || "—"}>{execution?.errorCode || "—"}</div></td>
              <td className="px-3 py-3"><div className="truncate text-slate-600" title={error}>{error}</div></td>
              <TimeCell value={formatUnixMs(execution?.lastReportAtUnixMs || execution?.updatedAtUnixMs || 0, locale)} />
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function OperationHistoryPanel({
  result,
  loading,
  error,
  page,
  onPageChange,
  onSelect,
  onRetry,
}: {
  result: ControlObjectOperationPage
  loading: boolean
  error: string
  page: number
  onPageChange: (page: number) => void
  onSelect: (operation: ControlObjectOperationSnapshot) => void
  onRetry: () => void
}) {
  const t = useTranslations("pages.controlCenter")
  const locale = useLocale()
  if (loading && result.items.length === 0) return <LoadingState label={t("deliveryDialog.loadingHistory")} />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (result.items.length === 0) return <EmptyState label={t("deliveryDialog.empty.history")} />

  return (
    <div className="flex h-full min-h-0 flex-col p-4 sm:px-5">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
        {loading && (
          <div className="absolute right-3 top-2.5 z-20 flex items-center gap-1.5 text-xs text-slate-500" role="status">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-600" aria-hidden="true" />
            {t("common.refreshing")}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1080px] table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[72px]" />
              <col className="w-[104px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[72px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[94px]" />
              <col className="w-[72px]" />
            </colgroup>
            <TableHeader labels={[
              t("deliveryDialog.columns.time"),
              t("deliveryDialog.columns.operation"),
              t("deliveryDialog.columns.objectVersion"),
              t("deliveryDialog.columns.targets"),
              t("deliveryDialog.columns.pending"),
              t("deliveryDialog.columns.running"),
              t("deliveryDialog.columns.success"),
              t("deliveryDialog.columns.failed"),
              t("deliveryDialog.columns.uncertain"),
              t("deliveryDialog.columns.skipped"),
              t("deliveryDialog.columns.canceled"),
              t("deliveryDialog.columns.result"),
              t("deliveryDialog.columns.details"),
            ]} centeredFrom={3} />
            <tbody className="divide-y divide-slate-100">
              {result.items.map((operation) => {
                const presentation = operationResult(operation, (key) => t(key))
                return (
                  <tr key={operation.operationId} className="hover:bg-cyan-50/30">
                    <TimeCell value={formatUnixMs(operation.createdAtUnixMs, locale)} />
                    <td className="px-2 py-3 font-medium text-slate-700">{t(OPERATION_LABEL_KEYS[operation.operation])}</td>
                    <MonoCell value={operation.objectVersion || "—"} compact />
                    <CountCell value={operation.totalCount} />
                    <CountCell value={operation.pendingCount} />
                    <CountCell value={operation.runningCount} />
                    <CountCell value={operation.successCount} className="text-emerald-700" />
                    <CountCell value={operation.failedCount} className="text-rose-700" />
                    <CountCell value={operation.uncertainCount} className="text-amber-700" />
                    <CountCell value={operation.skippedCount} />
                    <CountCell value={operation.canceledCount} />
                    <td className="px-2 py-3"><ExecutionStatus status={presentation.status} label={presentation.label} /></td>
                    <td className="px-2 py-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(operation)}
                        className="h-7 rounded-full px-2 text-xs text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
                      >
                        {t("common.view")}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={result.pageSize} total={result.total} loading={loading} onPageChange={onPageChange} />
      </div>
    </div>
  )
}

function ExecutionDetailPanel({
  operation,
  items,
  total,
  page,
  loading,
  error,
  onBack,
  onPageChange,
  onRetry,
}: {
  operation: ControlObjectOperationSnapshot
  items: DispatchExecutionResult[]
  total: number
  page: number
  loading: boolean
  error: string
  onBack: () => void
  onPageChange: (page: number) => void
  onRetry: () => void
}) {
  const t = useTranslations("pages.controlCenter")
  const result = useMemo(() => operationResult(operation, (key) => t(key)), [operation, t])

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:px-5">
      <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={onBack} aria-label={t("deliveryDialog.backToHistory")} className="h-8 w-8 shrink-0 rounded-full border-slate-200">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {t("deliveryDialog.batchTitle", {
                operation: t(OPERATION_LABEL_KEYS[operation.operation]),
                result: result.label,
              })}
            </p>
            <p className="truncate font-mono text-[10px] text-slate-400" title={operation.operationId}>{operation.operationId}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 lg:w-[440px]">
          <MiniMetric label={t("deliveryDialog.metrics.targets")} value={operation.totalCount} />
          <MiniMetric label={t("deliveryDialog.metrics.success")} value={operation.successCount} className="text-emerald-700" />
          <MiniMetric label={t("deliveryDialog.metrics.failed")} value={operation.failedCount} className="text-rose-700" />
          <MiniMetric label={t("deliveryDialog.metrics.incomplete")} value={operation.pendingCount + operation.runningCount + operation.uncertainCount} className="text-amber-700" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
        {loading && items.length === 0 ? (
          <LoadingState label={t("deliveryDialog.loadingExecutionDetails")} />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : items.length === 0 ? (
          <EmptyState label={t("deliveryDialog.empty.executionDetails")} />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1120px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[230px]" />
                  <col className="w-[100px]" />
                  <col className="w-[110px]" />
                  <col className="w-[110px]" />
                  <col className="w-[155px]" />
                  <col className="w-[155px]" />
                  <col className="w-[100px]" />
                  <col className="w-[260px]" />
                </colgroup>
                <TableHeader labels={[
                  "Agent ID",
                  t("deliveryDialog.columns.publishStatus"),
                  t("deliveryDialog.columns.executionStatus"),
                  t("deliveryDialog.columns.failureCertainty"),
                  t("deliveryDialog.columns.lastReported"),
                  t("deliveryDialog.columns.finishedAt"),
                  t("deliveryDialog.columns.errorCode"),
                  t("deliveryDialog.columns.errorDescription"),
                ]} />
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <ExecutionDetailRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} loading={loading} onPageChange={onPageChange} />
          </>
        )}
      </div>
    </div>
  )
}

function ExecutionDetailRow({ item }: { item: DispatchExecutionResult }) {
  const t = useTranslations("pages.controlCenter")
  const locale = useLocale()
  const certainty = item.executionStatus !== "failed"
    ? "—"
    : item.failureCertainty === "definitive"
      ? t("deliveryDialog.certainty.definitive")
      : item.failureCertainty === "uncertain"
        ? t("deliveryDialog.statuses.uncertain")
        : "—"
  const errorCode = item.errorCode || item.reasonCode || "—"
  const errorMessage = item.errorMessage || item.reasonMessage || "—"

  return (
    <tr className="hover:bg-cyan-50/30">
      <MonoCell value={item.agentId || "—"} />
      <td className="px-3 py-3 text-slate-700">{simpleStatusLabel(item.publishStatus, (key) => t(key))}</td>
      <td className="px-3 py-3"><AuditExecutionStatus status={item.executionStatus} /></td>
      <td className="px-3 py-3 text-slate-600">{certainty}</td>
      <TimeCell value={formatIsoDate(item.lastReportAt || item.updatedAt, locale)} />
      <TimeCell value={formatIsoDate(item.finishedAt, locale)} />
      <td className="px-3 py-3"><div className="truncate font-mono text-[11px] text-slate-600" title={errorCode}>{errorCode}</div></td>
      <td className="px-3 py-3"><div className="truncate text-slate-600" title={errorMessage}>{errorMessage}</div></td>
    </tr>
  )
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  const locale = useLocale()
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-center">
      <p className={cn("text-lg font-semibold tabular-nums", color)}>{value.toLocaleString(locale)}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

function MiniMetric({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="flex items-baseline justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
      <span className="text-[10px] text-slate-400">{label}</span>
      <span className={cn("font-mono text-xs font-semibold tabular-nums text-slate-700", className)}>{value}</span>
    </div>
  )
}

function TableHeader({ labels, centeredFrom = Number.POSITIVE_INFINITY }: { labels: string[]; centeredFrom?: number }) {
  return (
    <thead className="sticky top-0 z-10 bg-slate-50/95 text-[11px] font-medium text-slate-500 backdrop-blur">
      <tr className="border-b border-slate-200">
        {labels.map((label, index) => (
          <th key={label} className={cn("px-3 py-2.5", index >= centeredFrom ? "text-center" : "text-left")}>{label}</th>
        ))}
      </tr>
    </thead>
  )
}

function MonoCell({ value, compact = false }: { value: string; compact?: boolean }) {
  return (
    <td className={cn(compact ? "px-2 py-3" : "px-3 py-3")}>
      <div className="truncate font-mono text-[11px] text-slate-600" title={value}>{value}</div>
    </td>
  )
}

function TimeCell({ value }: { value: string }) {
  return <td className="whitespace-nowrap px-3 py-3 text-slate-500" title={value}>{value}</td>
}

function CountCell({ value, className }: { value: number; className?: string }) {
  return <td className={cn("px-2 py-3 text-center font-mono tabular-nums text-slate-600", className)}>{value}</td>
}

function ExecutionStatus({ status, label }: { status: ControlObjectExecutionStatus; label?: string }) {
  const t = useTranslations("pages.controlCenter")
  const presentation = EXECUTION_PRESENTATION[status]
  const Icon = presentation.icon
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", presentation.iconClassName, status === "running" && "animate-spin")} aria-hidden="true" />
      {label || t(presentation.labelKey)}
    </span>
  )
}

function AuditExecutionStatus({ status }: { status: DispatchExecutionStatus }) {
  const t = useTranslations("pages.controlCenter")
  const presentation = AUDIT_EXECUTION_PRESENTATION[status]
  const Icon = presentation.icon
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", presentation.iconClassName, status === "running" && "animate-spin")} aria-hidden="true" />
      {t(presentation.labelKey)}
    </span>
  )
}

function Pagination({
  page,
  pageSize,
  total,
  loading,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  loading: boolean
  onPageChange: (page: number) => void
}) {
  const t = useTranslations("pages.controlCenter")
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2">
      <span className="text-[11px] text-slate-500">{start}–{end} / {total}</span>
      <div className="flex items-center gap-1.5">
        <Button type="button" variant="outline" size="icon" aria-label={t("pagination.previous")} disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)} className="h-7 w-7 rounded-full border-slate-200">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <span className="min-w-14 text-center text-[11px] tabular-nums text-slate-500">{page} / {totalPages}</span>
        <Button type="button" variant="outline" size="icon" aria-label={t("pagination.next")} disabled={loading || page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-7 w-7 rounded-full border-slate-200">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4" role="status" aria-live="polite">
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14 rounded-xl" />)}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600" aria-hidden="true" />
        {label}
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations("pages.controlCenter")
  return (
    <div className="flex h-full min-h-64 items-center justify-center p-6 text-center" role="alert">
      <div className="max-w-md">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <CircleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-900">{t("deliveryDialog.loadFailedTitle")}</p>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{message}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4 h-8 rounded-full border-slate-200 px-3 text-xs">
          <RefreshCw className="h-3.5 w-3.5 text-cyan-600" aria-hidden="true" />
          {t("common.retry")}
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center p-6 text-center" role="status">
      <div>
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <CircleDashed className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}
