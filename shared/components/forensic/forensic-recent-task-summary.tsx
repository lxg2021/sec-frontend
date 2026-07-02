"use client"

import Link from "next/link"
import { Box, ChevronRight, Clock3 } from "lucide-react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("pages.investigation.collection")
  const items = tasks.slice(0, 5)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={Clock3}
          tone="teal"
          title={t("recentTasks.title")}
          description={t("recentTasks.description")}
          action={
            <Link
              href="/frame/investigation/tasks"
              className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("recentTasks.viewMore")}
              <ChevronRight className="size-3.5" />
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="flex flex-1 px-5 pb-5">
        {items.length === 0 ? (
          <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center text-center">
            <Box className="size-12 stroke-[1.8] text-slate-300" aria-hidden />
            <div className="mt-3 text-sm font-medium text-slate-500">{t("recentTasks.emptyTitle")}</div>
            <div className="mt-2 text-xs text-slate-500">{t("recentTasks.emptyDescription")}</div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">{t("recentTasks.columns.taskId")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("recentTasks.columns.status")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("recentTasks.columns.artifact")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("recentTasks.columns.target")}</th>
                  <th className="pb-2 font-medium">{t("recentTasks.columns.updatedAt")}</th>
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
                          {t(`taskStatus.${task.status}`)}
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
