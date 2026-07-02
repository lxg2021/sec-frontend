"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2, ChevronRight, Info, ShieldAlert, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicNoticeLevel, ForensicOverviewNotice } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader } from "./forensic-panel-chrome"

interface Props {
  notices: ForensicOverviewNotice[]
}

const LEVEL_WEIGHT: Record<ForensicNoticeLevel, number> = {
  error: 0,
  warning: 1,
  info: 2,
}

const LEVEL_CONFIG: Record<ForensicNoticeLevel, { wrap: string; iconWrap: string; action: string; icon: typeof AlertTriangle }> = {
  error: {
    wrap: "border-red-500/25 bg-red-500/10",
    iconWrap: "bg-red-500/15 text-red-600 ring-red-500/25 dark:text-red-300",
    action: "text-red-700",
    icon: XCircle,
  },
  warning: {
    wrap: "border-amber-500/25 bg-amber-500/10",
    iconWrap: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
    action: "text-amber-700",
    icon: AlertTriangle,
  },
  info: {
    wrap: "border-sky-500/25 bg-sky-500/10",
    iconWrap: "bg-sky-500/15 text-sky-600 ring-sky-500/25 dark:text-sky-300",
    action: "text-blue-700",
    icon: Info,
  },
}

export function ForensicRiskNoticePanel({ notices }: Props) {
  const sorted = [...notices]
    .sort((a, b) => LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level])
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader icon={ShieldAlert} tone="amber" title="风险提醒" />
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {sorted.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-sm text-foreground">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">
              <CheckCircle2 aria-hidden className="size-4" />
            </span>
            当前没有需要处理的风险
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((notice) => {
              const config = LEVEL_CONFIG[notice.level]
              const Icon = config.icon
              return (
                <li key={notice.id} className={cn("flex items-start gap-3 rounded-md border px-3 py-2.5", config.wrap)}>
                  <span className={cn("mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md ring-1", config.iconWrap)}>
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-foreground">{notice.title}</p>
                  {notice.action_label && notice.action_href && (
                    <Link href={notice.action_href} className={cn("mt-1 inline-flex shrink-0 items-center text-xs font-semibold hover:underline", config.action)}>
                      {notice.action_label}
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
