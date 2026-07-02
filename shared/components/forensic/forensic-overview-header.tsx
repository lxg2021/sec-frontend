"use client"

import { Clock3, RefreshCw, ScanSearch } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewContext } from "@/shared/lib/forensic/types"

interface Props {
  context: ForensicOverviewContext
  loading?: boolean
  refreshedAt?: Date | null
  onRefresh?: () => void
}

const CONTEXT_LABELS: Record<keyof ForensicOverviewContext, string> = {
  case_id: "案件",
  workflow_id: "工作流",
  workflow_action_id: "工作流动作",
  agent_id: "Agent",
  endpoint_id: "终端",
}

function formatRefreshTime(value?: Date | null): string {
  if (!value) return "--"

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(value)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`
}

export function ForensicOverviewHeader({
  context,
  loading,
  refreshedAt,
  onRefresh,
}: Props) {
  const contextEntries = (Object.keys(CONTEXT_LABELS) as (keyof ForensicOverviewContext)[])
    .map((key) => ({ key, value: context[key] }))
    .filter((item) => Boolean(item.value))
  const scopeText = contextEntries.length
    ? contextEntries.map((item) => `${CONTEXT_LABELS[item.key]}：${item.value}`).join(" / ")
    : "全部终端"

  return (
    <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            <ScanSearch aria-hidden className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-1.5">
            <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
              取证概览
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="inline-flex h-7 items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-teal-600">
                FORENSIC
              </span>
              <span className="min-w-0 truncate text-slate-500">
                远程取证 <span className="px-1 text-slate-200">/</span>
                {scopeText}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                <Clock3 aria-hidden className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400">更新时间</div>
                <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                  {formatRefreshTime(refreshedAt)}
                </div>
              </div>
            </div>

            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              aria-label="刷新取证概览"
              className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="sr-only">刷新取证概览</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
