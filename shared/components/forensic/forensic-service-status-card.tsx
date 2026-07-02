"use client"

import { ScanSearch } from "lucide-react"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewAvailability } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader, ForensicSummaryCard } from "./forensic-panel-chrome"

interface Props {
  availability: ForensicOverviewAvailability
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
      </CardContent>
    </ForensicSummaryCard>
  )
}
