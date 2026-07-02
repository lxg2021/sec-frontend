"use client"

import Link from "next/link"
import { ChevronRight, ShieldAlert } from "lucide-react"
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

export function ForensicRiskNoticePanel({ notices }: Props) {
  const sorted = [...notices]
    .sort((a, b) => LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level])
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={ShieldAlert}
          tone="red"
          title="风险提醒"
          description="展示影响取证任务下发和结果回收的异常项"
        />
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {sorted.length === 0 ? (
          <div className="rounded-md bg-emerald-500/10 px-3 py-3 text-sm font-medium leading-6 text-foreground">
            当前没有需要处理的风险
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((notice) => {
              const config = LEVEL_CONFIG[notice.level]
              return (
                <li key={notice.id} className={cn("flex items-start gap-3 rounded-md px-3 py-2.5", config.wrap)}>
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
