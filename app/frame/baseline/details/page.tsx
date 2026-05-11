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
  type BaselineItemResultStatistics,
  type BaselineTemplateItem,
} from "@/features/baseline/dashboard/api"

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

  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUser, setFilterUser] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterOS, setFilterOS] = useState("")
  const [filterHostId, setFilterHostId] = useState("")
  const [batchFixMethod, setBatchFixMethod] = useState(t("defaultFixMethod"))
  const [hostFixMethods, setHostFixMethods] = useState<Record<string, string>>({})
  const [detail, setDetail] = useState<BaselineTemplateItem | null>(null)
  const [statistics, setStatistics] = useState<BaselineItemResultStatistics | null>(null)
  const [hostData, setHostData] = useState<BaselineHostListItem[]>([])
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
        setHostData([])
        setHeaderLoading(false)
        setHostLoading(false)
        return
      }

      setHeaderLoading(true)
      setHostLoading(true)
      setDetail(null)
      setStatistics(null)
      setHostData([])
      setSelectedHosts([])

      const [detailResult, statisticsResult, hostResult] = await Promise.allSettled([
        fetchBaselineDetail(baselineUuid, itemId),
        fetchBaselineItemStatistics(baselineUuid, itemId),
        fetchBaselineItemHostResults(baselineUuid, itemId),
      ])

      if (cancelled) return

      if (detailResult.status === "fulfilled") {
        setDetail(detailResult.value)
      }

      if (statisticsResult.status === "fulfilled") {
        setStatistics(statisticsResult.value)
      }

      if (hostResult.status === "fulfilled") {
        setHostData(hostResult.value.hosts)
      }

      setHeaderLoading(false)
      setHostLoading(false)
    }

    void loadHeaderData()

    return () => {
      cancelled = true
    }
  }, [baselineUuid, itemId])

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedHosts(filteredData.map((host) => host.id))
    } else {
      setSelectedHosts([])
    }
  }

  const handleSelectHost = (hostId: string, checked: boolean) => {
    if (checked && !selectedHosts.includes(hostId)) {
      setSelectedHosts([...selectedHosts, hostId])
    } else if (!checked) {
      setSelectedHosts(selectedHosts.filter((id) => id !== hostId))
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterUser("")
    setFilterDepartment("")
    setFilterOS("")
    setFilterHostId("")
  }

  const handleBatchFixMethodSelect = (method: string) => {
    setBatchFixMethod(method)
    if (process.env.NODE_ENV !== "production") {
      console.log("批量修复方式:", method, "选中主机:", selectedHosts)
    }
  }

  const handleHostFixMethodSelect = (hostId: string, method: string) => {
    setHostFixMethods((prev) => ({
      ...prev,
      [hostId]: method,
    }))
    if (process.env.NODE_ENV !== "production") {
      console.log("主机修复方式:", hostId, method)
    }
  }

  const getHostFixMethod = (hostId: string) => {
    return hostFixMethods[hostId] || t("defaultFixMethod")
  }

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="space-y-6 p-6">
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
          selectedHosts={selectedHosts}
          searchTerm={searchTerm}
          filterUser={filterUser}
          filterDepartment={filterDepartment}
          filterOS={filterOS}
          filterHostId={filterHostId}
          batchFixMethod={batchFixMethod}
          uniqueUsers={uniqueUsers}
          uniqueDepartments={uniqueDepartments}
          uniqueOS={uniqueOS}
          setSearchTerm={setSearchTerm}
          setFilterUser={setFilterUser}
          setFilterDepartment={setFilterDepartment}
          setFilterOS={setFilterOS}
          setFilterHostId={setFilterHostId}
          handleSelectAll={handleSelectAll}
          handleSelectHost={handleSelectHost}
          clearFilters={clearFilters}
          handleBatchFixMethodSelect={handleBatchFixMethodSelect}
          handleHostFixMethodSelect={handleHostFixMethodSelect}
          getHostFixMethod={getHostFixMethod}
          isLoading={hostLoading}
        />
      </div>
    </div>
  )
}
