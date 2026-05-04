"use client"

import { useState } from "react"
import { Card } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, LogIn, LogOut, Shield, Settings, Users } from "lucide-react"
import type { UserActivityAudit } from "@/features/audit/types"
import { cn } from "@/shared/lib/utils"

interface UserActivityCardProps {
  audit: UserActivityAudit
}

export function UserActivityCard({ audit }: UserActivityCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getActionIcon = (actionType: string) => {
    if (actionType.includes("LOGIN")) return LogIn
    if (actionType.includes("LOGOUT")) return LogOut
    if (actionType.includes("BLOCK")) return Shield
    if (actionType.includes("CONFIG") || actionType.includes("TASK")) return Settings
    if (actionType.includes("USER") || actionType.includes("ROLE")) return Users
    return Settings
  }

  const getActionColor = (actionType: string) => {
    if (actionType.includes("LOGIN")) return "text-blue-500"
    if (actionType.includes("FAILED")) return "text-red-500"
    if (actionType.includes("BLOCK")) return "text-red-500"
    if (actionType.includes("DELETE")) return "text-orange-500"
    if (actionType.includes("CREATE")) return "text-green-500"
    return "text-gray-500"
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
          <ActionIcon className={cn("h-5 w-5 mt-0.5", getActionColor(audit.actionType))} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{audit.username}</span>
              <Badge variant="outline" className="text-xs">
                {audit.actionType}
              </Badge>
              {audit.targetType && (
                <Badge variant="secondary" className="text-xs">
                  {audit.targetType}
                </Badge>
              )}
              {audit.result === "SUCCESS" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            {audit.targetId && (
              <p className="text-sm text-muted-foreground">
                操作对象: {audit.targetType}: {audit.targetId}
              </p>
            )}
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-sm text-muted-foreground">{formatTime(audit.timestamp)}</p>
          {audit.sourceIp && <p className="text-xs text-muted-foreground">{audit.sourceIp}</p>}
        </div>
      </div>

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="w-full justify-between">
          <span>{expanded ? "收起详情" : "展开详情"}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">事件ID:</span>
              <span className="ml-2 font-mono">{audit.eventId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">用户ID:</span>
              <span className="ml-2 font-mono">{audit.userId}</span>
            </div>
            {audit.targetType && (
              <div>
                <span className="text-muted-foreground">目标类型:</span>
                <span className="ml-2">{audit.targetType}</span>
              </div>
            )}
            {audit.sourceIp && (
              <div>
                <span className="text-muted-foreground">来源IP:</span>
                <span className="ml-2 font-mono">{audit.sourceIp}</span>
              </div>
            )}
          </div>

          {audit.details && Object.keys(audit.details).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">详细信息</h4>
              <div className="bg-muted/50 p-3 rounded-md space-y-1 text-sm">
                {Object.entries(audit.details).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="ml-2">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
