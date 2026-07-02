"use client"

import Link from "next/link"
import { ChevronRight, ShieldAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type {
  ForensicNoticeLevel,
  ForensicOverviewAvailability,
  ForensicOverviewNotice,
} from "@/shared/lib/forensic/types"
import { ForensicPanelHeader } from "./forensic-panel-chrome"

interface Props {
  notices: ForensicOverviewNotice[]
  availability: ForensicOverviewAvailability
}

const LEVEL_WEIGHT: Record<ForensicNoticeLevel, number> = {
  error: 0,
  warning: 1,
  info: 2,
}

const LEVEL_CONFIG: Record<ForensicNoticeLevel, { wrap: string; action: string }> = {
  error: {
    wrap: "bg-red-500/10",
    action: "text-red-700",
  },
  warning: {
    wrap: "bg-amber-500/10",
    action: "text-amber-700",
  },
  info: {
    wrap: "bg-sky-500/10",
    action: "text-blue-700",
  },
}

export function ForensicRiskNoticePanel({ notices, availability }: Props) {
  const t = useTranslations("pages.investigation.collection.riskNotice")
  const sorted = [...notices]
    .sort((a, b) => LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level])
    .slice(0, 5)

  function formatNoticeTitle(notice: ForensicOverviewNotice): string {
    switch (notice.id) {
      case "artifact_unavailable":
        return t("notices.artifactUnavailable")
      case "no_target_agent":
        return t("notices.noTargetAgent")
      case "no_available_endpoint":
        return t("notices.noAvailableEndpoint")
      case "endpoint_unbound":
        return t("notices.endpointUnbound", {
          count: availability.unbound_endpoint_count,
        })
      case "endpoint_offline":
        return t("notices.endpointOffline", {
          count: availability.offline_endpoint_count,
        })
      case "task_failed":
        return t("notices.taskFailed", {
          count: availability.failed_task_count,
        })
      default:
        return notice.title
    }
  }

  function formatActionLabel(notice: ForensicOverviewNotice): string {
    if (notice.id === "task_failed") {
      return t("actions.view")
    }
    return notice.action_label ?? ""
  }

  return (
    <Card className="flex min-h-[220px] flex-1 flex-col">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={ShieldAlert}
          tone="red"
          title={t("title")}
          description={t("description")}
        />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5 pb-5">
        {sorted.length === 0 ? (
          <div className="rounded-md bg-emerald-500/10 px-3 py-3 text-sm font-medium leading-6 text-foreground">
            {t("empty")}
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((notice) => {
              const config = LEVEL_CONFIG[notice.level]
              const actionLabel = formatActionLabel(notice)
              return (
                <li key={notice.id} className={cn("flex items-start gap-3 rounded-md px-3 py-2.5", config.wrap)}>
                  <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-foreground">{formatNoticeTitle(notice)}</p>
                  {actionLabel && notice.action_href && (
                    <Link href={notice.action_href} className={cn("mt-1 inline-flex shrink-0 items-center text-xs font-semibold hover:underline", config.action)}>
                      {actionLabel}
                      <ChevronRight className="size-3.5" />
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
