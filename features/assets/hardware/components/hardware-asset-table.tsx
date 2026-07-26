"use client"

import type { ComponentType, ReactNode } from "react"
import { Fragment, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

function formatTimestamp(value: number, locale: string) {
  if (!value) return "-"
  const timestamp = value < 1_000_000_000_000 ? value * 1000 : value
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString(locale, {
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

function EmptyState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("pages.assets.hardware.inventory")

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto border-t border-slate-200 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Package className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{t("empty.title")}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{t("empty.description")}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 rounded-2xl border-slate-200">
        <RefreshCcw className="mr-2 h-4 w-4" />
        {t("actions.refresh")}
      </Button>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-hidden border-t border-slate-200 p-6">
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
  const t = useTranslations("pages.assets.hardware.inventory")
  const locale = useLocale()

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Server className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-950">
              {t("related.title", { title: item.title })}
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">{item.subtitle || item.vendor || t("related.description")}</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit rounded-full bg-slate-50 px-3 py-1 text-slate-700">
          {t("related.hostCount", { count: item.hosts.length })}
        </Badge>
      </div>

      {item.hosts.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">{t("related.empty")}</div>
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr className="text-left text-xs font-medium text-slate-500">
                <th className="px-5 py-3">
                  <HeaderLabel icon={Monitor}>{t("columns.hostname")}</HeaderLabel>
                </th>
                <th className="px-5 py-3">
                  <HeaderLabel icon={Fingerprint}>{t("columns.agentId")}</HeaderLabel>
                </th>
                <th className="px-5 py-3">
                  <HeaderLabel icon={Package}>{t("columns.os")}</HeaderLabel>
                </th>
                <th className="px-5 py-3">
                  <HeaderLabel icon={Hash}>{t("columns.status")}</HeaderLabel>
                </th>
                <th className="px-5 py-3">
                  <HeaderLabel icon={CalendarDays}>{t("columns.collectedAt")}</HeaderLabel>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {item.hosts.map((host) => (
                <tr key={`${host.agent_id}-${host.instance_hash}`} className="transition-colors hover:bg-blue-50/40">
                  <td className="px-5 py-3 font-medium text-slate-950">
                    <div className="truncate" title={host.hostname}>
                      {host.hostname || "-"}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <code
                      className="block max-w-[280px] truncate rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
                      title={host.agent_id}
                    >
                      {host.agent_id || "-"}
                    </code>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    <div className="max-w-[260px] truncate" title={`${host.os_name} ${host.os_version}`.trim()}>
                      {[host.os_name, host.os_version].filter(Boolean).join(" ") || "-"}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                      host.status === "online" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", host.status === "online" ? "bg-emerald-500" : "bg-slate-400")} />
                      {host.status === "online" ? t("status.online") : t("status.offline")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                    {formatTimestamp(host.collected_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const t = useTranslations("pages.assets.hardware.inventory")
  const locale = useLocale()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [draftKeyword, setDraftKeyword] = useState(keyword)

  const activeMeta = getHardwareCategoryMeta(category)
  const activeCategoryLabel = t(`categories.${category}`)
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
    <div className="min-h-[560px] flex-1 xl:min-h-0">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <activeMeta.icon className={cn("size-6", activeMeta.color)} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-medium text-slate-950">{t("list.title")}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t("list.description", { category: activeCategoryLabel })}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onRetry} disabled={isLoading} className="h-10 rounded-2xl border-slate-200 bg-white px-4 shadow-none">
            <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            {t("actions.refresh")}
          </Button>
        </div>

        <div className="shrink-0 border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              {t("list.showing", { shown: data.length, total: pagination.total_count })}
            </span>
            {keyword ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 w-fit rounded-2xl text-slate-500">
                <X className="mr-1 h-4 w-4" />
                {t("actions.clearFilters")}
              </Button>
            ) : null}
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(320px,1fr)_auto]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch()
                }}
                placeholder={t("list.searchPlaceholder")}
                aria-label={t("list.searchAriaLabel")}
                className="h-10 rounded-2xl border-slate-200 bg-white pl-9 shadow-none"
              />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
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
                        "inline-flex h-9 min-w-20 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        active
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? item.color : "text-slate-500")} />
                      {t(`categories.${item.value}`)}
                    </button>
                  )
                })}
              </div>
              <Button variant="outline" onClick={submitSearch} className="h-10 rounded-2xl border-slate-200 bg-white px-4 shadow-none">
                {t("actions.search")}
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto border-t border-slate-200 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Package className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950">{t("errors.listLoadFailed")}</h3>
            <p className="mt-2 max-w-lg text-sm text-slate-500">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 rounded-2xl border-slate-200">
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("actions.retry")}
            </Button>
          </div>
        ) : isLoading ? (
          <LoadingRows />
        ) : data.length === 0 ? (
          <EmptyState onRetry={onRetry} />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"><span className="sr-only">{t("columns.expand")}</span></TableHead>
                  <TableHead className="min-w-36">
                    <HeaderLabel icon={Hash}>{t("columns.type")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="min-w-80">
                    <HeaderLabel icon={Package}>{t("columns.modelInfo")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="min-w-52">
                    <HeaderLabel icon={Fingerprint}>{t("columns.modelFingerprint")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="text-center">
                    <HeaderLabel icon={ArrowUpDown} className="justify-center">{t("columns.deviceCount")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="text-center">
                    <HeaderLabel icon={Monitor} className="justify-center">{t("columns.hostCount")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="min-w-44">
                    <HeaderLabel icon={CalendarDays}>{t("columns.collectedAt")}</HeaderLabel>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleRow(item.id)
                            }}
                            className={cn(
                              "h-8 w-8 rounded-md border border-transparent p-0 text-slate-500 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900",
                              isExpanded && "border-blue-200 bg-white text-blue-600 shadow-sm hover:border-blue-200 hover:text-blue-700",
                            )}
                            aria-label={isExpanded ? t("actions.collapse") : t("actions.expand")}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Icon className={cn("h-4 w-4", meta.color)} />
                            {t(`categories.${item.category}`)}
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
                          <span className="inline-flex min-w-9 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-blue-600">
                            {item.device_count.toLocaleString(locale)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex min-w-9 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-blue-600">
                            {item.host_count.toLocaleString(locale)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{formatTimestamp(item.collected_at, locale)}</TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                          <TableCell colSpan={7} className="p-0">
                            <div className="px-4 pb-4">
                              <ExpandedHosts item={item} />
                            </div>
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

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {pagination.total_count > 0
              ? t("pagination.totalRange", { total: pagination.total_count, start: shownStart, end: shownEnd })
              : t("pagination.total", { total: pagination.total_count })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">{t("pagination.perPage")}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                onPageSizeChange(Number(value))
                onPageChange(1)
              }}
            >
              <SelectTrigger className="h-9 w-24 rounded-2xl border-slate-200 bg-white shadow-none" aria-label={t("pagination.perPage")}>
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
              className="rounded-2xl border-slate-200 bg-white shadow-none"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("pagination.previous")}
            </Button>
            {pageNumbers.map((pageNumber, index) =>
              pageNumber === "..." ? (
                <span key={`${pageNumber}-${index}`} className="px-1 text-slate-400">...</span>
              ) : (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-9 rounded-2xl px-0"
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
              className="rounded-2xl border-slate-200 bg-white shadow-none"
            >
              {t("pagination.next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
