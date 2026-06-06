"use client"

import { useState } from "react"
import { ArrowRight, ChevronDown, Clock, Loader2, Play, RefreshCw, ShieldAlert } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import type { AttackOverview, BucketType } from "@/features/attack/dashboard/types"
import { TriggerCheckDialog } from "@/features/attack/dashboard/components/trigger-check-dialog"
import { Button } from "@/shared/ui/button"

const BUCKET_LABEL: Record<BucketType, string> = {
  fixed: "FIXED",
  hour: "HOUR",
  day: "DAY",
}

interface AttackDashboardHeaderProps {
  overview: AttackOverview
  checking?: boolean
  onRefresh?: () => void
  onCheckSuccess?: () => void
  className?: string
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

function toInputValue(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function AttackDashboardHeader({
  overview,
  checking = false,
  onRefresh,
  onCheckSuccess,
  className,
}: AttackDashboardHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { bucket, scope } = overview

  const rangeStart = formatTime(bucket.bucket_start)
  const rangeEnd = formatTime(bucket.bucket_end)

  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <button
            type="button"
            className="group flex items-center gap-1.5 text-lg font-bold tracking-tight text-foreground"
          >
            攻击溯源概览
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
          </button>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold tracking-wide text-secondary-foreground">
              {BUCKET_LABEL[bucket.bucket_type]}
            </span>
            <span className="text-muted-foreground">
              ATT&amp;CK <span className="px-1 text-border">/</span>
              {scope || "全部主机"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex min-w-[220px] items-center gap-3 rounded-2xl bg-slate-50/90 px-3 py-2.5 xl:border-l xl:border-slate-200 xl:bg-transparent xl:pl-5 xl:pr-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80 xl:bg-slate-50">
            <Clock className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <p className="text-xs leading-none text-slate-400">{checking ? "检查中" : "检查范围"}</p>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700 tabular-nums">
              <span>{rangeStart}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span>{rangeEnd}</span>
            </div>
          </div>
        </div>

        <span className="hidden h-8 w-px bg-border md:block" aria-hidden />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDialogOpen(true)}
            disabled={checking}
            className="h-10 gap-2 rounded-full px-3 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            <span className="font-medium">{checking ? "检查中..." : "立即检查"}</span>
          </Button>

          <span className="h-6 w-px bg-border" aria-hidden />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={checking}
            aria-label="刷新概览"
            className="h-10 w-10 shrink-0 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <RefreshCw className={cn("h-4 w-4", checking && "animate-spin")} />
            <span className="sr-only">刷新概览</span>
          </Button>
        </div>
      </div>

      <TriggerCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStart={toInputValue(bucket.bucket_start)}
        defaultEnd={toInputValue(bucket.bucket_end)}
        defaultBucketType={bucket.bucket_type}
        onSuccess={onCheckSuccess}
      />
    </header>
  )
}
