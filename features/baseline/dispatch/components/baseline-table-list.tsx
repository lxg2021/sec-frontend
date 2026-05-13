"use client"

import { useMemo, useState } from "react"
import { useLocale } from "next-intl"
import {
  CalendarCheck,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Clock3,
  FileText,
  Hash,
  Link2,
  Play,
  RefreshCcw,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Tag,
} from "lucide-react"

import type {
  BaselineScanPolicyListResult,
  ReusableBaselineScanPolicy,
} from "@/features/baseline/dispatch/api"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

interface BaselineTableListProps {
  data?: BaselineScanPolicyListResult | null
  error?: string
  loading?: boolean
  onPageChange?: (page: number) => void
  onRefresh?: () => void
  onRowClick?: (item: ReusableBaselineScanPolicy) => void
  onSelectionChange?: (selectedKey: string | null) => void
  selectedKey?: string | null
}

function getPolicyRowKey(item: Pick<ReusableBaselineScanPolicy, "id" | "version">) {
  return `${item.id}::${item.version}`
}

function formatDateTime(value: string, locale: string) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function BaselineTableList({
  data,
  error,
  loading = false,
  onPageChange,
  onRefresh,
  onRowClick,
  onSelectionChange,
  selectedKey,
}: BaselineTableListProps) {
  const locale = useLocale()
  const isZh = locale.toLowerCase().startsWith("zh")
  const [internalSelectedKey, setInternalSelectedKey] = useState<string | null>(null)
  const activeSelectedKey = selectedKey ?? internalSelectedKey
  const items = data?.items ?? []
  const pagination = data?.pagination

  const text = useMemo(
    () =>
      isZh
        ? {
            refresh: "\u5237\u65b0",
            emptyTitle: "\u6682\u65e0\u57fa\u7ebf\u626b\u63cf\u7b56\u7565",
            emptyDescription: "\u5f53\u524d\u57fa\u7ebf\u4e0b\u8fd8\u6ca1\u6709\u53ef\u5c55\u793a\u7684\u626b\u63cf\u7b56\u7565\u3002",
            columns: {
              policyId: "\u7b56\u7565 ID",
              name: "\u7b56\u7565\u540d\u79f0",
              version: "\u7248\u672c",
              baselineUuid: "\u57fa\u7ebf UUID",
              mode: "\u8c03\u5ea6\u6a21\u5f0f",
              intervalHours: "\u95f4\u9694",
              specificTime: "\u56fa\u5b9a\u65f6\u95f4",
              randomDelayMinutes: "\u968f\u673a\u5ef6\u8fdf",
              retryLimit: "\u91cd\u8bd5\u6b21\u6570",
              retryIntervalMinutes: "\u91cd\u8bd5\u95f4\u9694",
              scanOnStartup: "\u542f\u52a8\u626b\u63cf",
              createdAt: "\u521b\u5efa\u65f6\u95f4",
              updatedAt: "\u66f4\u65b0\u65f6\u95f4",
            },
            modeInterval: "\u56fa\u5b9a\u95f4\u9694",
            retryNone: "\u4e0d\u91cd\u8bd5",
            startupEnabled: "\u5f00\u542f",
            startupDisabled: "\u5173\u95ed",
            hoursUnit: "\u5c0f\u65f6",
            minutesUnit: "\u5206\u949f",
            retryTimes: (count: number) => `${count} \u6b21`,
            pageInfo: (page: number, totalPages: number) => `\u7b2c ${page} / ${totalPages} \u9875`,
            selectRow: (name: string) => `\u9009\u62e9 ${name}`,
          }
        : {
            refresh: "Refresh",
            emptyTitle: "No baseline scan policies",
            emptyDescription: "There are no scan policies available for this baseline yet.",
            columns: {
              policyId: "Policy ID",
              name: "Policy Name",
              version: "Version",
              baselineUuid: "Baseline UUID",
              mode: "Schedule Mode",
              intervalHours: "Interval",
              specificTime: "Fixed Time",
              randomDelayMinutes: "Random Delay",
              retryLimit: "Retry Count",
              retryIntervalMinutes: "Retry Interval",
              scanOnStartup: "Startup Scan",
              createdAt: "Created At",
              updatedAt: "Updated At",
            },
            modeInterval: "Fixed Interval",
            retryNone: "No Retry",
            startupEnabled: "Enabled",
            startupDisabled: "Disabled",
            hoursUnit: "h",
            minutesUnit: "min",
            retryTimes: (count: number) => `${count}x`,
            pageInfo: (page: number, totalPages: number) => `Page ${page} / ${totalPages}`,
            selectRow: (name: string) => `Select ${name}`,
          },
    [isZh],
  )

  function formatScheduleMode(item: ReusableBaselineScanPolicy) {
    return item.scanSchedule.mode === "interval" ? text.modeInterval : item.scanSchedule.mode
  }

  function formatIntervalHours(value?: number) {
    if (!Number.isFinite(value) || !value || value <= 0) {
      return "-"
    }
    return `${value} ${text.hoursUnit}`
  }

  function formatSpecificTime(value?: string) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : "-"
  }

  function formatMinutes(value?: number) {
    if (!Number.isFinite(value)) {
      return "-"
    }
    return `${value} ${text.minutesUnit}`
  }

  function formatRetryLimit(value?: number) {
    if (!Number.isFinite(value) || value === 0) {
      return text.retryNone
    }
    return text.retryTimes(value ?? 0)
  }

  function handleSelectItem(policyKey: string) {
    const nextKey = activeSelectedKey === policyKey ? null : policyKey
    setInternalSelectedKey(nextKey)
    onSelectionChange?.(nextKey)
  }

  if (!loading && error) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-rose-900">{error}</p>
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              className="h-10 rounded-2xl border-rose-200 bg-white text-rose-900 hover:bg-rose-50"
            >
              {text.refresh}
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
        <Clock className="mb-4 size-12 opacity-50" />
        <p className="text-lg font-medium text-slate-900">{text.emptyTitle}</p>
        <p className="mt-2 text-sm">{text.emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <Table className="min-w-[2140px] table-auto text-sm">
          <TableHeader>
            <TableRow className="bg-slate-50/90">
              <TableHead className="w-[50px]" />
              <TableHead className="min-w-[280px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Hash className="size-4 text-blue-500" />
                  <span>{text.columns.policyId}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[180px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-emerald-500" />
                  <span>{text.columns.name}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[96px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-amber-500" />
                  <span>{text.columns.version}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[240px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Link2 className="size-4 text-violet-500" />
                  <span>{text.columns.baselineUuid}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-cyan-500" />
                  <span>{text.columns.mode}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[110px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-blue-500" />
                  <span>{text.columns.intervalHours}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-emerald-500" />
                  <span>{text.columns.specificTime}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[130px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Shuffle className="size-4 text-amber-500" />
                  <span>{text.columns.randomDelayMinutes}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <RotateCcw className="size-4 text-rose-500" />
                  <span>{text.columns.retryLimit}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[140px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="size-4 text-orange-500" />
                  <span>{text.columns.retryIntervalMinutes}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Play className="size-4 text-violet-500" />
                  <span>{text.columns.scanOnStartup}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[150px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="size-4 text-cyan-500" />
                  <span>{text.columns.createdAt}</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[150px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="size-4 text-rose-500" />
                  <span>{text.columns.updatedAt}</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="size-4 animate-pulse rounded-full bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                  </TableRow>
                ))
              : items.map((item) => {
                  const rowKey = getPolicyRowKey(item)

                  return (
                    <TableRow
                      key={rowKey}
                      className={cn("cursor-pointer", activeSelectedKey === rowKey && "bg-slate-50")}
                      onClick={() => {
                        handleSelectItem(rowKey)
                        onRowClick?.(item)
                      }}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div
                          role="radio"
                          aria-checked={activeSelectedKey === rowKey}
                          aria-label={text.selectRow(item.name)}
                          tabIndex={0}
                          className={cn(
                            "flex size-4 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
                            activeSelectedKey === rowKey
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 hover:border-primary",
                          )}
                          onClick={() => handleSelectItem(rowKey)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              handleSelectItem(rowKey)
                            }
                          }}
                        >
                          {activeSelectedKey === rowKey ? (
                            <div className="size-2 rounded-full bg-primary-foreground" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">{item.id}</TableCell>
                      <TableCell className="max-w-0 truncate font-medium text-slate-950" title={item.name}>
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.version}</Badge>
                      </TableCell>
                      <TableCell className="max-w-0 truncate text-sm text-slate-500" title={item.baselineUuid}>
                        {item.baselineUuid}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatScheduleMode(item)}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {formatIntervalHours(item.scanSchedule.interval_hours)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {formatSpecificTime(item.scanSchedule.specific_time)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {formatMinutes(item.scanSchedule.random_delay_minutes)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {formatRetryLimit(item.scanSchedule.retry_limit)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {item.scanSchedule.retry_limit === 0
                          ? "-"
                          : formatMinutes(item.scanSchedule.retry_interval_minutes)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            item.scanSchedule.scan_on_startup
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600",
                          )}
                        >
                          {item.scanSchedule.scan_on_startup ? text.startupEnabled : text.startupDisabled}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {formatDateTime(item.createdAt, locale)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {formatDateTime(item.updatedAt, locale)}
                      </TableCell>
                    </TableRow>
                  )
                })}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {text.pageInfo(pagination.currentPage, pagination.totalPages)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(1)}
              disabled={!pagination.hasPrevious || loading}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevious || loading}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={!pagination.hasNext || loading}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.totalPages)}
              disabled={!pagination.hasNext || loading}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
