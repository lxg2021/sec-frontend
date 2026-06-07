"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, CalendarClock, Clock, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { fetchAttackEventTimelineDistribution } from "@/features/attack/dashboard/api"
import type { AttackOverview } from "@/features/attack/dashboard/types"
import {
  AttackDistributionTimeline,
  type AttackEventTimelinePoint,
  type GetAttackEventTimelineDistributionData,
  type Granularity,
} from "@/features/attack/dashboard/components/attack-distribution-timeline"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

interface AttackSnapshotSelectorProps {
  value?: string
  snapshot?: AttackOverview
  disabled?: boolean
  onChange: (snapshot: AttackOverview) => void
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

export function AttackSnapshotSelector({
  snapshot,
  disabled = false,
}: AttackSnapshotSelectorProps) {
  const t = useTranslations("pages.attack.dashboard.header")
  const [open, setOpen] = useState(false)
  const [timelineGranularity, setTimelineGranularity] = useState<Granularity>("month")
  const [timelineData, setTimelineData] = useState<GetAttackEventTimelineDistributionData | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState(false)
  const [selectedTimelineRange, setSelectedTimelineRange] = useState<{
    start: AttackEventTimelinePoint
    end: AttackEventTimelinePoint
  } | null>(null)
  const selectedStartRaw = snapshot?.bucket.bucket_start
  const selectedEndRaw = snapshot?.bucket.bucket_end

  useEffect(() => {
    if (!open) return

    let cancelled = false

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
          setSelectedTimelineRange(null)
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

  const selectedStart = formatTime(selectedStartRaw)
  const selectedEnd = formatTime(selectedEndRaw)

  const timelinePreviewData: GetAttackEventTimelineDistributionData = useMemo(
    () =>
      timelineData ?? {
        start_time: selectedStart,
        end_time: selectedEnd,
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
    [selectedEnd, selectedStart, timelineData, timelineGranularity],
  )

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex min-w-[320px] items-center gap-3 rounded-2xl bg-slate-50/90 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 lg:border-l lg:border-slate-200 lg:bg-transparent lg:pl-5 lg:pr-0 lg:hover:bg-slate-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80 lg:bg-slate-50">
          {timelineLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs leading-none text-slate-400">{t("checkRange")}</span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-700 tabular-nums">
            <span className="truncate">{selectedStart}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{selectedEnd}</span>
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <CalendarClock className="h-5 w-5 text-teal-600" />
              {t("snapshotDialogTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <AttackDistributionTimeline
              data={timelinePreviewData}
              loading={timelineLoading}
              onGranularityChange={setTimelineGranularity}
              onRangeChange={setSelectedTimelineRange}
            />

            {timelineError && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                攻击时间分布加载失败
              </div>
            )}

            {selectedTimelineRange && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                已选择：{selectedTimelineRange.start.bucket_start}
                <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-slate-400" />
                {selectedTimelineRange.end.bucket_end}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
