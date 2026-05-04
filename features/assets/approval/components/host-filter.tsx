"use client"

import type { HostFilterOptions, HostStatus, LogicGroup } from "@/features/assets/approval/types"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Search, X, Filter } from "lucide-react"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"

interface HostFilterProps {
  filters: HostFilterOptions
  onFiltersChange: (filters: HostFilterOptions) => void
  logicGroups: LogicGroup[]
  totalHosts: number
  filteredHosts: number
}

export function HostFilter({ filters, onFiltersChange, logicGroups, totalHosts, filteredHosts }: HostFilterProps) {
  const statusOptions: { value: HostStatus; label: string; color: string }[] = [
    { value: "online", label: "在线", color: "bg-green-500" },
    { value: "offline", label: "离线", color: "bg-gray-500" },
  ]

  const handleStatusToggle = (status: HostStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    })
  }

  const handleGroupChange = (groupId: string) => {
    if (groupId === "all") {
      onFiltersChange({ ...filters, groupIds: undefined })
    } else {
      onFiltersChange({ ...filters, groupIds: [groupId] })
    }
  }

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchText: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFilterCount = [
    filters.status?.length,
    filters.groupIds?.length,
    filters.ungrouped,
    filters.unowned,
    filters.searchText,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">主机筛选</h3>
          </div>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="px-2 py-1">
              {activeFilterCount} 个筛选条件
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            显示 <span className="font-semibold text-foreground">{filteredHosts}</span> / {totalHosts} 台主机
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              清除全部
            </Button>
          )}
        </div>
      </div>

      {/* Main Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search - Full width on mobile, 2 cols on desktop */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索主机名、IP、MAC地址..."
              value={filters.searchText || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Group Filter */}
        <div>
          <Select value={filters.groupIds?.[0] || "all"} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="选择逻辑组" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有逻辑组</SelectItem>
              {logicGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.full_path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          {statusOptions.map((status) => (
            <Button
              key={status.value}
              variant={filters.status?.includes(status.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusToggle(status.value)}
              className="flex-1 h-10"
            >
              <span className={`mr-2 h-4 w-4 rounded-full ${status.color}`} />
              <span className="text-xs">{status.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="border-t pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="ungrouped"
                checked={filters.ungrouped || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, ungrouped: checked as boolean })}
              />
              <Label htmlFor="ungrouped" className="cursor-pointer text-sm font-medium text-foreground">
                未分组主机
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="unowned"
                checked={filters.unowned || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, unowned: checked as boolean })}
              />
              <Label htmlFor="unowned" className="cursor-pointer text-sm font-medium text-foreground">
                无负责人主机
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
