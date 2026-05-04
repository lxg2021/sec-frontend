"use client"

import { useState, useMemo, useCallback, Fragment } from "react"
import { Search, ChevronDown, ChevronRight, MoreHorizontal, ExternalLink, Trash2, VolumeX, Fingerprint, Monitor, Hash, CalendarDays, Folder, Package, Loader2, Filter, X, EyeOff } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { UninstallSoftTaskDialog } from "@/features/assets/software/components/uninstall-soft-task-dialog"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import type { SoftItem, SoftwareInstallation } from "@/features/assets/software/types/software-aggregate"
import type { CreateUninstallTaskRequest } from "@/features/assets/software/types/task-soft-uninstall"

interface SoftInventoryTableProps {
  data: SoftItem[]
  onTaskCreated: (task: CreateUninstallTaskRequest) => void
  isLoading?: boolean
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]
const DEFAULT_ITEMS_PER_PAGE = 10

export function SoftInventoryTable({ data, onTaskCreated, isLoading = false }: SoftInventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)
  const [selectedSoftwareForUninstall, setSelectedSoftwareForUninstall] = useState<SoftItem[]>([])
  const [uninstallType, setUninstallType] = useState<"uninstall" | "quietUninstall">("uninstall")

  // Get unique vendors for filter dropdown
  const vendors = useMemo(() => {
    const uniqueVendors = Array.from(new Set(data.map((item) => item.vendor)))
    return uniqueVendors.sort()
  }, [data])

  // Filter and search data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.version.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesVendor = vendorFilter === "all" || item.vendor === vendorFilter

      return matchesSearch && matchesVendor
    })
  }, [data, searchTerm, vendorFilter])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const toggleRowExpansion = useCallback((hash: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(hash)) {
        newExpanded.delete(hash)
      } else {
        newExpanded.add(hash)
      }
      return newExpanded
    })
  }, [])

  const getInstallStateColor = (state: string) => {
    switch (state) {
      case "Installed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "PartiallyInstalled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "Failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "NotInstalled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const handleBatchUninstall = (softItem: SoftItem) => {
    setSelectedSoftwareForUninstall([softItem])
    setUninstallType("uninstall")
    setUninstallDialogOpen(true)
  }

  const handleBatchSilentUninstall = (softItem: SoftItem) => {
    setSelectedSoftwareForUninstall([softItem])
    setUninstallType("quietUninstall")
    setUninstallDialogOpen(true)
  }

  const handleUninstall = (installation: SoftwareInstallation, softItem: SoftItem) => {
    const singleHostSoftware: SoftItem = {
      ...softItem,
      installations: [installation],
    }
    setSelectedSoftwareForUninstall([singleHostSoftware])
    setUninstallType("uninstall")
    setUninstallDialogOpen(true)
  }

  const handleSilentUninstall = (installation: SoftwareInstallation, softItem: SoftItem) => {
    const singleHostSoftware: SoftItem = {
      ...softItem,
      installations: [installation],
    }
    setSelectedSoftwareForUninstall([singleHostSoftware])
    setUninstallType("quietUninstall")
    setUninstallDialogOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setVendorFilter("all")
    setCurrentPage(1)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) pages.push('...')
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle></CardTitle>
            {(searchTerm !== "" || vendorFilter !== "all") && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                <X className="h-4 w-4" />
                清除筛选
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索软件名称、厂商或版本..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={vendorFilter}
              onValueChange={(value) => {
                setVendorFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="选择厂商" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有厂商</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary and Items Per Page Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {filteredData.length === 0 ? (
            "未找到匹配的软件"
          ) : (
            <>
              共找到 {filteredData.length} 个软件，显示第{" "}
              {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} 个
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">每页显示:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            // Loading state
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            // Empty state
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">未找到软件</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                尝试调整搜索条件或筛选条件
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-60">
                    <div className="flex items-center gap-1">
                      软件指纹
                      <Fingerprint className="w-4 h-4 text-blue-600" />
                    </div>
                  </TableHead>
                  <TableHead>软件名称</TableHead>
                  <TableHead className="hidden md:table-cell">版本</TableHead>
                  <TableHead className="hidden lg:table-cell">厂商</TableHead>
                  <TableHead className="hidden xl:table-cell">SKU</TableHead>
                  <TableHead>官网</TableHead>
                  <TableHead className="text-center">安装数</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <Fragment key={item.hash}>
                    <TableRow className="group hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(item.hash)}
                          className="p-1 h-6 w-6"
                        >
                          {expandedRows.has(item.hash) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono w-60 truncate" title={item.hash}>
                        {item.hash}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={item.displayName}>
                        {item.displayName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{item.version}</TableCell>
                      <TableCell className="hidden lg:table-cell">{item.vendor}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">{item.skuNumber || "-"}</TableCell>
                      <TableCell>
                        {item.urlInfoAbout ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={item.urlInfoAbout} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 text-blue-500" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>访问官网</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={item.installations.length === 0 ? "opacity-50" : ""}>
                          {item.installations.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>详情</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleBatchUninstall(item)}
                              disabled={
                                item.installations.length === 0 ||
                                !item.installations.some(installation => installation.uninstallString && installation.uninstallString.length > 0)
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                              <span className="text-black">批量正常卸载</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBatchSilentUninstall(item)}
                              disabled={
                                item.installations.length === 0 ||
                                !item.installations.some(installation => installation.quietUninstallString && installation.quietUninstallString.length > 0)
                              }
                              className="text-destructive"
                            >
                              <EyeOff className="h-4 w-4 mr-2 text-orange-500" />
                              <span className="text-black">批量静默卸载</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>


                      </TableCell>
                    </TableRow>

                    {/* Expanded Row Details */}
                    {expandedRows.has(item.hash) && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={9} className="p-0">
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-bold">
                                安装详情 - {item.displayName}
                              </h4>
                              <Badge variant="outline" className="ml-2">
                                {item.installations.length} 台主机
                              </Badge>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-blue-500" />
                                        主机名
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Fingerprint className="h-4 w-4 text-blue-500" />
                                        主机ID
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-blue-500" />
                                        安装日期
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Folder className="h-4 w-4 text-blue-500" />
                                        安装路径
                                      </div>
                                    </th>
                                    <th className="text-left p-2">
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-500" />
                                        包路径
                                      </div>
                                    </th>
                                    <th className="text-center p-2">操作</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.installations.map((installation, index) => (
                                    <tr key={`${installation.hostId}-${index}`}>
                                      <td className="font-medium p-2">{installation.hostname}</td>
                                      <td className="font-mono text-xs p-2">{installation.hostId}</td>
                                      <td className="p-2">
                                        {installation.installDate
                                          ? new Date(installation.installDate).toLocaleDateString("zh-CN")
                                          : "-"}
                                      </td>
                                      <td className="text-xs max-w-48 truncate p-2" title={installation.installLocation}>
                                        {installation.installLocation || "-"}
                                      </td>
                                      <td className="text-xs max-w-48 truncate p-2" title={installation.packageCache}>
                                        {installation.packageCache || "-"}
                                      </td>

                                      <td className="text-center p-2">
                                        <div
                                          className={`flex gap-1 justify-center items-center ${installation.uninstallString && installation.quietUninstallString ? "flex-row" : "flex-row"
                                            }`}
                                        >
                                          {installation.uninstallString && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleUninstall(installation, item)}
                                              className="flex items-center gap-1"
                                            >
                                              <Trash2 className="h-3 w-3 text-red-500" />
                                              普通卸载
                                            </Button>
                                          )}
                                          {installation.quietUninstallString && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleSilentUninstall(installation, item)}
                                              className="flex items-center gap-1"
                                            >
                                              <EyeOff className="h-3 w-3 text-orange-500" />
                                              静默卸载
                                            </Button>
                                          )}
                                        </div>
                                      </td>

                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            第 {currentPage} 页，共 {totalPages} 页，{filteredData.length} 条记录
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              首页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 py-1">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page as number)}
                  >
                    {page}
                  </Button>
                )
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              末页
            </Button>
          </div>
        </div>
      )}

      <UninstallSoftTaskDialog
        selectedSoftware={selectedSoftwareForUninstall}
        uninstallType={uninstallType}
        open={uninstallDialogOpen}
        onOpenChange={setUninstallDialogOpen}
        onTaskCreated={onTaskCreated}
      />
    </div>
  )
}