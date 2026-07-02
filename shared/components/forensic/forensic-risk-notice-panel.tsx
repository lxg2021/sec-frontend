"use client"

import Link from "next/link"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicNoticeLevel, ForensicOverviewNotice } from "@/shared/lib/forensic/types"

interface Props {
  notices: ForensicOverviewNotice[]
}

const LEVEL_WEIGHT: Record<ForensicNoticeLevel, number> = {
  error: 0,
  warning: 1,
  info: 2,
}

const LEVEL_CONFIG: Record<ForensicNoticeLevel, { wrap: string; dot: string; action: string }> = {
  error: {
    wrap: "border-red-200 bg-red-50",
    dot: "bg-red-600",
    action: "text-red-700",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    dot: "bg-amber-500",
    action: "text-amber-700",
  },
  info: {
    wrap: "border-blue-200 bg-blue-50",
    dot: "bg-blue-600",
    action: "text-blue-700",
  },
}

export function ForensicRiskNoticePanel({ notices }: Props) {
  const sorted = [...notices]
    .sort((a, b) => LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level])
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">风险提醒</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-foreground">
            <CheckCircle2 className="size-4 text-emerald-700" />
            当前没有需要处理的风险
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((notice) => {
              const config = LEVEL_CONFIG[notice.level]
              return (
                <li key={notice.id} className={cn("flex items-start gap-2 rounded-md border px-3 py-2.5", config.wrap)}>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", config.dot)} />
                  <p className="min-w-0 flex-1 text-xs text-foreground leading-relaxed">{notice.title}</p>
                  {notice.action_label && notice.action_href && (
                    <Link href={notice.action_href} className={cn("mt-0.5 inline-flex shrink-0 items-center text-xs font-medium hover:underline", config.action)}>
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

