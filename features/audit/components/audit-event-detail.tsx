"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
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
import { dispatchExecutionErrorPresentation } from "@/features/audit/error-presentation"
import type { DispatchAuditEvent, DispatchExecutionResult, DispatchExecutionStatus } from "@/features/audit/types"
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

function formatDateTime(value: string | undefined, locale: string) {
  if (!value) return "-"
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

function publishStatusKey(value: string) {
  const normalized = value.toLowerCase()
  if (normalized === "published") return "published"
  if (normalized === "publishing") return "publishing"
  if (normalized === "pending") return "pending"
  if (normalized.includes("fail")) return "failed"
  if (normalized.includes("retry")) return "retry"
  return undefined
}

export function AuditEventDetail({ event, open, onClose }: AuditEventDetailProps) {
  const t = useTranslations("pages.reports")
  const locale = useLocale()
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
      setError(loadError instanceof Error && loadError.message.trim() ? loadError.message : t("errors.executionLoadFallback"))
    } finally {
      setLoading(false)
    }
  }, [t])

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
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])
  const actorType = (["operator", "system", "publisher", "reconciler", "unknown"] as const)
    .find((type) => type === event?.actorName.toLowerCase())
  const actorDisplayName = actorType ? t(`dispatch.actorTypes.${actorType}`) : event?.actorName || t("dispatch.actorTypes.unknown")

  return (
    <Dialog open={open && Boolean(event)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex h-[calc(100vh-32px)] max-h-[820px] w-[calc(100vw-32px)] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[1440px]">
        {event && (
          <>
            <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Monitor className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-lg font-semibold text-slate-950">{t("dispatch.detail.title")}</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="shrink-0 px-6 py-3">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
                <dl className="grid min-w-0 grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 text-sm">
                  <div className="flex min-w-0 items-center gap-1 border-b border-r border-slate-200 px-3 py-2">
                    <dt className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400"><FileOutput className="h-3.5 w-3.5 text-cyan-500" aria-hidden="true" />{t("dispatch.detail.dispatchType")}</dt>
                    <dd className="min-w-0 truncate font-medium text-slate-700">{t(`dispatch.types.${event.dispatchType}`)}</dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1 border-b border-slate-200 px-3 py-2">
                    <dt className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400"><CalendarClock className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />{t("dispatch.detail.occurredAt")}</dt>
                    <dd className="min-w-0 truncate text-slate-700">{formatDateTime(event.occurredAt, locale)}</dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1 border-b border-r border-slate-200 px-3 py-2">
                    <dt className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400"><UserRound className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />{t("dispatch.detail.actor")}</dt>
                    <dd className="min-w-0 truncate text-slate-700" title={`${actorDisplayName} / ${event.actorId}`}>
                      {actorDisplayName} / {event.actorId}
                    </dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1 border-b border-slate-200 px-3 py-2">
                    <dt className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400"><ClipboardList className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />{t("dispatch.detail.task")}</dt>
                    <dd className="min-w-0 truncate font-mono text-slate-700" title={event.taskId}>{event.taskId}</dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1 border-r border-slate-200 px-3 py-2">
                    <dt className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400"><Tag className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />{t("dispatch.detail.objectVersion")}</dt>
                    <dd className="min-w-0 truncate font-mono text-slate-700">{event.objectVersion || "-"}</dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1 px-3 py-2">
                    <dt className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400"><Activity className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />{t("dispatch.detail.overallStatus")}</dt>
                    <dd className="min-w-0 truncate font-medium text-slate-700">{t(`dispatch.results.${event.result}`)}</dd>
                  </div>
                </dl>

                <div className="grid grid-cols-4 gap-2">
                  <SummaryMetric label={t("dispatch.detail.metrics.target")} value={numberFormatter.format(counts.total)} valueClass="text-blue-700" cardClass="border-blue-100 bg-blue-50/70" />
                  <SummaryMetric label={t("dispatch.detail.metrics.success")} value={numberFormatter.format(counts.success)} valueClass="text-emerald-700" cardClass="border-emerald-100 bg-emerald-50/70" />
                  <SummaryMetric label={t("dispatch.detail.metrics.failed")} value={numberFormatter.format(counts.failed)} valueClass="text-red-700" cardClass="border-red-100 bg-red-50/70" />
                  <SummaryMetric label={t("dispatch.detail.metrics.pending")} value={numberFormatter.format(counts.pending)} valueClass="text-sky-700" cardClass="border-sky-100 bg-sky-50/70" />
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{t("dispatch.detail.hostExecutionTitle")}</h3>
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
                  {t("dispatch.detail.refresh")}
                </Button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
                {loading && items.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-slate-500" role="status" aria-live="polite">
                    <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" aria-hidden="true" />
                    {t("dispatch.detail.loading")}
                  </div>
                ) : error ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center" role="alert">
                    <CircleAlert className="h-7 w-7 text-red-500" aria-hidden="true" />
                    <p className="text-sm text-red-700">{error}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadItems(event.operationId, page)}>{t("dispatch.detail.reload")}</Button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-500" role="status">{t("dispatch.detail.empty")}</div>
                ) : (
                  <>
                    <div className="min-h-0 flex-1 overflow-auto">
                      <table className="w-full min-w-[1200px] table-fixed text-left text-xs">
                        <colgroup>
                          <col className="w-[240px]" />
                          <col className="w-[100px]" />
                          <col className="w-[130px]" />
                          <col className="w-[150px]" />
                          <col className="w-[150px]" />
                          <col className="w-[100px]" />
                          <col className="w-[330px]" />
                        </colgroup>
                        <thead className="sticky top-0 z-10 bg-slate-50 font-semibold text-slate-500">
                          <tr>
                            <th className="px-4 py-3">{t("hostId")}</th>
                            <th className="px-3 py-3 text-center">{t("dispatch.detail.columns.publishStatus")}</th>
                            <th className="px-3 py-3 text-center">{t("dispatch.detail.columns.executionStatus")}</th>
                            <th className="px-3 py-3">{t("dispatch.detail.columns.lastReport")}</th>
                            <th className="px-3 py-3">{t("dispatch.detail.columns.finishedAt")}</th>
                            <th className="px-3 py-3">{t("dispatch.detail.columns.errorCode")}</th>
                            <th className="px-3 py-3">{t("dispatch.detail.columns.errorDescription")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <ExecutionRow key={item.id} item={item} locale={locale} />
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

function SummaryMetric({ label, value, valueClass, cardClass }: { label: string; value: string; valueClass: string; cardClass: string }) {
  return (
    <div className={`flex min-h-0 flex-col items-center justify-center rounded-xl border px-3 py-3 text-center ${cardClass}`}>
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
  const t = useTranslations("pages.reports.dispatch.detail")
  const locale = useLocale()
  const numberFormatter = new Intl.NumberFormat(locale)
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * EXECUTION_PAGE_SIZE + 1
  const endItem = Math.min(currentPage * EXECUTION_PAGE_SIZE, totalItems)

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
      <span className="text-xs text-slate-500">
        {t("pageSummary", { start: numberFormatter.format(startItem), end: numberFormatter.format(endItem), total: numberFormatter.format(totalItems) })}
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
          {t("previousPage")}
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
          {t("nextPage")}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
function ExecutionRow({ item, locale }: { item: DispatchExecutionResult; locale: string }) {
  const t = useTranslations("pages.reports.dispatch.detail")
  const StatusIcon = executionStatusIcons[item.executionStatus]
  const errorPresentation = dispatchExecutionErrorPresentation(item.errorCode, item.errorMessage, locale)
  const statusKey = publishStatusKey(item.publishStatus)
  const publishStatus = statusKey ? t(`publishStatuses.${statusKey}`) : item.publishStatus || "-"

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-4 py-3">
        <div className="truncate font-mono text-xs font-medium text-slate-700" title={item.agentId}>{item.agentId || "-"}</div>
      </td>
      <td className="px-3 py-3 text-center text-slate-700">{publishStatus}</td>
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 font-medium text-slate-700">
          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${executionStatusIconStyles[item.executionStatus]} ${item.executionStatus === "running" ? "animate-spin" : ""}`} aria-hidden="true" />
          {t(`executionStatuses.${item.executionStatus}`)}
        </span>
      </td>
      <td className="truncate whitespace-nowrap px-3 py-3 text-slate-600" title={formatDateTime(item.lastReportAt || item.updatedAt, locale)}>{formatDateTime(item.lastReportAt || item.updatedAt, locale)}</td>
      <td className="truncate whitespace-nowrap px-3 py-3 text-slate-600" title={formatDateTime(item.finishedAt, locale)}>{formatDateTime(item.finishedAt, locale)}</td>
      <td className="px-3 py-3">
        <div className="truncate text-slate-700" title={errorPresentation.codeTitle}>{errorPresentation.code}</div>
      </td>
      <td className="px-3 py-3">
        <div className="truncate text-slate-600" title={errorPresentation.descriptionTitle}>{errorPresentation.description}</div>
      </td>
    </tr>
  )
}
