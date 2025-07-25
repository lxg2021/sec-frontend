"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Wrench,
  ExternalLink,
  Users,
  Building,
  Monitor,
  Hash,
  RefreshCw,
  FileText,
  Lightbulb,
  BookOpen,
  Video,
  Settings,
  Lock,
  Database,
  TrendingUp,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

  // 筛选数据
  const filteredData = mockHostData.filter((host) => {
    return (
      (searchTerm === "" ||
        host.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        host.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        host.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterUser === "" || host.user === filterUser) &&
      (filterDepartment === "" || host.department === filterDepartment) &&
      (filterOS === "" || host.os === filterOS) &&
      (filterHostId === "" || host.id.toLowerCase().includes(filterHostId.toLowerCase()))
    )
  })

  // 计算不合规主机数量
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

  // 处理单个选择
  const handleSelectHost = (hostId, checked) => {
    if (checked) {
      setSelectedHosts([...selectedHosts, hostId])
    } else {
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

  const handleFixMethodSelect = (method) => {
    setSelectedFixMethod(method)
    console.log("选择修复方式:", method)
    // 这里可以添加具体的修复逻辑
  }

  const handleBatchFixMethodSelect = (method) => {
    setBatchFixMethod(method)
    console.log("批量修复方式:", method, "选中主机:", selectedHosts)
    // 这里实现批量修复逻辑
  }

  const handleHostFixMethodSelect = (hostId, method) => {
    setHostFixMethods((prev) => ({
      ...prev,
      [hostId]: method,
    }))
    console.log("主机修复方式:", hostId, method)
    // 这里实现单个主机修复逻辑
  }

  const getHostFixMethod = (hostId) => {
    return hostFixMethods[hostId] || "自动修复"
  }

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
              onClick={() => window.history.back()}
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

        {/* 详情信息卡片 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="space-y-8">
            {/* 基本信息卡片 - 重新设计 */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
              {/* 头部区域 */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <CategoryIcon className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{itemName}</h3>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1.5 font-semibold">
                          {categoryName}
                        </Badge>
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1.5 font-semibold">
                          中风险
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* 快速操作按钮 */}
                  <div className="flex items-center space-x-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6">
                          <Wrench className="h-4 w-4 mr-2" />
                          {selectedFixMethod}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleFixMethodSelect("提醒用户")}
                          className="flex items-center space-x-2"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span>提醒用户</span>
                          {selectedFixMethod === "提醒用户" && <CheckCircle className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFixMethodSelect("隔离文件")}
                          className="flex items-center space-x-2"
                        >
                          <Shield className="h-4 w-4" />
                          <span>隔离文件</span>
                          {selectedFixMethod === "隔离文件" && <CheckCircle className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFixMethodSelect("阻断网络")}
                          className="flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>阻断网络</span>
                          {selectedFixMethod === "阻断网络" && <CheckCircle className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFixMethodSelect("自动修复")}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>自动修复</span>
                          {selectedFixMethod === "自动修复" && <CheckCircle className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFixMethodSelect("阻断进程")}
                          className="flex items-center space-x-2"
                        >
                          <Monitor className="h-4 w-4" />
                          <span>阻断进程</span>
                          {selectedFixMethod === "阻断进程" && <CheckCircle className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* 统计信息区域 */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 影响范围 */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg">
                        <Monitor className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline space-x-2 mb-2">
                          <span className="text-3xl font-bold text-red-600">{nonCompliantCount}</span>
                          <span className="text-xl text-gray-400">/</span>
                          <span className="text-xl font-semibold text-gray-700">{totalCount}</span>
                          <span className="text-sm text-gray-500 ml-1">台主机</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <p className="text-sm font-medium text-gray-700">影响范围</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 合规率 */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-3xl font-bold text-gray-900">{complianceRate}%</span>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                              <div
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full shadow-sm transition-all duration-1000 relative overflow-hidden"
                                style={{ width: `${complianceRate}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-sm font-medium text-gray-700">合规率</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 检查分类 */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg">
                        <CategoryIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3">
                          <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200 px-4 py-2 text-sm font-bold shadow-sm">
                            {categoryName}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <p className="text-sm font-medium text-gray-700">检查分类</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 底部信息条 */}
                <div className="mt-6 pt-6 border-t border-white/30">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-6 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">检查完成:</span>
                        <span>2025-01-25 16:30</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">风险等级:</span>
                        <span className="text-orange-600 font-semibold">中风险</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-red-500" />
                        <span className="font-medium">影响主机:</span>
                        <span className="text-red-600 font-semibold">
                          {nonCompliantCount}/{totalCount}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-white/50 px-3 py-1 rounded-full">最后更新: 刚刚</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细描述区域 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">详细描述</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed text-base">
                    要求设置密码必须包含大写、小写、数字、符号，当前策略未启用该要求，存在口令被猜测风险。
                    密码复杂度是保障系统安全的重要基础措施，弱密码容易被暴力破解或字典攻击。
                  </p>
                  <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-800 font-medium">安全风险</p>
                        <p className="text-yellow-700 text-sm mt-1">
                          未启用密码复杂度策略可能导致账户被恶意攻击者轻易破解，进而获取系统访问权限。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 修复建议区域 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">修复建议</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed text-base">
                      建议开启密码复杂度策略，至少包含三种字符类别，并设置合理的密码长度要求。
                    </p>
                  </div>

                  {/* 具体步骤 */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      具体修复步骤
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-green-800 text-sm">
                      <li>登录系统管理控制台</li>
                      <li>导航至"安全策略" → "密码策略"</li>
                      <li>启用"密码复杂度要求"选项</li>
                      <li>设置最小密码长度为8位</li>
                      <li>要求包含大写、小写、数字、特殊字符中至少3种</li>
                      <li>保存配置并重启相关服务</li>
                    </ol>
                  </div>

                  {/* 相关链接 */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href="#"
                      className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md group"
                    >
                      <ExternalLink className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                      <span className="font-medium">查看详细配置指南</span>
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 hover:shadow-md group"
                    >
                      <BookOpen className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">密码策略最佳实践</span>
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 hover:shadow-md group"
                    >
                      <Video className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">视频教程</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主机列表 */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-900">影响主机列表</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  共 {filteredData.length} 台主机
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {filteredData.filter((h) => h.status === "failed").length} 台不合规
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 筛选和搜索 */}
            <div className="space-y-4 mb-6">
              {/* 搜索框 */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索主机ID、使用者或邮箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  清空筛选
                </Button>
              </div>

              {/* 筛选器 */}
              <div className="grid grid-cols-4 gap-4">
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="筛选使用者" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部使用者</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="筛选部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部部门</SelectItem>
                    {uniqueDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterOS} onValueChange={setFilterOS}>
                  <SelectTrigger>
                    <SelectValue placeholder="筛选操作系统" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部系统</SelectItem>
                    {uniqueOS.map((os) => (
                      <SelectItem key={os} value={os}>
                        {os}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="筛选主机ID"
                  value={filterHostId}
                  onChange={(e) => setFilterHostId(e.target.value)}
                />
              </div>
            </div>

            {/* 批量操作 */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedHosts.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-700">已选择 {selectedHosts.length} 台主机</span>
              </div>
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedHosts.length === 0}
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 disabled:opacity-50"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      {batchFixMethod}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleBatchFixMethodSelect("提醒用户")}
                      className="flex items-center space-x-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>提醒用户</span>
                      {batchFixMethod === "提醒用户" && <CheckCircle className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBatchFixMethodSelect("隔离文件")}
                      className="flex items-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span>隔离文件</span>
                      {batchFixMethod === "隔离文件" && <CheckCircle className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBatchFixMethodSelect("阻断网络")}
                      className="flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>阻断网络</span>
                      {batchFixMethod === "阻断网络" && <CheckCircle className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBatchFixMethodSelect("自动修复")}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>自动修复</span>
                      {batchFixMethod === "自动修复" && <CheckCircle className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBatchFixMethodSelect("阻断进程")}
                      className="flex items-center space-x-2"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>阻断进程</span>
                      {batchFixMethod === "阻断进程" && <CheckCircle className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* 主机表格 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <Checkbox
                        checked={selectedHosts.length === filteredData.length && filteredData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span>主机ID</span>
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>使用者</span>
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      电话
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center space-x-1">
                        <Building className="h-3 w-3" />
                        <span>所属部门</span>
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <div className="flex items-center space-x-1">
                        <Monitor className="h-3 w-3" />
                        <span>操作系统</span>
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      最近上线时间
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      检查结果
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((host) => (
                    <tr key={host.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedHosts.includes(host.id)}
                          onCheckedChange={(checked) => handleSelectHost(host.id, checked)}
                        />
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{host.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{host.user}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{host.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{host.phone}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{host.department}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{host.os}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{host.lastOnline}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            host.status === "passed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {host.status === "passed" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {host.checkResult}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                              {getHostFixMethod(host.id)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleHostFixMethodSelect(host.id, "提醒用户")}
                              className="flex items-center space-x-2"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              <span>提醒用户</span>
                              {getHostFixMethod(host.id) === "提醒用户" && <CheckCircle className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleHostFixMethodSelect(host.id, "隔离文件")}
                              className="flex items-center space-x-2"
                            >
                              <Shield className="h-4 w-4" />
                              <span>隔离文件</span>
                              {getHostFixMethod(host.id) === "隔离文件" && <CheckCircle className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleHostFixMethodSelect(host.id, "阻断网络")}
                              className="flex items-center space-x-2"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>阻断网络</span>
                              {getHostFixMethod(host.id) === "阻断网络" && <CheckCircle className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleHostFixMethodSelect(host.id, "自动修复")}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>自动修复</span>
                              {getHostFixMethod(host.id) === "自动修复" && <CheckCircle className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleHostFixMethodSelect(host.id, "阻断进程")}
                              className="flex items-center space-x-2"
                            >
                              <Monitor className="h-4 w-4" />
                              <span>阻断进程</span>
                              {getHostFixMethod(host.id) === "阻断进程" && <CheckCircle className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 空状态 */}
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的主机</h3>
                <p className="text-gray-500">请尝试调整筛选条件或搜索关键词</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
