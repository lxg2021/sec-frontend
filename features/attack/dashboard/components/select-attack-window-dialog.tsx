"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, X } from "lucide-react"

import {
  fetchAttackEventTimelineDistribution,
  fetchAttackSnapshotById,
  resolveAttackStatsRangeSnapshot,
} from "@/features/attack/dashboard/api"
import type { AttackOverview } from "@/features/attack/dashboard/types"
import {
  AttackDistributionTimeline,
  type AttackEventTimelinePoint,
  type GetAttackEventTimelineDistributionData,
  type Granularity,
} from "@/features/attack/dashboard/components/attack-distribution-timeline"
import { Button } from "@/features/attack/dashboard/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { useToast } from "@/shared/hooks/use-toast"

interface SelectAttackWindowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStart?: string
  defaultEnd?: string
  onSnapshotChange?: (snapshot: AttackOverview) => void
  onCheckSubmitted?: (taskId: string) => void
}

function formatTime(value?: string) {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function parseTimelineTime(value: string): Date | null {
  if (!value) return null
  const date = new Date(value.replace(" ", "T"))
  return Number.isNaN(date.getTime()) ? null : date
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function isTimelineRangeWithinThreeMonths(startTime: string, endTime: string) {
  const start = parseTimelineTime(startTime)
  const end = parseTimelineTime(endTime)
  if (!start || !end) return false
  return end <= addMonths(start, 3)
}

function clampTimelineTime(value: string, min?: string, max?: string) {
  const current = parseTimelineTime(value)
  const minDate = min ? parseTimelineTime(min) : null
  const maxDate = max ? parseTimelineTime(max) : null
  if (!current) return value
  if (min && minDate && current < minDate) return min
  if (max && maxDate && current > maxDate) return max
  return value
}

function withTimelineBounds(
  range: { start: AttackEventTimelinePoint; end: AttackEventTimelinePoint },
  data: GetAttackEventTimelineDistributionData,
) {
  return {
    start: {
      ...range.start,
      bucket_start: clampTimelineTime(range.start.bucket_start, data.start_time, data.end_time),
    },
    end: {
      ...range.end,
      bucket_end: clampTimelineTime(range.end.bucket_end, data.start_time, data.end_time),
    },
  }
}

export function SelectAttackWindowDialog({
  open,
  onOpenChange,
  defaultStart = "",
  defaultEnd = "",
  onSnapshotChange,
  onCheckSubmitted,
}: SelectAttackWindowDialogProps) {
  const { toast } = useToast()
  const [timelineGranularity, setTimelineGranularity] = useState<Granularity>("day")
  const [timelineData, setTimelineData] = useState<GetAttackEventTimelineDistributionData | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimelineRange, setSelectedTimelineRange] = useState<{
    start: AttackEventTimelinePoint
    end: AttackEventTimelinePoint
  } | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    setError(null)
    setSelectedTimelineRange(null)
    setTimelineData(null)

    async function loadTimeline() {
      setTimelineLoading(true)
      setTimelineError(false)
      try {
        const result = await fetchAttackEventTimelineDistribution({
          granularity: timelineGranularity,
          timezone: "Asia/Shanghai",
        })
        if (!cancelled) {
          setTimelineData(result)
          const first = result.items[0]
          const last = result.items[result.items.length - 1]
          setSelectedTimelineRange(
            first && last ? withTimelineBounds({ start: first, end: last }, result) : null,
          )
        }
      } catch (err) {
        console.error("load attack event timeline failed", err)
        if (!cancelled) {
          setTimelineError(true)
          setTimelineData(null)
          setSelectedTimelineRange(null)
        }
      } finally {
        if (!cancelled) setTimelineLoading(false)
      }
    }

    void loadTimeline()

    return () => {
      cancelled = true
    }
  }, [open, timelineGranularity])

  const busy = timelineLoading || applying
  const timelinePreviewData: GetAttackEventTimelineDistributionData = useMemo(
    () =>
      timelineData ?? {
        start_time: formatTime(defaultStart),
        end_time: formatTime(defaultEnd),
        timezone: "Asia/Shanghai",
        granularity: timelineGranularity,
        coverage_status: "unknown",
        total_sources: 0,
        total_instances: 0,
        total_groups: 0,
        total_rules: 0,
        total_hosts: 0,
        total_cases: 0,
        items: [],
      },
    [defaultEnd, defaultStart, timelineData, timelineGranularity],
  )

  const handleCancel = () => {
    if (busy) return
    onOpenChange(false)
    setError(null)
  }

  const handleConfirm = async () => {
    if (!selectedTimelineRange) return

    const startTime = selectedTimelineRange.start.bucket_start
    const endTime = selectedTimelineRange.end.bucket_end
    const nextGranularity =
      timelineGranularity === "hour" && !isTimelineRangeWithinThreeMonths(startTime, endTime)
        ? "month"
        : timelineGranularity

    setApplying(true)
    setTimelineLoading(true)
    setTimelineError(false)
    setError(null)
    try {
      setTimelineGranularity(nextGranularity)

      const resolved = await resolveAttackStatsRangeSnapshot({
        startTime,
        endTime,
        timezone: "Asia/Shanghai",
        autoTriggerDetection: true,
      })

      if (!resolved.snapshot_id) {
        if (resolved.task_id) {
          onOpenChange(false)
          onCheckSubmitted?.(resolved.task_id)
          toast({
            title: "检查任务已提交",
            description: `${startTime} - ${endTime}`,
          })
          return
        }
        setError("当前窗口没有可用快照，检查任务提交失败")
        return
      }

      const resolvedSnapshot = await fetchAttackSnapshotById(resolved.snapshot_id)
      if (!resolvedSnapshot) {
        throw new Error(`未找到快照 ${resolved.snapshot_id}`)
      }

      onSnapshotChange?.(resolvedSnapshot)
      toast({
        title: "窗口已应用",
        description: `${startTime} - ${endTime}`,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "应用窗口失败")
    } finally {
      setTimelineLoading(false)
      setApplying(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (busy) return
        onOpenChange(nextOpen)
        if (!nextOpen) setError(null)
      }}
    >
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>选择窗口</DialogTitle>
        </DialogHeader>
        <div className="flex h-11 items-center justify-end px-4 pt-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCancel}
            disabled={busy}
            aria-label="关闭"
            className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[calc(88vh-120px)] space-y-3 overflow-y-auto px-4 pb-4">
          <AttackDistributionTimeline
            data={timelinePreviewData}
            loading={timelineLoading}
            onGranularityChange={setTimelineGranularity}
            onRangeChange={(range) => setSelectedTimelineRange(withTimelineBounds(range, timelinePreviewData))}
            className="gap-3 rounded-lg p-3 sm:p-3 [&_.attack-timeline-chart]:h-60"
          />

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {selectedTimelineRange ? (
              <span className="inline-flex min-w-0 items-center">
                已选择：{selectedTimelineRange.start.bucket_start}
                <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-slate-400" />
                {selectedTimelineRange.end.bucket_end}
              </span>
            ) : (
              "请先拖动下方时间轴选择窗口"
            )}
          </div>

          {timelineError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              攻击时间分布加载失败
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <Button variant="outline" onClick={handleCancel} disabled={busy}>
            取消
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={busy || !selectedTimelineRange}>
            {busy ? "处理中" : "确认"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
