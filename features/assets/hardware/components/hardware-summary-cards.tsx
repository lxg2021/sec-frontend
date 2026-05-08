"use client"

import type { ComponentType } from "react"
import { Boxes, Database, MonitorCheck, PackageSearch } from "lucide-react"

import { HARDWARE_CATEGORIES } from "@/features/assets/hardware/constants"
import type { HardwareSummary } from "@/features/assets/hardware/types"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

interface HardwareSummaryCardsProps {
  summary: HardwareSummary
  isLoading?: boolean
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
  percent,
  isLoading,
}: {
  title: string
  value: number
  description: string
  icon: ComponentType<{ className?: string }>
  tone: "blue" | "green" | "red"
  percent?: string
  isLoading?: boolean
}) {
  const tones = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      value: "text-slate-800",
    },
    green: {
      gradient: "from-emerald-500 to-emerald-600",
      value: "text-emerald-600",
    },
    red: {
      gradient: "from-rose-500 to-rose-600",
      value: "text-rose-600",
    },
  }[tone]

  return (
    <Card className="group relative min-h-[188px] overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${tones.gradient} opacity-10 transition-opacity group-hover:opacity-20`} />
      <CardHeader className="relative flex flex-row items-center justify-between pb-3">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <div className={`rounded-lg bg-gradient-to-br p-2 ${tones.gradient}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="min-w-0">
          {isLoading ? (
            <Skeleton className="mt-2 h-9 w-20" />
          ) : (
            <div className="mt-2 flex h-10 items-baseline justify-between gap-3">
              <p className={`text-4xl font-semibold leading-none tabular-nums ${tones.value}`}>
                {value.toLocaleString()}
              </p>
              {percent ? (
                <span className="text-sm font-medium tabular-nums text-slate-500">{percent}</span>
              ) : null}
            </div>
          )}
          <p className="mt-3 text-sm text-slate-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DistributionCard({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  const byCategory = new Map(summary.categories.map((item) => [item.category, item]))

  return (
    <Card className="group relative min-h-[188px] overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 opacity-10 transition-opacity group-hover:opacity-20" />
      <CardHeader className="relative flex flex-row items-start justify-between pb-2">
        <div>
          <p className="text-sm font-medium text-slate-600">硬件分类分布</p>
          <p className="mt-2 text-xs text-slate-500">
            覆盖主机 {summary.covered_host_count.toLocaleString()} 台
          </p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 p-2 text-white">
          <Database className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        <div className="space-y-1.5">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))
          : HARDWARE_CATEGORIES.map((category) => {
                const value = byCategory.get(category.value)
                return (
                  <div key={category.value} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <category.icon className={`h-4 w-4 shrink-0 ${category.color}`} />
                      <span className="truncate text-slate-700">{category.label}</span>
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums text-slate-700">
                      {(value?.model_count || 0).toLocaleString()} / {(value?.device_count || 0).toLocaleString()}
                    </span>
                  </div>
                )
              })}
        </div>
      </CardContent>
    </Card>
  )
}

export function HardwareSummaryCards({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  const modelCount = Number(summary.model_count || 0)
  const deviceCount = Number(summary.device_count || 0)
  const recordCount = Number(summary.record_count || 0)
  const coveredHostCount = Number(summary.covered_host_count || 0)
  const deviceRatio = recordCount > 0 ? `${Math.round((deviceCount / recordCount) * 100)}%` : undefined

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="型号总数"
        value={modelCount}
        description="按硬件型号聚合"
        icon={PackageSearch}
        tone="blue"
        isLoading={isLoading}
      />
      <StatCard
        title="设备总数"
        value={deviceCount}
        description="真实硬件设备数量"
        icon={MonitorCheck}
        tone="green"
        percent={deviceRatio}
        isLoading={isLoading}
      />
      <StatCard
        title="明细记录"
        value={recordCount}
        description={`覆盖 ${coveredHostCount.toLocaleString()} 台主机`}
        icon={Boxes}
        tone="red"
        isLoading={isLoading}
      />
      <DistributionCard summary={summary} isLoading={isLoading} />
    </div>
  )
}
