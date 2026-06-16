"use client"

import { ChartNoAxesCombined } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"

export function ThreatAnalysisPageHeader({ className }: { className?: string }) {
  const t = useTranslations("pages.aiops.threatAnalysis")

  return (
    <header
      className={cn(
        "w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            <ChartNoAxesCombined className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate text-lg font-semibold text-slate-950">{t("title")}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="inline-flex h-7 items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-teal-600">
                {t("header.badge")}
              </span>
              <span className="text-slate-500">
                {t("header.category")} <span className="px-1 text-slate-200">/</span>
                {t("title")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
