"use client"

import { format } from "date-fns"
import { useTranslations } from "next-intl"
import {
  CalendarDays,
  CalendarRange,
  CircleCheck,
  CircleX,
  Clock3,
  FileOutput,
  Layers3,
  ListFilter,
  LoaderCircle,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  TerminalSquare,
} from "lucide-react"
import type { AuditResult, DispatchTimeRange, DispatchType } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select"

interface DispatchAuditFiltersProps {
  timeRange: DispatchTimeRange
  customDateFrom?: Date
  customDateTo?: Date
  dispatchType: DispatchType
  result: AuditResult
  actor: string
  keyword: string
  onTimeRangeChange: (value: DispatchTimeRange) => void
  onCustomDateFromChange: (value: Date | undefined) => void
  onCustomDateToChange: (value: Date | undefined) => void
  onDispatchTypeChange: (value: DispatchType) => void
  onResultChange: (value: AuditResult) => void
  onActorChange: (value: string) => void
  onKeywordChange: (value: string) => void
  onReset: () => void
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm font-normal text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"

const dispatchOptions = [
  { value: "all" as const, labelKey: "all", icon: Layers3, iconClass: "text-sky-500" },
  { value: "policy" as const, labelKey: "policy", icon: FileOutput, iconClass: "text-blue-500" },
  { value: "command" as const, labelKey: "command", icon: TerminalSquare, iconClass: "text-cyan-500" },
  { value: "config" as const, labelKey: "config", icon: Settings2, iconClass: "text-violet-500" },
]

const resultOptions = [
  { value: "all" as const, labelKey: "all", icon: ListFilter, iconClass: "text-sky-500" },
  { value: "success" as const, labelKey: "success", icon: CircleCheck, iconClass: "text-emerald-500" },
  { value: "failed" as const, labelKey: "failed", icon: CircleX, iconClass: "text-rose-500" },
  { value: "pending" as const, labelKey: "pending", icon: LoaderCircle, iconClass: "text-sky-500" },
  { value: "timeout" as const, labelKey: "timeout", icon: Clock3, iconClass: "text-amber-500" },
]

const timeRangeOptions = [
  { value: "24h" as const, labelKey: "last24Hours", icon: Clock3, iconClass: "text-cyan-500" },
  { value: "7d" as const, labelKey: "last7Days", icon: CalendarDays, iconClass: "text-sky-500" },
  { value: "30d" as const, labelKey: "last30Days", icon: CalendarRange, iconClass: "text-blue-500" },
  { value: "90d" as const, labelKey: "last90Days", icon: CalendarRange, iconClass: "text-indigo-500" },
  { value: "custom" as const, labelKey: "custom", icon: CalendarRange, iconClass: "text-violet-500" },
]

export function DispatchAuditFilters({
  timeRange,
  customDateFrom,
  customDateTo,
  dispatchType,
  result,
  actor,
  keyword,
  onTimeRangeChange,
  onCustomDateFromChange,
  onCustomDateToChange,
  onDispatchTypeChange,
  onResultChange,
  onActorChange,
  onKeywordChange,
  onReset,
}: DispatchAuditFiltersProps) {
  const t = useTranslations("pages.reports.dispatch")
  const selectedTimeRange = timeRangeOptions.find((option) => option.value === timeRange) ?? timeRangeOptions[1]
  const selectedDispatch = dispatchOptions.find((option) => option.value === dispatchType) ?? dispatchOptions[0]
  const selectedResult = resultOptions.find((option) => option.value === result) ?? resultOptions[0]
  const SelectedTimeRangeIcon = selectedTimeRange.icon
  const SelectedDispatchIcon = selectedDispatch.icon
  const SelectedResultIcon = selectedResult.icon

  return (
    <section
      className="shrink-0 overflow-hidden rounded-2xl bg-card"
      aria-labelledby="dispatch-filter-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 id="dispatch-filter-title" className="text-sm font-semibold text-foreground">
            {t("filters.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
        >
          <RotateCcw className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
          {t("filters.reset")}
        </button>
      </header>

      <div className="grid gap-x-4 gap-y-4 py-5 sm:grid-cols-2 xl:grid-cols-[160px_160px_160px_160px_minmax(280px,1fr)] 2xl:grid-cols-[180px_180px_180px_180px_minmax(360px,1fr)]">
        <div className="flex flex-col gap-1.5">
          <span className="sr-only" id="dispatch-time-range-label">{t("filters.timeRange")}</span>
          <Select value={timeRange} onValueChange={(value) => onTimeRangeChange(value as DispatchTimeRange)}>
            <SelectTrigger className={`${fieldClass} focus:ring-offset-0`} aria-labelledby="dispatch-time-range-label">
              <div className="flex min-w-0 items-center gap-2">
                <SelectedTimeRangeIcon className={`h-4 w-4 shrink-0 ${selectedTimeRange.iconClass}`} aria-hidden="true" />
                <span className="truncate">{t(`timeRanges.${selectedTimeRange.labelKey}`)}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={t(`timeRanges.${labelKey}`)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
                    <span>{t(`timeRanges.${labelKey}`)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="sr-only" id="dispatch-type-label">{t("filters.dispatchType")}</span>
          <Select value={dispatchType} onValueChange={(value) => onDispatchTypeChange(value as DispatchType)}>
            <SelectTrigger className={`${fieldClass} focus:ring-offset-0`} aria-labelledby="dispatch-type-label">
              <div className="flex min-w-0 items-center gap-2">
                <SelectedDispatchIcon className={`h-4 w-4 shrink-0 ${selectedDispatch.iconClass}`} aria-hidden="true" />
                <span className="truncate">{t(`types.${dispatchType}`)}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {dispatchOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={t(`types.${labelKey}`)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
                    <span>{t(`types.${labelKey}`)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="sr-only" id="result-label">{t("filters.result")}</span>
          <Select value={result} onValueChange={(value) => onResultChange(value as AuditResult)}>
            <SelectTrigger className={`${fieldClass} focus:ring-offset-0`} aria-labelledby="result-label">
              <div className="flex min-w-0 items-center gap-2">
                <SelectedResultIcon className={`h-4 w-4 shrink-0 ${selectedResult.iconClass}`} aria-hidden="true" />
                <span className="truncate">{t(`results.${result}`)}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {resultOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={t(`results.${labelKey}`)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
                    <span>{t(`results.${labelKey}`)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="sr-only">{t("filters.actor")}</span>
          <input
            value={actor}
            onChange={(event) => onActorChange(event.target.value)}
            placeholder={t("filters.actorPlaceholder")}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
          <span className="sr-only">{t("filters.keyword")}</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500"
              aria-hidden="true"
            />
            <input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={t("filters.keywordPlaceholder")}
              className={`${fieldClass} pl-10`}
            />
          </span>
        </label>
      </div>

      {timeRange === "custom" && (
        <div className="flex flex-wrap items-end gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex min-w-[200px] flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">{t("filters.startDate")}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 justify-start gap-2 rounded-lg bg-white px-3.5 text-left font-normal">
                  <CalendarDays className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  {customDateFrom ? format(customDateFrom, "yyyy-MM-dd") : t("filters.chooseDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateFrom}
                  onSelect={onCustomDateFromChange}
                  disabled={customDateTo ? { after: customDateTo } : undefined}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex min-w-[200px] flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">{t("filters.endDate")}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 justify-start gap-2 rounded-lg bg-white px-3.5 text-left font-normal">
                  <CalendarRange className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  {customDateTo ? format(customDateTo, "yyyy-MM-dd") : t("filters.chooseDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateTo}
                  onSelect={onCustomDateToChange}
                  disabled={customDateFrom ? { before: customDateFrom } : undefined}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </section>
  )
}






