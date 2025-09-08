"use client"

import { useState } from "react"
import { Play, Trash2, Clock, Calendar, Settings, CheckCircle, XCircle, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { InstallTask, TaskOperation, SendTaskResponse } from "@/lib/taskInstall"

interface InstallTaskListProps {
  tasks: InstallTask[]
  onDeleteTask: (taskId: string) => void
}

export function InstallTaskList({ tasks, onDeleteTask }: InstallTaskListProps) {
  const [submissionStatuses, setSubmissionStatuses] = useState<Map<string, SendTaskResponse>>(new Map())

  const getOperationColor = (operation: TaskOperation) => {
    return operation === "INSTALL" ? "bg-green-600 text-white" : "bg-red-600 text-white"
  }

  const getScheduleDisplay = (task: InstallTask) => {
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

  const getStatusIcon = (status: SendTaskResponse["status"]) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: SendTaskResponse["status"]) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleExecuteTask = (task: InstallTask) => {
    console.log("[v0] Submitting task to backend:", task)

    setTimeout(() => {
      const isSuccess = Math.random() > 0.2
      const response: SendTaskResponse = {
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

  const getTotalHostsForTask = (task: InstallTask) => {
    return task.patches.reduce((total, patch) => total + patch.selectedHosts.length, 0)
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            安装任务
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="flex flex-col space-y-2">
              <p className="text-sm">暂无安装任务</p>
              <p className="text-xs">请从已选择的补丁创建任务以管理部署</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span>安装任务</span>
            </div>
            <Badge variant="outline">{tasks.length} 任务</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => {
              const submissionStatus = submissionStatuses.get(task.taskId)
              const totalHosts = getTotalHostsForTask(task)

              return (
                <div key={task.taskId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.taskName}</h4>
                        <Badge className={getOperationColor(task.operation)}>安装</Badge>

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
                        {task.patches.length}个补丁, {totalHosts}台主机
                      </div>
                    </div>
                    <div>
                      <div className="font-bold mb-1">策略</div>
                      <div className="space-y-1 text-muted-foreground">
                        <div>重启: {task.policy.rebootAfterInstall ? "是" : "否"}</div>
                        <div>回滚: {task.policy.rollbackOnFailure ? "是" : "否"}</div>
                        <div>重试: {task.policy.retryCount}</div>
                      </div>
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <div className="font-bold text-sm">补丁信息:</div>
                    <div className="space-y-1">
                      {task.patches.map((patch) => (
                        <div
                          key={patch.patch.patchGuid}
                          className="flex items-center justify-between text-sm bg-muted rounded p-2"
                        >
                          <span className="truncate">{patch.patch.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {patch.selectedHosts.length} 台主机
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}