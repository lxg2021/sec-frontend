import type { ComponentType, ReactNode } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Hash,
  Mail,
  Monitor,
  Package,
  Phone,
  RefreshCcw,
  Search,
  Server,
  Users,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import type { BaselineHostListItem, BaselineHostPagination } from "@/features/baseline/dashboard/api"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface HostListProps {
  filteredData: BaselineHostListItem[]
  pagination: BaselineHostPagination
  searchTerm: string
  filterUser: string
  filterDepartment: string
  filterOS: string
  filterHostId: string
  uniqueUsers: string[]
  uniqueDepartments: string[]
  uniqueOS: string[]
  pageSize: number
  isLoading?: boolean
  error?: string
  setSearchTerm: (value: string) => void
  setFilterUser: (value: string) => void
  setFilterDepartment: (value: string) => void
  setFilterOS: (value: string) => void
  setFilterHostId: (value: string) => void
  clearFilters: () => void
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

function LoadingRows() {
  return (
    <div className="flex-1 space-y-4 border-t border-slate-200 p-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[180px_120px_180px_140px_140px_180px_150px_120px] items-center gap-4"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function ResultBadge({ status, label }: { status: BaselineHostListItem["status"]; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit rounded-full px-2.5 py-1 text-xs font-medium",
        status === "passed" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "failed" && "border-rose-200 bg-rose-50 text-rose-700",
        status === "error" && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      <span
        className={cn(
          "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
          status === "passed" && "bg-emerald-500",
          status === "failed" && "bg-rose-500",
          status === "error" && "bg-amber-500",
        )}
      />
      {label}
    </Badge>
  )
}

export default function HostList({
  filteredData,
  pagination,
  searchTerm,
  filterUser,
  filterDepartment,
  filterOS,
  filterHostId,
  uniqueUsers,
  uniqueDepartments,
  uniqueOS,
  pageSize,
  isLoading = false,
  error = "",
  setSearchTerm,
  setFilterUser,
  setFilterDepartment,
  setFilterOS,
  setFilterHostId,
  clearFilters,
  onPageChange,
  onPageSizeChange,
  onRetry,
}: HostListProps) {
  const t = useTranslations("pages.baseline.details")
  const currentPage = pagination.current_page || 1
  const totalPages = Math.max(pagination.total_pages, pagination.total_count > 0 ? 1 : 0)
  const shownStart = pagination.total_count > 0 ? (currentPage - 1) * pagination.page_size + 1 : 0
  const shownEnd = pagination.total_count > 0 ? Math.min(currentPage * pagination.page_size, pagination.total_count) : 0
  const hasFilters = Boolean(searchTerm || filterUser || filterDepartment || filterOS || filterHostId)
  const failedCount = filteredData.filter((host) => host.status !== "passed").length

  return (
    <section className="flex min-h-[22rem] flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Server className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-950">{t("hostListTitle")}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{t("hostListDescription")}</p>
          </div>
        </div>
        <Button className="h-10 rounded-full border-slate-200" variant="outline" onClick={onRetry} disabled={isLoading}>
          <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          {t("refresh")}
        </Button>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{t("hostCount", { count: pagination.total_count })}</span>
            <span className="text-slate-300">/</span>
            <span>{t("nonCompliantCount", { count: failedCount })}</span>
            {pagination.total_count > 0 ? (
              <>
                <span className="text-slate-300">/</span>
                <span>{t("currentRange", { start: shownStart, end: shownEnd })}</span>
              </>
            ) : null}
          </div>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 w-fit rounded-full text-slate-500">
              <X className="mr-1 h-4 w-4" />
              {t("clearFilters")}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_repeat(4,minmax(150px,180px))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 rounded-2xl border-slate-200 bg-white pl-9 shadow-none focus-visible:ring-blue-200"
            />
          </div>

          <Select value={filterUser || "all"} onValueChange={(value) => setFilterUser(value === "all" ? "" : value)}>
            <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white shadow-none">
              <SelectValue placeholder={t("filterUser")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allUsers")}</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterDepartment || "all"}
            onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white shadow-none">
              <SelectValue placeholder={t("filterDepartment")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allDepartments")}</SelectItem>
              {uniqueDepartments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOS || "all"} onValueChange={(value) => setFilterOS(value === "all" ? "" : value)}>
            <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white shadow-none">
              <SelectValue placeholder={t("filterOs")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allSystems")}</SelectItem>
              {uniqueOS.map((os) => (
                <SelectItem key={os} value={os}>
                  {os}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder={t("filterHostId")}
            value={filterHostId}
            onChange={(event) => setFilterHostId(event.target.value)}
            className="h-10 rounded-2xl border-slate-200 bg-white shadow-none focus-visible:ring-blue-200"
          />
        </div>
      </div>

      {error ? (
        <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center border-t border-slate-200 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-950">{t("loadHostsFailed")}</h3>
          <p className="mt-2 max-w-lg text-sm text-slate-500">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 rounded-full">
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("retry")}
          </Button>
        </div>
      ) : isLoading ? (
        <LoadingRows />
      ) : filteredData.length === 0 ? (
        <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center border-t border-slate-200 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-950">{t("noMatchTitle")}</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">{t("noMatchDescription")}</p>
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="min-w-52">
                <HeaderLabel icon={Hash}>{t("hostId")}</HeaderLabel>
              </TableHead>
              <TableHead className="min-w-32">
                <HeaderLabel icon={Users}>{t("user")}</HeaderLabel>
              </TableHead>
              <TableHead className="min-w-52">
                <HeaderLabel icon={Mail}>Email</HeaderLabel>
              </TableHead>
              <TableHead className="min-w-36">
                <HeaderLabel icon={Phone}>{t("phone")}</HeaderLabel>
              </TableHead>
              <TableHead className="min-w-36">
                <HeaderLabel icon={Server}>{t("department")}</HeaderLabel>
              </TableHead>
              <TableHead className="min-w-56">
                <HeaderLabel icon={Monitor}>{t("os")}</HeaderLabel>
              </TableHead>
              <TableHead className="min-w-44">
                <HeaderLabel icon={CalendarDays}>{t("lastOnline")}</HeaderLabel>
              </TableHead>
              <TableHead className="min-w-32">
                <HeaderLabel icon={Package}>{t("checkResult")}</HeaderLabel>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((host) => (
              <TableRow key={host.id} className="hover:bg-blue-50/40">
                <TableCell>
                  <code className="block max-w-[260px] truncate rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700" title={host.id}>
                    {host.id || "-"}
                  </code>
                </TableCell>
                <TableCell className="font-medium text-slate-950">{host.user}</TableCell>
                <TableCell className="text-slate-600">
                  <span className="block max-w-[260px] truncate" title={host.email}>
                    {host.email}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-600">{host.phone}</TableCell>
                <TableCell className="text-slate-600">{host.department}</TableCell>
                <TableCell className="text-slate-600">
                  <span className="block max-w-[300px] truncate" title={host.os}>
                    {host.os}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-500">{host.lastOnline}</TableCell>
                <TableCell>
                  <ResultBadge status={host.status} label={t(`resultStatus.${host.status}`)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {t("totalHosts", { count: pagination.total_count })}
          {pagination.total_count > 0 ? `, ${t("currentRange", { start: shownStart, end: shownEnd })}` : ""}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500">{t("pageSize")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              onPageSizeChange(Number(value))
              onPageChange(1)
            }}
          >
            <SelectTrigger className="h-9 w-24 rounded-2xl border-slate-200 shadow-none">
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
            className="rounded-full"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={isLoading || !pagination.has_previous}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("previousPage")}
          </Button>
          <span className="min-w-16 text-center text-slate-500">
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : "0 / 0"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLoading || !pagination.has_next}
          >
            {t("nextPage")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
