"use client"

import Link from "next/link"
import { ListChecks } from "lucide-react"
import { useTranslations } from "next-intl"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicTaskStatus, ForensicTaskSummary } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader, ForensicSummaryCard } from "./forensic-panel-chrome"

interface Props {
  summary: ForensicTaskSummary
}

const LEGEND: { key: ForensicTaskStatus; dot: string; href?: string }[] = [
  { key: "pending", dot: "bg-muted-foreground/60", href: "/frame/investigation/tasks?status=pending" },
  { key: "running", dot: "bg-blue-600", href: "/frame/investigation/tasks?status=running" },
  { key: "success", dot: "bg-emerald-600", href: "/frame/investigation/tasks?status=success" },
  { key: "failed", dot: "bg-red-600", href: "/frame/investigation/tasks?status=failed" },
  { key: "timeout", dot: "bg-amber-500" },
  { key: "canceled", dot: "bg-border" },
]

export function ForensicTaskStatusSummary({ summary }: Props) {
  const t = useTranslations("pages.investigation.collection")
  const total = LEGEND.reduce((sum, item) => sum + summary[item.key], 0)

  return (
    <ForensicSummaryCard color="from-violet-400 to-purple-600">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={ListChecks}
          iconColor="from-violet-400 to-purple-600"
          title={t("taskSummary.title")}
        />
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {LEGEND.map((item) => {
            const value = summary[item.key]
            if (!value || total === 0) return null
            return (
              <span key={item.key} className={cn("h-full", item.dot)} style={{ width: `${(value / total) * 100}%` }} />
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
          {LEGEND.map((item) => {
            const inner = (
              <span className="flex items-center gap-1.5 text-xs">
                <span className={cn("size-2 shrink-0 rounded-full", item.dot)} />
                <span className="text-muted-foreground">{t(`taskStatus.${item.key}`)}</span>
                <span className="font-medium tabular-nums text-foreground">{summary[item.key]}</span>
              </span>
            )
            return item.href ? (
              <Link key={item.key} href={item.href} className="transition-opacity hover:opacity-70">
                {inner}
              </Link>
            ) : (
              <span key={item.key}>{inner}</span>
            )
          })}
        </div>

      </CardContent>
    </ForensicSummaryCard>
  )
}
