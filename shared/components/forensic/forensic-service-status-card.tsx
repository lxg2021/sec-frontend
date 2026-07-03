"use client"

import { ScanSearch } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
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
  max,
  bar,
  labelClassName,
}: {
  label: string
  value: number
  max: number
  bar: string
  labelClassName?: string
}) {
  const width = max > 0 ? `${(value / max) * 100}%` : "0%"

  return (
    <div className="flex items-center gap-3">
      <span className={cn("shrink-0 whitespace-nowrap text-sm text-foreground", labelClassName)}>{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", bar)} style={{ width }} />
      </div>
      <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  )
}

export function ForensicServiceStatusCard({ availability }: Props) {
  const locale = useLocale()
  const t = useTranslations("pages.investigation.collection.serviceStatus")
  const labelClassName = locale.startsWith("zh") ? "w-24" : "w-32"
  const max = Math.max(
    availability.available_endpoint_count,
    availability.unbound_endpoint_count,
    availability.enabled_artifact_count,
    1
  )

  return (
    <ForensicSummaryCard color="from-cyan-400 to-blue-600">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={ScanSearch}
          iconColor="from-cyan-400 to-blue-600"
          title={t("title")}
        />
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        <div className="grid gap-3">
          <StatusRow
            label={t("availableEndpoint")}
            value={availability.available_endpoint_count}
            max={max}
            bar="bg-emerald-600"
            labelClassName={labelClassName}
          />
          <StatusRow
            label={t("unboundEndpoint")}
            value={availability.unbound_endpoint_count}
            max={max}
            bar="bg-amber-500"
            labelClassName={labelClassName}
          />
          <StatusRow
            label={t("enabledArtifact")}
            value={availability.enabled_artifact_count}
            max={max}
            bar="bg-cyan-600"
            labelClassName={labelClassName}
          />
        </div>
      </CardContent>
    </ForensicSummaryCard>
  )
}
