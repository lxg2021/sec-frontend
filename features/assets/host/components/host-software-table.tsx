"use client"

import { Archive, Calendar, ChevronLeft, ChevronRight, ExternalLink, FolderOpen, Loader2, Package, RefreshCcw, Trash2, VolumeX } from "lucide-react"

import type { HostPagination } from "@/features/assets/host/api"
import type { AgentSoftInfo } from "@/features/assets/host/types/software"
import TruncateCopyable from "@/features/assets/software/components/truncate-copyable"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { useTranslations } from "next-intl"

interface HostSoftwareTableProps {
  software: AgentSoftInfo | null
  loading?: boolean
  error?: string
  pagination?: HostPagination
  pageSize?: number
  onRetry?: () => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

function getInfoUrl(value?: string): string {
  const url = value?.trim() || ""

  if (!url || url === "-" || url.toLowerCase() === "null" || url.toLowerCase() === "undefined") {
    return ""
  }

  if (!/^https?:\/\//i.test(url)) {
    return ""
  }

  return url
}

export function HostSoftwareTable({
  software,
  loading = false,
  error = "",
  pagination,
  pageSize = 10,
  onRetry,
  onPageChange,
  onPageSizeChange,
}: HostSoftwareTableProps) {
  const t = useTranslations("pages.assets.hardware.host.softwarePanel")
  const softwareList = software?.softwareList || []
  const currentPage = pagination?.current_page || 1
  const totalPages = Math.max(pagination?.total_pages || 0, 1)
  const totalCount = pagination?.total_count || 0
  const rangeStart = totalCount > 0 ? (currentPage - 1) * (pagination?.page_size || pageSize) + 1 : 0
  const rangeEnd = totalCount > 0 ? Math.min(currentPage * (pagination?.page_size || pageSize), totalCount) : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("loading")}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 py-8 text-sm text-rose-700 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("retry")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  if (!software) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t("empty")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        <span>{t("count", { count: totalCount || softwareList.length })}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border [&>div]:h-full [&>div]:overscroll-contain">
        <Table className="min-w-[1690px] table-fixed">
          <colgroup>
            <col className="w-[220px]" />
            <col className="w-[140px]" />
            <col className="w-[112px]" />
            <col className="w-[180px]" />
            <col className="w-[200px]" />
            <col className="w-[160px]" />
            <col className="w-[140px]" />
            <col className="w-[96px]" />
            <col className="w-[170px]" />
            <col className="w-[170px]" />
            <col className="w-[100px]" />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_hsl(var(--border))]">
            <TableRow>
              <TableHead className="whitespace-nowrap px-3">{t("name")}</TableHead>
              <TableHead className="whitespace-nowrap px-3">{t("description")}</TableHead>
              <TableHead className="whitespace-nowrap px-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {t("installDate")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap px-3">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  {t("installPath")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap px-3">{t("internalName")}</TableHead>
              <TableHead className="whitespace-nowrap px-3">
                <div className="flex items-center gap-1.5">
                  <Archive className="h-4 w-4 shrink-0" />
                  {t("packageCache")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap px-3">{t("vendor")}</TableHead>
              <TableHead className="whitespace-nowrap px-3">{t("version")}</TableHead>
              <TableHead className="whitespace-nowrap px-3">
                <div className="flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4 shrink-0" />
                  {t("uninstallCommand")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap px-3">
                <div className="flex items-center gap-1.5">
                  <VolumeX className="h-4 w-4 shrink-0" />
                  {t("quietUninstall")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap px-3">
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  {t("infoUrl")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {softwareList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              softwareList.map((sw, index) => {
                const infoUrl = getInfoUrl(sw.urlInfoAbout)

                return (
                  <TableRow key={`${sw.identifyingNumber || sw.name}-${index}`} className="h-14">
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <div className="truncate font-medium" title={sw.displayName}>
                        {sw.displayName}
                      </div>
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <div className="truncate font-mono text-sm text-muted-foreground" title={sw.description}>
                        {sw.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <span className="block truncate whitespace-nowrap font-mono text-sm">{sw.installDate || "-"}</span>
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <TruncateCopyable value={sw.installLocation || ""} />
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <div className="truncate font-mono text-sm" title={sw.name}>
                        {sw.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <TruncateCopyable value={sw.packageCache || ""} />
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2 font-mono text-sm">
                      <div className="truncate" title={sw.vendor}>{sw.vendor || "-"}</div>
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2 font-mono text-sm">
                      <div className="truncate" title={sw.version}>{sw.version || "-"}</div>
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <TruncateCopyable value={sw.uninstallString || ""} />
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      <TruncateCopyable value={sw.quietUninstallString || ""} />
                    </TableCell>
                    <TableCell className="h-14 overflow-hidden px-3 py-2">
                      {infoUrl ? (
                        <a
                          href={infoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whitespace-nowrap text-xs text-blue-600 hover:text-blue-800"
                          title={infoUrl}
                        >
                          {t("details")}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <div className="flex shrink-0 flex-col gap-3 border-t pt-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {totalCount > 0
              ? t("totalRange", { total: totalCount, start: rangeStart, end: rangeEnd })
              : t("total", { total: totalCount })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">{t("pageInfo", { page: currentPage, totalPages })}</span>
            <span className="ml-2 text-slate-500">{t("pageSize")}</span>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange?.(Number(value))}>
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.max(currentPage - 1, 1))}
              disabled={loading || !pagination.has_previous}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("previousPage")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={loading || !pagination.has_next}
            >
              {t("nextPage")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
