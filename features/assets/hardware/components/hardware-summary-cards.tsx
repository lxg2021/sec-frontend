"use client"

import { Database, PackageSearch } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { HARDWARE_CATEGORIES } from "@/features/assets/hardware/constants"
import type { HardwareSummary } from "@/features/assets/hardware/types"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

interface HardwareSummaryCardsProps {
  summary: HardwareSummary
  isLoading?: boolean
}

function MetricItem({
  title,
  value,
  tone,
  isLoading,
}: {
  title: string
  value: number
  tone: "blue" | "green" | "slate"
  isLoading?: boolean
}) {
  const locale = useLocale()
  const tones = {
    blue: {
      value: "text-blue-600",
      dot: "bg-blue-500",
    },
    green: {
      value: "text-emerald-600",
      dot: "bg-emerald-500",
    },
    slate: {
      value: "text-slate-800",
      dot: "bg-slate-500",
    },
  }[tone]

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${tones.dot}`} />
        <span className="text-sm font-medium text-slate-600">{title}</span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-5 h-10 w-24" />
      ) : (
        <p className={`mt-4 text-3xl font-semibold leading-none tabular-nums ${tones.value}`}>
          {value.toLocaleString(locale)}
        </p>
      )}
    </div>
  )
}

function OverviewCard({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  const t = useTranslations("pages.assets.hardware.inventory")

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-10 transition-opacity group-hover:opacity-20" />
      <CardHeader className="relative flex flex-row items-center justify-between pb-3">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("summary.overviewTitle")}
        </h3>
        <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-2">
          <PackageSearch className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid gap-8 md:grid-cols-3">
          <MetricItem
            title={t("summary.modelCount")}
            value={Number(summary.model_count || 0)}
            tone="blue"
            isLoading={isLoading}
          />
          <MetricItem
            title={t("summary.deviceCount")}
            value={Number(summary.device_count || 0)}
            tone="green"
            isLoading={isLoading}
          />
          <MetricItem
            title={t("summary.hostCount")}
            value={Number(summary.covered_host_count || 0)}
            tone="slate"
            isLoading={isLoading}
          />
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {t("summary.overviewDescription")}
        </p>
      </CardContent>
    </Card>
  )
}

function DistributionCard({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  const t = useTranslations("pages.assets.hardware.inventory")
  const locale = useLocale()
  const byCategory = new Map(summary.categories.map((item) => [item.category, item]))

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 opacity-10 transition-opacity group-hover:opacity-20" />
      <CardHeader className="relative flex flex-row items-center justify-between pb-3">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("summary.distributionTitle")}
        </h3>
        <div className="rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-700 p-2">
          <Database className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid gap-x-8 gap-y-4 2xl:grid-cols-2">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))
            : HARDWARE_CATEGORIES.map((category) => {
                const categoryLabel = t(`categories.${category.value}`)
                const value = byCategory.get(category.value)
                const modelCount = Number(value?.model_count || 0)
                const deviceCount = Number(value?.device_count || 0)
                const percent = deviceCount > 0
                  ? Math.min(100, Math.max(0, Math.round((modelCount / deviceCount) * 100)))
                  : 0
                return (
                  <div key={category.value} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(120px,138px)_minmax(132px,auto)_minmax(100px,1fr)]">
                    <div className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                      <category.icon className={`h-4 w-4 shrink-0 ${category.color}`} />
                      <span className="truncate">{categoryLabel}</span>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                      <span>{modelCount.toLocaleString(locale)}</span>
                      <span>{t("units.models")}</span>
                      <span className="text-center text-slate-400">/</span>
                      <span>{deviceCount.toLocaleString(locale)}</span>
                      <span>{t("units.devices")}</span>
                    </div>
                    <div
                      className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-200 sm:col-span-1"
                      aria-label={t("summary.ratioAria", { category: categoryLabel, percent })}
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      title={`${percent}%`}
                    >
                      <div
                        className={`h-full rounded-full ${category.barClassName}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {t("summary.distributionDescription")}
        </p>
      </CardContent>
    </Card>
  )
}

export function HardwareSummaryCards({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  return (
    <div className="grid shrink-0 gap-4 xl:grid-cols-[minmax(420px,0.85fr)_minmax(560px,1.15fr)]">
      <OverviewCard summary={summary} isLoading={isLoading} />
      <DistributionCard summary={summary} isLoading={isLoading} />
    </div>
  )
}
