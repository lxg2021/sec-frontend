"use client"

import {
  Boxes,
  CircleCheck,
  Clock,
  Database,
  Loader,
  Monitor,
  TriangleAlert,
  Wifi,
  Unplug,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Card } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import type { ReadinessMetrics } from "../hooks"

interface Props {
  metrics: ReadinessMetrics
  loading: boolean
  onSelectMetric?: (key: string) => void
}

type Tone = "default" | "success" | "warning" | "info" | "danger"

const toneStyles: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  info: "text-sky-600",
  danger: "text-destructive",
}

export function ForensicReadinessSummary({
  metrics,
  loading,
  onSelectMetric,
}: Props) {
  const items: {
    key: string
    label: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    tone: Tone
    hint?: string
  }[] = [
    {
      key: "endpointTotal",
      label: "终端总数",
      value: metrics.endpointTotal,
      icon: Monitor,
      tone: "default",
      hint: "库内可取证终端",
    },
    {
      key: "endpointOnline",
      label: "在线终端",
      value: metrics.endpointOnline,
      icon: Wifi,
      tone: "success",
    },
    {
      key: "endpointUnbound",
      label: "未绑定终端",
      value: metrics.endpointUnbound,
      icon: Unplug,
      tone: "warning",
      hint: "缺少 agent_id",
    },
    {
      key: "taskRunning",
      label: "运行中任务",
      value: metrics.taskRunning,
      icon: Loader,
      tone: "info",
    },
    {
      key: "taskPending",
      label: "等待中任务",
      value: metrics.taskPending,
      icon: Clock,
      tone: "default",
    },
    {
      key: "taskFailed",
      label: "失败任务",
      value: metrics.taskFailed,
      icon: TriangleAlert,
      tone: "danger",
    },
    {
      key: "evidenceTotal",
      label: "证据总数",
      value: metrics.evidenceTotal,
      icon: Database,
      tone: "default",
    },
    {
      key: "artifactEnabled",
      label: "启用工件",
      value: metrics.artifactEnabled,
      icon: Boxes,
      tone: "success",
    },
  ]

  return (
    <section aria-label="取证就绪概览">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.key}
              onClick={() => onSelectMetric?.(item.key)}
              className={cn(
                "gap-0 p-4 transition-colors",
                onSelectMetric && "cursor-pointer hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                <Icon className={cn("size-4", toneStyles[item.tone])} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <span
                    className={cn(
                      "text-2xl font-semibold tabular-nums",
                      toneStyles[item.tone],
                    )}
                  >
                    {item.value}
                  </span>
                )}
                {item.hint ? (
                  <span className="text-[11px] text-muted-foreground">
                    {item.hint}
                  </span>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <CircleCheck className="size-3" />
        指标按“当前库内总量/当前筛选量”统计，暂不提供“今日精确统计”。
      </p>
    </section>
  )
}

