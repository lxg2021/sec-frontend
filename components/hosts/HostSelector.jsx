"use client"

import React, { useState, useMemo, useRef } from "react"
import { Search, X, ReplaceAllIcon as SelectAll, Trash2, Server, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VirtualizedTree } from "./VirtualizedTree"
import { useTreeData } from "@/hooks/useTreeData"

// 辅助函数：根据ID查找节点
function findNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export default function HostSelector({ data, onSelectionChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const onSelectionChangeRef = useRef(onSelectionChange)

  // 更新回调函数引用
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  // 搜索过滤
  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    const searchLower = searchTerm.toLowerCase()
    const matchingIds = new Set()

    // 递归搜索匹配的节点
    const searchNodes = (nodes) => {
      nodes.forEach((node) => {
        const matches =
          node.name.toLowerCase().includes(searchLower) ||
          node.hostname?.toLowerCase().includes(searchLower) ||
          node.hostId?.toLowerCase().includes(searchLower) ||
          node.ip?.includes(searchTerm) ||
          node.mac?.toLowerCase().includes(searchLower)

        if (matches) {
          matchingIds.add(node.id)
          // 添加所有父节点路径
          let current = node
          while (current.parentId) {
            matchingIds.add(current.parentId)
            current = findNodeById(data, current.parentId) || current
          }
        }

        if (node.children) {
          searchNodes(node.children)
        }
      })
    }

    searchNodes(data)

    // 过滤数据保持层级结构
    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const shouldInclude = matchingIds.has(node.id)
        const filteredChildren = node.children ? filterNodes(node.children) : undefined

        if (shouldInclude || (filteredChildren && filteredChildren.length > 0)) {
          acc.push({
            ...node,
            children: filteredChildren,
          })
        }

        return acc
      }, [])
    }

    return filterNodes(data)
  }, [searchTerm, data])

  const {
    flatNodes,
    selectedIds,
    toggleExpanded,
    toggleSelected,
    selectAll,
    clearSelection,
    expandMatchingPaths,
    getNodeSelectionState,
  } = useTreeData(filteredData)

  // 搜索时自动展开匹配项
  React.useEffect(() => {
    if (searchTerm) {
      const matchingIds = new Set()
      const searchLower = searchTerm.toLowerCase()

      const findMatches = (nodes) => {
        nodes.forEach((node) => {
          const matches =
            node.name.toLowerCase().includes(searchLower) ||
            node.hostname?.toLowerCase().includes(searchLower) ||
            node.hostId?.toLowerCase().includes(searchLower) ||
            node.ip?.includes(searchTerm)

          if (matches) {
            matchingIds.add(node.id)
          }

          if (node.children) {
            findMatches(node.children)
          }
        })
      }

      findMatches(filteredData)
      expandMatchingPaths(matchingIds)
    }
  }, [searchTerm, filteredData, expandMatchingPaths])

  // 当选择状态变化时，通知父组件 - 使用 ref 避免依赖循环
  React.useEffect(() => {
    if (onSelectionChangeRef.current) {
      const selectedNodes = Array.from(selectedIds)
        .map((id) => findNodeById(data, id))
        .filter(Boolean)
      onSelectionChangeRef.current(selectedNodes, selectedIds)
    }
  }, [selectedIds, data]) // 移除 onSelectionChange 依赖

  // 获取选中的节点统计
  const selectionStats = useMemo(() => {
    const selectedArray = Array.from(selectedIds)
    const hostCount = selectedArray.filter((id) => {
      const node = findNodeById(data, id)
      return node?.type === "host"
    }).length

    const groupCount = selectedArray.filter((id) => {
      const node = findNodeById(data, id)
      return node?.type === "group"
    }).length

    const deptCount = selectedArray.filter((id) => {
      const node = findNodeById(data, id)
      return node?.type === "department"
    }).length

    const companyCount = selectedArray.filter((id) => {
      const node = findNodeById(data, id)
      return node?.type === "company"
    }).length

    return {
      hostCount,
      groupCount,
      deptCount,
      companyCount,
      total: selectedArray.length,
    }
  }, [selectedIds, data])

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50/80 to-blue-50/50 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/90 to-blue-50/70 rounded-t-lg border-b border-slate-200/60">
          <CardTitle className="flex items-center gap-3 text-slate-700">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Server className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
              主机选择器
            </span>
            <Sparkles className="h-4 w-4 text-blue-400 opacity-60" />
          </CardTitle>

          {/* 工具栏 */}
          <div className="flex items-center gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索主机名称、IP地址、主机ID、MAC地址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-slate-200/60 bg-white/80 backdrop-blur-sm focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-lg shadow-sm"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="h-11 px-4 border-slate-200/60 bg-white/80 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-700 transition-all duration-200 shadow-sm"
            >
              <SelectAll className="h-4 w-4 mr-2" />
              全选
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="h-11 px-4 border-slate-200/60 bg-white/80 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-rose-700 transition-all duration-200 shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空
            </Button>
          </div>

          {/* 选中状态 */}
          {selectionStats.total > 0 && (
            <div className="flex items-center gap-3 pt-4 flex-wrap">
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md px-3 py-1.5 text-sm font-medium">
                已选择 {selectionStats.total} 项
                {selectionStats.hostCount > 0 && ` (${selectionStats.hostCount} 台主机)`}
                {selectionStats.groupCount > 0 && ` (${selectionStats.groupCount} 个组)`}
                {selectionStats.deptCount > 0 && ` (${selectionStats.deptCount} 个部门)`}
                {selectionStats.companyCount > 0 && ` (${selectionStats.companyCount} 个公司)`}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-8 w-8 p-0 hover:bg-rose-100 hover:text-rose-600 transition-colors duration-200 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>

        <Separator className="bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <CardContent className="p-0 bg-white/60 backdrop-blur-sm">
          <div className="border-t border-slate-100/80">
            <VirtualizedTree
              nodes={flatNodes}
              selectedIds={selectedIds}
              onToggleExpanded={toggleExpanded}
              onToggleSelected={toggleSelected}
              getNodeSelectionState={getNodeSelectionState}
              height={500}
              itemHeight={48}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
