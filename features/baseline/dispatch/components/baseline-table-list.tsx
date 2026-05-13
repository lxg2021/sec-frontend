"use client"

import { useMemo, useState } from "react"
import { useLocale } from "next-intl"
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  FileText,
  Hash,
  RefreshCw,
  RotateCcw,
  Tag,
  Timer,
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
  onSelectionChange?: (selectedId: string | null) => void
  selectedId?: string | null
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
  selectedId,
}: BaselineTableListProps) {
  const locale = useLocale()
  const isZh = locale.toLowerCase().startsWith("zh")
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const activeSelectedId = selectedId ?? internalSelectedId
  const items = data?.items ?? []
  const pagination = data?.pagination

  const text = useMemo(
    () =>
      isZh
        ? {
            totalRecords: (count: number) => `共 ${count} 条记录`,
            refresh: "刷新",
            emptyTitle: "暂无基线扫描策略",
            emptyDescription: "当前基线下还没有可展示的扫描策略。",
            columns: {
              policyId: "策略 ID",
              name: "策略名称",
              version: "版本",
              schedule: "扫描计划",
              interval: "间隔时间",
              retry: "重试次数",
              createdAt: "创建时间",
              updatedAt: "更新时间",
            },
            schedule: {
              everyHours: (hours: number) => `每 ${hours} 小时`,
              specificTime: (value: string) => `指定时间: ${value}`,
              startup: "开机后补跑",
            },
            pageInfo: (page: number, totalPages: number) => `第 ${page} / ${totalPages} 页`,
            selectRow: (name: string) => `选择 ${name}`,
          }
        : {
            totalRecords: (count: number) => `${count} records`,
            refresh: "Refresh",
            emptyTitle: "No baseline scan policies",
            emptyDescription: "There are no scan policies available for this baseline yet.",
            columns: {
              policyId: "Policy ID",
              name: "Policy Name",
              version: "Version",
              schedule: "Scan Schedule",
              interval: "Interval",
              retry: "Retry Count",
              createdAt: "Created At",
              updatedAt: "Updated At",
            },
            schedule: {
              everyHours: (hours: number) => `Every ${hours}h`,
              specificTime: (value: string) => `At ${value}`,
              startup: "Catch up on startup",
            },
            pageInfo: (page: number, totalPages: number) => `Page ${page} / ${totalPages}`,
            selectRow: (name: string) => `Select ${name}`,
          },
    [isZh],
  )

  function formatSchedule(item: ReusableBaselineScanPolicy) {
    const parts: string[] = []

    if (item.scanSchedule.interval_hours) {
      parts.push(text.schedule.everyHours(item.scanSchedule.interval_hours))
    }

    if (item.scanSchedule.specific_time) {
      parts.push(text.schedule.specificTime(item.scanSchedule.specific_time))
    }

    if (item.scanSchedule.scan_on_startup) {
      parts.push(text.schedule.startup)
    }

    return parts.length > 0 ? parts.join(", ") : "-"
  }

  function handleSelectItem(policyId: string) {
    const nextId = activeSelectedId === policyId ? null : policyId
    setInternalSelectedId(nextId)
    onSelectionChange?.(nextId)
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
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {pagination ? text.totalRecords(pagination.totalCount) : null}
        </div>
        {onRefresh ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 rounded-xl"
          >
            <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} />
            {text.refresh}
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/90">
              <TableHead className="w-[50px]" />
              <TableHead className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Hash className="size-4 text-blue-500" />
                  <span>{text.columns.policyId}</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-emerald-500" />
                  <span>{text.columns.name}</span>
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-amber-500" />
                  <span>{text.columns.version}</span>
                </div>
              </TableHead>
              <TableHead className="w-[220px]">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-violet-500" />
                  <span>{text.columns.schedule}</span>
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-2">
                  <Timer className="size-4 text-teal-500" />
                  <span>{text.columns.interval}</span>
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-2">
                  <RotateCcw className="size-4 text-orange-500" />
                  <span>{text.columns.retry}</span>
                </div>
              </TableHead>
              <TableHead className="w-[160px]">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="size-4 text-cyan-500" />
                  <span>{text.columns.createdAt}</span>
                </div>
              </TableHead>
              <TableHead className="w-[160px]">
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
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-12 animate-pulse rounded-full bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                  </TableRow>
                ))
              : items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "cursor-pointer",
                      activeSelectedId === item.id && "bg-slate-50",
                    )}
                    onClick={() => {
                      handleSelectItem(item.id)
                      onRowClick?.(item)
                    }}
                  >
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div
                        role="radio"
                        aria-checked={activeSelectedId === item.id}
                        aria-label={text.selectRow(item.name)}
                        tabIndex={0}
                        className={cn(
                          "flex size-4 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
                          activeSelectedId === item.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40 hover:border-primary",
                        )}
                        onClick={() => handleSelectItem(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            handleSelectItem(item.id)
                          }
                        }}
                      >
                        {activeSelectedId === item.id ? (
                          <div className="size-2 rounded-full bg-primary-foreground" />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell className="font-medium text-slate-950">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.version}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{formatSchedule(item)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {item.scanSchedule.interval_hours ? `${item.scanSchedule.interval_hours}h` : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {item.scanSchedule.retry_limit ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDateTime(item.createdAt, locale)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDateTime(item.updatedAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
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
