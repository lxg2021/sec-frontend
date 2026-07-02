"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  endpointStatusLabel,
  riskLevelLabel,
  taskStatusLabel,
} from "../mappers"
import type { EndpointStatus, RiskLevel, TaskStatus } from "../types"

export function EndpointStatusBadge({ status }: { status: EndpointStatus }) {
  const styles: Record<EndpointStatus, string> = {
    online: "border-emerald-200 bg-emerald-50 text-emerald-700",
    offline: "bg-muted text-muted-foreground border-border",
    unknown: "border-amber-200 bg-amber-50 text-amber-700",
  }
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", styles[status])}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "online" && "bg-emerald-500",
          status === "offline" && "bg-muted-foreground",
          status === "unknown" && "bg-amber-500",
        )}
        aria-hidden
      />
      {endpointStatusLabel[status]}
    </Badge>
  )
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    pending: "bg-muted text-muted-foreground border-border",
    running: "border-sky-200 bg-sky-50 text-sky-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    canceled: "bg-muted text-muted-foreground border-border",
    timeout: "border-amber-200 bg-amber-50 text-amber-700",
  }
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {taskStatusLabel[status]}
    </Badge>
  )
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<string, string> = {
    low: "bg-muted text-muted-foreground border-border",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    high: "bg-destructive/15 text-destructive border-destructive/30",
  }
  return (
    <Badge variant="outline" className={cn("font-medium", styles[level] ?? styles.low)}>
      {riskLevelLabel[level] ?? level}
    </Badge>
  )
}

export function CopyButton({
  value,
  label = "已复制",
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-6 shrink-0 text-muted-foreground", className)}
      onClick={async (e) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          toast.success(label)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          toast.error("复制失败")
        }
      }}
      aria-label="复制"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  )
}

export function MonoText({
  value,
  className,
  truncate,
}: {
  value?: string
  className?: string
  truncate?: boolean
}) {
  if (!value) return <span className="text-muted-foreground">-</span>
  return (
    <span
      title={value}
      className={cn(
        "font-mono text-xs",
        truncate && "block max-w-[14ch] truncate",
        className,
      )}
    >
      {value}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      {Icon ? <Icon className="size-6 text-muted-foreground" /> : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

