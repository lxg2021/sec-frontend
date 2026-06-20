"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { CalendarClock, Loader2, Play, Radar, RefreshCw } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import type {
  AttackOverview,
  BucketType,
} from "@/features/attack/dashboard/types"
import { AttackSnapshotSelector } from "@/features/attack/dashboard/components/attack-snapshot-selector"
import { SelectAttackWindowDialog } from "@/features/attack/dashboard/components/select-attack-window-dialog"
import { TriggerCheckDialog } from "@/features/attack/dashboard/components/trigger-check-dialog"
import { Button } from "@/shared/ui/button"
import { useTranslations } from "next-intl"

const BUCKET_LABEL: Record<BucketType, string> = {
  fixed: "FIXED",
  hour: "HOUR",
  day: "DAY",
}

export interface AttackDashboardHeaderProps {
  overview: AttackOverview
  checking?: boolean
  onRefresh?: () => void
  onCheckSubmitted?: (taskId: string) => void
  onSnapshotChange?: (snapshot: AttackOverview) => void
  className?: string
  title?: ReactNode
  icon?: ReactNode
  iconContainerClassName?: string
  showCheckAction?: boolean
}

function parseOverviewBucketTime(value?: string) {
  if (!value) return ""
  const normalized = value.trim().replace(" ", "T")
  if (!normalized) return ""
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  const date = new Date(hasExplicitTimezone ? normalized : `${normalized}Z`)
  if (Number.isNaN(date.getTime())) return ""
  return date
}

function toShanghaiInputValue(value?: string) {
  const date = parseOverviewBucketTime(value)
  if (!date) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`
}

export function AttackDashboardHeader({
  overview,
  checking = false,
  onRefresh,
  onCheckSubmitted,
  onSnapshotChange,
  className,
  title,
  icon,
  iconContainerClassName,
  showCheckAction = true,
}: AttackDashboardHeaderProps) {
  const t = useTranslations("pages.attack.dashboard")
  const [windowDialogOpen, setWindowDialogOpen] = useState(false)
  const [checkDialogOpen, setCheckDialogOpen] = useState(false)
  const { bucket, scope } = overview

  return (
    <header
      className={cn(
        "w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600",
              iconContainerClassName,
            )}
          >
            {icon ?? <Radar className="h-5 w-5" />}
          </div>
          <div className="min-w-0 space-y-1.5">
            <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
              {title ?? t("title")}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="inline-flex h-7 items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-teal-600">
                {BUCKET_LABEL[bucket.bucket_type]}
              </span>
              <span className="text-slate-500">
                ATT&amp;CK <span className="px-1 text-slate-200">/</span>
                {scope || t("allHosts")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:gap-3">
          <AttackSnapshotSelector
            value={bucket.snapshot_id}
            snapshot={overview}
            disabled={checking}
            onChange={(snapshot) => onSnapshotChange?.(snapshot)}
          />

          <div className="flex items-center gap-1 lg:border-l lg:border-slate-200 lg:pl-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWindowDialogOpen(true)}
              disabled={checking}
              className="h-10 gap-2 rounded-full px-3 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <CalendarClock className="h-4 w-4" />
              <span className="font-medium">{t("header.selectWindow")}</span>
            </Button>
            {showCheckAction ? (
              <>
                <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCheckDialogOpen(true)}
                  disabled={checking}
                  className="h-10 gap-2 rounded-full px-3 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  <span className="font-medium">
                    {checking ? t("header.checking") : t("header.checkNow")}
                  </span>
                </Button>
              </>
            ) : null}
          </div>

          <div className="flex items-center lg:border-l lg:border-slate-200 lg:pl-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={checking}
              aria-label={t("header.refreshOverview")}
              className="h-10 w-10 shrink-0 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <RefreshCw
                className={cn("h-4 w-4", checking && "animate-spin")}
              />
              <span className="sr-only">{t("header.refreshOverview")}</span>
            </Button>
          </div>
        </div>
      </div>

      <SelectAttackWindowDialog
        open={windowDialogOpen}
        onOpenChange={setWindowDialogOpen}
        defaultStart={toShanghaiInputValue(bucket.bucket_start)}
        defaultEnd={toShanghaiInputValue(bucket.bucket_end)}
        onSnapshotChange={onSnapshotChange}
        onCheckSubmitted={onCheckSubmitted}
      />

      {showCheckAction ? (
        <TriggerCheckDialog
          open={checkDialogOpen}
          onOpenChange={setCheckDialogOpen}
          onSubmitted={onCheckSubmitted}
        />
      ) : null}
    </header>
  )
}
