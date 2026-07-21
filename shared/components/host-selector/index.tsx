"use client"

import React, { useMemo, useRef, useState } from "react"
import { Search, X, ReplaceAllIcon as SelectAll, Trash2, Server, Sparkles } from "lucide-react"
import AutoSizer from "react-virtualized-auto-sizer"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Separator } from "@/shared/ui/separator"
import { Skeleton } from "@/shared/ui/skeleton"
import { badgeBaseClass, badgeButtonClass } from "@/shared/styles/badge-class"

import { useTreeData } from "./hooks/use-tree-data"
import { VirtualizedTree } from "./virtualized-tree"

const defaultText = {
  title: "Host Selector",
  searchPlaceholder: "Search host name, IP, host ID, MAC, or OS...",
  selectAll: "Select all",
  clear: "Clear",
  searchResults: (term: string, count: number) => `Search "${term}" returned ${count} result(s).`,
  clearSearch: "Clear search",
  selectedSummary: (
    total: number,
    hostCount: number,
    groupCount: number,
    deptCount: number,
    companyCount: number,
  ) =>
    `Selected ${total}${
      hostCount > 0 ? ` / ${hostCount} host(s)` : ""
    }${groupCount > 0 ? ` / ${groupCount} group(s)` : ""}${
      deptCount > 0 ? ` / ${deptCount} department(s)` : ""
    }${companyCount > 0 ? ` / ${companyCount} companie(s)` : ""}`,
}

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
  fillAvailableHeight = false,
  showHeader = true,
  compactHostRows = false,
  text = defaultText,
}: {
  data?: any[]
  onSelectionChange?: (nodes: any[], selectedIds: Set<string>) => void
  loading?: boolean
  emptyText?: string
  fillAvailableHeight?: boolean
  showHeader?: boolean
  compactHostRows?: boolean
  text?: typeof defaultText
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
  const renderTree = (height: number) => (
    <VirtualizedTree
      nodes={flatNodes}
      onToggleExpanded={toggleExpanded}
      onToggleSelected={toggleSelected}
      getNodeSelectionState={getNodeSelectionState}
      height={height}
      itemHeight={48}
      compactHostRows={compactHostRows}
    />
  )

  return (
    <div className={cn("w-full", fillAvailableHeight && "flex min-h-0 flex-1 flex-col")}>
      <Card
        className={cn(
          "border-0 bg-gradient-to-br from-slate-50/80 to-blue-50/50 shadow-none backdrop-blur-sm",
          fillAvailableHeight && "flex min-h-0 flex-1 flex-col",
        )}
      >
        <CardHeader
          className={cn(
            "rounded-t-lg border-b border-slate-200/60 bg-gradient-to-r from-slate-50/90 to-blue-50/70 pb-4",
            fillAvailableHeight && "shrink-0",
          )}
        >
          {showHeader ? (
            <CardTitle className="flex items-center gap-3 text-slate-700">
              <div className="rounded-md bg-gradient-to-br from-blue-50 to-indigo-100 p-1.5">
                <Server className="h-4 w-4 text-blue-600" />
              </div>
              <span className="bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-xl font-semibold text-transparent">
                {text.title}
              </span>
              <Sparkles className="h-4 w-4 text-blue-400 opacity-60" />
            </CardTitle>
          ) : null}

          <div className={showHeader ? "flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center" : "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"}>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-3 z-10 h-4 w-4 text-slate-400" />
              <Input
                placeholder={text.searchPlaceholder}
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
                {text.selectAll}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={loading || !hasData}
                className="h-11 whitespace-nowrap border-slate-200/60 bg-white/80 px-4 text-slate-600 shadow-sm transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {text.clear}
              </Button>
            </div>
          </div>

          {searchTerm && (
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200/60 bg-blue-50/80 px-3 py-2 text-sm text-slate-600">
                <span>
                  {text.searchResults(searchTerm, flatNodes.length)}
                </span>
                <Button variant="ghost" size="sm" onClick={clearSearch} className="h-6 px-2 text-xs">
                  {text.clearSearch}
                </Button>
              </div>
            </div>
          )}

          {selectionStats.total > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Badge className={`${badgeBaseClass} border-blue-100 bg-blue-50/60 text-blue-600 shadow-none transition-colors hover:bg-blue-50`}>
                {text.selectedSummary(
                  selectionStats.total,
                  selectionStats.hostCount,
                  selectionStats.groupCount,
                  selectionStats.deptCount,
                  selectionStats.companyCount,
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className={`${badgeButtonClass} hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Badge>
            </div>
          )}
        </CardHeader>

        <Separator
          className={cn(
            "bg-gradient-to-r from-transparent via-slate-200 to-transparent",
            fillAvailableHeight && "shrink-0",
          )}
        />

        <CardContent
          className={cn(
            "bg-white/60 p-0 backdrop-blur-sm",
            fillAvailableHeight && "min-h-0 flex-1",
          )}
        >
          {loading ? (
            <div className={cn(fillAvailableHeight && "h-full overflow-y-auto")}>
              <HostSelectorSkeleton />
            </div>
          ) : hasData ? (
            <div
              className={cn(
                "w-full border-t border-slate-100/80",
                fillAvailableHeight && "h-full min-h-0",
              )}
            >
              {fillAvailableHeight ? (
                <AutoSizer disableWidth>
                  {({ height }) => renderTree(Math.max(1, height))}
                </AutoSizer>
              ) : (
                renderTree(480)
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center px-6 text-center text-sm text-slate-500",
                fillAvailableHeight ? "h-full min-h-0" : "h-[320px]",
              )}
            >
              {emptyText}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
