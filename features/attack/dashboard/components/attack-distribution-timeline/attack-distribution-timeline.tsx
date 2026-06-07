"use client"

import { useMemo, useState } from "react"
import { ActivitySquare } from "lucide-react"
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/shared/lib/utils"
import { COVERAGE_META, GRANULARITY_OPTIONS, METRICS } from "./config"
import type {
  AttackEventTimelinePoint,
  Granularity,
  GetAttackEventTimelineDistributionData,
  MetricKey,
} from "./types"

interface AttackDistributionTimelineProps {
  data: GetAttackEventTimelineDistributionData
  defaultMetric?: MetricKey
  loading?: boolean
  onGranularityChange?: (granularity: Granularity) => void
  onRangeChange?: (range: { start: AttackEventTimelinePoint; end: AttackEventTimelinePoint }) => void
  className?: string
}

function formatBucketLabel(value: string, granularity: Granularity): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  switch (granularity) {
    case "hour":
      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:00`
    case "day":
      return `${date.getMonth() + 1}/${date.getDate()}`
    case "month":
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`
    default:
      return value
  }
}

function parseTimelineTime(value: string): Date | null {
  if (!value) return null
  const date = new Date(value.replace(" ", "T"))
  return Number.isNaN(date.getTime()) ? null : date
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function BrushTraveller(props: {
  x?: number
  y?: number
  width?: number
  height?: number
}) {
  const { x = 0, y = 0, width = 10, height = 26 } = props
  const [hovered, setHovered] = useState(false)
  const accent = "oklch(0.58 0.13 250)"
  const cx = x + width / 2
  const gripX = [cx - 1.5, cx, cx + 1.5]
  const gripTop = y + height / 2 - 4
  const gripBottom = y + height / 2 + 4

  return (
    <g
      style={{ cursor: "ew-resize" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        fill="hsl(var(--background))"
        stroke={hovered ? accent : "oklch(0.78 0.05 250)"}
        strokeWidth={hovered ? 1.5 : 1}
      />
      {gripX.map((gx) => (
        <line
          key={gx}
          x1={gx}
          y1={gripTop}
          x2={gx}
          y2={gripBottom}
          stroke={hovered ? accent : "hsl(var(--muted-foreground))"}
          strokeWidth={1}
          strokeLinecap="round"
        />
      ))}
    </g>
  )
}

export function AttackDistributionTimeline({
  data,
  defaultMetric = "total_rules",
  loading = false,
  onGranularityChange,
  onRangeChange,
  className,
}: AttackDistributionTimelineProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>(defaultMetric)

  const metricMeta = METRICS.find((m) => m.key === activeMetric) ?? METRICS[0]
  const coverageMeta = COVERAGE_META[data.coverage_status] ?? COVERAGE_META.unknown
  const hourGranularityDisabled = useMemo(() => {
    const start = parseTimelineTime(data.start_time)
    const end = parseTimelineTime(data.end_time)
    if (!start || !end) return false
    return end > addMonths(start, 3)
  }, [data.end_time, data.start_time])

  const chartData = useMemo(
    () =>
      data.items.map((point) => ({
        ...point,
        label: formatBucketLabel(point.bucket_start, data.granularity),
      })),
    [data.items, data.granularity],
  )

  const metricTotals = useMemo(() => {
    return METRICS.reduce(
      (acc, metric) => {
        acc[metric.key] = data[metric.key] ?? 0
        return acc
      },
      {} as Record<MetricKey, number>,
    )
  }, [data])

  const handleGranularityClick = (g: Granularity) => {
    if (g === "hour" && hourGranularityDisabled) return
    onGranularityChange?.(g)
  }

  const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
    if (
      !onRangeChange ||
      range.startIndex == null ||
      range.endIndex == null ||
      !data.items[range.startIndex] ||
      !data.items[range.endIndex]
    ) {
      return
    }
    onRangeChange({
      start: data.items[range.startIndex],
      end: data.items[range.endIndex],
    })
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-6",
        className,
      )}
      aria-label="攻击时间分布"
    >
      <header className="flex flex-col gap-3 pr-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
            <ActivitySquare className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold leading-none">攻击时间分布</h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  coverageMeta.className,
                )}
                title={coverageMeta.description}
              >
                {coverageMeta.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.start_time}
              <span className="mx-1.5 text-muted-foreground/60">→</span>
              {data.end_time}
              <span className="ml-2 text-muted-foreground/60">({data.timezone})</span>
            </p>
          </div>
        </div>

        <div
          className="inline-flex shrink-0 rounded-lg border border-border bg-muted/50 p-0.5"
          role="group"
          aria-label="选择时间粒度"
        >
          {GRANULARITY_OPTIONS.map((opt) => {
            const active = opt.value === data.granularity
            const disabled = opt.value === "hour" && hourGranularityDisabled
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => handleGranularityClick(opt.value)}
                aria-pressed={active}
                title={disabled ? "时间范围超过 3 个月，请先缩小范围后再按小时查看" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </header>

      <div
        className="flex flex-wrap items-center gap-1 border-b border-border"
        role="tablist"
        aria-label="选择展示指标"
      >
        {METRICS.map((metric) => {
          const active = metric.key === activeMetric
          const total = metricTotals[metric.key]
          return (
            <button
              key={metric.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveMetric(metric.key)}
              title={metric.description}
              className={cn(
                "relative -mb-px flex items-center gap-2 rounded-t-md px-3 py-2 text-sm transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: metric.color }}
                aria-hidden="true"
              />
              <span className="font-medium">{metric.label}</span>
              <span
                className={cn(
                  "tabular-nums",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {total.toLocaleString()}
              </span>
              {active && (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                  style={{ backgroundColor: metric.color }}
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="attack-timeline-chart relative h-72 w-full">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground">加载中…</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground">该时间范围内暂无数据</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="attackMetricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricMeta.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={metricMeta.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const point = payload[0].payload as AttackEventTimelinePoint
                  return (
                    <div className="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md">
                      <p className="mb-1 text-xs text-muted-foreground">
                        {point.bucket_start} → {point.bucket_end}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {METRICS.map((m) => (
                          <div
                            key={m.key}
                            className={cn(
                              "flex items-center justify-between gap-3 text-sm",
                              m.key === activeMetric && "font-semibold",
                            )}
                          >
                            <span className="text-muted-foreground">{m.label}</span>
                            <span className="tabular-nums">{point[m.key].toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={metricMeta.color}
                strokeWidth={2}
                fill="url(#attackMetricFill)"
                isAnimationActive={false}
                activeDot={{ r: 4 }}
              />
              <Brush
                dataKey="label"
                height={24}
                travellerWidth={10}
                traveller={<BrushTraveller />}
                stroke="oklch(0.8 0.04 250)"
                fill="oklch(0.93 0.03 250)"
                tickFormatter={() => ""}
                onChange={handleBrushChange}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
