"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import type { TrendDataPoint } from "../api"

interface TrendChartProps {
  data: TrendDataPoint[]
  loading?: boolean
}

export default function TrendChart({ data, loading = false }: TrendChartProps) {
  const t = useTranslations("pages.baseline.dashboard.trend")
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [isAnimated, setIsAnimated] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const trendData = data.map((item) => ({
    date: item.date,
    label: item.date,
    rate: Number(item.pass_rate || 0),
  }))

  const hasData = trendData.length > 0
  const rates = hasData ? trendData.map((item) => item.rate) : [0]
  const maxRate = Math.max(...rates)
  const minRate = Math.min(...rates)
  const rateRange = Math.max(maxRate - minRate, 1)

  const minPointSpacing = 80
  const padding = { top: 20, right: 40, bottom: 50, left: 50 }
  const minChartWidth = Math.max(600, trendData.length * minPointSpacing + padding.left + padding.right)
  const chartWidth = Math.max(minChartWidth, containerWidth - 32)
  const chartHeight = 200
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  useEffect(() => {
    if (hasData && !loading) {
      setIsAnimated(false)
      const timer = window.setTimeout(() => setIsAnimated(true), 100)
      return () => window.clearTimeout(timer)
    }
    setIsAnimated(false)
    return undefined
  }, [hasData, loading, data])

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
  const pathLength = points.length > 1 ? innerWidth * 1.5 : 0
  const showAllLabels = trendData.length <= 10
  const labelStep = showAllLabels ? 1 : Math.ceil(trendData.length / 8)

  return (
    <>
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
          <div
            ref={containerRef}
            className="relative w-full overflow-x-auto rounded-lg bg-gradient-to-t from-blue-50 to-transparent p-4 dark:from-blue-900/20"
          >
            {loading ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">{t("loading")}</div>
            ) : !hasData ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">{t("empty")}</div>
            ) : (
              <div className="flex w-full justify-start">
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
                    <clipPath id="baseline-trend-reveal-clip">
                      <rect
                        x={padding.left}
                        y={0}
                        width={isAnimated ? innerWidth + padding.right : 0}
                        height={chartHeight}
                        style={{
                          transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </clipPath>
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
                          x={padding.left - 10}
                          y={y + 6}
                          textAnchor="end"
                          className="fill-slate-500 text-xs dark:fill-slate-400"
                          style={{
                            opacity: isAnimated ? 1 : 0,
                            transition: `opacity 0.5s ease-out ${ratio * 0.1}s`,
                          }}
                        >
                          {value}%
                        </text>
                      </g>
                    )
                  })}

                  <g clipPath="url(#baseline-trend-reveal-clip)">
                    <path
                      d={areaPath}
                      fill="url(#baseline-trend-area)"
                      className="opacity-60"
                      style={{
                        opacity: isAnimated ? 0.6 : 0,
                        transition: "opacity 0.8s ease-out 0.3s",
                      }}
                    />
                  </g>

                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                    style={{
                      strokeDasharray: pathLength,
                      strokeDashoffset: isAnimated ? 0 : pathLength,
                      transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />

                  {points.map((point, index) => (
                    <g key={`${point.date}-${index}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={hoveredPoint === index ? 8 : 5}
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        className="cursor-pointer drop-shadow-sm"
                        style={{
                          opacity: isAnimated ? 1 : 0,
                          transform: isAnimated ? "scale(1)" : "scale(0)",
                          transformOrigin: `${point.x}px ${point.y}px`,
                          transition: `opacity 0.3s ease-out ${0.8 + index * 0.05}s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.8 + index * 0.05}s, r 0.2s ease-out`,
                        }}
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {hoveredPoint === index && (
                        <g
                          style={{
                            opacity: 1,
                            animation: "fadeIn 0.2s ease-out",
                          }}
                        >
                          <rect
                            x={point.x - 40}
                            y={point.y - 50}
                            width="80"
                            height="36"
                            rx="8"
                            fill="rgba(15, 23, 42, 0.9)"
                            className="drop-shadow-lg"
                          />
                          <polygon
                            points={`${point.x - 6},${point.y - 14} ${point.x + 6},${point.y - 14} ${point.x},${point.y - 6}`}
                            fill="rgba(15, 23, 42, 0.9)"
                          />
                          <text x={point.x} y={point.y - 33} textAnchor="middle" className="fill-white text-xs font-semibold">
                            {point.rate.toFixed(2)}%
                          </text>
                          <text x={point.x} y={point.y - 19} textAnchor="middle" className="fill-slate-300 text-xs">
                            {point.date}
                          </text>
                        </g>
                      )}
                    </g>
                  ))}

                  {points.map((point, index) => {
                    const shouldShow = index % labelStep === 0 || index === points.length - 1
                    if (!shouldShow) return null
                    return (
                      <text
                        key={`${point.date}-label-${index}`}
                        x={point.x}
                        y={chartHeight - padding.bottom + 28}
                        textAnchor="middle"
                        className="fill-slate-600 text-xs font-medium dark:fill-slate-400"
                        style={{
                          opacity: isAnimated ? 1 : 0,
                          transform: isAnimated ? "translateY(0)" : "translateY(10px)",
                          transition: `opacity 0.4s ease-out ${0.6 + index * 0.03}s, transform 0.4s ease-out ${0.6 + index * 0.03}s`,
                        }}
                      >
                        {point.label}
                      </text>
                    )
                  })}
                </svg>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div
              className="text-center"
              style={{
                opacity: isAnimated ? 1 : 0,
                transform: isAnimated ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease-out 1s, transform 0.5s ease-out 1s",
              }}
            >
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {loading ? "..." : `${maxRate.toFixed(2)}%`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("highest")}</div>
            </div>
            <div
              className="text-center"
              style={{
                opacity: isAnimated ? 1 : 0,
                transform: isAnimated ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease-out 1.1s, transform 0.5s ease-out 1.1s",
              }}
            >
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {loading ? "..." : `${averageRate.toFixed(2)}%`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("average")}</div>
            </div>
            <div
              className="text-center"
              style={{
                opacity: isAnimated ? 1 : 0,
                transform: isAnimated ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.5s ease-out 1.2s, transform 0.5s ease-out 1.2s",
              }}
            >
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {loading ? "..." : `${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)}%`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("change")}</div>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
