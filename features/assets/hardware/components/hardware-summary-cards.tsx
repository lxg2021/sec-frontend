"use client"

import { Database, PackageSearch } from "lucide-react"

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
        <p className={`mt-5 text-4xl font-semibold leading-none tabular-nums ${tones.value}`}>
          {value.toLocaleString()}
        </p>
      )}
    </div>
  )
}

function OverviewCard({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-emerald-500 to-slate-500 opacity-10 transition-opacity group-hover:opacity-20" />
      <CardHeader className="relative flex flex-row items-center justify-between pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">硬件资产概览</h3>
          <p className="mt-2 text-sm text-slate-500">按型号、设备和主机覆盖范围汇总</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 text-white">
          <PackageSearch className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid gap-8 md:grid-cols-3">
          <MetricItem
            title="型号总数"
            value={Number(summary.model_count || 0)}
            tone="blue"
            isLoading={isLoading}
          />
          <MetricItem
            title="设备总数"
            value={Number(summary.device_count || 0)}
            tone="green"
            isLoading={isLoading}
          />
          <MetricItem
            title="主机数"
            value={Number(summary.covered_host_count || 0)}
            tone="slate"
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function DistributionCard({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  const byCategory = new Map(summary.categories.map((item) => [item.category, item]))
  const maxDeviceCount = Math.max(...summary.categories.map((item) => Number(item.device_count || 0)), 1)

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 opacity-10 transition-opacity group-hover:opacity-20" />
      <CardHeader className="relative flex flex-row items-start justify-between pb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-800">硬件分类分布</h3>
          <p className="mt-2 text-sm text-slate-500">每类展示型号数 / 设备数，进度条按设备数占比绘制</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 p-2 text-white">
          <Database className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))
            : HARDWARE_CATEGORIES.map((category) => {
                const value = byCategory.get(category.value)
                const modelCount = Number(value?.model_count || 0)
                const deviceCount = Number(value?.device_count || 0)
                const percent = Math.max(4, Math.round((deviceCount / maxDeviceCount) * 100))
                return (
                  <div key={category.value} className="grid grid-cols-[72px_120px_minmax(120px,1fr)] items-center gap-4 text-sm">
                    <div className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                      <category.icon className={`h-4 w-4 shrink-0 ${category.color}`} />
                      <span className="truncate">{category.label}</span>
                    </div>
                    <span className="text-right text-sm font-medium tabular-nums text-slate-700">
                      {modelCount.toLocaleString()} 型号 / {deviceCount.toLocaleString()} 设备
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${category.barClassName}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
        </div>
      </CardContent>
    </Card>
  )
}

export function HardwareSummaryCards({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  return (
    <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(420px,0.85fr)_minmax(560px,1.15fr)]">
      <OverviewCard summary={summary} isLoading={isLoading} />
      <DistributionCard summary={summary} isLoading={isLoading} />
    </div>
  )
}
