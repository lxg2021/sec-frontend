"use client"

import { type ComponentType, type ReactNode } from "react"
import {
  DatabaseZap,
  FileCode2,
  GitBranch,
  Loader2,
  RotateCcw,
  Route,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

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

interface RemediationExecutionBatchesPanelProps {
  className?: string
  detail: RemediationWorkflowDetail | null
  execution: RemediationExecutionSnapshot | null
  onRefreshExecutionStatus: () => void | Promise<void>
  onSelectBatch: (item: RemediationWorkflowStatsItem) => void | Promise<void>
  refreshingExecutionStatus?: boolean
  stats: RemediationWorkflowStats | null
}

export function RemediationExecutionBatchesPanel({
  className,
  detail,
  execution,
  onRefreshExecutionStatus,
  onSelectBatch,
  refreshingExecutionStatus = false,
  stats,
}: RemediationExecutionBatchesPanelProps) {
  const statsItems = stats?.items ?? []
  const latestItem = statsItems[0]
  const detailExecution = detail?.execution ?? execution

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            执行批次、目标明细与聚合回写
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            按 workflow_action_id 查询全部批次，按 execution_id 查看明细
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!latestItem || refreshingExecutionStatus}
          onClick={() => void onRefreshExecutionStatus()}
          className="rounded-xl border-slate-200"
        >
          {refreshingExecutionStatus ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          执行状态
        </Button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              QueryRemediationWorkflowStats
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-500">
              POST /workflow/remediation/stats/query
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] text-slate-400">summary</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-2xl font-semibold text-emerald-600">
                {statsTotal(stats)}
              </span>
              <span className="pb-1 text-xs text-slate-500">batches</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Targets" value={targetTotal(stats)} tone="blue" />
          <Metric
            label="Success"
            value={stats?.summary.execution_stats.success_count ?? 0}
            tone="green"
          />
          <Metric
            label="Failed"
            value={stats?.summary.execution_stats.failed_count ?? 0}
            tone="red"
          />
          <Metric
            label="Running"
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
          <div className="font-mono text-[11px] text-slate-400">
            preview_status / execute_status
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
                  onClick={() => void onSelectBatch(item)}
                  className={cn(
                    "grid w-full gap-3 px-4 py-3 text-left transition-colors duration-200 md:grid-cols-[98px_108px_1fr_96px_150px]",
                    active ? "bg-sky-50" : "hover:bg-slate-50",
                  )}
                >
                  <span className="truncate font-mono text-xs text-slate-700">
                    {item.preview_id}
                  </span>
                  <span className="truncate font-mono text-xs text-slate-700">
                    {item.execution_id || "-"}
                  </span>
                  <span className="truncate text-xs text-slate-600">
                    {item.source_type} · {item.scope_type}
                  </span>
                  <span>{statusBadge(item.execute_status || item.preview_status)}</span>
                  <span className="truncate font-mono text-[11px] text-slate-400">
                    {running ? "polling" : buildStatsSummary(item)}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="p-4">
              <EmptyState
                icon={DatabaseZap}
                title="暂无处置批次"
                description="创建 preview 并确认执行后，这里会按 workflow_action_id 汇总展示全部处置批次"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              QueryRemediationWorkflowDetail
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-500">
              POST /workflow/remediation/detail/query · execution_id=
              {detailExecution?.execution_id || "-"}
            </div>
          </div>
          {detailExecution ? statusBadge(detailExecution.execute_status) : null}
        </div>

        {detailExecution ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100 bg-white">
            <div className="grid grid-cols-[58px_110px_120px_116px_1fr] border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
              <span>target</span>
              <span>agent</span>
              <span>action_type</span>
              <span>status</span>
              <span>task / pmc object</span>
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
                    {target.action_type}
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
                error_msg:{" "}
                {detailExecution.targets.find((target) => target.error_msg)?.error_msg}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={FileCode2}
              title="未选择执行批次"
              description="选择已确认的 preview 或刷新执行状态后，这里显示 execution target 明细"
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <GitBranch className="size-4 text-emerald-600" />
            Aggregate Backwrite
          </div>
          <div className="mt-3 space-y-1.5 font-mono text-[11px] leading-5 text-slate-600">
            <div>Control outbox -&gt; Analysis</div>
            <div>SyncAttackWorkflowActionResult</div>
            <div>result_type=remediation</div>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Route className="size-4 text-amber-600" />
            Action Aggregation
          </div>
          <div className="mt-3 space-y-1.5 font-mono text-[11px] leading-5 text-slate-600">
            <div>workflow_action_id 全量 target 聚合</div>
            <div>any created/dispatched -&gt; running</div>
            <div>latest batch -&gt; success / failed / skipped</div>
          </div>
        </div>
      </div>
    </section>
  )
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
  return `${execution.success_count} success / ${execution.failed_count} failed / ${execution.skipped_count} skipped`
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
