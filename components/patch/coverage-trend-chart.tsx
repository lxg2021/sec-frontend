"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { PatchCoverageTrendResponse } from "@/lib/patch-dashboard"
import type { SystemType } from "@/lib/patch"

interface CoverageTrendChartProps {
  data: PatchCoverageTrendResponse
  selectedSystem: string
}

const systemLabels = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
}

const systemColors = {
  windows: "#3b82f6", // blue-500
  macos: "#6b7280", // gray-500
  linux: "#f97316", // orange-500
}

export function CoverageTrendChart({ data, selectedSystem }: CoverageTrendChartProps) {
  const { trend } = data

  const getChartData = () => {
    // Filter trend data for the selected system
    const systemTrend = trend.filter((point) => point.system === selectedSystem)
    return systemTrend.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      }),
    }))
  }

  const chartData = getChartData()

  // Calculate trend direction
  const getTrendInfo = () => {
    if (chartData.length > 0) {
      const firstValue = chartData[0]?.coverageRate || 0
      const lastValue = chartData[chartData.length - 1]?.coverageRate || 0
      const trendDirection = lastValue > firstValue ? "up" : "down"
      const trendPercentage = Math.abs(lastValue - firstValue).toFixed(1)
      return { trendDirection, trendPercentage, lastValue }
    }
    return null
  }

  const trendInfo = getTrendInfo()

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">补丁安装覆盖率趋势</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{systemLabels[selectedSystem as SystemType]} • 过去 {chartData.length} 天</p>
          </div>
        </div>
        {trendInfo && (
          <div className="flex items-center gap-2">
            {trendInfo.trendDirection === "up" ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            <Badge variant={trendInfo.trendDirection === "up" ? "default" : "destructive"} className="text-xs font-semibold px-2 py-1">
              {trendInfo.trendDirection === "up" ? "+" : "-"}
              {trendInfo.trendPercentage}%
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 折线图区域 - 使用w-full确保占满容器 */}
          <div className="relative bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg p-4 w-full overflow-x-auto">
            <div className="w-full flex justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <pattern id="grid" width="50" height="20" patternUnits="userSpaceOnUse">
                      <path
                        d="M 50 0 L 0 0 0 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-slate-200 dark:text-slate-700"
                        opacity="0.3"
                      />
                    </pattern>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${value}%`}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "覆盖率"]}
                    labelFormatter={(label) => `日期: ${label}`}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="coverageRate"
                    stroke={systemColors[selectedSystem as keyof typeof systemColors]}
                    strokeWidth={3}
                    dot={{
                      fill: systemColors[selectedSystem as keyof typeof systemColors],
                      strokeWidth: 2,
                      r: 5,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                    }}
                    activeDot={{
                      r: 7,
                      stroke: systemColors[selectedSystem as keyof typeof systemColors],
                      strokeWidth: 3,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                    }}
                    isAnimationActive={false}
                    fill="url(#areaGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 统计信息 */}
          {trendInfo && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{trendInfo.lastValue.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">当前覆盖率</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {Math.max(...chartData.map((t) => t.coverageRate)).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">最高覆盖率</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {(chartData.reduce((sum, t) => sum + t.coverageRate, 0) / chartData.length).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">平均覆盖率</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
