"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Eye,
  FileCheck2,
  FilePenLine,
  FilePlus2,
  FileOutput,
  RotateCcw,
  Settings2,
  TerminalSquare,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { ChangeAuditAction, ChangeAuditEvent, DispatchType } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { ChangeAuditDetailDialog } from "./change-audit-detail-dialog"
import { changeAuditActionLabelKey, changeAuditOutcomeLabelKey } from "./change-audit-presentation"

interface ChangeAuditListProps {
  events: ChangeAuditEvent[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
}

const actionVisuals: Record<ChangeAuditAction, { icon: LucideIcon; iconClass: string }> = {
  created: { icon: FilePlus2, iconClass: "text-emerald-600" },
  reused: { icon: FileCheck2, iconClass: "text-cyan-600" },
  updated: { icon: FilePenLine, iconClass: "text-blue-600" },
  deleteAccepted: { icon: Trash2, iconClass: "text-rose-600" },
  deleteCompleted: { icon: CircleCheck, iconClass: "text-emerald-600" },
  deleteAborted: { icon: RotateCcw, iconClass: "text-amber-600" },
  legacyCommand: { icon: FileCheck2, iconClass: "text-slate-500" },
}

const objectVisuals: Record<Exclude<DispatchType, "all">, { icon: LucideIcon; iconClass: string }> = {
  policy: { icon: FileOutput, iconClass: "text-blue-600" },
  command: { icon: TerminalSquare, iconClass: "text-cyan-600" },
  config: { icon: Settings2, iconClass: "text-indigo-600" },
}

function formatDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

export function ChangeAuditList({ events, total, page, pageSize, loading, onPageChange }: ChangeAuditListProps) {
  const t = useTranslations("pages.audit.changeAudit")
  const locale = useLocale()
  const [selectedEvent, setSelectedEvent] = useState<ChangeAuditEvent>()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <>
      <section className="flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:min-h-0" aria-labelledby="change-audit-list-title">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            <h2 id="change-audit-list-title" className="truncate text-sm font-semibold text-foreground">{t("listTitle")}</h2>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{t("resultCount", { count: total })}</span>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1560px] table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[170px]" />
              <col className="w-[165px]" />
              <col className="w-[120px]" />
              <col className="w-[220px]" />
              <col className="w-[230px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[180px]" />
              <col className="w-[145px]" />
              <col className="w-[90px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("columns.time")}</th>
                <th className="px-3 py-3">{t("columns.action")}</th>
                <th className="px-3 py-3">{t("columns.objectType")}</th>
                <th className="px-3 py-3">{t("columns.objectName")}</th>
                <th className="px-3 py-3">{t("columns.objectId")}</th>
                <th className="px-3 py-3">{t("columns.previousVersion")}</th>
                <th className="px-3 py-3">{t("columns.newVersion")}</th>
                <th className="px-3 py-3">{t("columns.actor")}</th>
                <th className="px-3 py-3">{t("columns.outcome")}</th>
                <th className="px-3 py-3 text-center">{t("columns.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && total === 0 ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4"><Skeleton className="h-3.5 w-32" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-7 w-24 rounded-md" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3.5 w-36" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-44" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-20" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-20" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3.5 w-32" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-24" /></td>
                    <td className="px-3 py-4"><Skeleton className="mx-auto h-8 w-16 rounded-full" /></td>
                  </tr>
                ))
              ) : events.length > 0 ? (
                events.map((event) => {
                  const actionVisual = actionVisuals[event.action]
                  const ActionIcon = actionVisual.icon
                  const objectVisual = objectVisuals[event.objectType]
                  const ObjectIcon = objectVisual.icon
                  const actionLabelKey = changeAuditActionLabelKey(event)
                  const outcomeLabelKey = changeAuditOutcomeLabelKey(event)
                  const operatorID = event.requestedBy || event.actorId
                  return (
                    <tr key={event.id} className="bg-white transition-colors hover:bg-slate-50/80 focus-within:bg-sky-50/50">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-500">
                        <time dateTime={event.occurredAt}>{formatDate(event.occurredAt, locale)}</time>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-normal text-black">
                          <ActionIcon className={`h-3.5 w-3.5 shrink-0 ${actionVisual.iconClass}`} aria-hidden="true" />
                          <span className="truncate">{t(`actions.${actionLabelKey}`)}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <ObjectIcon className={`h-3.5 w-3.5 shrink-0 ${objectVisual.iconClass}`} aria-hidden="true" />
                          <span>{t(`objects.${event.objectType}`)}</span>
                        </span>
                      </td>
                      <td className="min-w-0 px-3 py-3"><div className="truncate font-medium text-slate-800" title={event.objectName}>{event.objectName || "-"}</div></td>
                      <td className="min-w-0 px-3 py-3"><div className="truncate font-mono text-xs text-slate-500" title={event.objectId}>{event.objectId || "-"}</div></td>
                      <td className="min-w-0 px-3 py-3"><div className="truncate font-mono text-xs text-slate-600" title={event.previousVersion}>{event.previousVersion || "-"}</div></td>
                      <td className="min-w-0 px-3 py-3"><div className="truncate font-mono text-xs text-slate-600" title={event.newVersion}>{event.newVersion || "-"}</div></td>
                      <td className="min-w-0 px-3 py-3"><div className="truncate text-slate-700" title={operatorID}>{operatorID || "-"}</div></td>
                      <td className="px-3 py-3 text-slate-700">{t(`outcomes.${outcomeLabelKey}`)}</td>
                      <td className="px-3 py-3 text-center">
                        <button type="button" onClick={() => setSelectedEvent(event)} aria-label={t("viewAria", { object: event.objectName || event.objectId })} className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 [&_svg]:size-3.5">
                          <Eye aria-hidden="true" />
                          {t("view")}
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : null}
            </tbody>
          </table>

          {!loading && events.length === 0 && (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><ClipboardList className="h-5 w-5" aria-hidden="true" /></span>
              <p className="mt-4 text-sm font-medium text-slate-700">{t("empty")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("emptyDescription")}</p>
            </div>
          )}
        </div>

        {total > 0 && (
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
            <span className="tabular-nums">{t("pageSummary", { start: startItem, end: endItem, total })}</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-cyan-50 hover:text-cyan-700" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={t("previousPage")} title={t("previousPage")}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
              <span className="min-w-[72px] text-center tabular-nums text-slate-600">{page} / {totalPages}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-cyan-50 hover:text-cyan-700" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label={t("nextPage")} title={t("nextPage")}><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
            </div>
          </footer>
        )}
      </section>

      <ChangeAuditDetailDialog event={selectedEvent} open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(undefined)} />
    </>
  )
}
