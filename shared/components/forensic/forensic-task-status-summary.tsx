"use client"

import Link from "next/link"
import { ListChecks } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicTaskStatus, ForensicTaskSummary } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader } from "./forensic-panel-chrome"

interface Props {
  summary: ForensicTaskSummary
}

const LEGEND: { key: ForensicTaskStatus; label: string; dot: string; href?: string }[] = [
  { key: "pending", label: "待下发", dot: "bg-muted-foreground/60", href: "/frame/investigation/tasks?status=pending" },
  { key: "running", label: "运行中", dot: "bg-blue-600", href: "/frame/investigation/tasks?status=running" },
  { key: "success", label: "成功", dot: "bg-emerald-600", href: "/frame/investigation/tasks?status=success" },
  { key: "failed", label: "失败", dot: "bg-red-600", href: "/frame/investigation/tasks?status=failed" },
  { key: "timeout", label: "超时", dot: "bg-amber-500" },
  { key: "canceled", label: "取消", dot: "bg-border" },
]

export function ForensicTaskStatusSummary({ summary }: Props) {
  const total = LEGEND.reduce((sum, item) => sum + summary[item.key], 0)

  return (
    <Card className="h-full">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={ListChecks}
          tone="teal"
          title="任务状态摘要"
          description="按任务生命周期聚合，不展示任务创建表单"
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
                <span className="text-muted-foreground">{item.label}</span>
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

        <p className="rounded-md bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          失败任务建议进入任务中心查看远端 flow 错误和重试。
        </p>
      </CardContent>
    </Card>
  )
}
