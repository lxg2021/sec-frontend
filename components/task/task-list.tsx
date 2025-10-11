"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { type Task, type TaskType, getTaskType } from "@/lib/task/task-types"
import { deleteTask } from "@/lib/task/api"
import { useToast } from "@/hooks/use-toast"
import type { BaselinePolicyType } from "@/lib/task/baseline-scan-task"

interface TaskListProps {
  tasks: Task[]
  onEdit: (type: TaskType, task: Task) => void
  onDelete: (taskId: string) => void
}

const POLICY_LABELS: Record<BaselinePolicyType, string> = {
  SECURITY_CONFIG: "安全配置",
  PATCH_COMPLIANCE: "补丁合规",
  CUSTOM_POLICY: "自定义策略",
}

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return

    setDeletingTaskId(taskToDelete)
    try {
      await deleteTask(taskToDelete)
      onDelete(taskToDelete)
      toast({
        title: "任务已删除",
        description: "任务已成功从系统中删除",
      })
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除任务时发生错误",
        variant: "destructive",
      })
    } finally {
      setDeletingTaskId(null)
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "待执行", variant: "secondary" as const, icon: Clock },
      running: { label: "运行中", variant: "default" as const, icon: Loader2 },
      completed: { label: "已完成", variant: "outline" as const, icon: CheckCircle2 },
      failed: { label: "失败", variant: "destructive" as const, icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTaskTypeBadge = (type: TaskType) => {
    const typeConfig = {
      vulnerability: { label: "漏洞扫描", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      attck: { label: "ATT&CK", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      baseline: { label: "基线扫描", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    }

    const config = typeConfig[type]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatPolicies = (policies: BaselinePolicyType[]) => {
    return policies.map((p) => POLICY_LABELS[p]).join(", ")
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
          <CardDescription>暂无任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">还没有创建任何任务</p>
            <p className="mt-2 text-sm text-muted-foreground">使用上方的表单创建您的第一个扫描任务</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
          <CardDescription>共 {tasks.length} 个任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => {
              const taskType = getTaskType(task)
              const isDeleting = deletingTaskId === task.id

              return (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{task.name}</h3>
                      {getTaskTypeBadge(taskType)}
                      {getStatusBadge(task.status)}
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">任务 ID:</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{task.id}</code>
                      </div>

                      {"targetHosts" in task && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">目标主机:</span>
                          <span>{task.targetHosts.join(", ")}</span>
                        </div>
                      )}

                      {"policy" in task && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">基线策略:</span>
                          <span>{Array.isArray(task.policy) ? formatPolicies(task.policy) : task.policy}</span>
                        </div>
                      )}

                      {"dataSources" in task && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">数据源:</span>
                          <span>{task.dataSources}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="font-medium">创建时间:</span>
                        <span>{formatDate(task.createdAt)}</span>
                      </div>

                      {task.updatedAt && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">更新时间:</span>
                          <span>{formatDate(task.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(taskType, task)} disabled={isDeleting}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">编辑任务</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(task.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      <span className="sr-only">删除任务</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>此操作无法撤销。确定要删除这个任务吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
