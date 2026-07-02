"use client"

import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewAvailability } from "@/shared/lib/forensic/types"
import { formatTimestamp } from "@/shared/lib/forensic/utils"
import { ForensicPanelHeader, type ForensicIconTone } from "./forensic-panel-chrome"
import { AVAILABILITY_LEVEL_CONFIG } from "./status-config"

interface Props {
  availability: ForensicOverviewAvailability
  lastRefreshAt: number
}

const STATUS_LABEL: Record<ForensicOverviewAvailability["level"], string> = {
  available: "可用",
  partial: "部分可用",
  unavailable: "不可用",
}

function StatusRow({
  label,
  value,
  accent = "default",
}: {
  label: string
  value: string | number
  accent?: "default" | "success" | "warning" | "error"
}) {
  const valueClassName = {
    default: "text-foreground",
    success: "text-emerald-700 dark:text-emerald-300",
    warning: "text-amber-700 dark:text-amber-300",
    error: "text-red-700 dark:text-red-300",
  }[accent]

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
      <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", valueClassName)}>
        {value}
      </span>
    </div>
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
  const tone: ForensicIconTone =
    availability.level === "available"
      ? "emerald"
      : availability.level === "unavailable"
        ? "red"
        : "amber"

  return (
    <Card className="h-full">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={LevelIcon}
          tone={tone}
          title="取证状态"
          description={availability.summary}
          action={
            <span className={cn("mt-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", config.ring)}>
              <ShieldCheck aria-hidden className="size-3.5" />
              {STATUS_LABEL[availability.level]}
            </span>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        <div className="grid gap-2">
          <StatusRow
            label="可下发终端"
            value={availability.available_endpoint_count}
            accent="success"
          />
          <StatusRow
            label="未绑定终端"
            value={availability.unbound_endpoint_count}
            accent={availability.unbound_endpoint_count > 0 ? "warning" : "default"}
          />
          <StatusRow label="可用工件" value={availability.enabled_artifact_count} />
        </div>

        <div className="rounded-md bg-muted/50 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">新建任务</span>
            <span
              className={cn(
                "text-xs font-semibold",
                availability.can_create_task
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-300"
              )}
            >
              {availability.can_create_task ? "可创建" : "不可创建"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            最近刷新：{formatTimestamp(lastRefreshAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
