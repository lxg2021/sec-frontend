"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from "lucide-react"
import type { TaskDispatchReport } from "@/lib/audit/task-dispatch-report"
import { cn } from "@/lib/utils"

interface TaskDispatchCardProps {
  report: TaskDispatchReport
}

export function TaskDispatchCard({ report }: TaskDispatchCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case "TASK":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "CONFIG":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "POLICY":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "MEDIUM":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "LOW":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const formatTime = (time: string) => {
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString("zh-CN")
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium">{report.name}</h3>
            <Badge variant="outline" className={cn("text-xs", getTaskTypeColor(report.taskType))}>
              {report.taskType}
            </Badge>
            {report.priority && (
              <Badge variant="outline" className={cn("text-xs", getPriorityColor(report.priority))}>
                {report.priority}
              </Badge>
            )}
            {report.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">ID: {report.id}</p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{report.successCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span>{report.pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>{report.failedCount}</span>
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-sm text-muted-foreground">{formatTime(report.createdAt)}</p>
          {report.dispatchedBy && <p className="text-sm font-medium">{report.dispatchedBy}</p>}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">进度</span>
          <span className="font-medium">{report.overallProgress}%</span>
        </div>
        <Progress value={report.overallProgress} className="h-2" />
      </div>

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full justify-between">
          <span>{expanded ? "收起详情" : "展开详情"}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t">
          {report.successCount > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                成功主机 ({report.successCount}台)
              </h4>
              <div className="text-sm text-muted-foreground">
                {report.successHosts
                  .slice(0, 5)
                  .map((h) => h.hostName)
                  .join(", ")}
                {report.successHosts.length > 5 && "..."}
              </div>
            </div>
          )}

          {report.failedCount > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                失败主机 ({report.failedCount}台)
              </h4>
              <div className="space-y-1">
                {report.failedHosts.slice(0, 3).map((h) => (
                  <div key={h.hostId} className="text-sm">
                    <span className="font-medium">{h.hostName}</span>
                    {h.errorMessage && <span className="text-muted-foreground ml-2">({h.errorMessage})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.pendingCount > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                待执行主机 ({report.pendingCount}台)
              </h4>
              <div className="text-sm text-muted-foreground">
                {report.pendingHosts
                  .slice(0, 5)
                  .map((h) => h.hostName)
                  .join(", ")}
                {report.pendingHosts.length > 5 && "..."}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
