"use client"

import { useEffect, useState } from "react"
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
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const itemStats = data?.item_stats
  const totalItems = itemStats?.total_items ?? 0

  const riskData = [
    { level: t("low"), count: itemStats?.low_items ?? 0, color: "#10b981" },
    { level: t("medium"), count: itemStats?.medium_items ?? 0, color: "#f59e0b" },
    { level: t("high"), count: itemStats?.high_items ?? 0, color: "#ef4444" },
  ].map((item) => ({
    ...item,
    percentage: percentage(item.count, totalItems),
  }))

  const circumference = 2 * Math.PI * 70

  useEffect(() => {
    if (loading) {
      setAnimationProgress(0)
      return
    }

    const timer = setTimeout(() => {
      const duration = 1000
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        setAnimationProgress(easedProgress)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, 100)

    return () => clearTimeout(timer)
  }, [loading, data])

  let offset = 0

  return (
    <Card className="h-full border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
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
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 lg:flex-row">
          <div className="relative flex items-center justify-center">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r={70}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  className="text-slate-200 dark:text-slate-700"
                />
                {riskData.map((item, index) => {
                  const segmentLength = (item.percentage / 100) * circumference
                  const animatedLength = segmentLength * animationProgress
                  const dash = `${animatedLength} ${circumference}`
                  const currentOffset = -offset * animationProgress
                  offset += segmentLength

                  const isHovered = hoveredIndex === index

                  return (
                    <circle
                      key={item.level}
                      cx="90"
                      cy="90"
                      r={70}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={isHovered ? 20 : 16}
                      strokeDasharray={dash}
                      strokeDashoffset={currentOffset}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        filter: isHovered ? `drop-shadow(0 0 8px ${item.color})` : "none",
                        transform: `scale(${isHovered ? 1.02 : 1})`,
                        transformOrigin: "center",
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  )
                })}
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold text-slate-800 transition-all duration-500 sm:text-4xl dark:text-white"
                    style={{
                      opacity: animationProgress,
                      transform: `scale(${0.5 + animationProgress * 0.5})`,
                    }}
                  >
                    {loading ? "..." : totalItems}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t("total")}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3 lg:min-w-[200px] lg:w-auto">
            {riskData.map((item, index) => {
              const isHovered = hoveredIndex === index
              return (
                <div
                  key={item.level}
                  className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors duration-200 ${
                    isHovered ? "bg-slate-100 dark:bg-slate-700" : "bg-slate-50 dark:bg-slate-800/50"
                  }`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.level}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {loading ? "..." : `${item.count} 项`}
                    </span>
                    <div className="min-w-[3.5rem] text-right" style={{ opacity: animationProgress }}>
                      <span className="text-sm font-bold" style={{ color: item.color }}>
                        {loading ? "..." : `${(item.percentage * animationProgress).toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
