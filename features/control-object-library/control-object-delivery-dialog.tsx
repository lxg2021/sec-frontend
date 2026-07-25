"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

const OPERATION_LABELS: Record<ControlObjectOperation | "unknown", string> = {
  apply: "应用",
  stop: "停止",
  remove: "移除",
  execute: "执行",
  unknown: "未知",
}

const EXECUTION_PRESENTATION: Record<ControlObjectExecutionStatus, {
  label: string
  icon: typeof Clock3
  iconClassName: string
}> = {
  pending: { label: "等待中", icon: Clock3, iconClassName: "text-sky-600" },
  accepted: { label: "已接收", icon: Clock3, iconClassName: "text-blue-600" },
  running: { label: "运行中", icon: LoaderCircle, iconClassName: "text-cyan-600" },
  success: { label: "成功", icon: CheckCircle2, iconClassName: "text-emerald-600" },
  failed: { label: "失败", icon: CircleAlert, iconClassName: "text-rose-600" },
  skipped: { label: "已跳过", icon: SkipForward, iconClassName: "text-slate-500" },
  canceled: { label: "已取消", icon: Ban, iconClassName: "text-amber-600" },
  unknown: { label: "未知", icon: CircleDashed, iconClassName: "text-slate-500" },
}

const AUDIT_EXECUTION_PRESENTATION: Record<DispatchExecutionStatus, {
  label: string
  icon: typeof Clock3
  iconClassName: string
}> = EXECUTION_PRESENTATION

function deliveryErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ""
  if (message === "PMC_OBJECT_AGENT_INVALID") {
    return "后台返回的主机状态与当前对象不一致，已停止展示。"
  }
  if (message === "PMC_OBJECT_AGENT_LIST_INVALID") {
    return "后台返回的主机状态列表格式不完整。"
  }
  if (message === "PMC_OBJECT_AGENT_STATISTICS_INVALID") {
    return "后台返回的主机统计与分页总数不一致。"
  }
  if (message === "PMC_OBJECT_OPERATION_INVALID") {
    return "后台返回了不属于当前对象的下发批次，已停止展示。"
  }
  if (message === "PMC_OBJECT_OPERATION_LIST_INVALID") {
    return "后台返回的下发历史列表格式不完整。"
  }
  return message || "数据加载失败，请稍后重试。"
}

function formatUnixMs(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "—"
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function formatIsoDate(value?: string) {
  if (!value) return "—"
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? formatUnixMs(timestamp) : "—"
}

function currentStateLabel(value: string) {
  const normalized = value.toLowerCase()
  if (normalized === "started" || normalized === "effective") return "已启动"
  if (normalized === "stopped") return "已停止"
  if (normalized === "removed") return "已移除"
  if (normalized === "none" || !normalized) return "未生效"
  return value
}

function simpleStatusLabel(value: string) {
  const normalized = value.toLowerCase()
  if (!normalized) return "—"
  if (normalized === "success" || normalized === "succeeded" || normalized === "completed") return "成功"
  if (normalized === "failed") return "失败"
  if (normalized === "pending") return "等待中"
  if (normalized === "accepted") return "已接收"
  if (normalized === "running") return "运行中"
  if (normalized === "published") return "已发布"
  if (normalized === "publishing") return "发布中"
  if (normalized === "canceled" || normalized === "cancelled") return "已取消"
  if (normalized === "skipped") return "已跳过"
  if (normalized === "unknown" || normalized === "uncertain") return "状态不确定"
  return value
}

function operationResult(operation: ControlObjectOperationSnapshot) {
  if (
    operation.pendingCount + operation.runningCount > 0
    || ["created", "pending", "planning", "materializing", "running"].includes(operation.status)
    || ["pending", "planning", "materializing"].includes(operation.planningStatus)
  ) {
    return { label: "进行中", status: "running" as const }
  }
  if (operation.uncertainCount > 0) {
    return { label: "状态不确定", status: "unknown" as const }
  }
  if (operation.failedCount > 0 && operation.successCount > 0) {
    return { label: "部分失败", status: "failed" as const }
  }
  if (operation.failedCount > 0) return { label: "失败", status: "failed" as const }
  if (operation.canceledCount > 0 && operation.successCount === 0) {
    return { label: "已取消", status: "canceled" as const }
  }
  if (operation.totalCount > 0 && operation.successCount + operation.skippedCount >= operation.totalCount) {
    return { label: operation.successCount > 0 ? "成功" : "已跳过", status: operation.successCount > 0 ? "success" as const : "skipped" as const }
  }
  if (["no_target", "empty"].includes(operation.outcome)) return { label: "无目标", status: "skipped" as const }
  if (["no_action", "skipped"].includes(operation.outcome)) return { label: "无需执行", status: "skipped" as const }
  if (operation.outcome === "partial") return { label: "部分成功", status: "unknown" as const }
  return { label: simpleStatusLabel(operation.outcome || operation.status), status: "unknown" as const }
}

export function ControlObjectDeliveryDialog({
  definition,
  onOpenChange,
}: {
  definition: ControlObjectDefinition | null
  onOpenChange: (open: boolean) => void
}) {
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
      setOverviewError(deliveryErrorMessage(error))
    } finally {
      if (sequence === overviewSequence.current) setOverviewLoading(false)
    }
  }, [definition, overviewPage])

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
      setOperationError(deliveryErrorMessage(error))
    } finally {
      if (sequence === operationSequence.current) setOperationLoading(false)
    }
  }, [definition, operationPage])

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
      setExecutionError(deliveryErrorMessage(error))
    } finally {
      if (sequence === executionSequence.current) setExecutionLoading(false)
    }
  }, [executionPage, selectedOperation])

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

  const overviewTabLabel = definition?.objectType === "command" ? "最近执行" : "当前应用"

  return (
    <Dialog open={Boolean(definition)} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-[2px]"
        className={cn(
          "flex h-[calc(100dvh-2rem)] max-h-[820px] w-[calc(100vw-1.5rem)] max-w-[1180px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:rounded-2xl",
          "[&>button]:right-4 [&>button]:top-3.5 [&>button]:z-20 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-slate-100 [&>button]:hover:text-slate-800 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-cyan-500",
        )}
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 pr-14 text-left sm:px-5 sm:pr-16">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <MonitorCog className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                应用情况
              </DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-xs text-slate-500">
                {definition ? `${definition.displayName} · 当前版本 ${definition.version}` : "查看对象运行态和历史下发批次"}
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
                下发历史
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
              刷新
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
  if (loading && result.items.length === 0) return <LoadingState label="正在读取对象运行态…" />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (!definition) return null

  const command = definition.objectType === "command"
  const statistics = result.statistics
  const metrics = command
    ? [
        { label: "执行主机", value: statistics.totalAgents, color: "text-blue-700" },
        { label: "成功", value: statistics.successCount, color: "text-emerald-700" },
        { label: "失败", value: statistics.failedCount, color: "text-rose-700" },
        { label: "等待 / 运行", value: statistics.pendingCount + statistics.runningCount, color: "text-cyan-700" },
        { label: "状态不确定", value: statistics.uncertainCount, color: "text-amber-700" },
        { label: "跳过 / 取消", value: statistics.skippedCount + statistics.canceledCount, color: "text-slate-700" },
      ]
    : [
        { label: "关联主机", value: statistics.totalAgents, color: "text-blue-700" },
        { label: "已生效", value: statistics.effectiveCount, color: "text-emerald-700" },
        { label: "已启动", value: statistics.startedCount, color: "text-cyan-700" },
        { label: "已停止", value: statistics.stoppedCount, color: "text-slate-700" },
        { label: "变更中", value: statistics.pendingCount + statistics.runningCount, color: "text-violet-700" },
        { label: "状态不确定", value: statistics.uncertainCount, color: "text-amber-700" },
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
            正在刷新
          </div>
        )}
        {result.items.length === 0 ? (
          <EmptyState label={command ? "这个命令还没有执行记录" : "这个对象尚未关联或应用到主机"} />
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
      <TableHeader labels={["Agent ID", "当前版本", "当前效果", "目标版本", "变更操作", "执行状态", "最后上报"]} />
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
              <td className="px-3 py-3 text-slate-700">{currentStateLabel(item.currentEffect?.currentState || "")}</td>
              <MonoCell value={change?.targetObjectVersion || "—"} />
              <td className="px-3 py-3 text-slate-700">{change ? OPERATION_LABELS[change.operation] : "—"}</td>
              <td className="px-3 py-3">
                {change
                  ? <ExecutionStatus status={change.executionStatus} />
                  : <span className="text-slate-600">{simpleStatusLabel(item.currentEffect?.applyState || "")}</span>}
              </td>
              <TimeCell value={formatUnixMs(lastReportAt)} />
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function CommandOverviewTable({ items }: { items: ControlObjectAgentOverview[] }) {
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
      <TableHeader labels={["Agent ID", "最近版本", "执行状态", "执行次数", "错误码", "错误信息", "最后上报"]} />
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
              <TimeCell value={formatUnixMs(execution?.lastReportAtUnixMs || execution?.updatedAtUnixMs || 0)} />
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
  if (loading && result.items.length === 0) return <LoadingState label="正在读取下发历史…" />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (result.items.length === 0) return <EmptyState label="这个对象还没有下发或执行记录" />

  return (
    <div className="flex h-full min-h-0 flex-col p-4 sm:px-5">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
        {loading && (
          <div className="absolute right-3 top-2.5 z-20 flex items-center gap-1.5 text-xs text-slate-500" role="status">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-600" aria-hidden="true" />
            正在刷新
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
            <TableHeader labels={["时间", "操作", "对象版本", "目标", "等待", "运行", "成功", "失败", "不确定", "跳过", "取消", "结果", "明细"]} centeredFrom={3} />
            <tbody className="divide-y divide-slate-100">
              {result.items.map((operation) => {
                const presentation = operationResult(operation)
                return (
                  <tr key={operation.operationId} className="hover:bg-cyan-50/30">
                    <TimeCell value={formatUnixMs(operation.createdAtUnixMs)} />
                    <td className="px-2 py-3 font-medium text-slate-700">{OPERATION_LABELS[operation.operation]}</td>
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
                        查看
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
  const result = useMemo(() => operationResult(operation), [operation])

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:px-5">
      <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={onBack} aria-label="返回下发历史" className="h-8 w-8 shrink-0 rounded-full border-slate-200">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{OPERATION_LABELS[operation.operation]}批次 · {result.label}</p>
            <p className="truncate font-mono text-[10px] text-slate-400" title={operation.operationId}>{operation.operationId}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 lg:w-[440px]">
          <MiniMetric label="目标" value={operation.totalCount} />
          <MiniMetric label="成功" value={operation.successCount} className="text-emerald-700" />
          <MiniMetric label="失败" value={operation.failedCount} className="text-rose-700" />
          <MiniMetric label="未完成" value={operation.pendingCount + operation.runningCount + operation.uncertainCount} className="text-amber-700" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
        {loading && items.length === 0 ? (
          <LoadingState label="正在读取 Agent 执行明细…" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : items.length === 0 ? (
          <EmptyState label="这个批次没有 Agent 执行明细" />
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
                <TableHeader labels={["Agent ID", "发布状态", "执行状态", "失败确定性", "最后上报", "完成时间", "错误码", "错误说明"]} />
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
  const certainty = item.executionStatus !== "failed"
    ? "—"
    : item.failureCertainty === "definitive"
      ? "确定失败"
      : item.failureCertainty === "uncertain"
        ? "状态不确定"
        : "—"
  const errorCode = item.errorCode || item.reasonCode || "—"
  const errorMessage = item.errorMessage || item.reasonMessage || "—"

  return (
    <tr className="hover:bg-cyan-50/30">
      <MonoCell value={item.agentId || "—"} />
      <td className="px-3 py-3 text-slate-700">{simpleStatusLabel(item.publishStatus)}</td>
      <td className="px-3 py-3"><AuditExecutionStatus status={item.executionStatus} /></td>
      <td className="px-3 py-3 text-slate-600">{certainty}</td>
      <TimeCell value={formatIsoDate(item.lastReportAt || item.updatedAt)} />
      <TimeCell value={formatIsoDate(item.finishedAt)} />
      <td className="px-3 py-3"><div className="truncate font-mono text-[11px] text-slate-600" title={errorCode}>{errorCode}</div></td>
      <td className="px-3 py-3"><div className="truncate text-slate-600" title={errorMessage}>{errorMessage}</div></td>
    </tr>
  )
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-center">
      <p className={cn("text-lg font-semibold tabular-nums", color)}>{value.toLocaleString("zh-CN")}</p>
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
  const presentation = EXECUTION_PRESENTATION[status]
  const Icon = presentation.icon
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", presentation.iconClassName, status === "running" && "animate-spin")} aria-hidden="true" />
      {label || presentation.label}
    </span>
  )
}

function AuditExecutionStatus({ status }: { status: DispatchExecutionStatus }) {
  const presentation = AUDIT_EXECUTION_PRESENTATION[status]
  const Icon = presentation.icon
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", presentation.iconClassName, status === "running" && "animate-spin")} aria-hidden="true" />
      {presentation.label}
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
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2">
      <span className="text-[11px] text-slate-500">{start}–{end} / {total}</span>
      <div className="flex items-center gap-1.5">
        <Button type="button" variant="outline" size="icon" aria-label="上一页" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)} className="h-7 w-7 rounded-full border-slate-200">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <span className="min-w-14 text-center text-[11px] tabular-nums text-slate-500">{page} / {totalPages}</span>
        <Button type="button" variant="outline" size="icon" aria-label="下一页" disabled={loading || page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-7 w-7 rounded-full border-slate-200">
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
  return (
    <div className="flex h-full min-h-64 items-center justify-center p-6 text-center" role="alert">
      <div className="max-w-md">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <CircleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-900">下发情况加载失败</p>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{message}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4 h-8 rounded-full border-slate-200 px-3 text-xs">
          <RefreshCw className="h-3.5 w-3.5 text-cyan-600" aria-hidden="true" />
          重试
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
