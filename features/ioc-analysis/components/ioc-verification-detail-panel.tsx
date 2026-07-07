"use client"

import { Loader2, Table2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { IocPanelEmptyState } from "@/features/ioc-analysis/components/ioc-panel-empty-state"
import type { IocVerificationItem } from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"

import { DetailFieldSections, DetailFieldTable } from "./ioc-detail/detail-table"
import { normalizeDetailLocale } from "./ioc-detail/detail-fields"
import { blacklistFields } from "./ioc-detail/detail-legacy-fields"
import {
  iocEntryHitDetailView,
  queryResultDetailView,
} from "./ioc-detail/detail-query-fallback"
import { detailViewSections } from "./ioc-detail/detail-sections"

export function IocVerificationDetailPanel({
  className,
  detailLayout = "paired",
  item,
  loading = false,
  onCopy,
}: {
  className?: string
  detailLayout?: "paired" | "single"
  item: IocVerificationItem | null
  loading?: boolean
  onCopy: (value: string) => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const locale = useLocale()
  const detailLocale = normalizeDetailLocale(locale)

  const detail = item?.verification_detail ?? null
  const detailView = detail?.detail_view ?? null
  const sourceDetail = detail?.final_hit_detail ?? detail?.hit_source_detail ?? null
  const iocEntry = sourceDetail?.ioc_entry ?? null
  const iocEntryDetailView = iocEntryHitDetailView(iocEntry)
  const blacklist = sourceDetail?.blacklist_indicator ?? null
  const queryResultFallbackView = queryResultDetailView(item)
  const normalizedDetailView =
    detailView || iocEntryDetailView || queryResultFallbackView
  const detailColumnLabel = t("detail.column")
  const detailValueLabel = t("detail.value")
  const copyFieldValueLabel = t("detail.copyFieldValue")

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Table2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-slate-950">
              {t("detail.title")}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {t("detail.description")}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!item ? (
          <IocPanelEmptyState
            title={t("detail.noSelectionTitle")}
            description={t("detail.noSelection")}
          />
        ) : normalizedDetailView ? (
          <DetailFieldSections
            sections={detailViewSections(normalizedDetailView, detailLocale)}
            columnLabel={detailColumnLabel}
            layout={detailLayout}
            valueLabel={detailValueLabel}
            locale={detailLocale}
            copyLabel={copyFieldValueLabel}
            onCopy={onCopy}
          />
        ) : blacklist ? (
          <DetailFieldTable
            fields={blacklistFields(blacklist)}
            columnLabel={detailColumnLabel}
            layout={detailLayout}
            valueLabel={detailValueLabel}
            locale={detailLocale}
            copyLabel={copyFieldValueLabel}
            onCopy={onCopy}
          />
        ) : loading || (item.verification && !detail) ? (
          <div className="flex min-h-[156px] items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-sky-600" aria-hidden="true" />
            {t("detail.loading")}
          </div>
        ) : (
          <IocPanelEmptyState
            title={t("detail.unavailableTitle")}
            description={t("detail.unavailable")}
          />
        )}
      </div>
    </section>
  )
}
