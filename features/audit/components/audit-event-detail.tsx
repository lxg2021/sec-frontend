"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Activity,
  Ban,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileOutput,
  LoaderCircle,
  Monitor,
  RefreshCw,
  SkipForward,
  Tag,
  UserRound,
} from "lucide-react"
import { listDispatchExecutionResults } from "@/features/audit/api"
import type { DispatchAuditEvent, DispatchExecutionResult, DispatchExecutionStatus } from "@/features/audit/types"
import { auditResultLabels, dispatchTypeLabels } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

interface AuditEventDetailProps {
  event?: DispatchAuditEvent
  open: boolean
  onClose: () => void
}

const EXECUTION_PAGE_SIZE = 10

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

export function AuditEventDetail({ event, open, onClose }: AuditEventDetailProps) {
  const t = useTranslations("pages.reports")
  const [items, setItems] = useState<DispatchExecutionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const totalPages = Math.max(1, Math.ceil(totalItems / EXECUTION_PAGE_SIZE))

  const loadItems = useCallback(async (operationId: string, requestedPage: number) => {
    setLoading(true)
    setError("")
    try {
      const result = await listDispatchExecutionResults(operationId, requestedPage, EXECUTION_PAGE_SIZE)
      setItems(result.items)
      setTotalItems(result.total)
    } catch (loadError) {
      setItems([])
      setTotalItems(0)
      setError(loadError instanceof Error ? loadError.message : "逐机执行明细加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [event?.operationId])

  useEffect(() => {
    if (!event?.operationId) {
      setItems([])
      setTotalItems(0)
      setError("")
      return
    }
    void loadItems(event.operationId, page)
  }, [event?.operationId, loadItems, page])

  const counts = useMemo(() => ({
    total: event?.totalCount || totalItems,
    success: event?.successCount || 0,
    failed: event?.failedCount || 0,
    pending: event?.pendingCount || 0,
  }), [event, totalItems])

  return (
    <Dialog open={open && Boolean(event)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex h-[calc(100vh-32px)] max-h-[820px] w-[calc(100vw-32px)] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[1440px]">
        {event && (
          <>
            <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5 pr-14 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Monitor className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-lg font-semibold text-slate-950">下发执行详情</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="shrink-0 border-b border-slate-100 px-6 py-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
                <dl className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><FileOutput className="h-3.5 w-3.5 text-cyan-500" aria-hidden="true" />下发类型</dt>
                    <dd className="mt-1 truncate font-medium text-slate-700">{dispatchTypeLabels[event.dispatchType]}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><CalendarClock className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />发生时间</dt>
                    <dd className="mt-1 truncate text-slate-700">{formatDateTime(event.occurredAt)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><UserRound className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />操作者</dt>
                    <dd className="mt-1 truncate text-slate-700" title={`${event.actorName} / ${event.actorId}`}>
                      {event.actorName} / {event.actorId}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Tag className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />对象版本</dt>
                    <dd className="mt-1 truncate font-mono text-slate-700">{event.objectVersion || "-"}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><ClipboardList className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />下发任务</dt>
                    <dd className="mt-1 truncate font-mono text-slate-700" title={event.taskId}>{event.taskId}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Activity className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />整体状态</dt>
                    <dd className="mt-1 font-medium text-slate-700">{auditResultLabels[event.result]}</dd>
                  </div>
                </dl>

                <div className="grid grid-cols-4 gap-2">
                  <SummaryMetric label="目标" value={counts.total} valueClass="text-blue-700" cardClass="border-blue-100 bg-blue-50/70" />
                  <SummaryMetric label="成功" value={counts.success} valueClass="text-emerald-700" cardClass="border-emerald-100 bg-emerald-50/70" />
                  <SummaryMetric label="失败" value={counts.failed} valueClass="text-red-700" cardClass="border-red-100 bg-red-50/70" />
                  <SummaryMetric label="待确认" value={counts.pending} valueClass="text-sky-700" cardClass="border-sky-100 bg-sky-50/70" />
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">主机执行详情</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => void loadItems(event.operationId, page)}
                  className="h-9 gap-2 text-slate-600"
                >
                  <RefreshCw className={`h-4 w-4 text-sky-600 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                  刷新
                </Button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
                {loading && items.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-slate-500">
                    <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" aria-hidden="true" />
                    正在加载逐机执行明细
                  </div>
                ) : error ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <CircleAlert className="h-7 w-7 text-red-500" aria-hidden="true" />
                    <p className="text-sm text-red-700">{error}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadItems(event.operationId, page)}>重新加载</Button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-500">暂无逐机执行记录</div>
                ) : (
                  <>
                    <div className="min-h-0 flex-1 overflow-auto">
                      <table className="w-full min-w-[1060px] table-fixed text-left text-xs">
                        <colgroup>
                          <col className="w-[240px]" />
                          <col className="w-[100px]" />
                          <col className="w-[130px]" />
                          <col className="w-[190px]" />
                          <col className="w-[110px]" />
                          <col className="w-[90px]" />
                          <col className="w-[190px]" />
                        </colgroup>
                        <thead className="sticky top-0 z-10 bg-slate-50 font-semibold text-slate-500">
                          <tr>
                            <th className="px-4 py-3">{t("hostId")}</th>
                            <th className="px-3 py-3 text-center">发布状态</th>
                            <th className="px-3 py-3 text-center">执行状态</th>
                            <th className="px-3 py-3">最后回执</th>
                            <th className="px-3 py-3">完成时间</th>
                            <th className="px-3 py-3">错误码</th>
                            <th className="px-3 py-3">错误描述</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <ExecutionRow key={item.id} item={item} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ExecutionPagination
                      currentPage={page}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      loading={loading}
                      onPageChange={setPage}
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SummaryMetric({ label, value, valueClass, cardClass }: { label: string; value: number; valueClass: string; cardClass: string }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${cardClass}`}>
      <div className={`text-lg font-semibold ${valueClass}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  )
}

function ExecutionPagination({
  currentPage,
  totalPages,
  totalItems,
  loading,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  loading: boolean
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * EXECUTION_PAGE_SIZE + 1
  const endItem = Math.min(currentPage * EXECUTION_PAGE_SIZE, totalItems)

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
      <span className="text-xs text-slate-500">
        显示 {startItem}-{endItem} 条，共 {totalItems} 条
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2.5 text-slate-600"
          disabled={loading || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          上一页
        </Button>
        <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-slate-950 px-2 text-xs font-medium text-white">
          {currentPage}
        </span>
        <span className="text-xs text-slate-500">/ {totalPages}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2.5 text-slate-600"
          disabled={loading || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
function ExecutionRow({ item }: { item: DispatchExecutionResult }) {
  const StatusIcon = executionStatusIcons[item.executionStatus]

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-4 py-3">
        <div className="truncate font-mono text-xs font-medium text-slate-700" title={item.agentId}>{item.agentId || "-"}</div>
      </td>
      <td className="px-3 py-3 text-center text-slate-700">{publishStatusLabel(item.publishStatus)}</td>
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 font-medium text-slate-700">
          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${executionStatusIconStyles[item.executionStatus]} ${item.executionStatus === "running" ? "animate-spin" : ""}`} aria-hidden="true" />
          {executionStatusLabels[item.executionStatus]}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateTime(item.lastReportAt || item.updatedAt)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateTime(item.finishedAt)}</td>
      <td className="px-3 py-3">
        <div className="truncate font-mono text-slate-600" title={item.errorCode || "-"}>{item.errorCode || "-"}</div>
      </td>
      <td className="px-3 py-3">
        <div className="truncate text-slate-600" title={item.errorMessage || "-"}>{item.errorMessage || "-"}</div>
      </td>
    </tr>
  )
}
