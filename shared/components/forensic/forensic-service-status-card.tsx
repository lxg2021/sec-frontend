"use client"

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewAvailability } from "@/shared/lib/forensic/types"
import { formatTimestamp } from "@/shared/lib/forensic/utils"
import { AVAILABILITY_LEVEL_CONFIG } from "./status-config"

interface Props {
  availability: ForensicOverviewAvailability
  lastRefreshAt: number
}

function CountPill({
  label,
  value,
  accent = "default",
}: {
  label: string
  value: string | number
  accent?: "default" | "success" | "warning" | "error"
}) {
  const className = {
    default: "bg-muted text-muted-foreground ring-border",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    error: "bg-red-50 text-red-700 ring-red-200",
  }[accent]

  return (
    <span
      className={cn(
        "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1",
        className
      )}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      {label}
    </span>
  )
}

export function ForensicServiceStatusCard({ availability, lastRefreshAt }: Props) {
  const config = AVAILABILITY_LEVEL_CONFIG[availability.level]
  const LevelIcon =
    availability.level === "available"
      ? CheckCircle2
      : availability.level === "unavailable"
        ? XCircle
        : AlertTriangle

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-lg", config.ring)}>
            <LevelIcon className="size-5" />
          </span>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{availability.title}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed text-pretty">
              {availability.summary}
            </p>
            <p className="text-xs text-muted-foreground">
              最近刷新：{formatTimestamp(lastRefreshAt)}
            </p>
          </div>
        </div>

        <div className="shrink-0 lg:w-auto">
          <p className="mb-2 text-xs font-medium text-muted-foreground lg:text-right">取证状态</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <CountPill label="台可下发" value={availability.available_endpoint_count} accent="success" />
            <CountPill
              label="台未绑定"
              value={availability.unbound_endpoint_count}
              accent={availability.unbound_endpoint_count > 0 ? "warning" : "default"}
            />
            <CountPill label="个可用工件" value={availability.enabled_artifact_count} />
            <CountPill
              label="个任务失败"
              value={availability.failed_task_count}
              accent={availability.failed_task_count > 0 ? "error" : "default"}
            />
            <CountPill
              label="新建任务"
              value={availability.can_create_task ? "可" : "不可"}
              accent={availability.can_create_task ? "success" : "warning"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
