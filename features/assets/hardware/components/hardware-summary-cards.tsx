"use client"

import type { ComponentType } from "react"
import { Boxes, Database, MonitorCheck, PackageSearch } from "lucide-react"

import { HARDWARE_CATEGORIES, getHardwareCategoryMeta } from "@/features/assets/hardware/constants"
import type { HardwareSummary } from "@/features/assets/hardware/types"
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
      wrapper: "bg-blue-50/80",
      icon: "bg-blue-600 text-white",
      value: "text-slate-800",
    },
    green: {
      wrapper: "bg-emerald-50/80",
      icon: "bg-emerald-500 text-white",
      value: "text-emerald-600",
    },
    red: {
      wrapper: "bg-rose-50/80",
      icon: "bg-rose-500 text-white",
      value: "text-rose-600",
    },
  }[tone]

  return (
    <div className={`min-h-[134px] rounded-lg p-6 shadow-lg shadow-slate-200/70 ${tones.wrapper}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-7 h-9 w-20" />
          ) : (
            <p className={`mt-6 text-4xl font-semibold leading-none tabular-nums ${tones.value}`}>
              {value.toLocaleString()}
            </p>
          )}
          <p className="mt-3 text-sm text-slate-600">{description}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {percent ? (
        <div className="mt-[-34px] text-right text-sm font-medium text-slate-500">
          {percent}
        </div>
      ) : null}
    </div>
  )
}

function DistributionCard({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  const byCategory = new Map(summary.categories.map((item) => [item.category, item]))

  return (
    <div className="min-h-[134px] rounded-lg bg-slate-100/80 p-6 shadow-lg shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">硬件分类分布</p>
          <p className="mt-2 text-xs text-slate-500">
            覆盖主机 {summary.covered_host_count.toLocaleString()} 台
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-600 text-white">
          <Database className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))
          : HARDWARE_CATEGORIES.slice(0, 4).map((category) => {
              const value = byCategory.get(category.value)
              return (
                <div key={category.value} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <category.icon className={`h-4 w-4 shrink-0 ${category.color}`} />
                    <span className="truncate text-slate-700">{category.label}</span>
                  </div>
                  <span className="font-medium tabular-nums text-slate-700">
                    {(value?.model_count || 0).toLocaleString()} / {(value?.device_count || 0).toLocaleString()}
                  </span>
                </div>
              )
            })}
      </div>
    </div>
  )
}

export function HardwareSummaryCards({ summary, isLoading = false }: HardwareSummaryCardsProps) {
  const modelCount = Number(summary.model_count || 0)
  const deviceCount = Number(summary.device_count || 0)
  const recordCount = Number(summary.record_count || 0)
  const coveredHostCount = Number(summary.covered_host_count || 0)
  const deviceRatio = recordCount > 0 ? `${Math.round((deviceCount / recordCount) * 100)}%` : undefined

  return (
    <div className="grid gap-5 xl:grid-cols-4">
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
