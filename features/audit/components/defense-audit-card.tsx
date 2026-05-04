"use client"

import { useState } from "react"
import { Card } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Shield, ShieldAlert, Bell } from "lucide-react"
import type { DefenseAudit } from "@/features/audit/types"
import { cn } from "@/shared/lib/utils"

interface DefenseAuditCardProps {
  audit: DefenseAudit
}

export function DefenseAuditCard({ audit }: DefenseAuditCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "ALERT":
        return Bell
      case "BLOCK":
        return ShieldAlert
      case "PROMPT":
        return AlertTriangle
      default:
        return Shield
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "ALERT":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "BLOCK":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "PROMPT":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
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
          <Badge variant="secondary" className="text-xs">
            {audit.executionSource}
          </Badge>
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
              <span className="text-muted-foreground">规则ID:</span>
              <span className="ml-2 font-mono">{audit.ruleId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">主机ID:</span>
              <span className="ml-2 font-mono">{audit.id}</span>
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
              <h4 className="text-sm font-medium">防御详情</h4>
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
