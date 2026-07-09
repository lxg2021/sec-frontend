"use client"

import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import {
  DatabaseZap,
  FileCode2,
  GitBranch,
  ListChecks,
  Loader2,
  RotateCcw,
  Route,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

import {
  queryRemediationWorkflowDetail,
  queryRemediationWorkflowStats,
  queryRemediationWorkflowStatus,
} from "../api"
import type {
  RemediationExecutionSnapshot,
  RemediationWorkflowDetail,
  RemediationWorkflowStats,
  RemediationWorkflowStatsItem,
} from "../types"

const RUNNING_EXECUTION_STATUSES = new Set(["created", "dispatched"])

const STATUS_LABELS: Record<string, string> = {
  pending: "等待中",
  running: "运行中",
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
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  block: "阻断",
  bypass: "放行",
  composite: "清理",
  delete: "删除",
  disable: "禁用",
  enable: "启用",
  quarantine: "隔离",
  reset_password: "重置密码",
  restore: "恢复",
  terminate: "终止",
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  case_graph: "案件图谱",
  drill_graph: "溯源图谱",
  locate_graph: "定位图谱",
  manual: "手动创建",
}

const SCOPE_TYPE_LABELS: Record<string, string> = {
  case: "案件范围",
  positioning: "定位范围",
}

export interface RemediationExecutionBatchesData {
  detail: RemediationWorkflowDetail | null
  execution: RemediationExecutionSnapshot | null
  stats: RemediationWorkflowStats | null
}

interface RemediationExecutionBatchesPanelProps {
  caseId?: string
  className?: string
  enabled?: boolean
  endTime?: string
  fallbackDetail?: RemediationWorkflowDetail | null
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
  const [detail, setDetail] = useState<RemediationWorkflowDetail | null>(
    fallbackDetail,
  )
  const [execution, setExecution] = useState<RemediationExecutionSnapshot | null>(
    fallbackExecution,
  )
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
  const statsItems = stats?.items ?? []
  const latestItem = statsItems[0]
  const detailExecution = detail?.execution ?? execution
  const busy = loading || Boolean(working)
  const refreshingExecutionStatus =
    loading || working === "refresh-execution"

  const publishData = useCallback(
    (data: RemediationExecutionBatchesData) => {
      setStats(data.stats)
      setDetail(data.detail)
      setExecution(data.execution)
      onDataChange?.(data)
    },
    [onDataChange],
  )

  const queryStats = useCallback(async () => {
    return queryRemediationWorkflowStats({
      tenant_id: normalizedTenantId,
      workflow_action_id: normalizedWorkflowActionId,
      workflow_id: normalizedWorkflowId,
      case_id: normalizedCaseId,
      start_time: startTime,
      end_time: endTime,
      timezone,
    })
  }, [
    endTime,
    normalizedCaseId,
    normalizedTenantId,
    normalizedWorkflowActionId,
    normalizedWorkflowId,
    startTime,
    timezone,
  ])

  const loadBatches = useCallback(async () => {
    if (!enabled || !hasQueryContext) {
      setError("")
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
      const nextStats = await queryStats()
      const first = nextStats.items[0]
      if (first?.execution_id || first?.preview_id) {
        const nextDetail = await queryRemediationWorkflowDetail({
          tenant_id: normalizedTenantId,
          execution_id: first.execution_id,
          preview_id: first.execution_id ? undefined : first.preview_id,
        })
        publishData({
          detail: nextDetail,
          execution: nextDetail.execution,
          stats: nextStats,
        })
      } else {
        publishData({
          detail: null,
          execution: null,
          stats: nextStats,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "处置批次查询失败")
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
    hasQueryContext,
    normalizedTenantId,
    publishData,
    queryStats,
  ])

  useEffect(() => {
    void loadBatches()
  }, [loadBatches, refreshKey])

  const handleSelectBatch = useCallback(
    async (item: RemediationWorkflowStatsItem) => {
      if (!enabled || !hasQueryContext) {
        publishData({
          detail: fallbackDetail,
          execution: fallbackExecution,
          stats: fallbackStats,
        })
        return
      }

      setWorking(`detail-${item.preview_id}`)
      setError("")
      try {
        const nextDetail = await queryRemediationWorkflowDetail({
          tenant_id: normalizedTenantId,
          execution_id: item.execution_id,
          preview_id: item.execution_id ? undefined : item.preview_id,
        })
        publishData({
          detail: nextDetail,
          execution: nextDetail.execution,
          stats,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "批次详情查询失败")
      } finally {
        setWorking("")
      }
    },
    [
      enabled,
      fallbackDetail,
      fallbackExecution,
      fallbackStats,
      hasQueryContext,
      normalizedTenantId,
      publishData,
      stats,
    ],
  )

  const handleRefreshExecutionStatus = useCallback(async () => {
    if (!enabled || !hasQueryContext) {
      publishData({
        detail: fallbackDetail,
        execution: fallbackExecution,
        stats: fallbackStats,
      })
      return
    }

    const executionId = detailExecution?.execution_id || latestItem?.execution_id
    const previewId = detail?.preview_id || latestItem?.preview_id
    if (!executionId && !previewId) {
      await loadBatches()
      return
    }

    setWorking("refresh-execution")
    setError("")
    try {
      const nextExecution = await queryRemediationWorkflowStatus({
        tenant_id: normalizedTenantId,
        execution_id: executionId,
        preview_id: executionId ? undefined : previewId,
      })
      const [nextStats, nextDetail] = await Promise.all([
        queryStats(),
        nextExecution?.execution_id
          ? queryRemediationWorkflowDetail({
              tenant_id: normalizedTenantId,
              execution_id: nextExecution.execution_id,
            })
          : previewId
            ? queryRemediationWorkflowDetail({
                tenant_id: normalizedTenantId,
                preview_id: previewId,
              })
            : Promise.resolve(null),
      ])
      publishData({
        detail: nextDetail,
        execution: nextDetail?.execution ?? nextExecution,
        stats: nextStats,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行状态刷新失败")
    } finally {
      setWorking("")
    }
  }, [
    detail?.preview_id,
    detailExecution?.execution_id,
    enabled,
    fallbackDetail,
    fallbackExecution,
    fallbackStats,
    hasQueryContext,
    latestItem?.execution_id,
    latestItem?.preview_id,
    loadBatches,
    normalizedTenantId,
    publishData,
    queryStats,
  ])

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600">
            <ListChecks className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">
              处置结果
            </h2>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!latestItem || busy}
          onClick={() => void handleRefreshExecutionStatus()}
          className="rounded-xl border-slate-200"
        >
          {refreshingExecutionStatus ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          刷新状态
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              处置执行概览
            </div>
            <div className="mt-1 text-xs text-slate-500">
              汇总当前处置阶段下所有批次和目标的执行结果
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] text-slate-400">批次总数</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-2xl font-semibold text-emerald-600">
                {statsTotal(stats)}
              </span>
              <span className="pb-1 text-xs text-slate-500">批</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="目标数" value={targetTotal(stats)} tone="blue" />
          <Metric
            label="成功"
            value={stats?.summary.execution_stats.success_count ?? 0}
            tone="green"
          />
          <Metric
            label="失败"
            value={stats?.summary.execution_stats.failed_count ?? 0}
            tone="red"
          />
          <Metric
            label="执行中"
            value={
              (stats?.summary.execution_stats.created_count ?? 0) +
              (stats?.summary.execution_stats.dispatched_count ?? 0)
            }
            tone="amber"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">处置批次列表</div>
          <div className="text-xs text-slate-400">
            预览状态 / 执行状态
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {statsItems.length > 0 ? (
            statsItems.map((item) => {
              const active =
                item.execution_id === detailExecution?.execution_id ||
                item.preview_id === detail?.preview_id
              const running = RUNNING_EXECUTION_STATUSES.has(item.execute_status)
              return (
                <button
                  type="button"
                  key={item.preview_id}
                  onClick={() => void handleSelectBatch(item)}
                  disabled={working.startsWith("detail-")}
                  className={cn(
                    "grid w-full gap-3 px-4 py-3 text-left transition-colors duration-200 md:grid-cols-[98px_108px_1fr_96px_150px]",
                    active ? "bg-sky-50" : "hover:bg-slate-50",
                    working.startsWith("detail-") && "cursor-wait opacity-80",
                  )}
                >
                  <span className="truncate font-mono text-xs text-slate-700">
                    {batchLabel(item.preview_id)}
                  </span>
                  <span className="truncate font-mono text-xs text-slate-700">
                    {executionLabel(item.execution_id)}
                  </span>
                  <span className="truncate text-xs text-slate-600">
                    {sourceScopeLabel(item)}
                  </span>
                  <span>{statusBadge(item.execute_status || item.preview_status)}</span>
                  <span className="truncate text-xs text-slate-500">
                    {running ? "状态同步中" : buildStatsSummary(item)}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="p-4">
              <EmptyState
                icon={DatabaseZap}
                title="暂无处置批次"
                description="创建处置计划并确认执行后，这里会汇总展示全部处置批次"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              目标执行明细
            </div>
            <div className="mt-1 text-xs text-slate-500">
              当前批次：{executionLabel(detailExecution?.execution_id || "")}
            </div>
          </div>
          {detailExecution ? statusBadge(detailExecution.execute_status) : null}
        </div>

        {detailExecution ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100 bg-white">
            <div className="grid grid-cols-[58px_110px_120px_116px_1fr] border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
              <span>序号</span>
              <span>终端</span>
              <span>动作</span>
              <span>结果</span>
              <span>下发对象</span>
            </div>
            <div className="divide-y divide-slate-100">
              {detailExecution.targets.map((target) => (
                <div
                  key={`${target.target_index}-${target.agent_id}-${target.action_type}`}
                  className="grid grid-cols-[58px_110px_120px_116px_1fr] items-center px-3 py-3 text-xs"
                >
                  <span className="font-mono text-slate-700">
                    #{target.target_index}
                  </span>
                  <span className="truncate font-mono text-slate-600">
                    {target.agent_id}
                  </span>
                  <span className="truncate font-mono text-slate-600">
                    {actionTypeLabel(target.action_type)}
                  </span>
                  <span>{statusBadge(target.execute_status)}</span>
                  <span
                    className="truncate font-mono text-slate-500"
                    title={
                      target.execute_task_id ||
                      target.pmc_object_id ||
                      target.error_msg
                    }
                  >
                    {target.execute_task_id ||
                      target.pmc_object_id ||
                      target.error_msg ||
                      "-"}
                  </span>
                </div>
              ))}
            </div>
            {detailExecution.targets.some((target) => target.error_msg) ? (
              <div className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                失败原因：{" "}
                {detailExecution.targets.find((target) => target.error_msg)?.error_msg}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={FileCode2}
              title="未选择执行批次"
              description="选择一个处置批次或刷新状态后，这里会显示目标执行明细"
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <GitBranch className="size-4 text-emerald-600" />
            工作流回写
          </div>
          <div className="mt-3 space-y-1.5 text-xs leading-5 text-slate-600">
            <div>控制服务收到执行结果后回写分析服务</div>
            <div>按处置阶段汇总目标执行状态</div>
            <div>用于更新工作流的处置阶段状态</div>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Route className="size-4 text-amber-600" />
            状态判定
          </div>
          <div className="mt-3 space-y-1.5 text-xs leading-5 text-slate-600">
            <div>存在待执行或已下发目标时，处置阶段保持执行中</div>
            <div>任一目标失败时，处置阶段标记为失败</div>
            <div>目标全部成功或跳过时，处置阶段标记为完成</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function shortId(value: string) {
  const normalized = value.trim()
  if (!normalized) return "-"
  const suffix = normalized.match(/([a-z]*-)?(\d{3,})$/i)?.[2]
  if (suffix) return suffix
  if (normalized.length <= 12) return normalized
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`
}

function batchLabel(previewId: string) {
  return previewId ? `批次 ${shortId(previewId)}` : "批次 -"
}

function executionLabel(executionId: string) {
  return executionId ? `执行 ${shortId(executionId)}` : "未执行"
}

function statsTotal(stats: RemediationWorkflowStats | null) {
  return stats?.summary.preview_stats.total_count ?? 0
}

function targetTotal(stats: RemediationWorkflowStats | null) {
  return stats?.summary.execution_stats.total_count ?? 0
}

function buildStatsSummary(item: RemediationWorkflowStatsItem) {
  const execution = item.stats.execution_stats
  if (!item.execution_id) return "未确认执行"
  return `成功 ${execution.success_count} / 失败 ${execution.failed_count} / 跳过 ${execution.skipped_count}`
}

function sourceScopeLabel(item: RemediationWorkflowStatsItem) {
  const source = SOURCE_TYPE_LABELS[item.source_type] ?? item.source_type
  const scope = SCOPE_TYPE_LABELS[item.scope_type] ?? item.scope_type
  return [source, scope].filter(Boolean).join(" · ") || "-"
}

function actionTypeLabel(actionType: string) {
  const normalized = actionType.trim().toLowerCase()
  return ACTION_TYPE_LABELS[normalized] ?? (actionType || "-")
}

function statusLabel(status: string | number | undefined) {
  const normalized =
    typeof status === "number"
      ? String(status)
      : String(status ?? "").trim().toLowerCase()
  return STATUS_LABELS[normalized] ?? String(status ?? "-")
}

function statusTone(status: string | number | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase()
  if (["success", "ready", "confirmed", "confirmed_preview"].includes(normalized)) {
    return "emerald"
  }
  if (["failed", "blocked", "canceled", "expired"].includes(normalized)) {
    return "red"
  }
  if (["created", "dispatched", "running", "pending"].includes(normalized)) {
    return "amber"
  }
  if (["skipped"].includes(normalized)) return "slate"
  return "blue"
}

function toneClasses(tone: string) {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "red":
      return "border-red-200 bg-red-50 text-red-700"
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "slate":
      return "border-slate-200 bg-slate-50 text-slate-600"
    default:
      return "border-sky-200 bg-sky-50 text-sky-700"
  }
}

function statusBadge(status: string | number | undefined, className?: string) {
  const tone = statusTone(status)
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px] font-medium",
        toneClasses(tone),
        className,
      )}
    >
      {statusLabel(status)}
    </Badge>
  )
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string
  value: ReactNode
  tone?: "slate" | "green" | "red" | "amber" | "blue"
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "amber"
          ? "text-amber-600"
          : tone === "blue"
            ? "text-sky-600"
            : "text-slate-900"
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", valueClass)}>
        {value}
      </div>
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
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <Icon className="size-8 text-slate-300" />
      <div className="mt-3 text-sm font-medium text-slate-700">{title}</div>
      <div className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </div>
    </div>
  )
}
