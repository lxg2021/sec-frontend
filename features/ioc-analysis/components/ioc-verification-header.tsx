"use client"

import { ArrowLeft, ShieldCheck, Wifi } from "lucide-react"
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
        "min-h-11 rounded-2xl px-3 py-2",
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
    <section className="rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_34px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
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
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              {t("description")}
            </p>
          </div>
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
