"use client"

import Link from "next/link"
import { ChevronRight, Clock3 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicRecentTaskView } from "@/shared/lib/forensic/types"
import { formatClock } from "@/shared/lib/forensic/utils"
import { ForensicPanelHeader } from "./forensic-panel-chrome"
import { TASK_STATUS_CONFIG } from "./status-config"

interface Props {
  tasks: ForensicRecentTaskView[]
}

export function ForensicRecentTaskSummary({ tasks }: Props) {
  const items = tasks.slice(0, 5)

  return (
    <Card className="h-full">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={Clock3}
          tone="teal"
          title="最近取证任务"
          description="最多展示 5 条，详情进入任务中心"
          action={
            <Link
              href="/frame/investigation/tasks"
              className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              查看更多
              <ChevronRight className="size-3.5" />
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">暂无任务记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">任务 ID</th>
                  <th className="pb-2 pr-3 font-medium">状态</th>
                  <th className="pb-2 pr-3 font-medium">工件</th>
                  <th className="pb-2 pr-3 font-medium">目标终端</th>
                  <th className="pb-2 font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((task) => {
                  const config = TASK_STATUS_CONFIG[task.status]
                  return (
                    <tr key={task.task_id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-accent/40">
                      <td className="py-3 pr-3">
                        <Link href={`/frame/investigation/tasks?task_id=${task.task_id}`} className="font-mono text-xs text-foreground hover:underline">
                          {task.task_id}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", config.className)}>
                          <span className={cn("size-1.5 rounded-full", config.dot)} />
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">{task.artifact_key}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">{task.target_label}</td>
                      <td className="py-3 text-xs text-muted-foreground tabular-nums">
                        {formatClock(task.last_sync_at ?? task.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
