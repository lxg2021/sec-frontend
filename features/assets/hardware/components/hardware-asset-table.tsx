"use client"

import type { ComponentType, ReactNode } from "react"
import { Fragment, useMemo, useState } from "react"
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Fingerprint,
  Hash,
  Monitor,
  Package,
  RefreshCcw,
  Search,
  Server,
  X,
} from "lucide-react"

import { HARDWARE_CATEGORIES, getHardwareCategoryMeta } from "@/features/assets/hardware/constants"
import type { HardwareAssetItem, HardwareCategory, HardwarePagination } from "@/features/assets/hardware/types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface HardwareAssetTableProps {
  data: HardwareAssetItem[]
  pagination: HardwarePagination
  category: HardwareCategory
  keyword: string
  pageSize: number
  isLoading?: boolean
  error?: string
  onCategoryChange: (category: HardwareCategory) => void
  onKeywordChange: (keyword: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRetry: () => void
}

function HeaderLabel({
  icon: Icon,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {children}
    </span>
  )
}

function formatTimestamp(value: number) {
  if (!value) return "-"
  const timestamp = value < 1_000_000_000_000 ? value * 1000 : value
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function shortHash(value: string) {
  if (!value) return "-"
  if (value.length <= 18) return value
  return `${value.slice(0, 12)}...${value.slice(-6)}`
}

function statusLabel(value: string) {
  return value === "online" ? "在线" : "离线"
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center border-t border-slate-200 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Package className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">暂无硬件资产</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">当前分类下没有匹配的硬件型号，调整筛选条件或刷新后再试。</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        <RefreshCcw className="mr-2 h-4 w-4" />
        刷新
      </Button>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-4 border-t border-slate-200 p-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[48px_220px_1fr_180px_120px_120px_160px] items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

function ExpandedHosts({ item }: { item: HardwareAssetItem }) {
  if (item.hosts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        暂无关联主机明细
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Server className="h-4 w-4 text-slate-500" />
        关联主机
        <Badge variant="secondary" className="bg-white text-slate-600">
          {item.hosts.length} 台
        </Badge>
      </div>
      <div className="grid max-h-56 gap-3 overflow-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
        {item.hosts.map((host) => (
          <div key={`${host.agent_id}-${host.instance_hash}`} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-950">{host.hostname}</div>
                <div className="mt-1 truncate text-xs text-slate-500">{host.os_name} {host.os_version}</div>
              </div>
              <span className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                host.status === "online" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", host.status === "online" ? "bg-emerald-500" : "bg-slate-400")} />
                {statusLabel(host.status)}
              </span>
            </div>
            <div className="mt-3 truncate font-mono text-xs text-slate-400">{host.agent_id}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HardwareAssetTable({
  data,
  pagination,
  category,
  keyword,
  pageSize,
  isLoading = false,
  error = "",
  onCategoryChange,
  onKeywordChange,
  onPageChange,
  onPageSizeChange,
  onRetry,
}: HardwareAssetTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [draftKeyword, setDraftKeyword] = useState(keyword)

  const activeMeta = getHardwareCategoryMeta(category)
  const currentPage = pagination.current_page
  const totalPages = Math.max(pagination.total_pages, pagination.total_count > 0 ? 1 : 0)
  const shownStart = pagination.total_count > 0 ? (pagination.current_page - 1) * pagination.page_size + 1 : 0
  const shownEnd = pagination.total_count > 0 ? Math.min(pagination.current_page * pagination.page_size, pagination.total_count) : 0

  const pageNumbers = useMemo(() => {
    const pages: Array<number | "..."> = []
    if (totalPages <= 5) {
      for (let page = 1; page <= totalPages; page += 1) pages.push(page)
      return pages
    }
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
    const end = Math.min(totalPages, start + 4)
    if (start > 1) pages.push(1, "...")
    for (let page = start; page <= end; page += 1) pages.push(page)
    if (end < totalPages) pages.push("...", totalPages)
    return pages
  }, [currentPage, totalPages])

  const submitSearch = () => {
    onKeywordChange(draftKeyword)
    onPageChange(1)
  }

  const clearFilters = () => {
    setDraftKeyword("")
    onKeywordChange("")
    onPageChange(1)
  }

  const toggleRow = (id: string) => {
    setExpandedRows((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", activeMeta.softClassName)}>
              <activeMeta.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">硬件清单</h3>
              <p className="mt-1 text-sm text-slate-500">按 {activeMeta.label} 型号聚合展示，支持筛选、展开查看关联主机</p>
            </div>
          </div>
          <Button variant="outline" onClick={onRetry} disabled={isLoading}>
            <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            刷新
          </Button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              显示 {data.length} / {pagination.total_count} 个型号
            </span>
            {keyword ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 w-fit text-slate-500">
                <X className="mr-1 h-4 w-4" />
                清除筛选
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(320px,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch()
                }}
                placeholder="搜索硬件型号、厂商、主机名或指纹..."
                className="h-10 bg-white pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
                {HARDWARE_CATEGORIES.map((item) => {
                  const Icon = item.icon
                  const active = item.value === category
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        onCategoryChange(item.value)
                        onPageChange(1)
                        setExpandedRows(new Set())
                      }}
                      className={cn(
                        "inline-flex h-9 min-w-20 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        active
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? item.color : "text-slate-500")} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
              <Button variant="outline" onClick={submitSearch} className="h-10 bg-white">
                查询
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center border-t border-slate-200 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950">加载硬件清单失败</h3>
            <p className="mt-2 max-w-lg text-sm text-slate-500">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
              <RefreshCcw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </div>
        ) : isLoading ? (
          <LoadingRows />
        ) : data.length === 0 ? (
          <EmptyState onRetry={onRetry} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-36">
                    <HeaderLabel icon={Hash}>类型</HeaderLabel>
                  </TableHead>
                  <TableHead className="min-w-80">
                    <HeaderLabel icon={Package}>型号信息</HeaderLabel>
                  </TableHead>
                  <TableHead className="min-w-52">
                    <HeaderLabel icon={Fingerprint}>型号指纹</HeaderLabel>
                  </TableHead>
                  <TableHead className="text-center">
                    <HeaderLabel icon={ArrowUpDown} className="justify-center">设备数</HeaderLabel>
                  </TableHead>
                  <TableHead className="text-center">
                    <HeaderLabel icon={Monitor} className="justify-center">主机数</HeaderLabel>
                  </TableHead>
                  <TableHead className="min-w-44">
                    <HeaderLabel icon={CalendarDays}>最近采集</HeaderLabel>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const meta = getHardwareCategoryMeta(item.category)
                  const isExpanded = expandedRows.has(item.id)
                  const Icon = meta.icon
                  return (
                    <Fragment key={item.id}>
                      <TableRow
                        onClick={() => toggleRow(item.id)}
                        className={cn("cursor-pointer", isExpanded && "bg-blue-50/40 hover:bg-blue-50/60")}
                      >
                        <TableCell className="w-12 text-slate-500">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold", meta.softClassName)}>
                            <Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-950">{item.title}</div>
                            <div className="mt-1 text-xs text-slate-500">{item.subtitle || item.vendor}</div>
                            {item.specs.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.specs.map((spec) => (
                                  <span key={`${spec.label}-${spec.value}`} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                    {spec.label}: {spec.value}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex max-w-52 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
                            {shortHash(item.model_hash)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("inline-flex min-w-9 justify-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums", meta.softClassName)}>
                            {item.device_count.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex min-w-9 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-blue-600">
                            {item.host_count.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{formatTimestamp(item.collected_at)}</TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={7} className="bg-white px-6 py-4">
                            <ExpandedHosts item={item} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <div>
            共 {pagination.total_count.toLocaleString()} 个型号
            {pagination.total_count > 0 ? `，当前显示 ${shownStart}-${shownEnd}` : ""}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">每页</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                onPageSizeChange(Number(value))
                onPageChange(1)
              }}
            >
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={isLoading || !pagination.has_previous}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              上一页
            </Button>
            {pageNumbers.map((pageNumber, index) =>
              pageNumber === "..." ? (
                <span key={`${pageNumber}-${index}`} className="px-1 text-slate-400">...</span>
              ) : (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-9 px-0"
                  onClick={() => onPageChange(pageNumber)}
                  disabled={isLoading}
                >
                  {pageNumber}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={isLoading || !pagination.has_next}
            >
              下一页
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
