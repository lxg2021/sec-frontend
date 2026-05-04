"use client"

import { useState } from "react"
import { Play, Trash2, Clock, Calendar, Settings, CheckCircle, XCircle, CalendarCheck, Fingerprint, Package, Tag, Factory } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
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
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import type { CreateUninstallTaskRequest, CreateUninstallTaskResponse } from "@/features/assets/software/types/task-soft-uninstall"

interface UninstallSoftTaskListProps {
  tasks: CreateUninstallTaskRequest[]
  onDeleteTask: (taskId: string) => void
}

function TargetHostList({
  targets,
}: {
  targets: { hostId: string; hostName: string }[]
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleTargets = expanded ? targets : targets.slice(0, 5)

  return (
    <div className="space-y-2">
      <div className="font-bold text-sm">目标主机:</div>

      <div className={expanded ? "space-y-1 max-h-64 overflow-y-auto pr-2" : "space-y-1"}>
        {visibleTargets.map((target) => (
          <div
            key={target.hostId}
            className="flex items-center justify-between bg-muted rounded p-2"
          >
            {/* 左侧：主机名 */}
            <div className="text-sm font-medium truncate">{target.hostName}</div>

            {/* 右侧：主机ID */}
            <Badge variant="outline" className="text-xs">
              {target.hostId}
            </Badge>
          </div>
        ))}
      </div>

      {targets.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-primary hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "收起" : `展开更多 (${targets.length - 5})`}
        </Button>
      )}
    </div>
  )
}


export function UninstallSoftTaskList({ tasks, onDeleteTask }: UninstallSoftTaskListProps) {
  const [submissionStatuses, setSubmissionStatuses] = useState<Map<string, CreateUninstallTaskResponse>>(new Map())

  const getTypeColor = (type: "uninstall" | "quietUninstall") => {
    return type === "uninstall" ? "bg-red-600 text-white" : "bg-orange-600 text-white"
  }

  const getTypeLabel = (type: "uninstall" | "quietUninstall") => {
    return type === "uninstall" ? "卸载" : "静默卸载"
  }

  const getScheduleDisplay = (task: CreateUninstallTaskRequest) => {
    if (task.schedule.type === "IMMEDIATE") {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-3 w-3" />
          <span>立即执行</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          <span>{new Date(task.schedule.executeAt).toLocaleString()}</span>
        </div>
      )
    }
  }

  const getStatusIcon = (status: CreateUninstallTaskResponse["status"]) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: CreateUninstallTaskResponse["status"]) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleExecuteTask = (task: CreateUninstallTaskRequest) => {
    console.log("Submitting uninstall task to backend:", task)

    setTimeout(() => {
      const isSuccess = Math.random() > 0.2
      const response: CreateUninstallTaskResponse = {
        taskId: task.taskId,
        status: isSuccess ? "SUCCESS" : "FAILED",
        errorMessage: isSuccess ? undefined : "Backend server connection timeout",
      }

      setSubmissionStatuses((prev) => {
        const newMap = new Map(prev)
        newMap.set(task.taskId, response)
        return newMap
      })
    }, 1000)
  }

  const handleDeleteTask = (taskId: string) => {
    onDeleteTask(taskId)
    setSubmissionStatuses((prev) => {
      const newMap = new Map(prev)
      newMap.delete(taskId)
      return newMap
    })
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-3">
            {/* 图标背景块 */}
            <div className="p-2 bg-gradient-to-br from-red-400 to-red-600 rounded-lg">
              <CalendarCheck className="h-5 w-5 text-white" />
            </div>
            {/* 标题 + 副标题 */}
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">卸载任务</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{tasks.length} 个任务</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="flex flex-col space-y-2">
              <p className="text-sm">暂无卸载任务</p>
              <p className="text-xs">请从软件清单创建卸载任务以管理软件移除</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-3">
            {/* 图标背景块 */}
            <div className="p-2 bg-gradient-to-br from-red-400 to-red-600 rounded-lg">
              <CalendarCheck className="h-5 w-5 text-white" />
            </div>
            {/* 标题 + 副标题 */}
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">卸载任务</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{tasks.length} 个任务</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => {
              const submissionStatus = submissionStatuses.get(task.taskId)

              return (
                <div key={task.taskId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.taskName}</h4>
                        <Badge className={getTypeColor(task.type)}>{getTypeLabel(task.type)}</Badge>

                        {submissionStatus && (
                          <Badge className={getStatusColor(submissionStatus.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(submissionStatus.status)}
                              <span>{submissionStatus.status === "SUCCESS" ? "提交成功" : "提交失败"}</span>
                            </div>
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>任务ID: {task.taskId}</span>
                        <span>创建时间: {new Date(task.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!submissionStatus && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleExecuteTask(task)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>提交任务</TooltipContent>
                        </Tooltip>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>删除任务</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除任务 "{task.taskName}" 吗？此操作无法撤销!
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTask(task.taskId)}>删除</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-bold mb-1">执行计划</div>
                      {getScheduleDisplay(task)}
                    </div>
                    <div>
                      <div className="font-bold mb-1">目标</div>
                      <div className="text-muted-foreground">
                        <div>{task.targets.length}台主机</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold mb-1">策略</div>
                      <div className="space-y-1 text-muted-foreground">
                        <div>重试: {task.retryCount}</div>
                      </div>
                    </div>
                  </div>

                  {/* 分隔线 */}
                  <div className="my-4 border-t border-border" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-bold mb-1 flex items-center gap-1">
                        软件名称
                      </div>
                      {task.name ? (
                        <div className="text-muted-foreground">{task.name}</div>
                      ) : (
                        <div className="text-muted-foreground">无</div>
                      )}
                    </div>

                    <div>
                      <div className="font-bold mb-1 flex items-center gap-1">
                        软件版本
                      </div>
                      {task.version ? (
                        <div className="text-muted-foreground">{task.version}</div>
                      ) : (
                        <div className="text-muted-foreground">无</div>
                      )}
                    </div>

                    <div>
                      <div className="font-bold mb-1 flex items-center gap-1">
                        软件厂商
                      </div>
                      {task.vendor ? (
                        <div className="text-muted-foreground">{task.vendor}</div>
                      ) : (
                        <div className="text-muted-foreground">无</div>
                      )}
                    </div>
                  </div>

                  {/* 分隔线 */}
                  <div className="my-4 border-t border-border" />

                  {submissionStatus && submissionStatus.status === "FAILED" && submissionStatus.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-center gap-2 text-red-800 text-sm">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">任务提交失败</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{submissionStatus.errorMessage}</p>
                    </div>
                  )}

                  {submissionStatus && submissionStatus.status === "SUCCESS" && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center gap-2 text-green-800 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">任务提交成功</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">任务已成功提交到后台服务器</p>
                    </div>
                  )}

                  <TargetHostList targets={task.targets} />

                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
