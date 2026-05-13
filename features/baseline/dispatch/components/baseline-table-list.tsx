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
  FileText,
  Hash,
  Link2,
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
  const balancedColumnWidth = "calc((100% - 50px) / 5)"

  const text = useMemo(
    () =>
      isZh
        ? {
            refresh: "刷新",
            emptyTitle: "暂无基线扫描策略",
            emptyDescription: "当前基线下还没有可展示的扫描策略。",
            columns: {
              policyId: "策略 ID",
              name: "策略名称",
              version: "版本",
              baselineUuid: "基线 UUID",
              createdAt: "创建时间",
              updatedAt: "更新时间",
            },
            pageInfo: (page: number, totalPages: number) => `第 ${page} / ${totalPages} 页`,
            selectRow: (name: string) => `选择 ${name}`,
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
              createdAt: "Created At",
              updatedAt: "Updated At",
            },
            pageInfo: (page: number, totalPages: number) => `Page ${page} / ${totalPages}`,
            selectRow: (name: string) => `Select ${name}`,
          },
    [isZh],
  )

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
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Table className="table-auto">
          <colgroup>
            <col style={{ width: "50px" }} />
            <col />
            <col style={{ width: balancedColumnWidth }} />
            <col style={{ width: balancedColumnWidth }} />
            <col style={{ width: balancedColumnWidth }} />
            <col style={{ width: balancedColumnWidth }} />
            <col style={{ width: balancedColumnWidth }} />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-slate-50/90">
              <TableHead className="w-[50px]" />
              <TableHead className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Hash className="size-4 text-blue-500" />
                  <span>{text.columns.policyId}</span>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-emerald-500" />
                  <span>{text.columns.name}</span>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-amber-500" />
                  <span>{text.columns.version}</span>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Link2 className="size-4 text-violet-500" />
                  <span>{text.columns.baselineUuid}</span>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="size-4 text-cyan-500" />
                  <span>{text.columns.createdAt}</span>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">
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
                    className={cn("cursor-pointer", activeSelectedId === item.id && "bg-slate-50")}
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
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">
                      {formatDateTime(item.createdAt, locale)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">
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
