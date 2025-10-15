"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Search, CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { AuditTab } from "./audit-center"

interface GlobalFiltersProps {
  activeTab: AuditTab
  globalSearch: string
  setGlobalSearch: (value: string) => void
  dateRange: string
  setDateRange: (value: string) => void
  customDateFrom?: Date
  setCustomDateFrom: (date: Date | undefined) => void
  customDateTo?: Date
  setCustomDateTo: (date: Date | undefined) => void
}

export function GlobalFilters({
  activeTab,
  globalSearch,
  setGlobalSearch,
  dateRange,
  setDateRange,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
}: GlobalFiltersProps) {
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "task":
        return "搜索任务名称、任务ID、操作人、标签..."
      case "user":
        return "搜索用户名、用户ID、操作对象、来源IP..."
      case "defense":
        return "搜索主机名称、规则名称、规则ID..."
      case "disposition":
        return "搜索主机名称、规则名称、处理人..."
      default:
        return "搜索..."
    }
  }

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Filter className="h-4 w-4 text-blue-500" />
        全局筛选条件
      </h3>
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">时间范围:</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">最近1天</SelectItem>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateRange === "custom" && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">开始日期:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !customDateFrom && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateFrom ? format(customDateFrom, "yyyy-MM-dd") : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">结束日期:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !customDateTo && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateTo ? format(customDateTo, "yyyy-MM-dd") : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={getSearchPlaceholder()}
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  )
}
