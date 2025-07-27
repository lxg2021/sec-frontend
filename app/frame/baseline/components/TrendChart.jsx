"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { useState } from "react"

export default function TrendChart() {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // 模拟最近7天的合规率数据
  const trendData = [
    { day: "周一", rate: 85.2, date: "12/18" },
    { day: "周二", rate: 86.1, date: "12/19" },
    { day: "周三", rate: 84.8, date: "12/20" },
    { day: "周四", rate: 87.3, date: "12/21" },
    { day: "周五", rate: 88.1, date: "12/22" },
    { day: "周六", rate: 87.9, date: "12/23" },
    { day: "周日", rate: 87.5, date: "12/24" },
  ]

  const maxRate = Math.max(...trendData.map((d) => d.rate))
  const minRate = Math.min(...trendData.map((d) => d.rate))
  const rateRange = maxRate - minRate

  // 计算折线图坐标点 - 增加图表宽度以占满Card
  const chartWidth = 500 // 从400增加到500
  const chartHeight = 160
  const padding = { top: 20, right: 30, bottom: 40, left: 40 } // 增加右边距
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const points = trendData.map((item, index) => {
    const x = padding.left + (index * innerWidth) / (trendData.length - 1)
    const y = padding.top + ((maxRate - item.rate) / rateRange) * innerHeight
    return { x, y, ...item }
  })

  // 生成折线路径
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

  // 生成渐变填充区域路径
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">基线检查趋势</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">最近7天合规率变化趋势</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 折线图区域 - 使用w-full确保占满容器 */}
          <div className="relative bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg p-4 w-full overflow-x-auto">
            <div className="w-full flex justify-center">
              <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                {/* 网格线 */}
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

                {/* 背景网格 */}
                <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

                {/* Y轴刻度线和标签 */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = padding.top + ratio * innerHeight
                  const value = (maxRate - ratio * rateRange).toFixed(1)
                  return (
                    <g key={index}>
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
                        className="text-xs fill-slate-500 dark:fill-slate-400"
                      >
                        {value}%
                      </text>
                    </g>
                  )
                })}

                {/* 填充区域 */}
                <path d={areaPath} fill="url(#areaGradient)" className="opacity-60" />

                {/* 折线 */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                />

                {/* 数据点 */}
                {points.map((point, index) => (
                  <g key={index}>
                    {/* 数据点外圈 */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="6"
                      fill="white"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      className="drop-shadow-sm cursor-pointer transition-all duration-200 hover:r-8"
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* 悬停效果 */}
                    {hoveredPoint === index && (
                      <>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="12"
                          fill="#3b82f6"
                          fillOpacity="0.1"
                          className="animate-ping"
                        />
                        {/* 悬停提示框 */}
                        <g>
                          <rect
                            x={point.x - 35}
                            y={point.y - 45}
                            width="70"
                            height="30"
                            rx="6"
                            fill="rgba(0, 0, 0, 0.8)"
                            className="drop-shadow-lg"
                          />
                          <text
                            x={point.x}
                            y={point.y - 32}
                            textAnchor="middle"
                            className="text-xs fill-white font-medium"
                          >
                            {point.rate}%
                          </text>
                          <text
                            x={point.x}
                            y={point.y - 20}
                            textAnchor="middle"
                            className="text-xs fill-white opacity-80"
                          >
                            {point.date}
                          </text>
                        </g>
                      </>
                    )}
                  </g>
                ))}

                {/* X轴标签 - 调整间距和位置 */}
                {points.map((point, index) => (
                  <g key={index}>
                    <text
                      x={point.x}
                      y={chartHeight - padding.bottom + 15}
                      textAnchor="middle"
                      className="text-xs fill-slate-600 dark:fill-slate-400 font-medium"
                    >
                      {point.day}
                    </text>
                    <text
                      x={point.x}
                      y={chartHeight - padding.bottom + 28}
                      textAnchor="middle"
                      className="text-xs fill-slate-500 dark:fill-slate-500"
                    >
                      {point.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {Math.max(...trendData.map((d) => d.rate)).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">最高合规率</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {(trendData.reduce((sum, d) => sum + d.rate, 0) / trendData.length).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">平均合规率</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                +{(trendData[trendData.length - 1].rate - trendData[0].rate).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">周变化</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
