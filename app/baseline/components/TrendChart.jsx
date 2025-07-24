"use client"

import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, ReferenceLine } from "recharts"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3, Activity, Target, Zap, RefreshCw } from "lucide-react"

const trendData = [
  { date: "12-18", compliance: 82.3, target: 85, incidents: 12, status: "warning" },
  { date: "12-19", compliance: 84.1, target: 85, incidents: 8, status: "warning" },
  { date: "12-20", compliance: 85.8, target: 85, incidents: 6, status: "good" },
  { date: "12-21", compliance: 87.2, target: 85, incidents: 4, status: "good" },
  { date: "12-22", compliance: 86.5, target: 85, incidents: 7, status: "good" },
  { date: "12-23", compliance: 88.7, target: 85, incidents: 3, status: "excellent" },
  { date: "12-24", compliance: 89.4, target: 85, incidents: 2, status: "excellent" },
]

export default function TrendChart() {
  const [chartType, setChartType] = useState("area")
  const [showTarget, setShowTarget] = useState(true)
  const [animationKey, setAnimationKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleChartTypeChange = (type) => {
    setChartType(type)
    setAnimationKey((prev) => prev + 1)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setAnimationKey((prev) => prev + 1)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const currentValue = trendData[trendData.length - 1].compliance
  const previousValue = trendData[trendData.length - 2].compliance
  const trend = currentValue > previousValue ? "up" : "down"
  const trendValue = Math.abs(currentValue - previousValue).toFixed(1)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const data = payload[0].payload
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xl p-4 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-medium text-slate-500">检查日期</span>
              <span className="font-bold text-slate-700 text-sm">{label}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase tracking-wide">合规率</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-slate-600">{data.compliance}%</span>
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-slate-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-slate-500" />
                  )}
                </div>
              </div>

              {showTarget && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">目标值</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-slate-600">{data.target}%</span>
                    <Target className="h-3 w-3 text-slate-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 uppercase tracking-wide">安全事件</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-600">{data.incidents}起</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    data.incidents <= 3 ? "bg-slate-400" : data.incidents <= 7 ? "bg-slate-500" : "bg-slate-600"
                  } animate-pulse`}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props) => {
    const { cx, cy, payload } = props

    if (!payload || typeof payload.compliance === "undefined") {
      return null
    }

    const status = payload.status
    const dotColor =
      status === "excellent" ? "#64748b" : status === "good" ? "#475569" : status === "warning" ? "#6b7280" : "#71717a"

    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="white" stroke={dotColor} strokeWidth={2} className="animate-pulse" />
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="none"
          stroke={dotColor}
          strokeWidth={1}
          opacity={0.4}
          className="animate-ping"
        />
      </g>
    )
  }

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={chartType === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChartTypeChange("area")}
            className="h-8 px-3 bg-gradient-to-r from-slate-500 to-slate-600 border-slate-300 text-white hover:from-slate-600 hover:to-slate-700 shadow-md font-medium rounded-lg text-xs"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            面积图
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChartTypeChange("line")}
            className="h-8 px-3 bg-gradient-to-r from-gray-500 to-gray-600 border-gray-300 text-white hover:from-gray-600 hover:to-gray-700 shadow-md font-medium rounded-lg text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            线图
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 bg-gradient-to-r from-slate-600 to-gray-700 border-slate-300 text-white hover:from-slate-700 hover:to-gray-800 shadow-md font-medium rounded-lg text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={showTarget}
              onChange={(e) => setShowTarget(e.target.checked)}
              className="rounded border-slate-300 bg-white text-slate-600 focus:ring-slate-500 w-3 h-3"
            />
            <span className="text-slate-500 font-medium">显示目标线</span>
          </label>

          <div className="flex items-center space-x-2 px-3 py-1 bg-white/40 backdrop-blur-xl rounded-lg border border-slate-200/50 shadow-md">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-slate-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-slate-500" />
            )}
            <span className="text-xs font-bold text-slate-600">
              {trend === "up" ? "+" : "-"}
              {trendValue}%
            </span>
            <Zap className="h-3 w-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="relative bg-white/30 backdrop-blur-xl rounded-xl p-4 border border-slate-200/50 shadow-lg">
        <ResponsiveContainer width="100%" height={300} key={animationKey}>
          {chartType === "area" ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#71717a" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#6b7280" />
                  <stop offset="100%" stopColor="#71717a" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontWeight: "500" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={[78, 92]}
                tick={{ fill: "#64748b", fontWeight: "500" }}
              />
              <Tooltip content={<CustomTooltip />} />

              {showTarget && (
                <ReferenceLine y={85} stroke="#475569" strokeDasharray="8 8" strokeWidth={2} opacity={0.8} />
              )}

              <Area
                type="monotone"
                dataKey="compliance"
                stroke="url(#strokeGradient)"
                strokeWidth={3}
                fill="url(#areaGradient)"
                dot={<CustomDot />}
                animationDuration={1500}
                animationBegin={200}
              />
            </AreaChart>
          ) : (
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#6b7280" />
                  <stop offset="100%" stopColor="#71717a" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontWeight: "500" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={[78, 92]}
                tick={{ fill: "#64748b", fontWeight: "500" }}
              />
              <Tooltip content={<CustomTooltip />} />

              {showTarget && (
                <ReferenceLine y={85} stroke="#475569" strokeDasharray="8 8" strokeWidth={2} opacity={0.8} />
              )}

              <Line
                type="monotone"
                dataKey="compliance"
                strokeWidth={3}
                stroke="url(#lineGradient)"
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={<CustomDot />}
                animationDuration={1500}
                animationBegin={200}
              />
            </LineChart>
          )}
        </ResponsiveContainer>

        {/* 状态指示器 */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
            <span className="text-slate-500 font-medium">实时监控</span>
          </div>
        </div>
      </div>
    </div>
  )
}
