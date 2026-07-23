"use client"

import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react"
import { useTranslations } from "next-intl"
import type { UserActivityAudit } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
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
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
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

      <div className="hidden shrink-0 grid-cols-[minmax(180px,1.1fr)_150px_minmax(220px,1.25fr)_180px_100px_44px] items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 xl:grid">
        <span>{t("columns.actor")}</span>
        <span>{t("columns.action")}</span>
        <span>{t("columns.target")}</span>
        <span>{t("columns.time")}</span>
        <span>{t("columns.result")}</span>
        <span className="sr-only">{t("columns.details")}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && total === 0 ? (
          <div className="divide-y divide-slate-100" aria-label={t("loading")}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.1fr)_150px_minmax(220px,1.25fr)_180px_100px_44px] xl:items-center">
                <div className="flex items-center gap-3 sm:col-span-2 xl:col-span-1">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-7 w-24 rounded-md" />
                <div className="space-y-2"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-44" /></div>
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-700">{t("empty")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("emptyDescription")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100" aria-label={t("listTitle")}>
            {events.map((audit) => <UserActivityListItem key={audit.eventId} audit={audit} />)}
          </ul>
        )}
      </div>

      {total > 0 && (
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
          <span className="tabular-nums">{t("pageSummary", { start: startItem, end: endItem, total })}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label={t("previousPage")}
              title={t("previousPage")}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-[88px] text-center font-medium tabular-nums text-slate-700">
              {t("pageNumber", { page, total: totalPages })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
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
  )
}
