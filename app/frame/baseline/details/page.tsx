"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Database, Lock, Monitor, Settings, Shield, Users } from "lucide-react"

import BaselineDetailHeader from "@/features/baseline/details/components/baseline-detail-header"
import BaselineDetailSpec from "@/features/baseline/details/components/baseline-detail-spec"
import HostList from "@/features/baseline/details/components/host-list"
import {
  fetchBaselineDetail,
  fetchBaselineItemStatistics,
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

const mockHostData = [
  {
    id: "HOST-001",
    user: "张三",
    email: "zhangsan/company.com",
    phone: "138****1234",
    department: "技术部",
    os: "Windows Server 2019",
    lastOnline: "2025-01-25 14:30:25",
    checkResult: "不合规",
    status: "failed",
  },
  {
    id: "HOST-002",
    user: "李四",
    email: "lisi/company.com",
    phone: "139****5678",
    department: "运维部",
    os: "Ubuntu 20.04",
    lastOnline: "2025-01-25 15:45:12",
    checkResult: "合规",
    status: "passed",
  },
  {
    id: "HOST-003",
    user: "王五",
    email: "wangwu/company.com",
    phone: "136****9012",
    department: "技术部",
    os: "CentOS 7.9",
    lastOnline: "2025-01-25 13:20:08",
    checkResult: "不合规",
    status: "failed",
  },
  {
    id: "HOST-004",
    user: "赵六",
    email: "zhaoliu/company.com",
    phone: "137****3456",
    department: "安全部",
    os: "Windows Server 2022",
    lastOnline: "2025-01-25 16:10:33",
    checkResult: "合规",
    status: "passed",
  },
  {
    id: "HOST-005",
    user: "钱七",
    email: "qianqi/company.com",
    phone: "135****7890",
    department: "运维部",
    os: "Red Hat 8.5",
    lastOnline: "2025-01-25 12:55:47",
    checkResult: "不合规",
    status: "failed",
  },
]

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
  const [headerLoading, setHeaderLoading] = useState(true)

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

  const uniqueUsers = [...new Set(mockHostData.map((host) => host.user))]
  const uniqueDepartments = [...new Set(mockHostData.map((host) => host.department))]
  const uniqueOS = [...new Set(mockHostData.map((host) => host.os))]

  const filteredData = mockHostData.filter((host) => {
    return (
      (searchTerm.trim() === "" ||
        host.user.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        host.id.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        host.email.toLowerCase().includes(searchTerm.trim().toLowerCase())) &&
      (filterUser === "" || host.user.toLowerCase() === filterUser.toLowerCase()) &&
      (filterDepartment === "" || host.department.toLowerCase() === filterDepartment.toLowerCase()) &&
      (filterOS === "" || host.os.toLowerCase() === filterOS.toLowerCase()) &&
      (filterHostId === "" || host.id.toLowerCase().includes(filterHostId.trim().toLowerCase()))
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
          hostFixMethods={hostFixMethods}
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
        />
      </div>
    </div>
  )
}
