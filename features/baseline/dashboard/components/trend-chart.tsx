"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import type { TrendDataPoint } from "../api"

interface TrendChartProps {
  data: TrendDataPoint[]
  loading?: boolean
}

function formatDateLabel(value: string) {
  const normalized = value.includes("/") ? value.replaceAll("/", "-") : value
  const parsed = new Date(`${normalized.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`
}

export default function TrendChart({ data, loading = false }: TrendChartProps) {
  const t = useTranslations("pages.baseline.dashboard.trend")
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const trendData = data.map((item) => ({
    date: formatDateLabel(item.date),
    rate: Number(item.pass_rate || 0),
  }))

  const hasData = trendData.length > 0
  const rates = hasData ? trendData.map((item) => item.rate) : [0]
  const maxRate = Math.max(...rates)
  const minRate = Math.min(...rates)
  const rateRange = Math.max(maxRate - minRate, 1)

  const chartWidth = 500
  const chartHeight = 160
  const padding = { top: 20, right: 30, bottom: 40, left: 40 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const points = trendData.map((item, index) => {
    const denominator = Math.max(trendData.length - 1, 1)
    const x = padding.left + (index * innerWidth) / denominator
    const y = padding.top + ((maxRate - item.rate) / rateRange) * innerHeight
    return { x, y, ...item }
  })

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`
    : ""
  const averageRate = hasData ? trendData.reduce((sum, item) => sum + item.rate, 0) / trendData.length : 0
  const weeklyChange = hasData ? trendData[trendData.length - 1].rate - trendData[0].rate : 0

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">{t("title")}</CardTitle>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative w-full overflow-x-auto rounded-lg bg-gradient-to-t from-blue-50 to-transparent p-4 dark:from-blue-900/20">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">{t("loading")}</div>
            ) : !hasData ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">{t("empty")}</div>
            ) : (
              <div className="flex w-full justify-center">
                <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                  <defs>
                    <pattern id="baseline-trend-grid" width="50" height="20" patternUnits="userSpaceOnUse">
                      <path
                        d="M 50 0 L 0 0 0 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-slate-200 dark:text-slate-700"
                        opacity="0.3"
                      />
                    </pattern>
                    <linearGradient id="baseline-trend-area" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  <rect width={chartWidth} height={chartHeight} fill="url(#baseline-trend-grid)" />
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padding.top + ratio * innerHeight
                    const value = (maxRate - ratio * rateRange).toFixed(1)
                    return (
                      <g key={ratio}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-slate-300 dark:text-slate-600"
                          opacity="0.5"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-500 text-xs dark:fill-slate-400"
                        >
                          {value}%
                        </text>
                      </g>
                    )
                  })}

                  <path d={areaPath} fill="url(#baseline-trend-area)" className="opacity-60" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                  />

                  {points.map((point, index) => (
                    <g key={`${point.date}-${index}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        className="cursor-pointer drop-shadow-sm transition-all duration-200 hover:r-8"
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {hoveredPoint === index && (
                        <g>
                          <rect x={point.x - 35} y={point.y - 45} width="70" height="30" rx="6" fill="rgba(0, 0, 0, 0.8)" />
                          <text x={point.x} y={point.y - 32} textAnchor="middle" className="fill-white text-xs font-medium">
                            {point.rate.toFixed(2)}%
                          </text>
                          <text x={point.x} y={point.y - 20} textAnchor="middle" className="fill-white text-xs opacity-80">
                            {point.date}
                          </text>
                        </g>
                      )}
                    </g>
                  ))}

                  {points.map((point, index) => (
                    <text
                      key={`${point.date}-label-${index}`}
                      x={point.x}
                      y={chartHeight - padding.bottom + 20}
                      textAnchor="middle"
                      className="fill-slate-600 text-xs font-medium dark:fill-slate-400"
                    >
                      {point.date}
                    </text>
                  ))}
                </svg>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {loading ? "..." : `${maxRate.toFixed(2)}%`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("highest")}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {loading ? "..." : `${averageRate.toFixed(2)}%`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("average")}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {loading ? "..." : `${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)}%`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("change")}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
