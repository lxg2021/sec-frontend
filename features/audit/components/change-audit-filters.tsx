"use client"

import { format } from "date-fns"
import {
  CalendarDays,
  CalendarRange,
  CircleCheck,
  FileCheck2,
  FileOutput,
  FilePenLine,
  FilePlus2,
  ListFilter,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  TerminalSquare,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { ChangeAuditAction, DispatchTimeRange, DispatchType } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select"

export type ChangeAuditActionFilter = Exclude<ChangeAuditAction, "legacyCommand"> | "all"

interface ChangeAuditFiltersProps {
  timeRange: DispatchTimeRange
  customDateFrom?: Date
  customDateTo?: Date
  action: ChangeAuditActionFilter
  objectType: DispatchType
  query: string
  onTimeRangeChange: (value: DispatchTimeRange) => void
  onCustomDateFromChange: (value: Date | undefined) => void
  onCustomDateToChange: (value: Date | undefined) => void
  onActionChange: (value: ChangeAuditActionFilter) => void
  onObjectTypeChange: (value: DispatchType) => void
  onQueryChange: (value: string) => void
  onReset: () => void
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm font-normal text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"

const timeRangeOptions = [
  { value: "24h" as const, labelKey: "last1d", icon: CalendarDays, iconClass: "text-cyan-600" },
  { value: "7d" as const, labelKey: "last7d", icon: CalendarDays, iconClass: "text-sky-600" },
  { value: "30d" as const, labelKey: "last30d", icon: CalendarRange, iconClass: "text-blue-600" },
  { value: "90d" as const, labelKey: "last90d", icon: CalendarRange, iconClass: "text-indigo-600" },
  { value: "custom" as const, labelKey: "custom", icon: CalendarRange, iconClass: "text-violet-600" },
]

const actionOptions = [
  { value: "all" as const, labelKey: "all", icon: ListFilter, iconClass: "text-slate-600" },
  { value: "created" as const, labelKey: "created", icon: FilePlus2, iconClass: "text-emerald-600" },
  { value: "reused" as const, labelKey: "reused", icon: FileCheck2, iconClass: "text-cyan-600" },
  { value: "updated" as const, labelKey: "updated", icon: FilePenLine, iconClass: "text-blue-600" },
  { value: "deleteAccepted" as const, labelKey: "deleteAccepted", icon: Trash2, iconClass: "text-rose-600" },
  { value: "deleteCompleted" as const, labelKey: "deleteCompleted", icon: CircleCheck, iconClass: "text-emerald-600" },
  { value: "deleteAborted" as const, labelKey: "deleteAborted", icon: RotateCcw, iconClass: "text-amber-600" },
]

const objectTypeOptions = [
  { value: "all" as const, labelKey: "allObjects", icon: ListFilter, iconClass: "text-slate-600" },
  { value: "policy" as const, labelKey: "policy", icon: FileOutput, iconClass: "text-blue-600" },
  { value: "command" as const, labelKey: "command", icon: TerminalSquare, iconClass: "text-cyan-600" },
  { value: "config" as const, labelKey: "config", icon: Settings2, iconClass: "text-indigo-600" },
]

export function ChangeAuditFilters(props: ChangeAuditFiltersProps) {
  const {
    timeRange,
    customDateFrom,
    customDateTo,
    action,
    objectType,
    query,
    onTimeRangeChange,
    onCustomDateFromChange,
    onCustomDateToChange,
    onActionChange,
    onObjectTypeChange,
    onQueryChange,
    onReset,
  } = props
  const t = useTranslations("pages.audit.changeAudit")
  const rangeT = useTranslations("pages.audit.filters")
  const selectedTimeRange = timeRangeOptions.find((option) => option.value === timeRange) ?? timeRangeOptions[1]
  const selectedAction = actionOptions.find((option) => option.value === action) ?? actionOptions[0]
  const selectedObjectType = objectTypeOptions.find((option) => option.value === objectType) ?? objectTypeOptions[0]
  const TimeIcon = selectedTimeRange.icon
  const ActionIcon = selectedAction.icon
  const ObjectTypeIcon = selectedObjectType.icon

  return (
    <section className="shrink-0 overflow-hidden rounded-2xl bg-card" aria-labelledby="change-audit-filter-title">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 id="change-audit-filter-title" className="text-sm font-semibold text-slate-900">{t("filterTitle")}</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReset} className="h-9 gap-1.5 rounded-lg px-3 text-xs text-slate-600">
          <RotateCcw className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          {t("reset")}
        </Button>
      </header>

      <div className="grid gap-x-4 gap-y-4 py-5 sm:grid-cols-2 xl:grid-cols-[170px_190px_190px_minmax(280px,1fr)]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span id="change-audit-time-label" className="sr-only">{rangeT("timeRange")}</span>
          <Select value={timeRange} onValueChange={(value) => onTimeRangeChange(value as DispatchTimeRange)}>
            <SelectTrigger className={fieldClass} aria-labelledby="change-audit-time-label">
              <span className="!flex min-w-0 items-center gap-2">
                <TimeIcon className={"h-4 w-4 shrink-0 " + selectedTimeRange.iconClass} aria-hidden="true" />
                <span className="truncate">{rangeT(selectedTimeRange.labelKey)}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={rangeT(labelKey)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={"h-4 w-4 shrink-0 " + iconClass} aria-hidden="true" />
                    {rangeT(labelKey)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span id="change-audit-action-label" className="sr-only">{t("actionType")}</span>
          <Select value={action} onValueChange={(value) => onActionChange(value as ChangeAuditActionFilter)}>
            <SelectTrigger className={fieldClass} aria-labelledby="change-audit-action-label">
              <span className="!flex min-w-0 items-center gap-2">
                <ActionIcon className={"h-4 w-4 shrink-0 " + selectedAction.iconClass} aria-hidden="true" />
                <span className="truncate">{t(selectedAction.labelKey)}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={t(labelKey)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={"h-4 w-4 shrink-0 " + iconClass} aria-hidden="true" />
                    {t(labelKey)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span id="change-audit-object-label" className="sr-only">{t("objectType")}</span>
          <Select value={objectType} onValueChange={(value) => onObjectTypeChange(value as DispatchType)}>
            <SelectTrigger className={fieldClass} aria-labelledby="change-audit-object-label">
              <span className="!flex min-w-0 items-center gap-2">
                <ObjectTypeIcon className={"h-4 w-4 shrink-0 " + selectedObjectType.iconClass} aria-hidden="true" />
                <span className="truncate">{t(selectedObjectType.labelKey)}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {objectTypeOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={t(labelKey)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={"h-4 w-4 shrink-0 " + iconClass} aria-hidden="true" />
                    {t(labelKey)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
          <span className="sr-only">{t("keyword")}</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600" aria-hidden="true" />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("keywordPlaceholder")} className={fieldClass + " pl-10"} />
          </span>
        </label>
      </div>

      {timeRange === "custom" && (
        <div className="flex flex-wrap items-end gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <DatePicker
            label={rangeT("startDate")}
            value={customDateFrom}
            onChange={onCustomDateFromChange}
            disabled={customDateTo ? { after: customDateTo } : undefined}
            placeholder={rangeT("chooseDate")}
            icon="start"
          />
          <DatePicker
            label={rangeT("endDate")}
            value={customDateTo}
            onChange={onCustomDateToChange}
            disabled={customDateFrom ? { before: customDateFrom } : undefined}
            placeholder={rangeT("chooseDate")}
            icon="end"
          />
        </div>
      )}
    </section>
  )
}

interface DatePickerProps {
  label: string
  value?: Date
  onChange: (value: Date | undefined) => void
  disabled?: { before: Date } | { after: Date }
  placeholder: string
  icon: "start" | "end"
}

function DatePicker({ label, value, onChange, disabled, placeholder, icon }: DatePickerProps) {
  const Icon = icon === "start" ? CalendarDays : CalendarRange
  return (
    <div className="flex min-w-[200px] flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-11 justify-start gap-2 rounded-lg bg-white px-3.5 text-left font-normal">
            <Icon className={icon === "start" ? "h-4 w-4 text-sky-600" : "h-4 w-4 text-indigo-600"} aria-hidden="true" />
            {value ? format(value, "yyyy-MM-dd") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} disabled={disabled} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  )
}
