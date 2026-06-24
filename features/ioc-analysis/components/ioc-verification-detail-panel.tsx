"use client"

import { Loader2, Table2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import type { IocVerificationItem } from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"

import { DetailFieldSections, DetailFieldTable } from "./ioc-detail/detail-table"
import { IocEntryDetailView } from "./ioc-detail/detail-legacy"
import { normalizeDetailLocale } from "./ioc-detail/detail-fields"
import { blacklistFields } from "./ioc-detail/detail-legacy-fields"
import { detailViewSections } from "./ioc-detail/detail-sections"

export function IocVerificationDetailPanel({
  className,
  item,
  onCopy,
}: {
  className?: string
  item: IocVerificationItem | null
  onCopy: (value: string) => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const locale = useLocale()
  const detailLocale = normalizeDetailLocale(locale)

  const detail = item?.verification_detail ?? null
  const detailView = detail?.detail_view ?? null
  const iocEntry = detail?.hit_source_detail?.ioc_entry ?? null
  const blacklist = detail?.hit_source_detail?.blacklist_indicator ?? null
  const detailColumnLabel = t("detail.column")
  const detailValueLabel = t("detail.value")
  const copyFieldValueLabel = t("detail.copyFieldValue")
  const legacyLabels = {
    observations: t("detail.observations"),
    sourceName: t("detail.sourceName"),
    confidence: t("detail.confidence"),
    lastSeen: t("detail.lastSeen"),
    evidence: t("detail.evidence"),
    relations: t("detail.relations"),
    direction: t("detail.direction"),
    relationType: t("detail.relationType"),
    peerEntryId: t("detail.peerEntryId"),
  }

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
            <h3 className="text-sm font-semibold text-slate-950">
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
          <div className="flex min-h-[156px] items-center justify-center px-4 py-8 text-sm text-slate-500">
            {t("detail.noSelection")}
          </div>
        ) : detailView ? (
          <DetailFieldSections
            sections={detailViewSections(detailView, detailLocale)}
            columnLabel={detailColumnLabel}
            valueLabel={detailValueLabel}
            locale={detailLocale}
            copyLabel={copyFieldValueLabel}
            onCopy={onCopy}
          />
        ) : iocEntry ? (
          <IocEntryDetailView
            detail={iocEntry}
            columnLabel={detailColumnLabel}
            valueLabel={detailValueLabel}
            locale={detailLocale}
            copyLabel={copyFieldValueLabel}
            labels={legacyLabels}
            onCopy={onCopy}
          />
        ) : blacklist ? (
          <DetailFieldTable
            fields={blacklistFields(blacklist)}
            columnLabel={detailColumnLabel}
            valueLabel={detailValueLabel}
            locale={detailLocale}
            copyLabel={copyFieldValueLabel}
            onCopy={onCopy}
          />
        ) : item.verification && !detail ? (
          <div className="flex min-h-[156px] items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-sky-600" aria-hidden="true" />
            {t("detail.loading")}
          </div>
        ) : (
          <div className="min-h-[156px] px-4 py-5">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              {t("detail.unavailable")}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
