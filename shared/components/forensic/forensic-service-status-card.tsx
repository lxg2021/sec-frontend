"use client"

import { ScanSearch, ShieldCheck } from "lucide-react"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewAvailability } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader, ForensicSummaryCard } from "./forensic-panel-chrome"

interface Props {
  availability: ForensicOverviewAvailability
}

const STATUS_LABEL: Record<ForensicOverviewAvailability["level"], string> = {
  available: "可用",
  partial: "部分可用",
  unavailable: "不可用",
}

const STATUS_BADGE_CLASS: Record<ForensicOverviewAvailability["level"], string> = {
  available: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/20",
  partial: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  unavailable: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20",
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
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5">
      <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", valueClassName)}>
        {value}
      </span>
    </div>
  )
}

export function ForensicServiceStatusCard({ availability }: Props) {
  return (
    <ForensicSummaryCard color="from-cyan-400 to-blue-600">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={ScanSearch}
          iconColor="from-cyan-400 to-blue-600"
          title="取证状态"
          action={
            <span
              className={cn(
                "mt-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                STATUS_BADGE_CLASS[availability.level]
              )}
            >
              <ShieldCheck aria-hidden className="size-3.5" />
              {STATUS_LABEL[availability.level]}
            </span>
          }
        />
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-5">
        <div className="grid gap-1.5">
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

        <div className="rounded-md bg-muted/50 px-3 py-1.5">
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
        </div>
      </CardContent>
    </ForensicSummaryCard>
  )
}
