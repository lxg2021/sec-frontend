"use client"

import { format } from "date-fns"
import {
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  CircleCheck,
  CircleEllipsis,
  CircleX,
  KeyRound,
  ListFilter,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  UserCog,
  UserMinus,
  UserPlus,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { UserActionType, UserAuditDateRange } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select"

export type UserAuditActionFilter = UserActionType | "all"
export type UserAuditResultFilter = "all" | "SUCCESS" | "FAILED"

interface UserActivityFiltersProps {
  dateRange: UserAuditDateRange
  customDateFrom?: Date
  customDateTo?: Date
  actionType: UserAuditActionFilter
  result: UserAuditResultFilter
  actorQuery: string
  targetQuery: string
  onDateRangeChange: (value: UserAuditDateRange) => void
  onCustomDateFromChange: (value: Date | undefined) => void
  onCustomDateToChange: (value: Date | undefined) => void
  onActionTypeChange: (value: UserAuditActionFilter) => void
  onResultChange: (value: UserAuditResultFilter) => void
  onActorQueryChange: (value: string) => void
  onTargetQueryChange: (value: string) => void
  onReset: () => void
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm font-normal text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"

const timeRangeOptions = [
  { value: "1d" as const, labelKey: "last1d", icon: CalendarDays, iconClass: "text-cyan-600" },
  { value: "7d" as const, labelKey: "last7d", icon: CalendarDays, iconClass: "text-sky-600" },
  { value: "30d" as const, labelKey: "last30d", icon: CalendarRange, iconClass: "text-blue-600" },
  { value: "90d" as const, labelKey: "last90d", icon: CalendarRange, iconClass: "text-indigo-600" },
  { value: "custom" as const, labelKey: "custom", icon: CalendarRange, iconClass: "text-violet-600" },
]

const actionOptions = [
  { value: "all" as const, labelKey: "all", icon: ListFilter, iconClass: "text-slate-600" },
  { value: "ADD_USER" as const, labelKey: "addUser", icon: UserPlus, iconClass: "text-emerald-600" },
  { value: "UPDATE_USER" as const, labelKey: "updateUser", icon: UserCog, iconClass: "text-blue-600" },
  { value: "PASSWORD_CHANGE" as const, labelKey: "passwordChange", icon: KeyRound, iconClass: "text-violet-600" },
  { value: "STATUS_CHANGE" as const, labelKey: "statusChange", icon: ShieldCheck, iconClass: "text-cyan-600" },
  { value: "ROLE_CHANGE" as const, labelKey: "roleChange", icon: BadgeCheck, iconClass: "text-indigo-600" },
  { value: "DELETE_USER" as const, labelKey: "deleteUser", icon: UserMinus, iconClass: "text-rose-600" },
  { value: "OTHER" as const, labelKey: "other", icon: CircleEllipsis, iconClass: "text-slate-500" },
]

const resultOptions = [
  { value: "all" as const, labelKey: "all", icon: ListFilter, iconClass: "text-slate-600" },
  { value: "SUCCESS" as const, labelKey: "success", icon: CircleCheck, iconClass: "text-emerald-600" },
  { value: "FAILED" as const, labelKey: "failed", icon: CircleX, iconClass: "text-rose-600" },
]

export function UserActivityFilters({
  dateRange,
  customDateFrom,
  customDateTo,
  actionType,
  result,
  actorQuery,
  targetQuery,
  onDateRangeChange,
  onCustomDateFromChange,
  onCustomDateToChange,
  onActionTypeChange,
  onResultChange,
  onActorQueryChange,
  onTargetQueryChange,
  onReset,
}: UserActivityFiltersProps) {
  const t = useTranslations("pages.audit.userActivity")
  const rangeT = useTranslations("pages.audit.filters")
  const selectedTimeRange = timeRangeOptions.find((option) => option.value === dateRange) ?? timeRangeOptions[1]
  const selectedAction = actionOptions.find((option) => option.value === actionType) ?? actionOptions[0]
  const selectedResult = resultOptions.find((option) => option.value === result) ?? resultOptions[0]
  const SelectedTimeRangeIcon = selectedTimeRange.icon
  const SelectedActionIcon = selectedAction.icon
  const SelectedResultIcon = selectedResult.icon

  return (
    <section className="shrink-0 overflow-hidden rounded-2xl bg-card" aria-labelledby="user-audit-filter-title">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="user-audit-filter-title" className="text-sm font-semibold text-slate-900">{t("filterTitle")}</h2>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-9 gap-1.5 rounded-lg px-3 text-xs text-slate-600"
        >
          <RotateCcw className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          {t("reset")}
        </Button>
      </header>

      <div className="grid gap-x-4 gap-y-4 py-5 sm:grid-cols-2 xl:grid-cols-[170px_190px_160px_minmax(200px,1fr)_minmax(220px,1fr)]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span id="user-audit-time-label" className="sr-only">{rangeT("timeRange")}</span>
          <Select value={dateRange} onValueChange={(value) => onDateRangeChange(value as UserAuditDateRange)}>
            <SelectTrigger className={fieldClass} aria-labelledby="user-audit-time-label">
              <span className="!flex min-w-0 items-center gap-2">
                <SelectedTimeRangeIcon className={`h-4 w-4 shrink-0 ${selectedTimeRange.iconClass}`} aria-hidden="true" />
                <span className="truncate">{rangeT(selectedTimeRange.labelKey)}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={rangeT(labelKey)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
                    {rangeT(labelKey)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span id="user-audit-action-label" className="sr-only">{t("actionType")}</span>
          <Select value={actionType} onValueChange={(value) => onActionTypeChange(value as UserAuditActionFilter)}>
            <SelectTrigger className={fieldClass} aria-labelledby="user-audit-action-label">
              <span className="!flex min-w-0 items-center gap-2">
                <SelectedActionIcon className={`h-4 w-4 shrink-0 ${selectedAction.iconClass}`} aria-hidden="true" />
                <span className="truncate">{t(selectedAction.labelKey)}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={t(labelKey)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
                    {t(labelKey)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span id="user-audit-result-label" className="sr-only">{t("result")}</span>
          <Select value={result} onValueChange={(value) => onResultChange(value as UserAuditResultFilter)}>
            <SelectTrigger className={fieldClass} aria-labelledby="user-audit-result-label">
              <span className="!flex min-w-0 items-center gap-2">
                <SelectedResultIcon className={`h-4 w-4 shrink-0 ${selectedResult.iconClass}`} aria-hidden="true" />
                <span className="truncate">{t(selectedResult.labelKey)}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {resultOptions.map(({ value, labelKey, icon: Icon, iconClass }) => (
                <SelectItem key={value} value={value} textValue={t(labelKey)} className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
                    {t(labelKey)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="sr-only">{t("actor")}</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600" aria-hidden="true" />
            <input
              value={actorQuery}
              onChange={(event) => onActorQueryChange(event.target.value)}
              placeholder={t("actorPlaceholder")}
              className={`${fieldClass} pl-10`}
            />
          </span>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
          <span className="sr-only">{t("targetUser")}</span>
          <span className="relative block">
            <Target className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" aria-hidden="true" />
            <input
              value={targetQuery}
              onChange={(event) => onTargetQueryChange(event.target.value)}
              placeholder={t("targetUserPlaceholder")}
              className={`${fieldClass} pl-10`}
            />
          </span>
        </label>
      </div>

      {dateRange === "custom" && (
        <div className="flex flex-wrap items-end gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex min-w-[200px] flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">{rangeT("startDate")}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 justify-start gap-2 rounded-lg bg-white px-3.5 text-left font-normal">
                  <CalendarDays className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  {customDateFrom ? format(customDateFrom, "yyyy-MM-dd") : rangeT("chooseDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customDateFrom} onSelect={onCustomDateFromChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex min-w-[200px] flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">{rangeT("endDate")}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 justify-start gap-2 rounded-lg bg-white px-3.5 text-left font-normal">
                  <CalendarRange className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  {customDateTo ? format(customDateTo, "yyyy-MM-dd") : rangeT("chooseDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customDateTo} onSelect={onCustomDateToChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </section>
  )
}
