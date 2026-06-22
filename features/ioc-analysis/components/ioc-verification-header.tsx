"use client"

import { ArrowLeft, Wifi } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

export type IocVerificationHeaderCounts = {
  total: number
  whitelist: number
  error: number
  hit: number
}

function SummaryMetric({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className: string
}) {
  return (
    <div
      className={cn(
        "min-h-11 rounded-2xl px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_18px_rgba(15,23,42,0.08)] ring-1 ring-white/70",
        className,
      )}
    >
      <div className="font-mono text-base font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium leading-none opacity-70">{label}</div>
    </div>
  )
}

export function IocVerificationHeader({
  counts,
  onBack,
}: {
  counts: IocVerificationHeaderCounts
  onBack: () => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const metrics = [
    {
      label: t("summary.total"),
      value: counts.total,
      className: "bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-950",
    },
    {
      label: t("summary.whitelist"),
      value: counts.whitelist,
      className: "bg-gradient-to-br from-white via-emerald-50 to-emerald-100 text-emerald-700",
    },
    {
      label: t("summary.suspicious"),
      value: counts.error,
      className: "bg-gradient-to-br from-white via-orange-50 to-orange-100 text-orange-700",
    },
    {
      label: t("summary.danger"),
      value: counts.hit,
      className: "bg-gradient-to-br from-white via-red-50 to-red-100 text-red-700",
    },
  ]

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_34px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
              {t("title")}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-slate-200 bg-white px-3 text-slate-800 shadow-[0_4px_10px_rgba(15,23,42,0.06)]"
                onClick={onBack}
              >
                <ArrowLeft className="size-4" />
                {t("actions.back")}
              </Button>
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_10px_rgba(37,99,235,0.10)]"
              >
                <Wifi className="size-3.5" aria-hidden="true" />
                {t("onlineBadge")}
              </Badge>
            </div>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            {t("description")}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto xl:min-w-[440px]">
          {metrics.map((metric) => (
            <SummaryMetric
              key={metric.label}
              label={metric.label}
              value={metric.value}
              className={metric.className}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
