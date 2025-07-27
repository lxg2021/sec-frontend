"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Users, Settings, Lock, Monitor, Database } from "lucide-react"
import DetailsCard from "@/components/secline/DetailsCard"
import HostList from "@/components/secline/HostList"

// 分类映射
const categoryMap = {
  account: "账号策略",
  system: "系统设置",
  permission: "权限控制",
  service: "服务配置",
  network: "网络安全",
  database: "数据库安全",
}

// 分类图标映射
const categoryIconMap = {
  account: Users,
  system: Settings,
  permission: Lock,
  service: Monitor,
  network: Shield,
  database: Database,
}

// 模拟主机数据
const mockHostData = [
  {
    id: "HOST-001",
    user: "张三",
    email: "zhangsan@company.com",
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
    email: "lisi@company.com",
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
    email: "wangwu@company.com",
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
    email: "zhaoliu@company.com",
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
    email: "qianqi@company.com",
    phone: "135****7890",
    department: "运维部",
    os: "Red Hat 8.5",
    lastOnline: "2025-01-25 12:55:47",
    checkResult: "不合规",
    status: "failed",
  },
]

export default function BaselineDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [selectedHosts, setSelectedHosts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUser, setFilterUser] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterOS, setFilterOS] = useState("")
  const [filterHostId, setFilterHostId] = useState("")
  const [selectedFixMethod, setSelectedFixMethod] = useState("自动修复")
  const [batchFixMethod, setBatchFixMethod] = useState("自动修复")
  const [hostFixMethods, setHostFixMethods] = useState({})

  // 从URL参数获取分类和项目信息
  const categoryId = searchParams.get("category") || "account"
  const itemName = searchParams.get("item") || "密码复杂度策略"
  const categoryName = categoryMap[categoryId] || "账号策略"
  const CategoryIcon = categoryIconMap[categoryId] || Users

  // 获取唯一的筛选选项
  const uniqueUsers = [...new Set(mockHostData.map((host) => host.user))]
  const uniqueDepartments = [...new Set(mockHostData.map((host) => host.department))]
  const uniqueOS = [...new Set(mockHostData.map((host) => host.os))]

  // 筛选数据（统一小写比较）
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

  // 计算不合规主机数量和合规率
  const nonCompliantCount = filteredData.filter((h) => h.status === "failed").length
  const totalCount = filteredData.length
  const complianceRate = totalCount > 0 ? Math.round(((totalCount - nonCompliantCount) / totalCount) * 100) : 0

  // 处理全选
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedHosts(filteredData.map((host) => host.id))
    } else {
      setSelectedHosts([])
    }
  }

  // 处理单个选择，避免重复添加
  const handleSelectHost = (hostId, checked) => {
    if (checked && !selectedHosts.includes(hostId)) {
      setSelectedHosts([...selectedHosts, hostId])
    } else if (!checked) {
      setSelectedHosts(selectedHosts.filter((id) => id !== hostId))
    }
  }

  // 清空筛选
  const clearFilters = () => {
    setSearchTerm("")
    setFilterUser("")
    setFilterDepartment("")
    setFilterOS("")
    setFilterHostId("")
  }

  // 选择修复方式
  const handleFixMethodSelect = (method) => {
    setSelectedFixMethod(method)
    if (process.env.NODE_ENV !== "production") {
      console.log("选择修复方式:", method)
    }
  }

  // 批量修复方式
  const handleBatchFixMethodSelect = (method) => {
    setBatchFixMethod(method)
    if (process.env.NODE_ENV !== "production") {
      console.log("批量修复方式:", method, "选中主机:", selectedHosts)
    }
  }

  // 单个主机修复方式
  const handleHostFixMethodSelect = (hostId, method) => {
    setHostFixMethods((prev) => ({
      ...prev,
      [hostId]: method,
    }))
    if (process.env.NODE_ENV !== "production") {
      console.log("主机修复方式:", hostId, method)
    }
  }

  // 获取单个主机的修复方式
  const getHostFixMethod = (hostId) => {
    return hostFixMethods[hostId] || "自动修复"
  }

  // 用useCallback避免多次重新创建函数（可选）
  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">基线检查详情</h1>
                <p className="text-sm text-gray-500 mt-1">Security Baseline Check Details</p>
              </div>
            </div>
          </div>
        </div>

        <DetailsCard
          itemName={itemName}
          categoryName={categoryName}
          CategoryIcon={CategoryIcon}
          nonCompliantCount={nonCompliantCount}
          totalCount={totalCount}
          complianceRate={complianceRate}
          selectedFixMethod={selectedFixMethod}
          handleFixMethodSelect={handleFixMethodSelect}
        />

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
