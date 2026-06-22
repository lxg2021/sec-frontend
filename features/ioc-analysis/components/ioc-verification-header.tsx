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
    <div className={cn("rounded-2xl px-4 py-3", className)}>
      <div className="font-mono text-xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-xs font-medium opacity-70">{label}</div>
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
      className: "bg-slate-50 text-slate-950",
    },
    {
      label: t("summary.whitelist"),
      value: counts.whitelist,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: t("summary.suspicious"),
      value: counts.error,
      className: "bg-orange-50 text-orange-700",
    },
    {
      label: t("summary.danger"),
      value: counts.hit,
      className: "bg-red-50 text-red-700",
    },
  ]

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.07)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-slate-200 bg-white px-3 text-slate-800"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              {t("actions.back")}
            </Button>
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700"
            >
              <Wifi className="size-3.5" aria-hidden="true" />
              {t("onlineBadge")}
            </Badge>
          </div>
          <h1 className="mt-4 line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 xl:w-auto xl:min-w-[520px]">
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
