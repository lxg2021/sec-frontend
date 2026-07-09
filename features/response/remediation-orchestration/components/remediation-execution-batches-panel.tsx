"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DatabaseZap,
  FileCode2,
  Layers3,
  ListChecks,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import {
  getRemediationExecutionResult,
  getRemediationPreviewDetail,
  listRemediationPreviews,
  queryRemediationWorkflowStats,
} from "../api"
import type {
  RemediationExecutionSnapshot,
  RemediationPreviewList,
  RemediationPreviewListItem,
  RemediationPreviewTargetSnapshot,
  RemediationPreviewDetail,
  RemediationWorkflowStats,
} from "../types"

const PAGE_SIZE = 6

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  running: "执行中",
  success: "成功",
  failed: "失败",
  skipped: "已跳过",
  created: "已创建",
  dispatched: "已下发",
  confirmed: "已确认",
  confirmed_preview: "已确认",
  canceled: "已取消",
  expired: "已过期",
  ready: "就绪",
  blocked: "阻断",
  unresolved: "未解析",
  valid: "有效",
  available: "可执行",
  partial: "部分可执行",
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  block: "阻断",
  bypass: "放行",
  composite: "清理",
  delete: "删除",
  disable: "禁用",
  enable: "启用",
  file_quarantine: "文件隔离",
  net_block: "网络阻断",
  process_terminate: "进程终止",
  quarantine: "隔离",
  reset_password: "重置密码",
  restore: "恢复",
  terminate: "终止",
}

export interface RemediationExecutionBatchesData {
  detail: RemediationPreviewDetail | null
  execution: RemediationExecutionSnapshot | null
  stats: RemediationWorkflowStats | null
}

interface RemediationExecutionBatchesPanelProps {
  caseId?: string
  className?: string
  enabled?: boolean
  endTime?: string
  fallbackDetail?: RemediationPreviewDetail | null
  fallbackExecution?: RemediationExecutionSnapshot | null
  fallbackStats?: RemediationWorkflowStats | null
  onDataChange?: (data: RemediationExecutionBatchesData) => void
  refreshKey?: number | string
  startTime?: string
  tenantId?: string
  timezone?: string
  workflowActionId?: string
  workflowId?: string
}

export function RemediationExecutionBatchesPanel({
  caseId = "",
  className,
  enabled = true,
  endTime = "",
  fallbackDetail = null,
  fallbackExecution = null,
  fallbackStats = null,
  onDataChange,
  refreshKey = 0,
  startTime = "",
  tenantId = "",
  timezone = "Asia/Shanghai",
  workflowActionId = "",
  workflowId = "",
}: RemediationExecutionBatchesPanelProps) {
  const [stats, setStats] = useState<RemediationWorkflowStats | null>(
    fallbackStats,
  )
  const [previewList, setPreviewList] = useState<RemediationPreviewList | null>(
    () => fallbackListFromStats(fallbackStats, fallbackDetail),
  )
  const [detail, setDetail] = useState<RemediationPreviewDetail | null>(
    fallbackDetail,
  )
  const [execution, setExecution] = useState<RemediationExecutionSnapshot | null>(
    fallbackExecution,
  )
  const [selectedPreviewId, setSelectedPreviewId] = useState(
    fallbackDetail?.preview_id || "",
  )
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState("")
  const [error, setError] = useState("")

  const normalizedTenantId = tenantId.trim()
  const normalizedWorkflowActionId = workflowActionId.trim()
  const normalizedWorkflowId = workflowId.trim()
  const normalizedCaseId = caseId.trim()
  const hasQueryContext = Boolean(
    normalizedWorkflowActionId || normalizedWorkflowId || normalizedCaseId,
  )

  const listItems = previewList?.items ?? []
  const selectedItem = listItems.find((item) => item.preview_id === selectedPreviewId)
  const detailExecution = execution ?? detail?.execution ?? null
  const summary = previewList
    ? {
        preview: previewList.preview_summary,
        target: previewList.target_summary,
      }
    : {
        preview: stats?.summary.preview_stats,
        target: stats?.summary.execution_stats,
      }
  const targetTotal =
    summary.target?.total_count ||
    detail?.preview_target_summary.total_count ||
    selectedItem?.preview_target_summary.total_count ||
    0
  const busyTargetCount =
    (summary.target?.created_count ?? 0) +
    (summary.target?.dispatched_count ?? 0) +
    (summary.target?.running_count ?? 0)
  const busy = loading || Boolean(working)
  const canGoPrev = (previewList?.page.page ?? page) > 1 && !busy
  const canGoNext = Boolean(previewList?.page.has_next) && !busy

  const publishData = useCallback(
    (data: RemediationExecutionBatchesData) => {
      setStats(data.stats)
      setDetail(data.detail)
      setExecution(data.execution)
      onDataChange?.(data)
    },
    [onDataChange],
  )

  const queryScope = useMemo(
    () => ({
      tenant_id: normalizedTenantId,
      workflow_action_id: normalizedWorkflowActionId,
      workflow_id: normalizedWorkflowId,
      case_id: normalizedCaseId,
      start_time: startTime,
      end_time: endTime,
      timezone,
    }),
    [
      endTime,
      normalizedCaseId,
      normalizedTenantId,
      normalizedWorkflowActionId,
      normalizedWorkflowId,
      startTime,
      timezone,
    ],
  )

  const fetchBatchDetail = useCallback(
    async (item: RemediationPreviewListItem | null) => {
      if (!item?.preview_id) {
        return {
          detail: null,
          execution: null,
        }
      }

      const [nextDetail, nextExecution] = await Promise.all([
        getRemediationPreviewDetail({
          tenant_id: normalizedTenantId,
          preview_id: item.preview_id,
        }),
        item.execution_id
          ? getRemediationExecutionResult({
              tenant_id: normalizedTenantId,
              execution_id: item.execution_id,
            })
          : Promise.resolve(null),
      ])

      return {
        detail: nextDetail,
        execution: nextExecution ?? nextDetail.execution,
      }
    },
    [normalizedTenantId],
  )

  const loadBatches = useCallback(async () => {
    if (!enabled || !hasQueryContext) {
      setError("")
      const fallbackList = fallbackListFromStats(fallbackStats, fallbackDetail)
      setPreviewList(fallbackList)
      setSelectedPreviewId(fallbackDetail?.preview_id || fallbackList?.items[0]?.preview_id || "")
      publishData({
        detail: fallbackDetail,
        execution: fallbackExecution,
        stats: fallbackStats,
      })
      return
    }

    setLoading(true)
    setError("")
    try {
      const [nextStats, nextList] = await Promise.all([
        queryRemediationWorkflowStats(queryScope),
        listRemediationPreviews({
          ...queryScope,
          page,
          page_size: PAGE_SIZE,
        }),
      ])
      const first = nextList.items[0] ?? null
      const nextSelection = first?.preview_id ?? ""
      setPreviewList(nextList)
      setSelectedPreviewId(nextSelection)

      const nextDetail = await fetchBatchDetail(first)
      publishData({
        detail: nextDetail.detail,
        execution: nextDetail.execution,
        stats: nextStats,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "处置结果查询失败")
      const fallbackList = fallbackListFromStats(fallbackStats, fallbackDetail)
      setPreviewList(fallbackList)
      setSelectedPreviewId(fallbackDetail?.preview_id || fallbackList?.items[0]?.preview_id || "")
      publishData({
        detail: fallbackDetail,
        execution: fallbackExecution,
        stats: fallbackStats,
      })
    } finally {
      setLoading(false)
    }
  }, [
    enabled,
    fallbackDetail,
    fallbackExecution,
    fallbackStats,
    fetchBatchDetail,
    hasQueryContext,
    page,
    publishData,
    queryScope,
  ])

  useEffect(() => {
    void loadBatches()
  }, [loadBatches, refreshKey])

  const handleSelectBatch = useCallback(
    async (item: RemediationPreviewListItem) => {
      if (!enabled || !hasQueryContext) {
        return
      }

      setWorking(`detail-${item.preview_id}`)
      setError("")
      setSelectedPreviewId(item.preview_id)
      try {
        const nextDetail = await fetchBatchDetail(item)
        publishData({
          detail: nextDetail.detail,
          execution: nextDetail.execution,
          stats,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "批次详情查询失败")
      } finally {
        setWorking("")
      }
    },
    [enabled, fetchBatchDetail, hasQueryContext, publishData, stats],
  )

  const handleRefresh = useCallback(async () => {
    setWorking("refresh")
    try {
      await loadBatches()
    } finally {
      setWorking("")
    }
  }, [loadBatches])

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
            <ListChecks className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">处置结果</h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              按处置批次查看预览目标与执行结果
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={() => void handleRefresh()}
          className="size-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="刷新处置结果"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
        </Button>
      </div>

      {error ? (
        <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 border-b border-slate-100 sm:grid-cols-5">
        <Metric
          icon={Layers3}
          label="批次"
          value={summary.preview?.total_count ?? 0}
          tone="blue"
        />
        <Metric
          icon={Target}
          label="目标"
          value={targetTotal}
          tone="slate"
        />
        <Metric
          icon={Clock3}
          label="处理中"
          value={busyTargetCount}
          tone="amber"
        />
        <Metric
          icon={CheckCircle2}
          label="成功"
          value={summary.target?.success_count ?? 0}
          tone="green"
        />
        <Metric
          icon={XCircle}
          label="失败"
          value={summary.target?.failed_count ?? 0}
          tone="red"
        />
      </div>

      <div className="grid min-h-0 flex-1 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-h-0 border-b border-slate-100 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-950">批次列表</div>
              <div className="mt-0.5 text-xs text-slate-400">
                {previewList?.page.total ?? listItems.length} 条记录
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!canGoPrev}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="size-8 rounded-lg"
                aria-label="上一页"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-8 text-center font-mono text-xs text-slate-500">
                {previewList?.page.page ?? page}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
                className="size-8 rounded-lg"
                aria-label="下一页"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 px-3 pb-4">
            {listItems.length > 0 ? (
              listItems.map((item) => (
                <BatchButton
                  key={item.preview_id}
                  active={item.preview_id === selectedPreviewId}
                  disabled={working.startsWith("detail-")}
                  item={item}
                  onClick={() => void handleSelectBatch(item)}
                />
              ))
            ) : (
              <EmptyState
                icon={DatabaseZap}
                title="暂无处置批次"
                description="创建并确认处置预览后，这里会展示处置结果"
              />
            )}
          </div>
        </aside>

        <div className="min-w-0 p-4">
          {selectedItem ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-950">
                      批次 {shortId(selectedItem.preview_id)}
                    </span>
                    {statusChip(selectedItem.execute_status || selectedItem.preview_status)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>预览 {formatDateTime(selectedItem.created_at)}</span>
                    <span>
                      执行 {selectedItem.confirmed_at ? formatDateTime(selectedItem.confirmed_at) : "未确认"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MiniFact label="案件" value={selectedItem.case_id || normalizedCaseId || "-"} />
                  <MiniFact
                    label="目标"
                    value={String(
                      selectedItem.target_summary.total_count ||
                        selectedItem.preview_target_summary.total_count ||
                        0,
                    )}
                  />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileCode2}
              title="未选择批次"
              description="选择左侧批次后查看目标与执行明细"
            />
          )}

          <div className="mt-4 grid gap-4 2xl:grid-cols-2">
            <ResultBlock
              title="预览目标"
              description={`${detail?.preview_targets.length ?? 0} 个目标`}
            >
              <TargetTable
                targets={detail?.preview_targets ?? []}
                loading={loading || working.startsWith("detail-")}
              />
            </ResultBlock>

            <ResultBlock
              title="执行结果"
              description={detailExecution ? `${detailExecution.targets.length} 个目标` : "未执行"}
            >
              <ExecutionTable
                execution={detailExecution}
                loading={loading || working.startsWith("detail-")}
              />
            </ResultBlock>
          </div>
        </div>
      </div>
    </section>
  )
}

function BatchButton({
  active,
  disabled,
  item,
  onClick,
}: {
  active: boolean
  disabled: boolean
  item: RemediationPreviewListItem
  onClick: () => void
}) {
  const targetCount =
    item.target_summary.total_count || item.preview_target_summary.total_count || 0
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl px-3 py-3 text-left transition-colors duration-200",
        active
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-700 hover:bg-slate-100",
        disabled && "cursor-wait opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              "truncate text-sm font-semibold",
              active ? "text-white" : "text-slate-950",
            )}
          >
            批次 {shortId(item.preview_id)}
          </div>
          <div
            className={cn(
              "mt-1 truncate text-xs",
              active ? "text-slate-300" : "text-slate-500",
            )}
          >
            {actionTypeLabel(item.action_type)} · {targetCount} 个目标
          </div>
        </div>
        {statusDot(item.execute_status || item.preview_status, active)}
      </div>
      <div
        className={cn(
          "mt-3 flex items-center justify-between text-[11px]",
          active ? "text-slate-300" : "text-slate-400",
        )}
      >
        <span>{formatShortTime(item.created_at)}</span>
        <span>{item.execution_id ? "已执行" : "待确认"}</span>
      </div>
    </button>
  )
}

function TargetTable({
  targets,
  loading,
}: {
  targets: RemediationPreviewTargetSnapshot[]
  loading: boolean
}) {
  if (loading) {
    return <SkeletonRows />
  }
  if (targets.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="暂无预览目标"
        description="生成预览后会展示本次解析出的目标"
      />
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <div className="grid grid-cols-[42px_minmax(76px,0.8fr)_minmax(120px,1.4fr)_70px_76px] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
        <span>#</span>
        <span>终端</span>
        <span>目标对象</span>
        <span className="text-center">执行</span>
        <span className="text-center">校验</span>
      </div>
      <div className="divide-y divide-slate-100">
        {targets.map((target) => (
          <div
            key={`${target.target_index}-${target.agent_id}-${target.target_key}`}
            className="grid grid-cols-[42px_minmax(76px,0.8fr)_minmax(120px,1.4fr)_70px_76px] items-center gap-2 px-3 py-3 text-xs"
          >
            <span className="font-mono text-[11px] text-slate-400">
              {target.target_index}
            </span>
            <span className="truncate font-mono text-[11px] text-slate-600">
              {target.agent_id || "-"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs text-slate-700">
                {target.target_display || target.target_key || "-"}
              </span>
              <span className="mt-1 block truncate text-[11px] text-slate-400">
                {target.dedupe_reason || "本次目标"}
              </span>
            </span>
            <span className="flex justify-center">
              {statusChip(target.will_apply ? "ready" : "skipped")}
            </span>
            <span className="flex justify-center">
              {statusChip(target.validation_status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExecutionTable({
  execution,
  loading,
}: {
  execution: RemediationExecutionSnapshot | null
  loading: boolean
}) {
  if (loading) {
    return <SkeletonRows />
  }
  if (!execution || execution.targets.length === 0) {
    return (
      <EmptyState
        icon={FileCode2}
        title="暂无执行结果"
        description="确认执行后会展示各终端的处置结果"
      />
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <div className="grid grid-cols-[42px_minmax(76px,0.75fr)_minmax(86px,0.8fr)_76px_minmax(118px,1.3fr)] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
        <span>#</span>
        <span>终端</span>
        <span>动作</span>
        <span className="text-center">状态</span>
        <span>结果</span>
      </div>
      <div className="divide-y divide-slate-100">
        {execution.targets.map((target) => (
          <div
            key={`${target.target_index}-${target.agent_id}-${target.action_type}`}
            className="grid grid-cols-[42px_minmax(76px,0.75fr)_minmax(86px,0.8fr)_76px_minmax(118px,1.3fr)] items-center gap-2 px-3 py-3 text-xs"
          >
            <span className="font-mono text-[11px] text-slate-400">
              {target.target_index}
            </span>
            <span className="truncate font-mono text-[11px] text-slate-600">
              {target.agent_id || "-"}
            </span>
            <span className="truncate text-xs text-slate-700">
              {actionTypeLabel(target.action_type)}
            </span>
            <span className="flex justify-center">
              {statusChip(target.execute_status)}
            </span>
            <span
              className="truncate text-[11px] text-slate-500"
              title={
                target.error_msg ||
                target.execute_task_id ||
                target.pmc_object_id ||
                target.target_key
              }
            >
              {target.error_msg ||
                target.execute_task_id ||
                target.pmc_object_id ||
                target.target_key ||
                "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">{title}</div>
          <div className="mt-0.5 text-xs text-slate-400">{description}</div>
        </div>
      </div>
      {children}
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  tone?: "slate" | "green" | "red" | "amber" | "blue"
}) {
  return (
    <div className="min-w-0 border-r border-slate-100 px-4 py-3 last:border-r-0">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", metricTone(tone))}>
          <Icon className="size-3.5" />
        </span>
        <span className="truncate text-xs text-slate-400">{label}</span>
      </div>
      <div className="mt-2 font-mono text-xl font-semibold tabular-nums text-slate-950">
        {value}
      </div>
    </div>
  )
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-full bg-white px-3 py-1.5 text-xs ring-1 ring-slate-200">
      <span className="text-slate-400">{label}</span>
      <span className="ml-2 font-mono text-slate-700" title={value}>
        {shortReadable(value)}
      </span>
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-2xl bg-slate-50"
        />
      ))}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <Icon className="size-8 text-slate-300" />
      <div className="mt-3 text-sm font-medium text-slate-700">{title}</div>
      <div className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </div>
    </div>
  )
}

function statusChip(status: string | number | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase()
  const tone = statusTone(normalized)
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium",
        chipTone(tone),
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotTone(tone))} />
      {statusLabel(normalized)}
    </span>
  )
}

function statusDot(status: string | number | undefined, inverted = false) {
  const tone = statusTone(String(status ?? "").trim().toLowerCase())
  return (
    <span
      className={cn(
        "mt-1 size-2.5 shrink-0 rounded-full",
        inverted ? "bg-white/70" : dotTone(tone),
      )}
      aria-label={statusLabel(status)}
      title={statusLabel(status)}
    />
  )
}

function statusLabel(status: string | number | undefined) {
  const normalized =
    typeof status === "number"
      ? String(status)
      : String(status ?? "").trim().toLowerCase()
  return STATUS_LABELS[normalized] ?? String(status ?? "-")
}

function statusTone(status: string) {
  if (["success", "ready", "confirmed", "valid", "available"].includes(status)) {
    return "emerald"
  }
  if (["failed", "blocked", "canceled", "expired"].includes(status)) {
    return "red"
  }
  if (["created", "dispatched", "running", "pending", "partial"].includes(status)) {
    return "amber"
  }
  if (["skipped"].includes(status)) return "slate"
  return "blue"
}

function chipTone(tone: string) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700"
    case "red":
      return "bg-red-50 text-red-700"
    case "amber":
      return "bg-amber-50 text-amber-700"
    case "slate":
      return "bg-slate-100 text-slate-600"
    default:
      return "bg-sky-50 text-sky-700"
  }
}

function dotTone(tone: string) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500"
    case "red":
      return "bg-red-500"
    case "amber":
      return "bg-amber-500"
    case "slate":
      return "bg-slate-400"
    default:
      return "bg-sky-500"
  }
}

function metricTone(tone: string) {
  switch (tone) {
    case "green":
      return "bg-emerald-50 text-emerald-600"
    case "red":
      return "bg-red-50 text-red-600"
    case "amber":
      return "bg-amber-50 text-amber-600"
    case "blue":
      return "bg-sky-50 text-sky-600"
    default:
      return "bg-slate-50 text-slate-600"
  }
}

function actionTypeLabel(actionType: string | number | undefined) {
  const normalized = String(actionType ?? "").trim().toLowerCase()
  return ACTION_TYPE_LABELS[normalized] ?? (normalized || "处置动作")
}

function shortId(value: string) {
  const normalized = value.trim()
  if (!normalized) return "-"
  const suffix = normalized.match(/([a-z]*-)?(\d{3,})$/i)?.[2]
  if (suffix) return suffix
  if (normalized.length <= 12) return normalized
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`
}

function shortReadable(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized === "-") return "-"
  if (normalized.length <= 16) return normalized
  return `${normalized.slice(0, 10)}...${normalized.slice(-4)}`
}

function formatShortTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function fallbackListFromStats(
  stats: RemediationWorkflowStats | null,
  detail: RemediationPreviewDetail | null,
): RemediationPreviewList | null {
  if (!stats && !detail) return null
  const items = detail ? [detailToPreviewListItem(detail)] : []
  return {
    tenant_id: stats?.tenant_id ?? detail?.tenant_id ?? "",
    start_time: stats?.start_time ?? "",
    end_time: stats?.end_time ?? "",
    timezone: stats?.timezone ?? "Asia/Shanghai",
    preview_summary: stats?.summary.preview_stats ?? {
      total_count: items.length,
      created_count: 0,
      confirmed_count: detail?.preview?.preview_status === "confirmed" ? 1 : 0,
      canceled_count: detail?.preview?.preview_status === "canceled" ? 1 : 0,
      expired_count: detail?.preview?.preview_status === "expired" ? 1 : 0,
    },
    target_summary: stats?.summary.execution_stats ??
      detail?.target_summary ?? {
        total_count: 0,
        created_count: 0,
        dispatched_count: 0,
        running_count: 0,
        success_count: 0,
        failed_count: 0,
        skipped_count: 0,
      },
    items,
    page: {
      page: 1,
      page_size: items.length || PAGE_SIZE,
      total: items.length,
      has_next: false,
    },
  }
}

function detailToPreviewListItem(
  detail: RemediationPreviewDetail,
): RemediationPreviewListItem {
  const preview = detail.preview
  return {
    tenant_id: detail.tenant_id,
    preview_id: detail.preview_id,
    execution_id: detail.execution_id,
    workflow_id: preview?.workflow_id ?? "",
    workflow_action_id: preview?.workflow_action_id ?? "",
    case_id: preview?.case_id ?? "",
    source_request_id: preview?.source_request_id ?? "",
    preview_status: preview?.preview_status ?? "",
    execute_status: detail.execution?.execute_status ?? "",
    source_type: preview?.source_type ?? "",
    scope_type: preview?.scope_type ?? "",
    scope_id: preview?.scope_id ?? "",
    target_type: preview?.target_type ?? "",
    action_type: preview?.action_type ?? "",
    plan_status: preview?.plan_status ?? "",
    created_at: preview?.created_at ?? "",
    confirmed_at: "",
    expires_at: preview?.expires_at ?? "",
    preview_target_summary: detail.preview_target_summary,
    target_summary: detail.target_summary,
  }
}
