"use client"

import { PieChart } from "lucide-react"
import { useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import type { BaselineDailyStatsData } from "../api"

interface RiskChartProps {
  data: BaselineDailyStatsData | null
  loading?: boolean
}

function percentage(count: number, total: number) {
  if (!total) return 0
  return Number(((count / total) * 100).toFixed(1))
}

export default function RiskChart({ data, loading = false }: RiskChartProps) {
  const t = useTranslations("pages.baseline.dashboard.risk")
  const itemStats = data?.item_stats
  const riskData = [
    { level: t("low"), count: itemStats?.low_items ?? 0, color: "#10b981" },
    { level: t("medium"), count: itemStats?.medium_items ?? 0, color: "#f59e0b" },
    { level: t("high"), count: itemStats?.high_items ?? 0, color: "#ef4444" },
  ].map((item) => ({
    ...item,
    percentage: percentage(item.count, itemStats?.total_items ?? 0),
  }))

  const total = riskData.reduce((sum, item) => sum + item.count, 0)
  const circumference = 2 * Math.PI * 40
  let offset = 0

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-2">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">{t("title")}</CardTitle>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-700"
                />
                {riskData.map((item) => {
                  const dash = `${(item.percentage / 100) * circumference} ${circumference}`
                  const currentOffset = -offset
                  offset += (item.percentage / 100) * circumference

                  return (
                    <circle
                      key={item.level}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="8"
                      strokeDasharray={dash}
                      strokeDashoffset={currentOffset}
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800 dark:text-white">{loading ? "..." : total}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t("total")}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {riskData.map((item) => (
              <div
                key={item.level}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.level}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {loading ? "..." : t("count", { count: item.count })}
                  </span>
                  <span className="min-w-[2.5rem] text-right text-sm font-semibold text-slate-800 dark:text-white">
                    {loading ? "..." : `${item.percentage}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
