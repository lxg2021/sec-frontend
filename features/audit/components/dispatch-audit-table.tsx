"use client"

import { ChevronLeft, ChevronRight, CircleCheck, ClipboardList, Clock3, Copy, FileOutput, Settings2, TriangleAlert } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { DispatchAuditEvent } from "@/features/audit/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

interface DispatchAuditTableProps {
  events: DispatchAuditEvent[]
  total: number
  page: number
  pageSize: number
  selectedId?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSelect: (event: DispatchAuditEvent) => void
  onView: (event: DispatchAuditEvent) => void
}

const typeIcons = { policy: FileOutput, command: Copy, config: Settings2 }
const typeIconStyles = { policy: "text-blue-600", command: "text-cyan-600", config: "text-indigo-600" }
const resultIconStyles = { success: "text-emerald-600", failed: "text-red-600", pending: "text-sky-600", timeout: "text-amber-600" }

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

export function DispatchAuditTable({
  events,
  total,
  page,
  pageSize,
  selectedId,
  onPageChange,
  onPageSizeChange,
  onSelect,
  onView,
}: DispatchAuditTableProps) {
  const t = useTranslations("pages.reports.dispatch")
  const locale = useLocale()
  const numberFormatter = new Intl.NumberFormat(locale)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">{t("table.title")}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{t("table.resultCount", { count: total })}</span>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-left text-xs 2xl:min-w-[1700px]">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="w-[104px] px-4 py-3 2xl:w-[120px]">{t("table.columns.time")}</th>
              <th className="w-[108px] px-3 py-3 2xl:w-[120px]">{t("table.columns.type")}</th>
              <th className="px-3 py-3 2xl:w-[240px]">{t("table.columns.object")}</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[80px]">{t("table.columns.version")}</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[220px]">{t("table.columns.task")}</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[220px]">{t("table.columns.taskId")}</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[90px]">{t("table.columns.actor")}</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[220px]">{t("table.columns.actorId")}</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[110px]">{t("table.columns.target")}</th>
              <th className="w-[88px] px-3 py-3 2xl:w-[100px]">{t("table.columns.status")}</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[110px]">{t("table.columns.result")}</th>
              <th className="w-[88px] px-3 py-3 text-center 2xl:w-[96px]">{t("table.columns.details")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => {
              const Icon = typeIcons[event.dispatchType]
              const ResultIcon = event.result === "success" ? CircleCheck : event.result === "failed" || event.result === "timeout" ? TriangleAlert : Clock3
              const actorType = (["operator", "system", "publisher", "reconciler", "unknown"] as const)
                .find((type) => type === event.actorName.toLowerCase())
              const actorDisplayName = actorType ? t(`actorTypes.${actorType}`) : event.actorName || t("actorTypes.unknown")
              const objectName = event.objectName || t("generated.unnamedObject")
              const targetSummary = event.targetSummary || t("generated.targetCount", { count: event.totalCount })

              return (
                <tr
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedId === event.id}
                  onClick={() => onSelect(event)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault()
                      onSelect(event)
                    }
                  }}
                  className={selectedId === event.id
                    ? "cursor-pointer bg-blue-50/60 outline-none"
                    : "cursor-pointer outline-none hover:bg-slate-50/80 focus-visible:bg-sky-50/70"}
                >
                  <td className="relative whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {selectedId === event.id && (
                      <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-cyan-500" aria-hidden="true" />
                    )}
                    {formatDate(event.occurredAt, locale)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${typeIconStyles[event.dispatchType]}`} aria-hidden="true" />
                      <span className="truncate">{t(`types.${event.dispatchType}`)}</span>
                    </span>
                  </td>
                  <td className="min-w-0 px-3 py-3">
                    <div className="truncate font-medium text-slate-800" title={objectName}>{objectName}</div>
                    <div className="mt-1 truncate text-xs text-slate-400 2xl:hidden">{event.objectVersion}</div>
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-500 2xl:table-cell">
                    <div className="truncate" title={event.objectVersion}>{event.objectVersion || "-"}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-mono text-xs text-slate-600" title={event.taskId}>{event.taskId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-mono text-xs text-slate-600" title={event.operationId}>{event.operationId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-medium text-slate-700" title={actorDisplayName}>{actorDisplayName}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-mono text-xs text-slate-500" title={event.actorId}>{event.actorId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate text-xs text-slate-700" title={targetSummary}>{targetSummary}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                      <ResultIcon className={`h-3.5 w-3.5 shrink-0 ${resultIconStyles[event.result]}`} aria-hidden="true" />
                      {t(`results.${event.result}`)}
                    </span>
                    <div className="mt-1 truncate text-xs text-slate-400 2xl:hidden">{t("table.successSummary", { success: numberFormatter.format(event.successCount), total: numberFormatter.format(event.totalCount) })}</div>
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-600 2xl:table-cell">
                    <div className="truncate">{t("table.successSummary", { success: numberFormatter.format(event.successCount), total: numberFormatter.format(event.totalCount) })}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        onView(event)
                      }}
                      aria-label={t("table.viewAria", { object: objectName })}
                      className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                      {t("table.view")}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {events.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-500">{t("table.empty")}</div>}

      {total > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
          <span className="tabular-nums">{t("table.pageSummary", { start: numberFormatter.format(startItem), end: numberFormatter.format(endItem), total: numberFormatter.format(total) })}</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span>{t("table.pageSizeLabel")}</span>
              <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
                <SelectTrigger
                  className="h-8 w-[88px] rounded-full border-slate-300 bg-white px-3 text-xs text-black shadow-none hover:border-black focus:border-black focus:text-black focus:ring-1 focus:ring-black focus:ring-offset-0 data-[state=open]:border-black data-[state=open]:text-black data-[state=open]:ring-1 data-[state=open]:ring-black [&>svg]:text-black [&>svg]:opacity-100"
                  aria-label={t("table.pageSizeAria")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="min-w-[88px] rounded-xl border-slate-200">
                  <SelectItem value="10" className="rounded-lg text-xs focus:bg-slate-100 focus:text-black data-[state=checked]:text-black">{t("table.pageSizeOption", { count: 10 })}</SelectItem>
                  <SelectItem value="20" className="rounded-lg text-xs focus:bg-slate-100 focus:text-black data-[state=checked]:text-black">{t("table.pageSizeOption", { count: 20 })}</SelectItem>
                  <SelectItem value="50" className="rounded-lg text-xs focus:bg-slate-100 focus:text-black data-[state=checked]:text-black">{t("table.pageSizeOption", { count: 50 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-cyan-50 hover:text-cyan-700 disabled:pointer-events-none disabled:opacity-35" aria-label={t("table.previousPage")}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[72px] text-center tabular-nums text-slate-600">{page} / {totalPages}</span>
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-cyan-50 hover:text-cyan-700 disabled:pointer-events-none disabled:opacity-35" aria-label={t("table.nextPage")}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
