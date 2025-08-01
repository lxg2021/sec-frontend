"use client"

import React, { useState, useMemo, useRef } from "react"
import { Search, X, ReplaceAllIcon as SelectAll, Trash2, Server, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VirtualizedTree } from "@/components/hosts/VirtualizedTree"
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
  const prevSelectedIdsRef = useRef(new Set())

  // 更新回调函数引用
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  // 搜索过滤 - 修复搜索逻辑
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data

    const searchLower = searchTerm.toLowerCase().trim()
    const matchingIds = new Set()

    // 递归搜索匹配的节点
    const searchNodes = (nodes) => {
      nodes.forEach((node) => {
        const matches =
          node.name?.toLowerCase().includes(searchLower) ||
          node.hostname?.toLowerCase().includes(searchLower) ||
          node.hostId?.toLowerCase().includes(searchLower) ||
          node.ip?.toLowerCase().includes(searchLower) ||
          node.mac?.toLowerCase().includes(searchLower) ||
          node.os?.toLowerCase().includes(searchLower)

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

    const result = filterNodes(data)
    console.log("搜索词:", searchTerm, "匹配的节点数:", matchingIds.size, "过滤后的数据:", result)
    return result
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

  // 搜索时自动展开匹配项 - 优化展开逻辑
  React.useEffect(() => {
    if (searchTerm.trim()) {
      const matchingIds = new Set()
      const searchLower = searchTerm.toLowerCase().trim()

      const findMatches = (nodes) => {
        nodes.forEach((node) => {
          const matches =
            node.name?.toLowerCase().includes(searchLower) ||
            node.hostname?.toLowerCase().includes(searchLower) ||
            node.hostId?.toLowerCase().includes(searchLower) ||
            node.ip?.toLowerCase().includes(searchLower) ||
            node.mac?.toLowerCase().includes(searchLower) ||
            node.os?.toLowerCase().includes(searchLower)

          if (matches) {
            matchingIds.add(node.id)
          }

          if (node.children) {
            findMatches(node.children)
          }
        })
      }

      findMatches(data) // 使用原始数据进行匹配
      console.log("搜索匹配的节点:", Array.from(matchingIds))

      // 展开匹配节点的路径
      if (matchingIds.size > 0) {
        expandMatchingPaths(matchingIds)
      }
    }
  }, [searchTerm, data, expandMatchingPaths])

  // 当选择状态变化时，通知父组件 - 使用防抖避免频繁调用
  React.useEffect(() => {
    // 检查选择状态是否真的发生了变化
    const prevSelectedIds = prevSelectedIdsRef.current
    const hasChanged =
      selectedIds.size !== prevSelectedIds.size || Array.from(selectedIds).some((id) => !prevSelectedIds.has(id))

    if (hasChanged && onSelectionChangeRef.current) {
      const selectedNodes = Array.from(selectedIds)
        .map((id) => findNodeById(data, id))
        .filter(Boolean)

      // 使用 setTimeout 避免在渲染过程中调用 setState
      setTimeout(() => {
        onSelectionChangeRef.current(selectedNodes, selectedIds)
      }, 0)

      // 更新上一次的选择状态
      prevSelectedIdsRef.current = new Set(selectedIds)
    }
  }, [selectedIds, data])

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

  // 清空搜索
  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="w-full">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50/80 to-blue-50/50 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/90 to-blue-50/70 rounded-t-lg border-b border-slate-200/60">
          <CardTitle className="flex items-center gap-3 text-slate-700">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Server className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
              主机选择
            </span>
            <Sparkles className="h-4 w-4 text-blue-400 opacity-60" />
          </CardTitle>

          {/* 工具栏 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
              <Input
                placeholder="搜索主机名称、IP地址、主机ID、MAC地址、操作系统..."
                value={searchTerm}
                onChange={(e) => {
                  console.log("搜索输入变化:", e.target.value)
                  setSearchTerm(e.target.value)
                }}
                className="pl-10 pr-10 h-11 border-slate-200/60 bg-white/80 backdrop-blur-sm focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-lg shadow-sm w-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-2 h-7 w-7 p-0 hover:bg-slate-100 rounded-full z-10"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="h-11 px-4 border-slate-200/60 bg-white/80 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-700 transition-all duration-200 shadow-sm whitespace-nowrap"
              >
                <SelectAll className="h-4 w-4 mr-2" />
                全选
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="h-11 px-4 border-slate-200/60 bg-white/80 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-700 transition-all duration-200 shadow-sm whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                清空
              </Button>
            </div>
          </div>

          {/* 搜索结果提示 */}
          {searchTerm && (
            <div className="pt-2">
              <div className="text-sm text-slate-600 bg-blue-50/80 px-3 py-2 rounded-lg border border-blue-200/60 flex items-center justify-between flex-wrap gap-2">
                <span>
                  搜索 "{searchTerm}" 找到 {flatNodes.length} 个结果
                </span>
                <Button variant="ghost" size="sm" onClick={clearSearch} className="h-6 px-2 text-xs flex-shrink-0">
                  清除搜索
                </Button>
              </div>
            </div>
          )}

          {/* 选中状态 */}
          {selectionStats.total > 0 && (
            <div className="flex items-center gap-3 pt-4 flex-wrap">
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md px-3 py-1.5 text-sm font-medium flex-shrink-0">
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
                className="h-8 w-8 p-0 hover:bg-rose-100 hover:text-rose-600 transition-colors duration-200 rounded-full flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>

        <Separator className="bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <CardContent className="p-0 bg-white/60 backdrop-blur-sm">
          <div className="border-t border-slate-100/80 w-full">
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
