"use client"

import { useState, useMemo, useCallback, Fragment } from "react"
import type React from "react"
import { Search, ChevronDown, ChevronRight, ExternalLink, Fingerprint, Monitor, CalendarDays, Folder, Package, Filter, X, RefreshCcw, ArrowUpDown, Boxes, Globe2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import type { SoftwarePagination } from "@/features/assets/software/api"
import type { SoftItem } from "@/features/assets/software/types/software-aggregate"
import { cn } from "@/shared/lib/utils"
import { useLocale, useTranslations } from "next-intl"

interface SoftInventoryTableProps {
  data: SoftItem[]
  isLoading?: boolean
  error?: string
  pagination: SoftwarePagination
  searchTerm: string
  vendorFilter: string
  itemsPerPage: number
  onSearchTermChange: (value: string) => void
  onVendorFilterChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRetry?: () => void
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

function getWebsiteUrl(value?: string): string {
  const url = value?.trim() || ""
  return /^https?:\/\//i.test(url) ? url : ""
}

function HeaderLabel({
  icon: Icon,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className || ""}`}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </span>
  )
}

export function SoftInventoryTable({
  data,
  isLoading = false,
  error = "",
  pagination,
  searchTerm,
  vendorFilter,
  itemsPerPage,
  onSearchTermChange,
  onVendorFilterChange,
  onPageChange,
  onPageSizeChange,
  onRetry,
}: SoftInventoryTableProps) {
  const t = useTranslations("pages.assets.software.table")
  const locale = useLocale()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const currentPage = pagination.current_page
  const totalCount = pagination.total_count
  const totalPages = Math.max(pagination.total_pages, totalCount > 0 ? 1 : 0)

  const vendors = useMemo(() => {
    const uniqueVendors = Array.from(new Set([
      ...data.map((item) => item.vendor).filter(Boolean),
      ...(vendorFilter !== "all" ? [vendorFilter] : []),
    ]))
    return uniqueVendors.sort()
  }, [data, vendorFilter])

  const toggleRowExpansion = useCallback((hash: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(hash)) {
        newExpanded.delete(hash)
      } else {
        newExpanded.add(hash)
      }
      return newExpanded
    })
  }, [])

  const clearFilters = () => {
    onSearchTermChange("")
    onVendorFilterChange("all")
    onPageChange(1)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) pages.push('...')
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-slate-950">{t("filterTitle")}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {t("displaySoftware", { shown: data.length, total: totalCount })}
            </span>
            {(searchTerm !== "" || vendorFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-muted-foreground">
                <X className="mr-1 h-4 w-4" />
                {t("clearFilters")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_280px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                onSearchTermChange(e.target.value)
                onPageChange(1)
              }}
              className="h-10 pl-9"
            />
          </div>
          <Select
            value={vendorFilter}
            onValueChange={(value) => {
              onVendorFilterChange(value)
              onPageChange(1)
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("selectVendor")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allVendors")}</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {isLoading ? (
            // Loading state
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
                <Package className="h-6 w-6 text-rose-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{error}</h3>
              {onRetry ? (
                <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {t("retry")}
                </Button>
              ) : null}
            </div>
          ) : data.length === 0 ? (
            // Empty state
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t("emptyTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("emptyDescription")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-60">
                    <HeaderLabel icon={Fingerprint}>
                      {t("fingerprint")}
                    </HeaderLabel>
                  </TableHead>
                  <TableHead>
                    <HeaderLabel icon={Package}>{t("name")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <HeaderLabel icon={ArrowUpDown}>{t("version")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <HeaderLabel icon={Boxes}>{t("vendor")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    <HeaderLabel icon={Fingerprint}>{t("sku")}</HeaderLabel>
                  </TableHead>
                  <TableHead>
                    <HeaderLabel icon={Globe2}>{t("website")}</HeaderLabel>
                  </TableHead>
                  <TableHead className="text-center">
                    <HeaderLabel icon={Monitor} className="justify-center">
                      {t("installCount")}
                    </HeaderLabel>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const websiteUrl = getWebsiteUrl(item.urlInfoAbout)
                  const isExpanded = expandedRows.has(item.hash)

                  return (
                  <Fragment key={item.hash}>
                    <TableRow
                      onClick={() => toggleRowExpansion(item.hash)}
                      className={cn(
                        "group cursor-pointer border-border transition-colors hover:bg-slate-50",
                        isExpanded && "bg-blue-50/30 hover:bg-blue-50/40",
                      )}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleRowExpansion(item.hash)
                          }}
                          className={cn(
                            "h-8 w-8 rounded-md border border-transparent p-0 text-slate-500 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900",
                            isExpanded && "border-blue-200 bg-white text-blue-600 shadow-sm hover:border-blue-200 hover:text-blue-700",
                          )}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="w-60 max-w-60 truncate font-mono text-xs" title={item.hash}>
                        {item.hash}
                      </TableCell>
                      <TableCell className="max-w-[240px]" title={item.displayName}>
                        <div className="truncate font-medium text-slate-950">{item.displayName}</div>
                        {item.name !== item.displayName ? (
                          <div className="truncate text-xs text-muted-foreground">{item.name}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{item.version}</TableCell>
                      <TableCell className="hidden lg:table-cell">{item.vendor}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{item.skuNumber || "-"}</TableCell>
                      <TableCell>
                        {websiteUrl ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" asChild>
                                  <a
                                    href={websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <ExternalLink className="h-4 w-4 text-blue-500" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("visitWebsite")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={item.installations.length === 0 ? "opacity-50" : "bg-blue-50 text-blue-700 hover:bg-blue-50"}>
                          {item.installations.length}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="border-border bg-slate-50/80 hover:bg-slate-50/80">
                        <TableCell colSpan={8} className="p-0">
                          <div className="px-4 pb-4">
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                              <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <Monitor className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="truncate text-sm font-semibold text-slate-950">
                                      {t("installDetail")} - {item.displayName}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">{item.version}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="w-fit rounded-full bg-slate-50 px-3 py-1 text-slate-700">
                                  {t("hostCount", { count: item.installations.length })}
                                </Badge>
                              </div>

                              <div className="max-h-80 overflow-auto">
                                <table className="w-full min-w-[960px] text-sm">
                                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                    <tr className="text-left text-xs font-medium text-slate-500">
                                      <th className="px-5 py-3">
                                        <HeaderLabel icon={Monitor}>{t("hostName")}</HeaderLabel>
                                      </th>
                                      <th className="px-5 py-3">
                                        <HeaderLabel icon={Fingerprint}>{t("hostId")}</HeaderLabel>
                                      </th>
                                      <th className="px-5 py-3">
                                        <HeaderLabel icon={CalendarDays}>{t("installDate")}</HeaderLabel>
                                      </th>
                                      <th className="px-5 py-3">
                                        <HeaderLabel icon={Folder}>{t("installPath")}</HeaderLabel>
                                      </th>
                                      <th className="px-5 py-3">
                                        <HeaderLabel icon={Package}>{t("packagePath")}</HeaderLabel>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {item.installations.map((installation, index) => (
                                      <tr
                                        key={`${installation.hostId}-${index}`}
                                        className="transition-colors hover:bg-blue-50/40"
                                      >
                                        <td className="px-5 py-3 font-medium text-slate-950">
                                          <div className="truncate" title={installation.hostname}>
                                            {installation.hostname || "-"}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3">
                                          <code
                                            className="block max-w-[260px] truncate rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
                                            title={installation.hostId}
                                          >
                                            {installation.hostId || "-"}
                                          </code>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                                          {installation.installDate
                                            ? new Date(installation.installDate).toLocaleDateString(locale)
                                            : "-"}
                                        </td>
                                        <td className="px-5 py-3">
                                          <div
                                            className="max-w-[260px] truncate text-xs text-slate-700"
                                            title={installation.installLocation || "-"}
                                          >
                                            {installation.installLocation || "-"}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3">
                                          <div
                                            className="max-w-[260px] truncate text-xs text-slate-700"
                                            title={installation.packageCache || "-"}
                                          >
                                            {installation.packageCache || "-"}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )})}
              </TableBody>
            </Table>
            </div>
          )}

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {totalCount === 0
                ? t("noMatch")
                : t("summary", {
                    count: totalCount,
                    start: Math.min((currentPage - 1) * itemsPerPage + 1, totalCount),
                    end: Math.min(currentPage * itemsPerPage, totalCount),
                  })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("itemsPerPage")}</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  onPageSizeChange(Number(value))
                  onPageChange(1)
                }}
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                {t("home")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={!pagination.has_previous}
              >
                {t("prev")}
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-1">...</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onPageChange(page as number)}
                    >
                      {page}
                    </Button>
                  )
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={!pagination.has_next}
              >
                {t("next")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                {t("last")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

    </div>
  )
}
