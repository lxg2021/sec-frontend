"use client"

import { Card } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewMetrics } from "@/shared/lib/forensic/types"

interface Props {
  metrics: ForensicOverviewMetrics
}

type Accent = "default" | "success" | "warning" | "destructive" | "info"

const HINT_CLASS: Record<Accent, string> = {
  default: "text-muted-foreground",
  success: "text-emerald-700",
  warning: "text-amber-700",
  destructive: "text-red-700",
  info: "text-blue-700",
}

export function ForensicMetricCards({ metrics }: Props) {
  const items = [
    ["endpoint_total", "终端总数", metrics.endpoint_total, `${metrics.endpoint_online} 在线`, "success"],
    ["endpoint_online", "在线终端", metrics.endpoint_online, "可下发", "default"],
    ["endpoint_unbound", "未绑定终端", metrics.endpoint_unbound, metrics.endpoint_unbound > 0 ? "需处理" : "已绑定", metrics.endpoint_unbound > 0 ? "warning" : "success"],
    ["artifact_enabled", "启用工件", metrics.artifact_enabled, "文件/注册表/日志", "default"],
    ["task_running", "运行中任务", metrics.task_running, metrics.task_running > 0 ? "同步中" : "空闲", metrics.task_running > 0 ? "info" : "default"],
    ["task_failed", "失败任务", metrics.task_failed, metrics.task_failed > 0 ? "需重试" : "无", metrics.task_failed > 0 ? "destructive" : "default"],
    ["evidence_total", "证据总数", metrics.evidence_total, "已结构化", "default"],
  ] as const

  return (
    <section aria-label="核心指标" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {items.map(([key, label, value, hint, hintAccent]) => (
        <Card key={key} className="gap-0 p-4">
          <span className="text-xs text-muted-foreground">{label}</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
            <span className={cn("truncate text-xs font-medium", HINT_CLASS[hintAccent])}>{hint}</span>
          </div>
        </Card>
      ))}
    </section>
  )
}

