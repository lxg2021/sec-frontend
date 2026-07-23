"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react"
import { useTranslations } from "next-intl"
import type { UserActivityAudit } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { UserActivityDetailDialog } from "./user-activity-detail-dialog"
import { UserActivityListItem } from "./user-activity-list-item"

interface UserActivityListProps {
  events: UserActivityAudit[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
}

export function UserActivityList({
  events,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
}: UserActivityListProps) {
  const t = useTranslations("pages.audit.userActivity")
  const [selectedAudit, setSelectedAudit] = useState<UserActivityAudit>()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <>
      <section className="flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:min-h-0" aria-labelledby="user-audit-list-title">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            <h2 id="user-audit-list-title" className="truncate text-sm font-semibold text-foreground">{t("listTitle")}</h2>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {t("resultCount", { count: total })}
          </span>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1540px] table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[190px]" />
              <col className="w-[250px]" />
              <col className="w-[160px]" />
              <col className="w-[180px]" />
              <col className="w-[250px]" />
              <col className="w-[110px]" />
              <col className="w-[190px]" />
              <col className="w-[110px]" />
              <col className="w-[96px]" />
              <col className="w-[96px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("columns.actor")}</th>
                <th className="px-3 py-3">{t("columns.actorId")}</th>
                <th className="px-3 py-3">{t("columns.action")}</th>
                <th className="px-3 py-3">{t("columns.target")}</th>
                <th className="px-3 py-3">{t("columns.targetId")}</th>
                <th className="px-3 py-3">{t("columns.targetType")}</th>
                <th className="px-3 py-3">{t("columns.time")}</th>
                <th className="px-3 py-3">{t("columns.sourceIp")}</th>
                <th className="px-3 py-3">{t("columns.result")}</th>
                <th className="px-3 py-3 text-center">{t("columns.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && total === 0 ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4"><Skeleton className="h-3.5 w-40" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-48" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-7 w-24 rounded-md" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3.5 w-36" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-44" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-16" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3.5 w-36" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-3 w-28" /></td>
                    <td className="px-3 py-4"><Skeleton className="h-7 w-20 rounded-full" /></td>
                    <td className="px-3 py-4"><Skeleton className="mx-auto h-8 w-16 rounded-full" /></td>
                  </tr>
                ))
              ) : events.length > 0 ? (
                events.map((audit) => (
                  <UserActivityListItem key={audit.eventId} audit={audit} onView={setSelectedAudit} />
                ))
              ) : null}
            </tbody>
          </table>

          {!loading && events.length === 0 && (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-medium text-slate-700">{t("empty")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("emptyDescription")}</p>
            </div>
          )}
        </div>

        {total > 0 && (
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
            <span className="tabular-nums">{t("pageSummary", { start: startItem, end: endItem, total })}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                aria-label={t("previousPage")}
                title={t("previousPage")}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="min-w-[72px] text-center tabular-nums text-slate-600">{page} / {totalPages}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                aria-label={t("nextPage")}
                title={t("nextPage")}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </footer>
        )}
      </section>

      <UserActivityDetailDialog
        audit={selectedAudit}
        open={Boolean(selectedAudit)}
        onClose={() => setSelectedAudit(undefined)}
      />
    </>
  )
}
