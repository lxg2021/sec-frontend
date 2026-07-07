"use client"

import { CalendarClock, ExternalLink, Loader2, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  localEventKey,
  localEventSummary,
  localEventTime,
  localEventUniqueId,
  type IocLocalEventSource,
} from "@/features/ioc-analysis/components/ioc-search-event-utils"
import { IocPanelEmptyState } from "@/features/ioc-analysis/components/ioc-panel-empty-state"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

type LocalLocateStatus = "idle" | "loading" | "success" | "unsupported" | "error"
type LocalTimeRangeMode = "30d" | "90d" | "custom"

export type IocLocalLocatePanelResult = {
  status: LocalLocateStatus
  message: string
  source: string
  positionType: number | null
  items: IocLocalEventSource[]
  rangeLabel: string
  pageToken: string
  nextPageToken: string
  hasNext: boolean
}

export function IocLocalEventsPanel({
  className,
  customEnd,
  customStart,
  currentValue,
  graphLoadingEventKey,
  onCustomEndChange,
  onCustomStartChange,
  onLoadMore,
  onLocateGraph,
  onRefresh,
  onTimeRangeModeChange,
  result,
  selectedEventKey,
  timeRangeLabel,
  timeRangeMode,
}: {
  className?: string
  customEnd: string
  customStart: string
  currentValue: string
  graphLoadingEventKey?: string
  onCustomEndChange: (value: string) => void
  onCustomStartChange: (value: string) => void
  onLoadMore?: () => void
  onLocateGraph: (event: IocLocalEventSource, index: number) => void
  onRefresh?: () => void
  onTimeRangeModeChange: (mode: LocalTimeRangeMode) => void
  result: IocLocalLocatePanelResult
  selectedEventKey?: string
  timeRangeLabel: string
  timeRangeMode: LocalTimeRangeMode
}) {
  const loading = result.status === "loading"
  const hasEvents = result.items.length > 0
  const t = useTranslations("pages.iocAnalysis.search.local")
  const activeRangeLabel = timeRangeLabel || result.rangeLabel

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white", className)}>
      <div className="border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-950">{t("title")}</h2>
              <p className="mt-1 truncate text-xs text-slate-500">
                <span className="font-medium text-slate-600">{activeRangeLabel}</span>
                <span className="mx-1.5 text-slate-300">/</span>
                <code className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 ring-1 ring-slate-200">
                  {result.source || currentValue || "-"}
                </code>
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <div className="flex h-9 items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-inner shadow-slate-200/60">
              {(["30d", "90d", "custom"] as LocalTimeRangeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    "h-7 rounded-full px-3 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200",
                    timeRangeMode === mode
                      ? "bg-slate-950 text-white shadow-sm shadow-slate-300"
                      : "text-slate-500 hover:bg-white hover:text-slate-900",
                  )}
                  disabled={loading}
                  onClick={() => onTimeRangeModeChange(mode)}
                >
                  {t(`range.${mode}`)}
                </button>
              ))}
            </div>
            {onRefresh ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-blue-100 bg-blue-600 px-4 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:text-white"
                disabled={loading}
                onClick={onRefresh}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {t("refresh")}
              </Button>
            ) : null}
          </div>
        </div>

        {timeRangeMode === "custom" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
            <TimeInputField
              label={t("customStartShort")}
              ariaLabel={t("customStart")}
              disabled={loading}
              value={customStart}
              onChange={onCustomStartChange}
            />
            <span className="hidden h-px w-5 bg-slate-300 sm:block" aria-hidden="true" />
            <TimeInputField
              label={t("customEndShort")}
              ariaLabel={t("customEnd")}
              disabled={loading}
              value={customEnd}
              onChange={onCustomEndChange}
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" />
            {t("loading")}
          </div>
        ) : null}

        {result.status === "unsupported" || result.status === "error" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            {result.message}
          </div>
        ) : null}

        {result.status === "success" && !hasEvents ? (
          <IocPanelEmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription", { range: activeRangeLabel })}
          />
        ) : null}

        {hasEvents ? (
          <div className="space-y-2">
            {result.items.map((event, index) => {
              const uniqueId = localEventUniqueId(event)
              const key = localEventKey(event, index)
              const selected = selectedEventKey === key
              const locating = graphLoadingEventKey === key

              return (
                <article
                  key={key}
                  className={cn(
                    "rounded-lg border bg-white p-3 transition-colors",
                    selected ? "border-blue-200 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-950">{event.event_name || "-"}</span>
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                          {event.event_type || "-"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{localEventSummary(event)}</p>
                      <div className="mt-2 space-y-1">
                        <div className="truncate font-mono text-xs text-slate-400">{uniqueId || t("noUniqueId")}</div>
                        <div className="truncate font-mono text-xs text-slate-400">{localEventTime(event) || "-"}</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className={cn("h-8 shrink-0 rounded-md", selected ? "bg-blue-600 text-white hover:bg-blue-700" : "border-slate-200")}
                      disabled={!uniqueId || locating}
                      onClick={() => onLocateGraph(event, index)}
                    >
                      {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                      {t("graphAction")}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </div>

      {result.hasNext && onLoadMore ? (
        <div className="border-t border-slate-100 p-3">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full rounded-md border-slate-200"
            disabled={loading}
            onClick={onLoadMore}
          >
            {t("loadMore")}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

function TimeInputField({
  ariaLabel,
  disabled,
  label,
  onChange,
  value,
}: {
  ariaLabel: string
  disabled: boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      <Input
        aria-label={ariaLabel}
        className="h-7 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 font-mono text-xs text-slate-800 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={disabled}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
