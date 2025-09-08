"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { Eye, Search, CheckSquare, Square, Filter, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PatchDetailDialog } from "./patch-detail-dialog"
import type { PatchCoverageForInstall } from "@/lib/patchInstall"
import type { SelectedPatchPool, SelectedPatchItem } from "@/lib/patchSelection"
import type { PatchSeverity, SystemType } from "@/lib/patch"

interface PatchListProps {
  onSelectionChange: (selection: SelectedPatchPool) => void
  onRemoveSelection: (patchGuid: string) => void
  onClearSelection: () => void // Add clear selection callback
  activeSystem: SystemType
  patchData: PatchCoverageForInstall[]
  selectedPatchGuids: Set<string> // Add prop for selected patch GUIDs
  isLoading?: boolean
}

export function PatchList({
  onSelectionChange,
  onRemoveSelection,
  onClearSelection, // Add clear selection prop
  activeSystem,
  patchData,
  selectedPatchGuids, // Add selectedPatchGuids prop
  isLoading = false,
}: PatchListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [coverageFilter, setCoverageFilter] = useState<string>("all")
  const [selectedPatches, setSelectedPatches] = useState<Set<string>>(new Set())
  const [selectedPatchForDetail, setSelectedPatchForDetail] = useState<PatchCoverageForInstall | null>(null)
  const previousSelectionRef = useRef<string>("")
  const onSelectionChangeRef = useRef(onSelectionChange)

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  useEffect(() => {
    setSelectedPatches(selectedPatchGuids)
  }, [selectedPatchGuids])

  // Filter patches based on search and filter criteria
  const filteredPatches = useMemo(() => {
    return patchData.filter((patch) => {
      const matchesSearch =
        patch.item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patch.item.kbArticleIds.some((kb) => kb.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesSeverity = severityFilter === "all" || patch.item.securityLevel === severityFilter
      const matchesSystem = patch.item.osPlatform === activeSystem
      const matchesCoverage =
        coverageFilter === "all" ||
        (coverageFilter === "incomplete" && patch.coverageRate < 100) ||
        (coverageFilter === "complete" && patch.coverageRate === 100)
      return matchesSearch && matchesSeverity && matchesSystem && matchesCoverage
    })
  }, [searchTerm, severityFilter, activeSystem, coverageFilter, patchData])

  const getSeverityColor = useCallback((severity: PatchSeverity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500 text-white"
      case "Important":
        return "bg-orange-500 text-white"
      case "Moderate":
        return "bg-yellow-500 text-black"
      case "Low":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedPatches.size === filteredPatches.length) {
      setSelectedPatches(new Set())
      onClearSelection()
    } else {
      setSelectedPatches(new Set(filteredPatches.map((p) => p.item.patchGuid)))
    }
  }, [selectedPatches, filteredPatches, onClearSelection])

  const handlePatchSelection = useCallback(
    (patchGuid: string, checked: boolean) => {
      setSelectedPatches((prev) => {
        const newSelected = new Set(prev)
        if (checked) {
          newSelected.add(patchGuid)
        } else {
          newSelected.delete(patchGuid)
          onRemoveSelection(patchGuid)
        }
        return newSelected
      })
    },
    [onRemoveSelection],
  )

  // Update selection pool when patches are selected
  useEffect(() => {
    // Only proceed if we have filtered patches to work with
    if (filteredPatches.length === 0) return

    const selectedItems: SelectedPatchItem[] = filteredPatches
      .filter((patch) => selectedPatches.has(patch.item.patchGuid))
      .map((patch) => ({
        patch: {
          patchGuid: patch.item.patchGuid,
          title: patch.item.title,
          kbArticleIds: patch.item.kbArticleIds,
          securityLevel: patch.item.securityLevel,
          osPlatform: patch.item.osPlatform,
        },
        selectedHosts: patch.pendingHostList || [],
      }))

    const uniqueHosts = new Set<string>()
    selectedItems.forEach((item) => {
      item.selectedHosts.forEach((host) => {
        uniqueHosts.add(host.hostId)
      })
    })

    const selectionKey = `${selectedItems.length}-${uniqueHosts.size}-${Array.from(selectedPatches).sort().join(",")}`

    if (previousSelectionRef.current !== selectionKey) {
      previousSelectionRef.current = selectionKey

      onSelectionChangeRef.current({
        totalPatches: selectedItems.length,
        totalHosts: uniqueHosts.size,
        items: selectedItems,
      })
    }
  }, [selectedPatches, filteredPatches])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }, [])

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="pb-3 bg-muted/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <span>补丁管理</span>
            <Badge variant="secondary" className="text-sm font-semibold">
              {filteredPatches.length} 个补丁
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="flex items-center gap-2 bg-background"
              disabled={filteredPatches.length === 0}
            >
              {selectedPatches.size === filteredPatches.length && filteredPatches.length > 0 ? (
                <>
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  取消全选
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  全部选中
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索补丁标题或KB ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>筛选:</span>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="严重等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有等级</SelectItem>
                <SelectItem value="Critical">严重</SelectItem>
                <SelectItem value="Important">重要</SelectItem>
                <SelectItem value="Moderate">中等</SelectItem>
                <SelectItem value="Low">低</SelectItem>
              </SelectContent>
            </Select>
            <Select value={coverageFilter} onValueChange={setCoverageFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="覆盖状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="incomplete">未覆盖</SelectItem>
                <SelectItem value="complete">已覆盖</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>正在加载补丁数据...</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-12 text-center">选择</TableHead>
                      <TableHead className="min-w-[260px]">补丁信息</TableHead>
                      <TableHead className="w-36">安全等级</TableHead>
                      <TableHead className="w-40">安装覆盖率</TableHead>
                      <TableHead className="w-20 text-center">已安装</TableHead>
                      <TableHead className="w-20 text-center">未安装</TableHead>
                      <TableHead className="w-20 text-center">失败</TableHead>
                      <TableHead className="w-16 text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredPatches.map((patch) => {
                      const isChecked = selectedPatches.has(patch.item.patchGuid)

                      const toggleRow = () => {
                        handlePatchSelection(patch.item.patchGuid, !isChecked)
                      }

                      return (
                        <TableRow
                          key={patch.item.patchGuid}
                          className="group hover:bg-muted/30 cursor-pointer focus-within:outline-none focus-within:outline focus-within:outline-1 focus-within:outline-primary/40"
                          onClick={toggleRow}
                          aria-selected={isChecked}
                          tabIndex={-1}
                        >
                          {/* 复选框：阻止冒泡，避免触发行点击 */}
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handlePatchSelection(patch.item.patchGuid, checked as boolean)
                              }
                              aria-label={`选择补丁 ${patch.item.title}`}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </TableCell>

                          {/* 补丁信息列：点击该列也可选择，增强可用性 */}
                          <TableCell
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRow()
                            }}
                          >
                            <div className="space-y-1.5">
                              <div className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary">
                                {patch.item.title}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {patch.item.kbArticleIds.join(", ")}
                                </Badge>
                                <span>•</span>
                                <span>{formatDate(patch.item.publishDate)}</span>
                                <span>•</span>
                                <span className="capitalize">{patch.item.osPlatform}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={`px-2 py-1 ${getSeverityColor(patch.item.securityLevel)}`}
                              style={{ width: "80px" }}
                            >
                              {patch.item.securityLevel}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{patch.coverageRate}%</span>
                                <span className="text-muted-foreground text-xs">
                                  {patch.installedHosts}/{patch.totalHosts}
                                </span>
                              </div>
                              <Progress value={patch.coverageRate} className="h-1.5" />
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="text-green-600 font-medium text-sm">{patch.installedHosts}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-amber-600 font-medium text-sm">{patch.pendingHosts}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-red-600 font-medium text-sm">{patch.failedHosts}</span>
                          </TableCell>

                          {/* 查看详情：阻止冒泡，避免触发行选择 */}
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPatchForDetail(patch)}
                              className="h-8 w-8 p-0"
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {filteredPatches.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <Search className="h-10 w-10 opacity-50" />
                  {searchTerm || severityFilter !== "all" || coverageFilter !== "all" ? (
                    <p>没有找到匹配的补丁，请尝试调整搜索条件或筛选条件</p>
                  ) : (
                    <p>暂无补丁数据</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {selectedPatchForDetail && (
        <PatchDetailDialog
          patch={selectedPatchForDetail}
          open={!!selectedPatchForDetail}
          onOpenChange={(open) => !open && setSelectedPatchForDetail(null)}
          onSelectionChange={onSelectionChange}
        />
      )}
    </Card>
  )
}
