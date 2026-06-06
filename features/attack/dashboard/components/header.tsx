"use client"

import type { ReactNode } from "react"
import { Activity, AlertTriangle, Layers3, Server } from "lucide-react"
import { useTranslations } from "next-intl"

import type { AttackOverview } from "@/features/attack/dashboard/types"
import type { AttckData, Severity } from "@/features/attack/utils/attck-utils"
import { countsFromSeverityEntries } from "@/features/attack/utils/attck-utils"

interface HeaderProps {
  data: AttckData
  overview: AttackOverview
}

const colorMap: Record<Severity, { chip: string; bar: string }> = {
  高: { chip: "bg-red-100 text-red-700", bar: "bg-red-500" },
  中: { chip: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
  低: { chip: "bg-green-100 text-green-700", bar: "bg-green-500" },
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value || 0)
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  children,
}: {
  title: string
  value: number
  icon: typeof Activity
  color: string
  children?: ReactNode
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 transition-opacity group-hover:opacity-10`} />
      <div className="relative flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</div>
        <div className={`rounded-lg bg-gradient-to-br p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
      </div>
      <div className="relative p-6 pt-2">
        <div className="flex items-baseline justify-between">
          <div className={`bg-gradient-to-br ${color} bg-clip-text text-2xl font-bold text-transparent`}>
            {formatCount(value)}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function AttckHeader({ data, overview }: HeaderProps) {
  const t = useTranslations("pages.attack.dashboard.header")
  const sevCounts = countsFromSeverityEntries(data.severity)
  const totalCount = (sevCounts["高"] ?? 0) + (sevCounts["中"] ?? 0) + (sevCounts["低"] ?? 0)
  const barTotal = totalCount || 1

  const segments: { key: Severity; labelKey: "high" | "medium" | "low"; value: number }[] = [
    { key: "高", labelKey: "high", value: sevCounts["高"] ?? 0 },
    { key: "中", labelKey: "medium", value: sevCounts["中"] ?? 0 },
    { key: "低", labelKey: "low", value: sevCounts["低"] ?? 0 },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="涉及规则" value={overview.total_rules} icon={Activity} color="from-blue-400 to-indigo-600">
        <p className="mt-1 text-xs text-slate-500">命中的检测规则数量</p>
      </StatCard>

      <StatCard title="攻击活动" value={overview.total_instances} icon={Layers3} color="from-violet-400 to-purple-600">
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">攻击实例</span>
          <span className="font-semibold text-slate-950">{formatCount(overview.total_instances)}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">攻击场景</span>
          <span className="font-semibold text-slate-950">{formatCount(overview.total_cases)}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">攻击分组</span>
          <span className="font-semibold text-slate-950">{formatCount(overview.total_groups)}</span>
        </div>
      </StatCard>

      <StatCard title="受影响主机" value={overview.total_hosts} icon={Server} color="from-green-400 to-emerald-600">
        <p className="mt-1 text-xs text-slate-500">涉及到的主机数量</p>
      </StatCard>

      <div className="group relative overflow-hidden rounded-lg border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 opacity-5 transition-opacity group-hover:opacity-10" />
        <div className="relative flex flex-row items-center justify-between space-y-0 p-6 pb-2">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">安全等级</div>
          <div className="rounded-lg bg-gradient-to-br from-yellow-400 to-red-500 p-2">
            <AlertTriangle className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </div>
        <div className="relative p-6 pt-2">
          <div className="mb-2 text-xs text-muted-foreground">{t("total", { total: totalCount })}</div>
          <div className="mb-2 flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {segments.map((seg) => {
              const widthPct = `${Math.round((seg.value / barTotal) * 100)}%`
              return (
                <div
                  key={seg.key}
                  className={colorMap[seg.key].bar}
                  style={{ width: widthPct }}
                  title={`${t(`severity.${seg.labelKey}`)}: ${seg.value}`}
                />
              )
            })}
          </div>
          <div className="flex w-full items-center justify-evenly">
            {segments.map((seg) => (
              <span
                key={seg.key}
                className={`rounded-full px-2 py-0.5 text-xs ${colorMap[seg.key].chip}`}
                title={`${t(`severity.${seg.labelKey}`)}: ${seg.value}`}
              >
                {t(`severity.${seg.labelKey}`)} {seg.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
