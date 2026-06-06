"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/lib/utils"
import type { BucketType, TriggerCheckPayload } from "@/features/attack/dashboard/types"
import { getTaskStatus, triggerCheck } from "@/features/attack/dashboard/api"
import { Button } from "@/features/attack/dashboard/components/ui/button"

const BUCKET_OPTIONS: { value: BucketType; label: string }[] = [
  { value: "fixed", label: "固定区间 (FIXED)" },
  { value: "hour", label: "按小时 (HOUR)" },
  { value: "day", label: "按天 (DAY)" },
]

const TIMEZONE_OPTIONS = ["Asia/Shanghai", "Asia/Hong_Kong", "UTC", "America/New_York"]

interface TriggerCheckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStart?: string
  defaultEnd?: string
  defaultBucketType?: BucketType
  onSuccess?: () => void
}

type Phase = "idle" | "submitting" | "polling" | "failed"

export function TriggerCheckDialog({
  open,
  onOpenChange,
  defaultStart = "",
  defaultEnd = "",
  defaultBucketType = "fixed",
  onSuccess,
}: TriggerCheckDialogProps) {
  const [startTime, setStartTime] = useState(defaultStart)
  const [endTime, setEndTime] = useState(defaultEnd)
  const [bucketType, setBucketType] = useState<BucketType>(defaultBucketType)
  const [timezone, setTimezone] = useState("Asia/Shanghai")
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStartTime(defaultStart)
    setEndTime(defaultEnd)
    setBucketType(defaultBucketType)
  }, [defaultBucketType, defaultEnd, defaultStart, open])

  const loading = phase === "submitting" || phase === "polling"

  const resetState = () => {
    setPhase("idle")
    setError(null)
  }

  const validate = () => {
    if (!startTime) return "请选择开始时间"
    if (!endTime) return "请选择结束时间"
    if (new Date(startTime).getTime() > new Date(endTime).getTime()) {
      return "开始时间不能晚于结束时间"
    }
    return null
  }

  const pollUntilDone = async (taskId: string) => {
    while (true) {
      const status = await getTaskStatus(taskId)
      if (status.status === "success") return
      if (status.status === "failed") {
        throw new Error(status.error_message || "检查任务执行失败")
      }
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }

  const handleConfirm = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setPhase("submitting")

    const payload: TriggerCheckPayload = {
      start_time: startTime,
      end_time: endTime,
      bucket_type: bucketType,
      timezone,
    }

    try {
      const result = await triggerCheck(payload)
      setPhase("polling")
      await pollUntilDone(result.task_id)
      onSuccess?.()
      onOpenChange(false)
      resetState()
    } catch (err) {
      setPhase("failed")
      setError(err instanceof Error ? err.message : "检查任务执行失败")
    }
  }

  const handleCancel = () => {
    if (loading) return
    onOpenChange(false)
    resetState()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (loading) return
        onOpenChange(nextOpen)
        if (!nextOpen) resetState()
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0 text-left">
          <div className="space-y-1">
            <DialogTitle className="text-base font-semibold text-foreground">立即检查</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              设置时间范围与统计粒度，触发一次攻击溯源检查任务。
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCancel}
            disabled={loading}
            aria-label="关闭"
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <Field label="开始时间" required>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </Field>

          <Field label="结束时间" required>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </Field>

          <Field label="统计粒度">
            <select
              value={bucketType}
              onChange={(event) => setBucketType(event.target.value as BucketType)}
              disabled={loading}
              className={inputClass}
            >
              {BUCKET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="时区">
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              disabled={loading}
              className={inputClass}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {phase === "polling" ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            检查中，正在等待任务完成。
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "检查中..." : "确认"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const inputClass = cn(
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
)

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </span>
      {children}
    </label>
  )
}
