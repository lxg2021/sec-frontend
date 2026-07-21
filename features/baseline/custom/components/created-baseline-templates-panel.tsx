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
      <CardHeader className="shrink-0 bg-slate-50/70 px-4 py-3.5">
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
        <div className="h-full space-y-2 overflow-y-auto px-1 py-2">
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
              <div key={baseline.uuid} className="transform-gpu rounded-xl border border-slate-200 bg-white p-3 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:relative hover:z-10 origin-center hover:-translate-y-0.5 hover:scale-[1.008] hover:border-cyan-200 hover:shadow-[0_14px_28px_-10px_rgba(8,145,178,0.35),0_8px_16px_-12px_rgba(15,23,42,0.28)]">
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
                  <div className="rounded-lg border border-cyan-100 bg-cyan-50/70 px-2.5 py-2">
                    <p className="text-cyan-600">{t("templateSelector.standardLabel")}</p>
                    <p className="mt-0.5 truncate font-semibold text-cyan-800">{baseline.standard || "-"}</p>
                  </div>
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2.5 py-2">
                    <p className="text-indigo-600">{t("templateSelector.profileLabel")}</p>
                    <p className="mt-0.5 truncate font-semibold text-indigo-800">{baseline.profile || "-"}</p>
                  </div>
                </div>


                <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 text-center text-[11px] font-semibold">
                  <span className="border-r border-red-100 bg-red-50/70 px-2 py-1.5 text-red-600">{t("itemsPanel.high")} {baseline.high_count}</span>
                  <span className="border-r border-amber-100 bg-amber-50/70 px-2 py-1.5 text-amber-600">{t("itemsPanel.medium")} {baseline.medium_count}</span>
                  <span className="bg-emerald-50/70 px-2 py-1.5 text-emerald-600">{t("itemsPanel.low")} {baseline.low_count}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span className="flex shrink-0 items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t("existingList.columns.createdAt")}: {formatCreatedAt(baseline.created_at, locale)}
                  </span>
                  <div className="ml-auto flex min-w-0 items-center gap-2">
                    <span className="whitespace-nowrap">
                      {t("existingList.columns.version")} <strong className="font-semibold text-slate-700">{baseline.baseline_version || "-"}</strong>
                    </span>
                    <span className="h-3 w-px shrink-0 bg-slate-200" aria-hidden="true" />
                    <span className="whitespace-nowrap">
                      {t("existingList.columns.items")} <strong className="font-semibold text-slate-700">{baseline.item_count}</strong>
                    </span>
                    <span className="h-3 w-px shrink-0 bg-slate-200" aria-hidden="true" />
                    <span className="min-w-0 truncate">
                      <strong className="font-semibold text-slate-700">{baseline.product || "-"}</strong> / {baseline.os_version || "-"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
