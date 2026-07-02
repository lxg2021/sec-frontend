"use client"

import { useMemo, useState } from "react"
import { ListChecks, RotateCw } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"
import {
  formatUnixTime,
  taskStatusLabel,
  taskTargetLabel,
} from "../mappers"
import type {
  ForensicEndpointItem,
  ForensicTaskItem,
  TaskStatus,
} from "../types"
import { CopyButton, EmptyState, MonoText, TaskStatusBadge } from "./shared"

interface Props {
  tasks: ForensicTaskItem[]
  endpoints: ForensicEndpointItem[]
  loading: boolean
  onSyncTask: (taskId: string) => Promise<unknown>
  onOpenTask: (taskId: string) => void
}

const statusFilters: (TaskStatus | "all")[] = [
  "all",
  "running",
  "pending",
  "success",
  "failed",
]

export function ForensicRecentTasksPanel({
  tasks,
  endpoints,
  loading,
  onSyncTask,
  onOpenTask,
}: Props) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all")
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  )

  const handleSync = async (taskId: string) => {
    setSyncingId(taskId)
    try {
      await onSyncTask(taskId)
      toast.success("任务结果已同步")
    } catch (e) {
      toast.error("同步失败", { description: (e as Error).message })
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-4 text-primary" />
            最近任务
          </CardTitle>
          <span className="text-xs text-muted-foreground">最新 10 条</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={filter === s ? "default" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "全部" : taskStatusLabel[s]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="暂无取证任务"
            description="可以从上方“快速创建取证任务”开始。"
          />
        ) : (
          filtered.map((task) => {
            const canSync =
              task.status === "pending" || task.status === "running"
            return (
              <div
                key={task.task_id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenTask(task.task_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onOpenTask(task.task_id)
                }}
                className={cn(
                  "group cursor-pointer rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <TaskStatusBadge status={task.status} />
                      <span className="truncate text-sm font-medium">
                        {task.artifact_name || task.artifact_key}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        任务
                        <MonoText value={task.task_id} className="inline" />
                        <CopyButton value={task.task_id} label="已复制任务 ID" />
                      </span>
                      <span>目标 {taskTargetLabel(task, endpoints)}</span>
                      {task.remote_flow_id ? (
                        <span className="flex items-center gap-1">
                          flow
                          <MonoText
                            value={task.remote_flow_id}
                            className="inline opacity-70"
                          />
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                      <span>创建 {formatUnixTime(task.created_at)}</span>
                      {task.finished_at ? (
                        <span>完成 {formatUnixTime(task.finished_at)}</span>
                      ) : null}
                      {task.last_sync_at ? (
                        <span>同步 {formatUnixTime(task.last_sync_at)}</span>
                      ) : null}
                    </div>
                    {task.error_msg ? (
                      <p className="text-[11px] text-destructive">
                        {task.error_code ? `[${task.error_code}] ` : ""}
                        {task.error_msg}
                      </p>
                    ) : null}
                  </div>

                  {canSync ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-xs"
                      disabled={syncingId === task.task_id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSync(task.task_id)
                      }}
                    >
                      <RotateCw
                        className={
                          syncingId === task.task_id ? "animate-spin" : undefined
                        }
                      />
                      同步
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

