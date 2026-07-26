"use client"

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export interface DistributionRingItem {
  key: string
  label: string
  value: number
  color: string
}

interface DistributionRingCardProps {
  appearance?: "default" | "dashboard"
  className?: string
  title: string
  description?: string
  totalLabel: string
  items: DistributionRingItem[]
  totalValue?: number
  loading?: boolean
  icon?: ReactNode
  emptyText?: string
  formatValue?: (value: number) => string
}

function percentage(value: number, total: number) {
  if (!total) return 0
  return Number(((value / total) * 100).toFixed(1))
}

export function DistributionRingCard({
  appearance = "default",
  className,
  title,
  description,
  totalLabel,
  items,
  totalValue,
  loading = false,
  icon,
  emptyText,
  formatValue,
}: DistributionRingCardProps) {
  const isDashboardAppearance = appearance === "dashboard"
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const resolvedTotal = totalValue ?? items.reduce((sum, item) => sum + item.value, 0)
  const chartData = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        percentage: percentage(item.value, resolvedTotal),
      })),
    [items, resolvedTotal],
  )

  const circumference = 2 * Math.PI * 70
  const center = 90
  const minRadius = 56
  const maxRadius = 86

  useEffect(() => {
    if (loading) {
      setAnimationProgress(0)
      return
    }

    const timer = window.setTimeout(() => {
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

    return () => window.clearTimeout(timer)
  }, [loading, items, resolvedTotal])

  const handlePieMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!resolvedTotal || !chartData.length) {
      setHoveredIndex(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const x = ((event.clientX - rect.left) / rect.width) * 180
    const y = ((event.clientY - rect.top) / rect.height) * 180
    const dx = x - center
    const dy = y - center
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minRadius || distance > maxRadius) {
      setHoveredIndex(null)
      return
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    const normalized = (angle + 450) % 360
    const targetPercent = (normalized / 360) * 100

    let accumulated = 0
    for (let index = 0; index < chartData.length; index += 1) {
      const nextAccumulated = accumulated + chartData[index].percentage
      if (targetPercent >= accumulated && targetPercent < nextAccumulated) {
        setHoveredIndex(index)
        return
      }
      accumulated = nextAccumulated
    }

    setHoveredIndex(null)
  }

  const renderHeader = () => (
    <CardHeader
      className={cn(
        "flex flex-row items-center justify-between pb-2",
        isDashboardAppearance && "px-5 pb-3 pt-5",
      )}
    >
      <div className="flex items-center space-x-3">
        {icon ? (
          <div
            className={cn(
              "bg-gradient-to-br from-purple-500 to-purple-600",
              isDashboardAppearance
                ? "flex size-10 shrink-0 items-center justify-center rounded-xl"
                : "rounded-lg p-2",
            )}
          >
            {icon}
          </div>
        ) : null}
        <div>
          <CardTitle
            className={cn(
              "text-lg font-semibold text-slate-800 dark:text-white",
              isDashboardAppearance && "text-base font-medium text-slate-950",
            )}
          >
            {title}
          </CardTitle>
          {description ? (
            <p
              className={cn(
                "mt-1 text-sm text-slate-600 dark:text-slate-300",
                isDashboardAppearance && "text-xs leading-5 text-slate-500",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </CardHeader>
  )

  const cardClassName = cn(
    "h-full border-0 shadow-lg",
    isDashboardAppearance &&
      "min-w-0 rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    className,
  )

  if (!loading && resolvedTotal === 0 && emptyText) {
    return (
      <Card className={cardClassName}>
        {renderHeader()}
        <CardContent className={cn("flex h-64 items-center justify-center", isDashboardAppearance && "px-5 pb-5")}>
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    )
  }

  let offset = 0

  return (
    <Card className={cardClassName}>
      {renderHeader()}
      <CardContent className={cn("flex flex-1 flex-col", isDashboardAppearance && "px-5 pb-5")}>
        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-6 lg:flex-row",
            isDashboardAppearance && "lg:flex-col xl:flex-row",
          )}
        >
          <div className="relative flex items-center justify-center">
            <div
              className="relative h-56 w-56 sm:h-64 sm:w-64"
              onMouseMove={handlePieMouseMove}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <svg className="h-full w-full -rotate-90 transform cursor-pointer" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r={70}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  className="text-slate-200 dark:text-slate-700"
                />
                {chartData.map((item, index) => {
                  const segmentLength = (item.percentage / 100) * circumference
                  const animatedLength = segmentLength * animationProgress
                  const dash = `${animatedLength} ${circumference}`
                  const currentOffset = -offset * animationProgress
                  offset += segmentLength

                  const isHovered = hoveredIndex === index
                  const isDimmed = hoveredIndex !== null && !isHovered

                  return (
                    <g key={item.key}>
                      <circle
                        cx="90"
                        cy="90"
                        r={70}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={28}
                        strokeDasharray={dash}
                        strokeDashoffset={currentOffset}
                        strokeLinecap="round"
                        className="pointer-events-none"
                      />
                      <circle
                        cx="90"
                        cy="90"
                        r={70}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={isHovered ? 20 : 16}
                        strokeDasharray={dash}
                        strokeDashoffset={currentOffset}
                        strokeLinecap="round"
                        className="pointer-events-none transition-all duration-300"
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 2px ${item.color})` : "none",
                          opacity: isDimmed ? 0.38 : 1,
                          transform: `scale(${isHovered ? 1.02 : 1})`,
                          transformOrigin: "center",
                        }}
                      />
                    </g>
                  )
                })}
              </svg>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold text-slate-800 transition-all duration-500 sm:text-4xl dark:text-white"
                    style={{
                      opacity: animationProgress,
                      transform: `scale(${0.5 + animationProgress * 0.5})`,
                    }}
                  >
                    {loading ? "..." : resolvedTotal}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{totalLabel}</div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "w-full space-y-3 lg:min-w-[220px] lg:w-auto",
              isDashboardAppearance && "lg:w-full xl:w-auto",
            )}
          >
            {chartData.map((item, index) => {
              const isHovered = hoveredIndex === index
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors duration-200",
                    isDashboardAppearance && "rounded-2xl",
                    isHovered ? "bg-slate-100 dark:bg-slate-700" : "bg-slate-50 dark:bg-slate-800/50",
                  )}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {loading ? "..." : formatValue ? formatValue(item.value) : item.value}
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
