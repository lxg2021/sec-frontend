"use client"

import { useState, useMemo, useCallback, Fragment } from "react"
import type React from "react"
import { Search, ChevronDown, ChevronRight, MoreHorizontal, ExternalLink, Trash2, Fingerprint, Monitor, CalendarDays, Folder, Package, Filter, X, EyeOff, RefreshCcw, ArrowUpDown, Boxes, Globe2, Settings } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu"
import { Badge } from "@/shared/ui/badge"
import { UninstallSoftTaskDialog } from "@/features/assets/software/components/uninstall-soft-task-dialog"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import type { SoftwarePagination } from "@/features/assets/software/api"
import type { SoftItem, SoftwareInstallation } from "@/features/assets/software/types/software-aggregate"
import type { CreateUninstallTaskRequest } from "@/features/assets/software/types/task-soft-uninstall"
import { useLocale, useTranslations } from "next-intl"

interface SoftInventoryTableProps {
  data: SoftItem[]
  onTaskCreated: (task: CreateUninstallTaskRequest) => void
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
  onTaskCreated,
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

  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)
  const [selectedSoftwareForUninstall, setSelectedSoftwareForUninstall] = useState<SoftItem[]>([])
  const [uninstallType, setUninstallType] = useState<"uninstall" | "quietUninstall">("uninstall")
  const currentPage = pagination.current_page
  const totalCount = pagination.total_count
  const totalPages = Math.max(pagination.total_pages, totalCount > 0 ? 1 : 0)

  const vendors = useMemo(() => {
    const uniqueVendors = Array.from(new Set([
      ...data.map((item) => item.vendor).filter(Boolean),
      ...(vendorFilter !== "all" ? [vendorFilter] : []),
    ]))
    return uniqueVendors.sort()
  }, [data, searchTerm, vendorFilter])

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

  const handleBatchUninstall = (softItem: SoftItem) => {
    setSelectedSoftwareForUninstall([softItem])
    setUninstallType("uninstall")
    setUninstallDialogOpen(true)
  }

  const handleBatchSilentUninstall = (softItem: SoftItem) => {
    setSelectedSoftwareForUninstall([softItem])
    setUninstallType("quietUninstall")
    setUninstallDialogOpen(true)
  }

  const handleUninstall = (installation: SoftwareInstallation, softItem: SoftItem) => {
    const singleHostSoftware: SoftItem = {
      ...softItem,
      installations: [installation],
    }
    setSelectedSoftwareForUninstall([singleHostSoftware])
    setUninstallType("uninstall")
    setUninstallDialogOpen(true)
  }

  const handleSilentUninstall = (installation: SoftwareInstallation, softItem: SoftItem) => {
    const singleHostSoftware: SoftItem = {
      ...softItem,
      installations: [installation],
    }
    setSelectedSoftwareForUninstall([singleHostSoftware])
    setUninstallType("quietUninstall")
    setUninstallDialogOpen(true)
  }

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
                  <TableHead className="text-right">
                    <HeaderLabel icon={Settings} className="justify-end">
                      {t("actions")}
                    </HeaderLabel>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const websiteUrl = getWebsiteUrl(item.urlInfoAbout)

                  return (
                  <Fragment key={item.hash}>
                    <TableRow className="group border-border hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(item.hash)}
                          className="p-1 h-6 w-6"
                        >
                          {expandedRows.has(item.hash) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
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
                      <TableCell className="text-right">

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>{t("details")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleBatchUninstall(item)}
                              disabled={
                                item.installations.length === 0 ||
                                !item.installations.some(installation => installation.uninstallString && installation.uninstallString.length > 0)
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                              <span className="text-black">{t("batchNormalUninstall")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBatchSilentUninstall(item)}
                              disabled={
                                item.installations.length === 0 ||
                                !item.installations.some(installation => installation.quietUninstallString && installation.quietUninstallString.length > 0)
                              }
                              className="text-destructive"
                            >
                              <EyeOff className="h-4 w-4 mr-2 text-orange-500" />
                              <span className="text-black">{t("batchSilentUninstall")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>


                      </TableCell>
                    </TableRow>

                    {/* Expanded Row Details */}
                    {expandedRows.has(item.hash) && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={9} className="p-0">
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-bold">
                                {t("installDetail")} - {item.displayName}
                              </h4>
                              <Badge variant="outline" className="ml-2">
                                {t("hostCount", { count: item.installations.length })}
                              </Badge>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-blue-500" />
                                        {t("hostName")}
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Fingerprint className="h-4 w-4 text-blue-500" />
                                        {t("hostId")}
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-blue-500" />
                                        {t("installDate")}
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Folder className="h-4 w-4 text-blue-500" />
                                        {t("installPath")}
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-500" />
                                        {t("packagePath")}
                                      </div>
                                    </th>
                                    <th className="text-center p-2">{t("operation")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.installations.map((installation, index) => (
                                    <tr key={`${installation.hostId}-${index}`}>
                                      <td className="font-medium p-2">{installation.hostname}</td>
                                      <td className="font-mono text-xs p-2">{installation.hostId}</td>
                                      <td className="p-2">
                                        {installation.installDate
                                          ? new Date(installation.installDate).toLocaleDateString(locale)
                                          : "-"}
                                      </td>
                                      <td className="text-xs max-w-48 truncate p-2" title={installation.installLocation}>
                                        {installation.installLocation || "-"}
                                      </td>
                                      <td className="text-xs max-w-48 truncate p-2" title={installation.packageCache}>
                                        {installation.packageCache || "-"}
                                      </td>

                                      <td className="text-center p-2">
                                        <div
                                          className={`flex gap-1 justify-center items-center ${installation.uninstallString && installation.quietUninstallString ? "flex-row" : "flex-row"
                                            }`}
                                        >
                                          {installation.uninstallString && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleUninstall(installation, item)}
                                              className="flex items-center gap-1"
                                            >
                                              <Trash2 className="h-3 w-3 text-red-500" />
                                              {t("normalUninstall")}
                                            </Button>
                                          )}
                                          {installation.quietUninstallString && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleSilentUninstall(installation, item)}
                                              className="flex items-center gap-1"
                                            >
                                              <EyeOff className="h-3 w-3 text-orange-500" />
                                              {t("quietUninstall")}
                                            </Button>
                                          )}
                                        </div>
                                      </td>

                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

      <UninstallSoftTaskDialog
        selectedSoftware={selectedSoftwareForUninstall}
        uninstallType={uninstallType}
        open={uninstallDialogOpen}
        onOpenChange={setUninstallDialogOpen}
        onTaskCreated={onTaskCreated}
      />
    </div>
  )
}
