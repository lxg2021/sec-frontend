import React, { memo, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  Server, 
  ShieldAlert, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HostRiskLevel, SystemType, PatchSeverity } from '@/types/patch'
import { HostRiskInfo } from '@/types/patch-dashboard'

// 类型定义
interface TopQueryDetailsProps {
  host: HostRiskInfo
  onClose?: () => void
}

// 常量配置
const RISK_LEVEL_CONFIG: Record<HostRiskLevel, { 
  label: string; 
  color: 'bg-red-500' | 'bg-orange-500' | 'bg-yellow-500' | 'bg-green-500' 
}> = {
  HIGH: { label: '高危', color: 'bg-red-500' },
  MEDIUM: { label: '中危', color: 'bg-orange-500' },
  LOW: { label: '低危', color: 'bg-yellow-500' },
  SAFE: { label: '安全', color: 'bg-green-500' }
} as const

const SEVERITY_CONFIG: Record<PatchSeverity, {
  label: string
  color: string
  icon: React.ReactNode
}> = {
  Critical: {
    label: '严重',
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    icon: <ShieldAlert className="h-3 w-3 mr-1" />
  },
  Important: {
    label: '重要',
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    icon: <AlertTriangle className="h-3 w-3 mr-1" />
  },
  Moderate: {
    label: '中等',
    color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    icon: <Clock className="h-3 w-3 mr-1" />
  },
  Low: {
    label: '低等',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    icon: <CheckCircle2 className="h-3 w-3 mr-1" />
  }
} as const

// 工具函数
const getRiskLevelConfig = (riskLevel: HostRiskLevel) => {
  return RISK_LEVEL_CONFIG[riskLevel] ?? {
    label: '未知',
    color: 'bg-gray-500'
  }
}

const getSeverityConfig = (severity: PatchSeverity) => {
  return SEVERITY_CONFIG[severity] ?? {
    label: '未知',
    color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    icon: <AlertTriangle className="h-3 w-3 mr-1" />
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  try {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '日期格式错误'
  }
}

// 主组件
const TopQueryDetails: React.FC<TopQueryDetailsProps> = memo(({ host, onClose }) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<"overview" | "patches" | "details">("overview")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeverities, setSelectedSeverities] = useState<PatchSeverity[]>([
    "Critical", "Important", "Moderate", "Low"
  ])
  const [selectedPatches, setSelectedPatches] = useState<string[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // 计算数据
  const criticalPatches = useMemo(() => 
    host.uninstalledPatches.filter(p => p.severity === "Critical"),
    [host.uninstalledPatches]
  )

  const filteredPatches = useMemo(() => {
    return host.uninstalledPatches
      .filter(patch => selectedSeverities.includes(patch.severity))
      .filter(patch => 
        patch.patchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patch.patchName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const severityOrder: Record<PatchSeverity, number> = { 
          Critical: 0, Important: 1, Moderate: 2, Low: 3 
        }
        return sortOrder === "desc" 
          ? severityOrder[a.severity] - severityOrder[b.severity]
          : severityOrder[b.severity] - severityOrder[a.severity]
      })
  }, [host.uninstalledPatches, selectedSeverities, searchTerm, sortOrder])

  // 事件处理
  const handlePatchSelect = (patchId: string) => {
    setSelectedPatches(prev => 
      prev.includes(patchId) 
        ? prev.filter(id => id !== patchId)
        : [...prev, patchId]
    )
  }

  const handleSelectAll = () => {
    setSelectedPatches(prev => 
      prev.length === filteredPatches.length
        ? []
        : filteredPatches.map(p => p.patchId)
    )
  }

  const handleSeverityToggle = (severity: PatchSeverity) => {
    setSelectedSeverities(prev => 
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    )
  }

  const handleInstallPatches = () => {
    console.log('安装补丁:', selectedPatches)
    // 实际安装逻辑实现
  }

  // 渲染函数
  const renderPatchRow = (patch: HostRiskInfo['uninstalledPatches'][number]) => {
    const config = getSeverityConfig(patch.severity)
    return (
      <tr key={patch.patchId} className="border-b hover:bg-gray-50 transition-colors">
        <td className="p-2">
          <input 
            type="checkbox" 
            className="rounded"
            checked={selectedPatches.includes(patch.patchId)}
            onChange={() => handlePatchSelect(patch.patchId)}
          />
        </td>
        <td className="p-2">
          <span className="text-xs font-mono text-blue-600">KB{patch.patchId}</span>
        </td>
        <td className="p-2">
          <div className="text-xs truncate max-w-xs" title={patch.patchName}>
            {patch.patchName}
          </div>
        </td>
        <td className="p-2">
          <Badge className={`text-xs ${config.color}`}>
            {config.icon}
            {config.label}
          </Badge>
        </td>
        <td className="p-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs"
            onClick={() => console.log('安装', patch.patchId)}
          >
            安装
          </Button>
        </td>
      </tr>
    )
  }

  // 空状态组件
  const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <Search className="h-8 w-8 mb-2 opacity-50" />
      <p className="font-medium">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  )

  // 主渲染
  if (!host) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Server className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {host.hostName}
                <Badge className={`${getRiskLevelConfig(host.riskLevel).color} text-white text-xs`}>
                  {getRiskLevelConfig(host.riskLevel).label}
                </Badge>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {host.department} • {host.group}
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 选项卡 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="patches">补丁列表 ({host.uninstalledPatches.length})</TabsTrigger>
          <TabsTrigger value="details">详细信息</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 风险统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'critical', count: host.criticalCounts, color: 'red', label: '严重' },
              { key: 'important', count: host.importantCounts, color: 'orange', label: '重要' },
              { key: 'moderate', count: host.moderateCounts, color: 'yellow', label: '中等' },
              { key: 'low', count: host.lowCounts, color: 'green', label: '低等' }
            ].map(item => (
              <Card key={item.key} className={`bg-${item.color}-50 border-${item.color}-100`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">{item.label}风险</p>
                    <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                  </div>
                  {item.color === 'red' && <ShieldAlert className="h-8 w-8 text-red-500" />}
                  {item.color === 'orange' && <AlertTriangle className="h-8 w-8 text-orange-500" />}
                  {item.color === 'yellow' && <Clock className="h-8 w-8 text-yellow-500" />}
                  {item.color === 'green' && <CheckCircle2 className="h-8 w-8 text-green-500" />}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 高危预警 */}
          {criticalPatches.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-medium text-red-800">紧急风险预警</h3>
              </div>
              <p className="text-sm text-red-700 mb-3">
                检测到 {criticalPatches.length} 个严重级别补丁未安装，建议立即处理！
              </p>
              <div className="space-y-2">
                {criticalPatches.slice(0, 3).map(patch => (
                  <div key={patch.patchId} className="flex items-center justify-between bg-white/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-800 truncate max-w-xs" title={patch.patchName}>
                        {patch.patchName}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs">KB{patch.patchId}</Badge>
                  </div>
                ))}
                {criticalPatches.length > 3 && (
                  <div className="text-xs text-red-700">
                    +{criticalPatches.length - 3} 个更多严重补丁...
                  </div>
                )}
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="mt-3 w-full"
                onClick={() => {
                  setSelectedPatches(criticalPatches.map(p => p.patchId))
                  setActiveTab('patches')
                }}
              >
                一键处理高危补丁 ({criticalPatches.length})
              </Button>
            </div>
          )}

          {/* 主机信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Server className="h-4 w-4" />
              主机信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24">主机名称:</span>
                <span className="font-medium">{host.hostName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24">操作系统:</span>
                <span className="font-medium">{host.system}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24">所属部门:</span>
                <span className="font-medium">{host.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24">分组:</span>
                <span className="font-medium">{host.group}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 补丁列表标签页 */}
        <TabsContent value="patches">
          {/* 操作工具栏 */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="搜索补丁ID或名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              <Select 
                value={sortOrder} 
                onValueChange={(value: "desc" | "asc") => setSortOrder(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">严重程度 (高→低)</SelectItem>
                  <SelectItem value="asc">严重程度 (低→高)</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 高级筛选 */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4 flex flex-wrap gap-2">
              {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => (
                <Badge 
                  key={severity}
                  className={`
                    cursor-pointer transition-all
                    ${selectedSeverities.includes(severity as PatchSeverity) 
                      ? config.color 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                  `}
                  onClick={() => handleSeverityToggle(severity as PatchSeverity)}
                >
                  {config.icon}
                  {config.label}
                </Badge>
              ))}
            </div>
          )}

          {/* 批量操作 */}
          {selectedPatches.length > 0 && (
            <div className="bg-blue-50 p-2 rounded-lg mb-3 flex items-center justify-between">
              <span className="text-sm text-blue-800">
                已选择 {selectedPatches.length} 个补丁
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-8"
                  onClick={() => setSelectedPatches([])}
                >
                  取消选择
                </Button>
                <Button 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={handleInstallPatches}
                >
                  批量安装
                </Button>
              </div>
            </div>
          )}

          {/* 补丁表格 */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-8 p-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedPatches.length === filteredPatches.length && filteredPatches.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 p-2">补丁ID</th>
                  <th className="text-left text-xs font-medium text-gray-500 p-2">补丁名称</th>
                  <th className="text-left text-xs font-medium text-gray-500 p-2">严重程度</th>
                  <th className="text-left text-xs font-medium text-gray-500 p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatches.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState 
                        title="未找到匹配的补丁" 
                        description="请尝试其他筛选条件"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPatches.map(renderPatchRow)
                )}
              </tbody>
            </table>
          </ScrollArea>

          {/* 分页信息 */}
          <div className="mt-3 text-xs text-gray-500">
            共 {filteredPatches.length} 个补丁，显示 {filteredPatches.length > 0 ? 1 : 0}-{filteredPatches.length} 条
          </div>
        </TabsContent>

        {/* 详细信息标签页 */}
        <TabsContent value="details">
          <div className="space-y-6">
            {/* 主机元数据 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">主机元数据</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24">主机ID:</span>
                  <span className="font-medium font-mono">{host.hostId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24">主机名称:</span>
                  <span className="font-medium">{host.hostName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24">操作系统:</span>
                  <span className="font-medium">{host.system}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24">所属部门:</span>
                  <span className="font-medium">{host.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24">分组:</span>
                  <span className="font-medium">{host.group}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24">风险等级:</span>
                  <Badge className={`${getRiskLevelConfig(host.riskLevel).color} text-white`}>
                    {getRiskLevelConfig(host.riskLevel).label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 补丁统计 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">补丁统计</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries({
                  Critical: host.criticalCounts,
                  Important: host.importantCounts,
                  Moderate: host.moderateCounts,
                  Low: host.lowCounts
                }).map(([severity, count]) => {
                  const config = getSeverityConfig(severity as PatchSeverity)
                  return (
                    <div key={severity} className={`${config.color.split(' ')[0]} p-3 rounded-lg`}>
                      <div className="flex items-center gap-2 mb-1">
                        {config.icon}
                        <span className="text-xs text-gray-700">{config.label}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 补丁详情 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">补丁详情</h3>
              {host.uninstalledPatches.length === 0 ? (
                <EmptyState 
                  title="无未安装补丁" 
                  description="该主机所有补丁均已安装"
                />
              ) : (
                <div className="space-y-4">
                  {host.uninstalledPatches.map((patch) => {
                    const config = getSeverityConfig(patch.severity)
                    return (
                      <div key={patch.patchId} className="bg-white p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <span className="font-medium text-sm">{patch.patchName}</span>
                          </div>
                          <Badge className={`text-xs ${config.color}`}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          补丁ID: <span className="font-mono">KB{patch.patchId}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
})

TopQueryDetails.displayName = 'TopQueryDetails'
export default TopQueryDetails
