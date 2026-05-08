"use client"

import { useCallback, useEffect, useState } from "react"
import { Computer, Package, RefreshCcw } from "lucide-react"
import { useTranslations } from "next-intl"

import { getSoftwareDistributionPagination } from "@/features/assets/software/api"
import type { SoftwarePagination } from "@/features/assets/software/api"
import { SoftInventoryTable } from "@/features/assets/software/components/soft-inventory-table"
import { UninstallSoftTaskList } from "@/features/assets/software/components/uninstall-soft-task-list"
import type { SoftItem } from "@/features/assets/software/types/software-aggregate"
import type { CreateUninstallTaskRequest } from "@/features/assets/software/types/task-soft-uninstall"
import { Button } from "@/shared/ui/button"

const TENANT_ID = "public"
const DEFAULT_PAGE_SIZE = 10

const EMPTY_PAGINATION: SoftwarePagination = {
  current_page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total_count: 0,
  total_pages: 0,
  has_previous: false,
  has_next: false,
}

export default function Home() {
  const t = useTranslations("pages.assets.softwareDetails")
  const [software, setSoftware] = useState<SoftItem[]>([])
  const [pagination, setPagination] = useState<SoftwarePagination>(EMPTY_PAGINATION)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [uninstallTasks, setUninstallTasks] = useState<CreateUninstallTaskRequest[]>([])

  const loadSoftware = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const result = await getSoftwareDistributionPagination({
        tenantId: TENANT_ID,
        page,
        pageSize,
        name: searchTerm,
        vendor: vendorFilter === "all" ? "" : vendorFilter,
      })

      setSoftware(result.software)
      setPagination(result.pagination)
    } catch (requestError) {
      setSoftware([])
      setPagination({
        ...EMPTY_PAGINATION,
        current_page: page,
        page_size: pageSize,
      })
      setError(requestError instanceof Error ? requestError.message : t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchTerm, t, vendorFilter])

  useEffect(() => {
    void loadSoftware()
  }, [loadSoftware])

  const handleTaskCreated = (task: CreateUninstallTaskRequest) => {
    setUninstallTasks((prev) => [...prev, task])
  }

  const handleDeleteTask = (taskId: string) => {
    setUninstallTasks((prev) => prev.filter((task) => task.taskId !== taskId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Computer className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{t("softwareList")}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("softwareCount", { count: pagination.total_count })}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => void loadSoftware()} disabled={loading}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>

          <div className="p-6">
            <SoftInventoryTable
              data={software}
              isLoading={loading}
              error={error}
              pagination={pagination}
              searchTerm={searchTerm}
              vendorFilter={vendorFilter}
              itemsPerPage={pageSize}
              onSearchTermChange={setSearchTerm}
              onVendorFilterChange={setVendorFilter}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onRetry={() => void loadSoftware()}
              onTaskCreated={handleTaskCreated}
            />
          </div>
        </section>

        <UninstallSoftTaskList tasks={uninstallTasks} onDeleteTask={handleDeleteTask} />
      </div>
    </div>
  )
}
