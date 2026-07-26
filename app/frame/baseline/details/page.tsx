"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Database, Lock, Monitor, Settings, Shield, Users } from "lucide-react"

import BaselineDetailHeader from "@/features/baseline/details/components/baseline-detail-header"
import BaselineDetailSpec from "@/features/baseline/details/components/baseline-detail-spec"
import HostList from "@/features/baseline/details/components/host-list"
import {
  fetchBaselineDetail,
  fetchBaselineItemHostResults,
  fetchBaselineItemStatistics,
  type BaselineHostListItem,
  type BaselineHostPagination,
  type BaselineItemResultStatistics,
  type BaselineTemplateItem,
} from "@/features/baseline/dashboard/api"

const DEFAULT_HOST_PAGE_SIZE = 10

const EMPTY_HOST_PAGINATION: BaselineHostPagination = {
  current_page: 1,
  page_size: DEFAULT_HOST_PAGE_SIZE,
  total_count: 0,
  total_pages: 0,
  has_previous: false,
  has_next: false,
}

const categoryKeys = ["account", "system", "permission", "service", "network", "database"] as const
type CategoryKey = (typeof categoryKeys)[number]

const categoryIconMap = {
  account: Users,
  system: Settings,
  permission: Lock,
  service: Monitor,
  network: Shield,
  database: Database,
}

export default function BaselineDetailsPage() {
  const t = useTranslations("pages.baseline.details")
  const searchParams = useSearchParams()
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterUser, setFilterUser] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterOS, setFilterOS] = useState("")
  const [filterHostId, setFilterHostId] = useState("")
  const [detail, setDetail] = useState<BaselineTemplateItem | null>(null)
  const [statistics, setStatistics] = useState<BaselineItemResultStatistics | null>(null)
  const [hostData, setHostData] = useState<BaselineHostListItem[]>([])
  const [hostPagination, setHostPagination] = useState<BaselineHostPagination>(EMPTY_HOST_PAGINATION)
  const [hostPage, setHostPage] = useState(1)
  const [hostPageSize, setHostPageSize] = useState(DEFAULT_HOST_PAGE_SIZE)
  const [hostError, setHostError] = useState("")
  const [hostReloadKey, setHostReloadKey] = useState(0)
  const [headerLoading, setHeaderLoading] = useState(true)
  const [hostLoading, setHostLoading] = useState(true)

  const baselineUuid = searchParams.get("baseline_uuid") || ""
  const baselineNameFallback = searchParams.get("baseline_name") || baselineUuid || "基线模板"
  const itemId = searchParams.get("item_id") || ""
  const itemNameFallback = searchParams.get("item") || t("defaultItemName")
  const categoryId = searchParams.get("category") || "account"
  const categoryKey = categoryKeys.includes(categoryId as CategoryKey) ? (categoryId as CategoryKey) : "account"
  const fallbackCategoryName = t(`categories.${categoryKey}`)
  const CategoryIcon = categoryIconMap[categoryKey] || Users

  useEffect(() => {
    let cancelled = false

    const loadHeaderData = async () => {
      if (!baselineUuid || !itemId) {
        setDetail(null)
        setStatistics(null)
        setHeaderLoading(false)
        return
      }

      setHeaderLoading(true)
      setDetail(null)
      setStatistics(null)

      const [detailResult, statisticsResult] = await Promise.allSettled([
        fetchBaselineDetail(baselineUuid, itemId),
        fetchBaselineItemStatistics(baselineUuid, itemId),
      ])

      if (cancelled) return

      if (detailResult.status === "fulfilled") {
        setDetail(detailResult.value)
      }

      if (statisticsResult.status === "fulfilled") {
        setStatistics(statisticsResult.value)
      }

      setHeaderLoading(false)
    }

    void loadHeaderData()

    return () => {
      cancelled = true
    }
  }, [baselineUuid, itemId])

  useEffect(() => {
    setHostPage(1)
  }, [baselineUuid, itemId])

  useEffect(() => {
    let cancelled = false

    const loadHostData = async () => {
      if (!baselineUuid || !itemId) {
        setHostData([])
        setHostPagination(EMPTY_HOST_PAGINATION)
        setHostError("")
        setHostLoading(false)
        return
      }

      setHostLoading(true)
      setHostError("")

      try {
        const result = await fetchBaselineItemHostResults(baselineUuid, itemId, {
          limit: hostPageSize,
          offset: (hostPage - 1) * hostPageSize,
        })

        if (cancelled) return

        setHostData(result.hosts)
        setHostPagination(result.pagination)
      } catch (error) {
        if (cancelled) return

        setHostData([])
        setHostPagination({ ...EMPTY_HOST_PAGINATION, current_page: hostPage, page_size: hostPageSize })
        setHostError(error instanceof Error ? error.message : t("loadHostsFailed"))
      } finally {
        if (!cancelled) {
          setHostLoading(false)
        }
      }
    }

    void loadHostData()

    return () => {
      cancelled = true
    }
  }, [baselineUuid, hostPage, hostPageSize, hostReloadKey, itemId, t])

  const uniqueUsers = useMemo(
    () => [...new Set(hostData.map((host) => host.user).filter((value) => value !== "-"))],
    [hostData],
  )
  const uniqueDepartments = useMemo(
    () => [...new Set(hostData.map((host) => host.department).filter((value) => value !== "-"))],
    [hostData],
  )
  const uniqueOS = useMemo(
    () => [...new Set(hostData.map((host) => host.os).filter((value) => value !== "-"))],
    [hostData],
  )

  const filteredData = hostData.filter((host) => {
    const keyword = searchTerm.trim().toLowerCase()
    const hostIdKeyword = filterHostId.trim().toLowerCase()

    return (
      (keyword === "" ||
        host.user.toLowerCase().includes(keyword) ||
        host.id.toLowerCase().includes(keyword) ||
        host.email.toLowerCase().includes(keyword) ||
        host.hostname.toLowerCase().includes(keyword) ||
        host.ip.toLowerCase().includes(keyword)) &&
      (filterUser === "" || host.user.toLowerCase() === filterUser.toLowerCase()) &&
      (filterDepartment === "" || host.department.toLowerCase() === filterDepartment.toLowerCase()) &&
      (filterOS === "" || host.os.toLowerCase() === filterOS.toLowerCase()) &&
      (hostIdKeyword === "" || host.id.toLowerCase().includes(hostIdKeyword))
    )
  })

  const clearFilters = () => {
    setSearchTerm("")
    setFilterUser("")
    setFilterDepartment("")
    setFilterOS("")
    setFilterHostId("")
    setHostPage(1)
  }

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="space-y-6 p-4 sm:p-6">
        <BaselineDetailHeader
          item={detail}
          statistics={statistics}
          baselineUuid={baselineUuid}
          baselineName={baselineNameFallback}
          categoryIcon={CategoryIcon}
          fallbackCategory={fallbackCategoryName}
          fallbackTitle={itemNameFallback}
          isLoading={headerLoading}
          onBack={handleBack}
        />

        <BaselineDetailSpec item={detail} isLoading={headerLoading} />

        <HostList
          filteredData={filteredData}
          pagination={hostPagination}
          searchTerm={searchTerm}
          filterUser={filterUser}
          filterDepartment={filterDepartment}
          filterOS={filterOS}
          filterHostId={filterHostId}
          uniqueUsers={uniqueUsers}
          uniqueDepartments={uniqueDepartments}
          uniqueOS={uniqueOS}
          pageSize={hostPageSize}
          setSearchTerm={setSearchTerm}
          setFilterUser={setFilterUser}
          setFilterDepartment={setFilterDepartment}
          setFilterOS={setFilterOS}
          setFilterHostId={setFilterHostId}
          clearFilters={clearFilters}
          isLoading={hostLoading}
          error={hostError}
          onPageChange={setHostPage}
          onPageSizeChange={setHostPageSize}
          onRetry={() => setHostReloadKey((value) => value + 1)}
        />
      </div>
    </div>
  )
}
