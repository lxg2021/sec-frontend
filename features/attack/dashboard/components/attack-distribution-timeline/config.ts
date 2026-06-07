import type { CoverageStatus, Granularity, MetricKey } from "./types"

export interface MetricMeta {
  key: MetricKey
  color: string
}

export const METRICS: MetricMeta[] = [
  {
    key: "total_rules",
    color: "oklch(0.58 0.13 290)",
  },
  {
    key: "total_instances",
    color: "oklch(0.68 0.14 55)",
  },
  {
    key: "total_hosts",
    color: "oklch(0.6 0.12 160)",
  },
  {
    key: "total_cases",
    color: "oklch(0.58 0.13 250)",
  },
]

export const GRANULARITY_OPTIONS: { value: Granularity }[] = [
  { value: "hour" },
  { value: "day" },
  { value: "month" },
]

export const COVERAGE_META: Record<
  CoverageStatus,
  { className: string }
> = {
  covered: {
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  partial: {
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  unknown: {
    className: "bg-muted text-muted-foreground",
  },
}
