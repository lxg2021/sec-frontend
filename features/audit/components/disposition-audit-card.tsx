"use client"

import { useState } from "react"
import { Card } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, FileX, XOctagon, WifiOff, ShieldX } from "lucide-react"
import type { DispositionAudit } from "@/features/audit/types"
import { cn } from "@/shared/lib/utils"

interface DispositionAuditCardProps {
  audit: DispositionAudit
}

export function DispositionAuditCard({ audit }: DispositionAuditCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "ISOLATE":
        return FileX
      case "TERMINATE":
        return XOctagon
      case "DISCONNECT":
        return WifiOff
      case "QUARANTINE":
        return ShieldX
      default:
        return FileX
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "ISOLATE":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "TERMINATE":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "DISCONNECT":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "QUARANTINE":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "HIGH":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
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

  const ActionIcon = getActionIcon(audit.actionType)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <ActionIcon className="h-5 w-5 mt-0.5 text-primary" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{audit.name}</span>
              <Badge variant="outline" className={cn("text-xs", getActionColor(audit.actionType))}>
                {audit.actionType}
              </Badge>
              {audit.severity && (
                <Badge variant="outline" className={cn("text-xs", getSeverityColor(audit.severity))}>
                  {audit.severity}
                </Badge>
              )}
              {audit.status === "SUCCESS" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{audit.ruleName}</p>
            {audit.message && <p className="text-sm">{audit.message}</p>}
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-sm text-muted-foreground">{formatTime(audit.triggeredAt)}</p>
          {audit.handledBy && (
            <Badge variant="secondary" className="text-xs">
              {audit.handledBy}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full justify-between">
          <span>{expanded ? "收起详情" : "展开详情"}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t">
          <div>
            <h4 className="text-sm font-medium mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">规则ID:</span>
                <span className="ml-2 font-mono">{audit.ruleId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">规则名称:</span>
                <span className="ml-2">{audit.ruleName}</span>
              </div>
              {audit.executionSource && (
                <div>
                  <span className="text-muted-foreground">执行来源:</span>
                  <span className="ml-2">{audit.executionSource}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">严重等级:</span>
                <span className="ml-2">{audit.severity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">触发时间:</span>
                <span className="ml-2">{new Date(audit.triggeredAt).toLocaleString("zh-CN")}</span>
              </div>
              {audit.resolvedAt && (
                <div>
                  <span className="text-muted-foreground">完成时间:</span>
                  <span className="ml-2">{new Date(audit.resolvedAt).toLocaleString("zh-CN")}</span>
                </div>
              )}
              {audit.handledBy && (
                <div>
                  <span className="text-muted-foreground">处理人:</span>
                  <span className="ml-2">{audit.handledBy}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">执行状态:</span>
                <span className="ml-2">{audit.status}</span>
              </div>
            </div>
          </div>

          {audit.tags && audit.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">标签:</span>
              {audit.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {audit.details && Object.keys(audit.details).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {audit.actionType === "ISOLATE" && "文件隔离详情"}
                {audit.actionType === "TERMINATE" && "进程终止详情"}
                {audit.actionType === "DISCONNECT" && "网络阻断详情"}
                {audit.actionType === "QUARANTINE" && "文件拦截详情"}
              </h4>
              <div className="bg-muted/50 p-3 rounded-md space-y-2 text-sm">
                {Object.entries(audit.details).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="text-muted-foreground min-w-[120px]">{key}:</span>
                    <span className="flex-1 break-all">
                      {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audit.message && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">附加信息</h4>
              <p className="text-sm text-muted-foreground">{audit.message}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
