import type { CoverageStatus, Granularity, MetricKey } from "./types"

export interface MetricMeta {
  key: MetricKey
  label: string
  description: string
  color: string
}

export const METRICS: MetricMeta[] = [
  {
    key: "total_rules",
    label: "命中规则",
    description: "按 rule_id 去重后的命中规则数",
    color: "oklch(0.58 0.13 290)",
  },
  {
    key: "total_instances",
    label: "攻击实例",
    description: "按 instance_id 去重后的攻击实例数",
    color: "oklch(0.68 0.14 55)",
  },
  {
    key: "total_hosts",
    label: "影响主机",
    description: "按非空 agent_id 去重后的影响主机数",
    color: "oklch(0.6 0.12 160)",
  },
  {
    key: "total_cases",
    label: "攻击场景",
    description: "按 case_id 去重后的攻击场景数",
    color: "oklch(0.58 0.13 250)",
  },
]

export const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "hour", label: "按小时" },
  { value: "day", label: "按天" },
  { value: "month", label: "按月" },
]

export const COVERAGE_META: Record<
  CoverageStatus,
  { label: string; className: string; description: string }
> = {
  covered: {
    label: "已覆盖",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    description: "整个时间范围已确认检测覆盖",
  },
  partial: {
    label: "部分覆盖",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    description: "只有部分时间范围确认检测覆盖",
  },
  unknown: {
    label: "覆盖未知",
    className: "bg-muted text-muted-foreground",
    description: "没有可靠 coverage ledger，无法判断覆盖情况",
  },
}
