"use client"

import { ArrowRight, Clock } from "lucide-react"
import { useTranslations } from "next-intl"

import type { AttackOverview } from "@/features/attack/dashboard/types"

interface AttackSnapshotSelectorProps {
  value?: string
  snapshot?: AttackOverview
  disabled?: boolean
  onChange: (snapshot: AttackOverview) => void
}

function formatTime(value?: string) {
  if (!value) return "--"
  const normalized = value.trim().replace(" ", "T")
  const date = new Date(`${normalized}Z`)
  if (Number.isNaN(date.getTime())) return value
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`
}

export function AttackSnapshotSelector({ snapshot }: AttackSnapshotSelectorProps) {
  const t = useTranslations("pages.attack.dashboard.header")
  const selectedStart = formatTime(snapshot?.bucket.bucket_start)
  const selectedEnd = formatTime(snapshot?.bucket.bucket_end)

  return (
    <div
      className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-slate-50/90 px-3 py-2.5 text-left sm:min-w-[320px] lg:w-auto lg:border-l lg:border-slate-200 lg:bg-transparent lg:pl-5 lg:pr-0"
      title={`${selectedStart} - ${selectedEnd}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80 lg:bg-slate-50">
        <Clock className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs leading-none text-slate-400">{t("checkRange")}</span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-700 tabular-nums">
          <span className="truncate">{selectedStart}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{selectedEnd}</span>
        </span>
      </span>
    </div>
  )
}
