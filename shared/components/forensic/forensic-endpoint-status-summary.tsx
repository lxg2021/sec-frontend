"use client"

import { Monitor } from "lucide-react"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicEndpointSummary } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader, ForensicSummaryCard } from "./forensic-panel-chrome"

interface Props {
  summary: ForensicEndpointSummary
}

export function ForensicEndpointStatusSummary({ summary }: Props) {
  const rows = [
    { key: "online", label: "在线", value: summary.online, bar: "bg-emerald-600" },
    { key: "offline", label: "离线", value: summary.offline, bar: "bg-muted-foreground/60" },
    { key: "unbound", label: "未绑定", value: summary.unbound, bar: "bg-amber-500" },
  ]
  const max = Math.max(summary.total, 1)

  return (
    <ForensicSummaryCard color="from-green-400 to-emerald-600">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={Monitor}
          tone="sky"
          title="终端状态摘要"
          description="agent_id 与 velociraptor_client_id 绑定后的可用性"
          action={
            <span className="mt-1 inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
              共 <span className="mx-1 font-semibold tabular-nums text-foreground">{summary.total}</span> 台
            </span>
          }
        />
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-sm text-foreground">{row.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span className={cn("block h-full rounded-full", row.bar)} style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </ForensicSummaryCard>
  )
}
