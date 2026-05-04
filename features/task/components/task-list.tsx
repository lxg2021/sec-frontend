"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Pencil, Trash2, Clock, CheckCircle2, XCircle, Loader2, Server, Shield, Database, Calendar } from "lucide-react"
import { type Task, type TaskType, getTaskType } from "@/features/task/types"
import { deleteTask, mockDeleteTask } from "@/features/task/api"
import { useToast } from "@/shared/hooks/use-toast"
import type { BaselinePolicyType } from "@/features/task/models/baseline-scan-task"
import { ClipboardList } from "lucide-react"

interface TaskListProps {
  tasks: Task[]
  onEdit: (type: TaskType, task: Task) => void
  onDelete: (taskId: string) => void
}

const POLICY_LABELS: Record<BaselinePolicyType, string> = {
  SECURITY_CONFIG: "安全配置",
  PATCH_COMPLIANCE: "补丁合规",
  ACCOUNT_POLICY: "账号合规",
  ATTCK_POLICY: "ATTCK预检",
  SYSTEM_COMPLIANCE: "系统合规",
  PREEXECUTION_CHECK: "运行预检",
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
      await mockDeleteTask(taskToDelete)
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
      <Card className="border-0 shadow-lg w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          {/* 左侧图标 + 标题 */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <ClipboardList className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                任务列表
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                暂无任务
              </CardDescription>
            </div>
          </div>

          {/* 可选右上角占位 */}
          <div className="text-sm text-gray-500">
            {/* 可以显示最后更新时间或者留空 */}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
            <p className="text-lg font-medium text-gray-700">还没有创建任何任务</p>
            <p className="text-sm text-gray-500">
              使用上方的表单创建您的第一个扫描任务
            </p>
          </div>
        </CardContent>
        
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          {/* 标题左侧区域 */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <ClipboardList className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                任务列表
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                共 {tasks.length} 个任务
              </CardDescription>
            </div>
          </div>

          {/* 可选的右上角统计 / 操作区域 */}
          {tasks.length > 0 && (
            <div className="text-sm text-gray-500">
              最后更新时间：{new Date().toLocaleString()}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6 pt-0">
            {tasks.map((task) => {
              const taskType = getTaskType(task)
              const isDeleting = deletingTaskId === task.id

              return (
                <div
                  key={task.id}
                  className="group relative rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* 左侧：任务信息 */}
                    <div className="flex-1 space-y-4">
                      {/* 标题行 */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <h3 className="font-semibold text-lg truncate">{task.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTaskTypeBadge(taskType)}
                          {getStatusBadge(task.status)}
                        </div>
                      </div>

                      {/* 任务详情网格 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 基础信息 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium min-w-20 text-muted-foreground">任务 ID:</span>
                            <code className="rounded bg-muted px-2 py-1 text-xs font-mono truncate">
                              {task.id}
                            </code>
                          </div>

                          {"targetHosts" in task && task.targetHosts && (
                            <div className="flex items-start gap-2 text-sm">
                              <Server className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div>
                                <span className="font-medium text-muted-foreground">目标主机:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {task.targetHosts.slice(0, 3).map((host, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {host}
                                    </Badge>
                                  ))}
                                  {task.targetHosts.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{task.targetHosts.length - 3} 更多
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {"policy" in task && task.policy && (
                            <div className="flex items-start gap-2 text-sm">
                              <Shield className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div>
                                <span className="font-medium text-muted-foreground">基线策略:</span>
                                <div className="mt-1">
                                  {Array.isArray(task.policy) ? (
                                    <div className="flex flex-wrap gap-1">
                                      {task.policy.slice(0, 3).map((policy, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {POLICY_LABELS[policy]}
                                        </Badge>
                                      ))}
                                      {task.policy.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{task.policy.length - 3} 更多
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      {task.policy}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 时间信息 */}
                        <div className="space-y-3">
                          {"dataSources" in task && task.dataSources && (
                            <div className="flex items-center gap-2 text-sm">
                              <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <span className="font-medium text-muted-foreground">数据源:</span>
                                <span className="ml-2">{task.dataSources}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <span className="font-medium text-muted-foreground">创建时间:</span>
                              <span className="ml-2">{formatDate(task.createdAt)}</span>
                            </div>
                          </div>

                          {task.updatedAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <span className="font-medium text-muted-foreground">更新时间:</span>
                                <span className="ml-2">{formatDate(task.updatedAt)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex lg:flex-col gap-2 lg:self-start">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 lg:w-full"
                        onClick={() => onEdit(taskType, task)}
                        disabled={isDeleting}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="lg:sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 lg:w-full text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(task.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="lg:sr-only">删除</span>
                      </Button>
                    </div>
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
            <AlertDialogDescription>
              此操作无法撤销。确定要删除这个任务吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
