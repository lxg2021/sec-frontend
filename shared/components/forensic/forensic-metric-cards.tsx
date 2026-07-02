"use client"

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSearch,
  Monitor,
  XCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewMetrics } from "@/shared/lib/forensic/types"
import { ForensicIconBadge, type ForensicIconTone } from "./forensic-panel-chrome"

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
  const items: {
    key: string
    label: string
    value: number
    hint: string
    hintAccent: Accent
    icon: LucideIcon
    tone: ForensicIconTone
  }[] = [
    {
      key: "endpoint_total",
      label: "终端总数",
      value: metrics.endpoint_total,
      hint: `${metrics.endpoint_online} 在线`,
      hintAccent: "success",
      icon: Monitor,
      tone: "sky",
    },
    {
      key: "endpoint_online",
      label: "在线终端",
      value: metrics.endpoint_online,
      hint: "可下发",
      hintAccent: "default",
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      key: "endpoint_unbound",
      label: "未绑定终端",
      value: metrics.endpoint_unbound,
      hint: metrics.endpoint_unbound > 0 ? "需处理" : "已绑定",
      hintAccent: metrics.endpoint_unbound > 0 ? "warning" : "success",
      icon: AlertTriangle,
      tone: metrics.endpoint_unbound > 0 ? "amber" : "emerald",
    },
    {
      key: "artifact_enabled",
      label: "启用工件",
      value: metrics.artifact_enabled,
      hint: "文件/注册表/日志",
      hintAccent: "default",
      icon: FileSearch,
      tone: "teal",
    },
    {
      key: "task_running",
      label: "运行中任务",
      value: metrics.task_running,
      hint: metrics.task_running > 0 ? "同步中" : "空闲",
      hintAccent: metrics.task_running > 0 ? "info" : "default",
      icon: Activity,
      tone: "cyan",
    },
    {
      key: "task_failed",
      label: "失败任务",
      value: metrics.task_failed,
      hint: metrics.task_failed > 0 ? "需重试" : "无",
      hintAccent: metrics.task_failed > 0 ? "destructive" : "default",
      icon: XCircle,
      tone: metrics.task_failed > 0 ? "red" : "slate",
    },
    {
      key: "evidence_total",
      label: "证据总数",
      value: metrics.evidence_total,
      hint: "已结构化",
      hintAccent: "default",
      icon: Database,
      tone: "slate",
    },
  ]

  return (
    <section aria-label="核心指标" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <Card key={item.key} className="gap-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <ForensicIconBadge icon={item.icon} tone={item.tone} className="size-8 rounded-md" iconClassName="size-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{item.value}</span>
            <span className={cn("truncate text-xs font-medium", HINT_CLASS[item.hintAccent])}>{item.hint}</span>
          </div>
        </Card>
      ))}
    </section>
  )
}
