"use client"

import { useCallback, useEffect, useState } from "react"
import { SoftInventoryTable } from "@/features/assets/software/components/soft-inventory-table"
import { UninstallSoftTaskList } from "@/features/assets/software/components/uninstall-soft-task-list"
import { getSoftwareDistributionPagination } from "@/features/assets/software/api"
import type { SoftwarePagination } from "@/features/assets/software/api"
import type { SoftItem } from "@/features/assets/software/types/software-aggregate"
import type { CreateUninstallTaskRequest } from "@/features/assets/software/types/task-soft-uninstall"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { CalendarCheck, Computer } from "lucide-react"
import { useTranslations } from "next-intl"

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
      setError(requestError instanceof Error ? requestError.message : "加载软件列表失败")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchTerm, vendorFilter])

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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Computer className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                <CalendarCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                  {t("softwareList")}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t("softwareCount", { count: pagination.total_count })}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
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
          </CardContent>
        </Card>

        <UninstallSoftTaskList tasks={uninstallTasks} onDeleteTask={handleDeleteTask} />
      </div>
    </div>
  )
}
