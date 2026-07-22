"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Ban,
  CircleAlert,
  CircleCheck,
  Clock3,
  LoaderCircle,
  Monitor,
  RefreshCw,
  SkipForward,
} from "lucide-react"
import { listDispatchExecutionResults } from "@/features/audit/api"
import type { DispatchAuditEvent, DispatchExecutionResult, DispatchExecutionStatus } from "@/features/audit/types"
import { auditResultLabels, dispatchTypeLabels } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

interface AuditEventDetailProps {
  event?: DispatchAuditEvent
  open: boolean
  onClose: () => void
}

const executionStatusLabels: Record<DispatchExecutionStatus, string> = {
  pending: "待执行",
  accepted: "已接收",
  running: "执行中",
  success: "成功",
  failed: "失败",
  skipped: "已跳过",
  canceled: "已取消",
  unknown: "未确认",
}

const executionStatusIcons = {
  pending: Clock3,
  accepted: Clock3,
  running: LoaderCircle,
  success: CircleCheck,
  failed: CircleAlert,
  skipped: SkipForward,
  canceled: Ban,
  unknown: CircleAlert,
}

const executionStatusIconStyles: Record<DispatchExecutionStatus, string> = {
  pending: "text-sky-600",
  accepted: "text-blue-600",
  running: "text-cyan-600",
  success: "text-emerald-600",
  failed: "text-red-600",
  skipped: "text-slate-500",
  canceled: "text-orange-600",
  unknown: "text-amber-600",
}

function formatDateTime(value?: string) {
  if (!value) return "-"
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

function publishStatusLabel(value: string) {
  const normalized = value.toLowerCase()
  if (normalized === "published") return "已发布"
  if (normalized === "publishing") return "发布中"
  if (normalized === "pending") return "待发布"
  if (normalized.includes("fail")) return "发布失败"
  if (normalized.includes("retry")) return "等待重试"
  return value || "-"
}

function resultMessage(item: DispatchExecutionResult) {
  return item.errorMessage || item.reasonMessage || item.errorCode || item.reasonCode || "-"
}

export function AuditEventDetail({ event, open, onClose }: AuditEventDetailProps) {
  const [items, setItems] = useState<DispatchExecutionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadItems = async (operationId: string) => {
    setLoading(true)
    setError("")
    try {
      setItems(await listDispatchExecutionResults(operationId))
    } catch (loadError) {
      setItems([])
      setError(loadError instanceof Error ? loadError.message : "逐机执行明细加载失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!event?.operationId) {
      setItems([])
      setError("")
      return
    }
    void loadItems(event.operationId)
  }, [event?.operationId])

  const counts = useMemo(() => {
    const success = items.filter((item) => item.executionStatus === "success").length
    const failed = items.filter((item) => ["failed", "canceled"].includes(item.executionStatus)).length
    const pending = items.filter((item) => ["pending", "accepted", "running", "unknown"].includes(item.executionStatus)).length
    return {
      total: items.length || event?.totalCount || 0,
      success: items.length ? success : event?.successCount || 0,
      failed: items.length ? failed : event?.failedCount || 0,
      pending: items.length ? pending : event?.pendingCount || 0,
    }
  }, [event, items])

  return (
    <Dialog open={open && Boolean(event)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[88vh] w-[calc(100vw-32px)] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[1180px]">
        {event && (
          <>
            <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5 pr-14 text-left">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Monitor className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-lg font-semibold text-slate-950">下发执行详情</DialogTitle>
                  <DialogDescription className="mt-1 truncate text-sm text-slate-500">
                    {event.objectName} · {event.operationId}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="shrink-0 border-b border-slate-100 px-6 py-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
                <dl className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">下发类型</dt>
                    <dd className="mt-1 truncate font-medium text-slate-700">{dispatchTypeLabels[event.dispatchType]}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">发生时间</dt>
                    <dd className="mt-1 truncate text-slate-700">{formatDateTime(event.occurredAt)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">操作者</dt>
                    <dd className="mt-1 truncate text-slate-700" title={`${event.actorName} / ${event.actorId}`}>
                      {event.actorName} / {event.actorId}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">对象版本</dt>
                    <dd className="mt-1 truncate font-mono text-slate-700">{event.objectVersion || "-"}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">下发任务</dt>
                    <dd className="mt-1 truncate font-mono text-slate-700" title={event.taskId}>{event.taskId}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">整体状态</dt>
                    <dd className="mt-1 font-medium text-slate-700">{auditResultLabels[event.result]}</dd>
                  </div>
                </dl>

                <div className="grid grid-cols-4 gap-2">
                  <SummaryMetric label="目标" value={counts.total} iconClass="text-slate-600" />
                  <SummaryMetric label="成功" value={counts.success} iconClass="text-emerald-600" />
                  <SummaryMetric label="失败" value={counts.failed} iconClass="text-red-600" />
                  <SummaryMetric label="待确认" value={counts.pending} iconClass="text-sky-600" />
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">逐机执行情况</h3>
                  <p className="mt-1 text-xs text-slate-500">每条记录对应一台 Agent 的发布、执行与回执结果</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => void loadItems(event.operationId)}
                  className="h-9 gap-2 text-slate-600"
                >
                  <RefreshCw className={`h-4 w-4 text-sky-600 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                  刷新
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200">
                {loading && items.length === 0 ? (
                  <div className="flex h-56 items-center justify-center gap-2 text-sm text-slate-500">
                    <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" aria-hidden="true" />
                    正在加载逐机执行明细
                  </div>
                ) : error ? (
                  <div className="flex h-56 flex-col items-center justify-center gap-3 px-6 text-center">
                    <CircleAlert className="h-7 w-7 text-red-500" aria-hidden="true" />
                    <p className="text-sm text-red-700">{error}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadItems(event.operationId)}>重新加载</Button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-slate-500">暂无逐机执行记录</div>
                ) : (
                  <div className="h-full overflow-auto">
                    <table className="w-full min-w-[980px] table-fixed text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-50 font-semibold text-slate-500">
                        <tr>
                          <th className="w-[210px] px-4 py-3">Agent / 主机标识</th>
                          <th className="w-[105px] px-3 py-3">发布状态</th>
                          <th className="w-[110px] px-3 py-3">执行状态</th>
                          <th className="w-[95px] px-3 py-3">结果可信度</th>
                          <th className="w-[155px] px-3 py-3">最后回执</th>
                          <th className="w-[155px] px-3 py-3">完成时间</th>
                          <th className="px-3 py-3">原因 / 错误</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item) => (
                          <ExecutionRow key={item.id} item={item} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SummaryMetric({ label, value, iconClass }: { label: string; value: number; iconClass: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <div className={`text-lg font-semibold ${iconClass}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  )
}

function ExecutionRow({ item }: { item: DispatchExecutionResult }) {
  const StatusIcon = executionStatusIcons[item.executionStatus]
  const message = resultMessage(item)
  const certainty = item.failureCertainty === "uncertain" ? "未确认" : item.failureCertainty === "definitive" ? "已确认" : "-"

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-4 py-3">
        <div className="truncate font-mono text-xs font-medium text-slate-700" title={item.agentId}>{item.agentId || "-"}</div>
        <div className="mt-1 truncate font-mono text-[11px] text-slate-400" title={item.dispatchId}>{item.dispatchId || "-"}</div>
      </td>
      <td className="px-3 py-3 text-slate-700">{publishStatusLabel(item.publishStatus)}</td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 font-medium text-slate-700">
          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${executionStatusIconStyles[item.executionStatus]} ${item.executionStatus === "running" ? "animate-spin" : ""}`} aria-hidden="true" />
          {executionStatusLabels[item.executionStatus]}
        </span>
      </td>
      <td className="px-3 py-3 text-slate-600">{certainty}</td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateTime(item.lastReportAt || item.updatedAt)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateTime(item.finishedAt)}</td>
      <td className="px-3 py-3">
        <div className="truncate text-slate-600" title={message}>{message}</div>
        {item.taskVisibility === "unknown" && <div className="mt-1 text-[11px] text-amber-600">状态新鲜度未知</div>}
      </td>
    </tr>
  )
}
