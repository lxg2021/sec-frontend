"use client"

import { useLocale, useTranslations } from "next-intl"
import { CalendarDays, Database, RefreshCw, ShieldCheck } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"

import type { BaselineListItem } from "../api"

interface CreatedBaselineTemplatesPanelProps {
  baselines: BaselineListItem[]
  loading: boolean
  errorMessage: string
  onRefresh: () => void
}

function formatCreatedAt(value: string, locale: string) {
  const normalized = value.trim()
  if (!normalized) return "-"

  const date = new Date(normalized.includes("T") ? normalized : normalized.replace(" ", "T"))
  if (Number.isNaN(date.getTime())) return normalized

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function CreatedBaselineTemplatesPanel({
  baselines,
  loading,
  errorMessage,
  onRefresh,
}: CreatedBaselineTemplatesPanelProps) {
  const t = useTranslations("pages.baseline.custom")
  const locale = useLocale()

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <CardHeader className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Database className="h-4 w-4" />
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="truncate text-sm font-semibold text-slate-950">{t("existingList.title")}</CardTitle>
              <Badge variant="secondary" className="h-5 shrink-0 rounded-full bg-cyan-50 px-2 text-[11px] font-semibold text-cyan-700">
                {baselines.length}
              </Badge>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            aria-label={t("existingList.refresh")}
            title={t("existingList.refresh")}
            className="h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-3">
        <div className="h-full space-y-2 overflow-y-auto pr-1">
          {loading && baselines.length === 0 ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)
          ) : errorMessage ? (
            <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/60 px-4 text-center">
              <div>
                <p className="text-sm font-semibold text-rose-700">{t("existingList.loadFailed")}</p>
                <p className="mt-1 line-clamp-3 text-xs text-rose-600">{errorMessage}</p>
              </div>
            </div>
          ) : baselines.length === 0 ? (
            <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center">
              <div>
                <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-800">{t("existingList.emptyTitle")}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("existingList.emptyDescription")}</p>
              </div>
            </div>
          ) : (
            baselines.map((baseline) => (
              <div key={baseline.uuid} className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-cyan-200 hover:bg-cyan-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950" title={baseline.display_name || baseline.uuid}>
                      {baseline.display_name || baseline.uuid}
                    </p>
                    {baseline.description ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{baseline.description}</p> : null}
                  </div>
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <p className="text-slate-400">{t("templateSelector.standardLabel")}</p>
                    <p className="mt-0.5 truncate font-semibold text-slate-700">{baseline.standard || "-"}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <p className="text-slate-400">{t("templateSelector.profileLabel")}</p>
                    <p className="mt-0.5 truncate font-semibold text-slate-700">{baseline.profile || "-"}</p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="h-5 rounded-full bg-indigo-50 px-2 text-[11px] font-normal text-indigo-700">
                    {t("existingList.columns.version")}: {baseline.baseline_version || "-"}
                  </Badge>
                  <Badge variant="secondary" className="h-5 rounded-full bg-blue-50 px-2 text-[11px] font-normal text-blue-700">
                    {t("existingList.columns.items")}: {baseline.item_count}
                  </Badge>
                  <Badge variant="secondary" className="h-5 max-w-full rounded-full bg-slate-100 px-2 text-[11px] font-normal text-slate-600">
                    <span className="truncate">{[baseline.product, baseline.os_version].filter(Boolean).join(" · ") || "-"}</span>
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                  <span className="text-red-600">{t("itemsPanel.high")} {baseline.high_count}</span>
                  <span className="text-amber-600">{t("itemsPanel.medium")} {baseline.medium_count}</span>
                  <span className="text-emerald-600">{t("itemsPanel.low")} {baseline.low_count}</span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{t("existingList.columns.createdAt")}: {formatCreatedAt(baseline.created_at, locale)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
