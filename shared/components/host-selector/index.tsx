"use client"

import React, { useMemo, useRef, useState } from "react"
import { Search, X, ReplaceAllIcon as SelectAll, Trash2, Server, Sparkles } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Separator } from "@/shared/ui/separator"
import { Skeleton } from "@/shared/ui/skeleton"
import { badgeBaseClass, badgeButtonClass } from "@/shared/styles/badge-class"

import { useTreeData } from "./hooks/use-tree-data"
import { VirtualizedTree } from "./virtualized-tree"

function findNodeById(nodes: any[], id: string): any | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function HostSelectorSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export default function HostSelector({
  data = [],
  onSelectionChange,
  loading = false,
  emptyText = "No host data available.",
  showHeader = true,
}: {
  data?: any[]
  onSelectionChange?: (nodes: any[], selectedIds: Set<string>) => void
  loading?: boolean
  emptyText?: string
  showHeader?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const onSelectionChangeRef = useRef(onSelectionChange)
  const prevSelectedIdsRef = useRef(new Set<string>())

  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data

    const searchLower = searchTerm.toLowerCase().trim()
    const matchingIds = new Set<string>()

    const searchNodes = (nodes: any[]) => {
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

    const filterNodes = (nodes: any[]): any[] => {
      return nodes.reduce((acc, node) => {
        const shouldInclude = matchingIds.has(node.id)
        const filteredChildren = node.children ? filterNodes(node.children) : undefined

        if (shouldInclude || (filteredChildren && filteredChildren.length > 0)) {
          acc.push(
            filteredChildren
              ? {
                  ...node,
                  children: filteredChildren,
                }
              : node,
          )
        }

        return acc
      }, [] as any[])
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

  React.useEffect(() => {
    if (!searchTerm.trim()) return

    const matchingIds = new Set<string>()
    const searchLower = searchTerm.toLowerCase().trim()

    const findMatches = (nodes: any[]) => {
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

    findMatches(data)

    if (matchingIds.size > 0) {
      expandMatchingPaths(matchingIds)
    }
  }, [searchTerm, data, expandMatchingPaths])

  React.useEffect(() => {
    const prevSelectedIds = prevSelectedIdsRef.current
    const hasChanged =
      selectedIds.size !== prevSelectedIds.size || Array.from(selectedIds).some((id) => !prevSelectedIds.has(id))

    if (hasChanged && onSelectionChangeRef.current) {
      const selectedNodes = Array.from(selectedIds)
        .map((id) => findNodeById(data, id))
        .filter(Boolean)

      setTimeout(() => {
        onSelectionChangeRef.current?.(selectedNodes, selectedIds)
      }, 0)

      prevSelectedIdsRef.current = new Set(selectedIds)
    }
  }, [selectedIds, data])

  const selectionStats = useMemo(() => {
    const selectedArray = Array.from(selectedIds)
    const hostCount = selectedArray.filter((id) => findNodeById(data, id)?.type === "host").length
    const groupCount = selectedArray.filter((id) => findNodeById(data, id)?.type === "group").length
    const deptCount = selectedArray.filter((id) => findNodeById(data, id)?.type === "department").length
    const companyCount = selectedArray.filter((id) => findNodeById(data, id)?.type === "company").length

    return {
      hostCount,
      groupCount,
      deptCount,
      companyCount,
      total: selectedArray.length,
    }
  }, [selectedIds, data])

  const clearSearch = () => {
    setSearchTerm("")
  }

  const hasData = data.length > 0

  return (
    <div className="w-full">
      <Card className="border-0 shadow-none bg-gradient-to-br from-slate-50/80 to-blue-50/50 backdrop-blur-sm">
        <CardHeader className="rounded-t-lg border-b border-slate-200/60 bg-gradient-to-r from-slate-50/90 to-blue-50/70 pb-4">
          {showHeader ? (
            <CardTitle className="flex items-center gap-3 text-slate-700">
              <div className="rounded-md bg-gradient-to-br from-blue-50 to-indigo-100 p-1.5">
                <Server className="h-4 w-4 text-blue-600" />
              </div>
              <span className="bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-xl font-semibold text-transparent">
                Host Selector
              </span>
              <Sparkles className="h-4 w-4 text-blue-400 opacity-60" />
            </CardTitle>
          ) : null}

          <div className={showHeader ? "flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center" : "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"}>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-3 z-10 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search host name, IP, host ID, MAC, or OS..."
                value={searchTerm}
                disabled={loading || !hasData}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-lg border-slate-200/60 bg-white/80 pl-10 pr-10 shadow-sm transition-all duration-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-2 z-10 h-7 w-7 rounded-full p-0 hover:bg-slate-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex flex-shrink-0 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={loading || !hasData}
                className="h-11 whitespace-nowrap border-slate-200/60 bg-white/80 px-4 text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <SelectAll className="mr-2 h-4 w-4" />
                Select all
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={loading || !hasData}
                className="h-11 whitespace-nowrap border-slate-200/60 bg-white/80 px-4 text-slate-600 shadow-sm transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>

          {searchTerm && (
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200/60 bg-blue-50/80 px-3 py-2 text-sm text-slate-600">
                <span>
                  Search &quot;{searchTerm}&quot; returned {flatNodes.length} result(s).
                </span>
                <Button variant="ghost" size="sm" onClick={clearSearch} className="h-6 px-2 text-xs">
                  Clear search
                </Button>
              </div>
            </div>
          )}

          {selectionStats.total > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Badge className={`${badgeBaseClass} shadow-none transition-colors hover:bg-blue-100`}>
                Selected {selectionStats.total}
                {selectionStats.hostCount > 0 && ` / ${selectionStats.hostCount} host(s)`}
                {selectionStats.groupCount > 0 && ` / ${selectionStats.groupCount} group(s)`}
                {selectionStats.deptCount > 0 && ` / ${selectionStats.deptCount} department(s)`}
                {selectionStats.companyCount > 0 && ` / ${selectionStats.companyCount} companie(s)`}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className={`${badgeButtonClass} hover:bg-blue-100/80 hover:text-blue-700 hover:border-blue-200`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Badge>
            </div>
          )}
        </CardHeader>

        <Separator className="bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <CardContent className="bg-white/60 p-0 backdrop-blur-sm">
          {loading ? (
            <HostSelectorSkeleton />
          ) : hasData ? (
            <div className="w-full border-t border-slate-100/80">
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
          ) : (
            <div className="flex h-[320px] items-center justify-center px-6 text-center text-sm text-slate-500">
              {emptyText}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
