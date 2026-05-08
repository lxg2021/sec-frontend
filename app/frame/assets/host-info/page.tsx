"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, ChevronLeft, ChevronRight, List, Loader2, RefreshCcw } from "lucide-react"
import { useTranslations } from "next-intl"

import { getHostSummary, getHostsPagination } from "@/features/assets/host/api"
import type { HostPagination } from "@/features/assets/host/api"
import { HostDetailsDialog } from "@/features/assets/host/components/host-details-dialog"
import { HostListTable } from "@/features/assets/host/components/host-list-table"
import { HostSummaryCard } from "@/features/assets/host/components/host-summary-card"
import type { HostSummary } from "@/features/assets/host/types/host-summary"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const TENANT_ID = "public"
const DEFAULT_PAGE_SIZE = 10

const EMPTY_PAGINATION: HostPagination = {
  current_page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total_count: 0,
  total_pages: 0,
  has_previous: false,
  has_next: false,
}

export default function HostInfoPage() {
  const t = useTranslations("pages.assets.hardware")
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null)
  const [summary, setSummary] = useState<HostSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState("")
  const [hosts, setHosts] = useState<AgentInfo[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)
  const [hostsError, setHostsError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [pagination, setPagination] = useState<HostPagination>(EMPTY_PAGINATION)

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    setSummaryError("")

    try {
      setSummary(await getHostSummary(TENANT_ID))
    } catch (error) {
      setSummary(null)
      setSummaryError(error instanceof Error ? error.message : "加载主机统计失败")
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const loadHosts = useCallback(async () => {
    setHostsLoading(true)
    setHostsError("")

    try {
      const result = await getHostsPagination({
        tenantId: TENANT_ID,
        page,
        pageSize,
      })

      setHosts(result.hosts)
      setPagination(result.pagination)
      setSelectedHostId((current) =>
        current && result.hosts.some((host) => host.hostId === current) ? current : null,
      )
    } catch (error) {
      setHosts([])
      setPagination({ ...EMPTY_PAGINATION, current_page: page, page_size: pageSize })
      setHostsError(error instanceof Error ? error.message : "加载主机列表失败")
    } finally {
      setHostsLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadHosts()
  }, [loadHosts])

  const selectedHost = useMemo(
    () => (selectedHostId ? hosts.find((host) => host.hostId === selectedHostId) ?? null : null),
    [hosts, selectedHostId],
  )

  const handleRefresh = () => {
    void loadSummary()
    void loadHosts()
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  const rangeStart = pagination.total_count > 0
    ? (pagination.current_page - 1) * pagination.page_size + 1
    : 0
  const rangeEnd = pagination.total_count > 0
    ? Math.min(pagination.current_page * pagination.page_size, pagination.total_count)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {summaryLoading ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在加载主机统计...
          </div>
        ) : summaryError ? (
          <div className="flex min-h-32 flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{summaryError}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadSummary()} className="bg-white">
              <RefreshCcw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </div>
        ) : summary ? (
          <HostSummaryCard summary={summary} />
        ) : null}

        <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-none">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <List className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-950">
                  {t("hostList")}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {t("hostListDescription")}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={hostsLoading || summaryLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pb-6 pt-6">
            {hostsError ? (
              <div className="flex min-h-24 flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{hostsError}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => void loadHosts()} className="bg-white">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </div>
            ) : hostsLoading ? (
              <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在加载主机列表...
              </div>
            ) : (
              <HostListTable
                hosts={hosts}
                selectedHostId={selectedHostId}
                onSelectHost={setSelectedHostId}
              />
            )}

            <div className="flex flex-col gap-3 border-t pt-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
              <div>
                共 {pagination.total_count} 台主机
                {pagination.total_count > 0 ? `，当前显示 ${rangeStart}-${rangeEnd}` : ""}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">第 {pagination.current_page} / {Math.max(pagination.total_pages, 1)} 页</span>
                <span className="ml-2 text-slate-500">每页</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
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
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={hostsLoading || !pagination.has_previous}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={hostsLoading || !pagination.has_next}
                >
                  下一页
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <HostDetailsDialog
          isOpen={!!selectedHostId}
          onClose={() => setSelectedHostId(null)}
          host={selectedHost}
        />
      </div>
    </div>
  )
}
