"use client"

import { Monitor } from "lucide-react"
import { useTranslations } from "next-intl"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicEndpointSummary } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader, ForensicSummaryCard } from "./forensic-panel-chrome"

interface Props {
  summary: ForensicEndpointSummary
}

export function ForensicEndpointStatusSummary({ summary }: Props) {
  const t = useTranslations("pages.investigation.collection.endpointSummary")
  const rows = [
    { key: "online", label: t("online"), value: summary.online, bar: "bg-emerald-600" },
    { key: "offline", label: t("offline"), value: summary.offline, bar: "bg-muted-foreground/60" },
    { key: "unbound", label: t("unbound"), value: summary.unbound, bar: "bg-amber-500" },
  ]
  const max = Math.max(summary.total, 1)

  return (
    <ForensicSummaryCard>
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-4">
        <ForensicPanelHeader
          icon={Monitor}
          iconColor="from-green-400 to-emerald-600"
          title={t("title")}
        />
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
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
