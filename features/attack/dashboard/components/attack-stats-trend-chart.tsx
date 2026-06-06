"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, Loader2, TrendingUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { fetchAttackStatsTrend } from "@/features/attack/dashboard/api"
import type { AttackTrendPoint, BucketType } from "@/features/attack/dashboard/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

type TrendRange = "24h" | "7d" | "30d"

interface RangeConfig {
  bucketType: BucketType
  hours: number
}

interface ChartPoint {
  time: string
  label: string
  total_instances: number
  total_hosts: number
  total_rules: number
}

const RANGE_CONFIG: Record<TrendRange, RangeConfig> = {
  "24h": { bucketType: "hour", hours: 24 },
  "7d": { bucketType: "day", hours: 24 * 7 },
  "30d": { bucketType: "day", hours: 24 * 30 },
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function toApiTime(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatAxisLabel(value: string, range: TrendRange, locale: string) {
  const date = new Date(value.replace(" ", "T"))
  if (Number.isNaN(date.getTime())) return value

  if (range === "24h") {
    return date.toLocaleTimeString(locale === "zh-CN" ? "zh-CN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return date.toLocaleDateString(locale === "zh-CN" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  })
}

function buildTrendRange(range: TrendRange) {
  const end = new Date()
  const start = new Date(end.getTime() - RANGE_CONFIG[range].hours * 60 * 60 * 1000)
  return {
    bucketType: RANGE_CONFIG[range].bucketType,
    startTime: toApiTime(start),
    endTime: toApiTime(end),
  }
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-slate-700">{label}</div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div className="flex min-w-32 items-center justify-between gap-4" key={item.name}>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{item.value ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AttackStatsTrendChart() {
  const t = useTranslations("pages.attack.dashboard")
  const locale = useLocale()
  const [range, setRange] = useState<TrendRange>("7d")
  const [items, setItems] = useState<AttackTrendPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTrend() {
      setLoading(true)
      setError(null)

      try {
        const params = buildTrendRange(range)
        const result = await fetchAttackStatsTrend({
          ...params,
          timezone: "Asia/Shanghai",
        })
        if (!cancelled) setItems(result)
      } catch (err) {
        console.error("load attack stats trend failed", err)
        if (!cancelled) {
          setItems([])
          setError(err instanceof Error ? err.message : t("trend.loadFailed"))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadTrend()

    return () => {
      cancelled = true
    }
  }, [range, t])

  const chartData = useMemo<ChartPoint[]>(() => {
    return items.map((item) => {
      const time = item.bucket.bucket_start || item.bucket.bucket_end
      return {
        time,
        label: formatAxisLabel(time, range, locale),
        total_instances: item.total_instances,
        total_hosts: item.total_hosts,
        total_rules: item.total_rules,
      }
    })
  }, [items, locale, range])

  const hasData = chartData.length > 0

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex min-w-0 items-center space-x-3">
          <div className="rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 p-2">
            <TrendingUp className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-lg font-semibold text-slate-800 dark:text-white">
              {t("trend.title")}
            </CardTitle>
          </div>
        </div>
        <div className="flex shrink-0 rounded-lg bg-slate-100 p-1">
          {(["24h", "7d", "30d"] as const).map((option) => (
            <button
              type="button"
              key={option}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors",
                range === option && "bg-white text-slate-900 shadow-sm",
              )}
              onClick={() => setRange(option)}
            >
              {t(`trend.ranges.${option}`)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] rounded-lg bg-gradient-to-t from-sky-50 to-transparent p-3">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("trend.loading")}
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-500">{t("trend.loadFailed")}</div>
          ) : !hasData ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">{t("trend.noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 18, bottom: 12, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  allowDecimals={false}
                  width={42}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total_instances"
                  name={t("trend.instances")}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="total_hosts"
                  name={t("trend.hosts")}
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="total_rules"
                  name={t("trend.rules")}
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
            {t("trend.instances")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            {t("trend.hosts")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
            {t("trend.rules")}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
