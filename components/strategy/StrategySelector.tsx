"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, X, ChevronUp, ChevronDown, RotateCcw, Server, Sparkles, Trash2 } from "lucide-react"

interface Strategy {
  id: string
  name: string
  type: "基线" | "补丁" | "回溯"
  level: "高" | "中" | "低"
  description: string
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  status: "启用" | "禁用" | "草稿"
  version: number
  content: string
}

interface StrategySelectorProps {
  data: Strategy[]
  onSelectionChange?: (selectedStrategies: Strategy[]) => void
  multiSelect?: boolean
}

type SortField = "name" | "createdAt" | "level"
type SortOrder = "asc" | "desc"

export default function StrategySelector({ data, onSelectionChange, multiSelect = true }: StrategySelectorProps) {
  // 动态获取筛选选项
  const availableTypes = useMemo(() => {
    const types = [...new Set(data.map((item) => item.type))]
    return types.sort()
  }, [data])

  const availableLevels = useMemo(() => {
    const levels = [...new Set(data.map((item) => item.level))]
    return levels.sort((a, b) => {
      const levelOrder = { 高: 3, 中: 2, 低: 1 }
      return levelOrder[b as keyof typeof levelOrder] - levelOrder[a as keyof typeof levelOrder]
    })
  }, [data])

  const availableStatuses = useMemo(() => {
    const statuses = [...new Set(data.map((item) => item.status))]
    return statuses.sort()
  }, [data])

  // 筛选状态
  const [nameFilter, setNameFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // 排序状态
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // 选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 筛选和排序逻辑
  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter((strategy) => {
      const matchesName = strategy.name.toLowerCase().includes(nameFilter.toLowerCase())
      const matchesType = typeFilter === "all" || strategy.type === typeFilter
      const matchesLevel = levelFilter === "all" || strategy.level === levelFilter
      const matchesStatus = statusFilter === "all" || strategy.status === statusFilter

      return matchesName && matchesType && matchesLevel && matchesStatus
    })

    // 排序
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "createdAt") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (sortField === "level") {
        const levelOrder = { 高: 3, 中: 2, 低: 1 }
        aValue = levelOrder[aValue as keyof typeof levelOrder]
        bValue = levelOrder[bValue as keyof typeof levelOrder]
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [data, nameFilter, typeFilter, levelFilter, statusFilter, sortField, sortOrder])

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  // 已选择的策略
  const selectedStrategies = useMemo(() => {
    return data.filter((strategy) => selectedIds.has(strategy.id))
  }, [data, selectedIds])

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // 处理选择
  const handleSelect = (strategyId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (checked) {
      newSelectedIds.add(strategyId)
    } else {
      newSelectedIds.delete(strategyId)
    }
    setSelectedIds(newSelectedIds)

    if (onSelectionChange) {
      const newSelectedStrategies = data.filter((s) => newSelectedIds.has(s.id))
      onSelectionChange(newSelectedStrategies)
    }
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map((s) => s.id))
      setSelectedIds((prev) => new Set([...prev, ...allIds]))
    } else {
      const currentPageIds = new Set(paginatedData.map((s) => s.id))
      setSelectedIds((prev) => new Set([...prev].filter((id) => !currentPageIds.has(id))))
    }
  }

  // 清空筛选器
  const clearFilters = () => {
    setNameFilter("")
    setTypeFilter("all")
    setLevelFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  // 移除已选策略
  const removeSelected = (strategyId: string) => {
    handleSelect(strategyId, false)
  }

  // 获取优先级颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case "高":
        return "destructive"
      case "中":
        return "default"
      case "低":
        return "secondary"
      default:
        return "default"
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "启用":
        return "default"
      case "禁用":
        return "secondary"
      case "草稿":
        return "outline"
      default:
        return "default"
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50/80 to-blue-50/50 backdrop-blur-sm">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/90 to-blue-50/70 rounded-t-lg border-b border-slate-200/60">
        <CardTitle className="flex items-center gap-3 text-slate-700">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <Server className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
            策略选择
          </span>
          <Sparkles className="h-4 w-4 text-blue-400 opacity-60" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        {/* 筛选区域 */}
        <div className="px-2 lg:px-4 xl:px-6">
          <h3 className="text-lg font-medium mb-4 text-slate-700">筛选条件</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-600">策略名称</label>
              <Input
                placeholder="输入策略名称..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="border-slate-200 focus:border-blue-300 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-600">策略类型</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-slate-200 focus:border-blue-300 focus:ring-blue-100">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-600">优先等级</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="border-slate-200 focus:border-blue-300 focus:ring-blue-100">
                  <SelectValue placeholder="选择等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-600">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-200 focus:border-blue-300 focus:ring-blue-100">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="default"
                className="h-11 px-4 border-slate-200/60 bg-white/80 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-700 transition-all duration-200 shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                清空
              </Button>
            </div>
          </div>
        </div>

        {/* 已选策略标签 */}
        {multiSelect && selectedStrategies.length > 0 && (
          <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-lg font-medium mb-4 text-slate-700">已选策略 ({selectedStrategies.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedStrategies.map((strategy) => (
                <Badge
                  key={strategy.id}
                  variant="secondary"
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                >
                  {strategy.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-blue-200 text-blue-600"
                    onClick={() => removeSelected(strategy.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 策略表格 */}
        <div className="bg-slate-50/30 rounded-lg p-4 border border-slate-100">
          <h3 className="text-lg font-medium mb-4 text-slate-700">策略列表 ({filteredAndSortedData.length} 条记录)</h3>
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/70">
                  {multiSelect && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={paginatedData.length > 0 && paginatedData.every((s) => selectedIds.has(s.id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                      策略名称
                      <SortIcon field="name" />
                    </Button>
                  </TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("level")} className="h-auto p-0 font-semibold">
                      优先级
                      <SortIcon field="level" />
                    </Button>
                  </TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                      className="h-auto p-0 font-semibold"
                    >
                      创建时间
                      <SortIcon field="createdAt" />
                    </Button>
                  </TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((strategy) => (
                  <TableRow key={strategy.id} className="hover:bg-slate-50/50 transition-colors">
                    {multiSelect && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(strategy.id)}
                          onCheckedChange={(checked) => handleSelect(strategy.id, !!checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{strategy.name}</TableCell>
                    <TableCell>{strategy.type}</TableCell>
                    <TableCell>
                      <Badge variant={getLevelColor(strategy.level)}>{strategy.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(strategy.status)}>{strategy.status}</Badge>
                    </TableCell>
                    <TableCell>{strategy.createdBy}</TableCell>
                    <TableCell>{new Date(strategy.createdAt).toLocaleDateString("zh-CN")}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        预览
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <div className="text-sm text-slate-500">
                显示 {(currentPage - 1) * pageSize + 1} 到{" "}
                {Math.min(currentPage * pageSize, filteredAndSortedData.length)} 条， 共 {filteredAndSortedData.length}{" "}
                条记录
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  上一页
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 p-0 ${currentPage === page
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
