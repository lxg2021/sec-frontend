"use client"

import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { Search, CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/shared/lib/utils"
import type { AuditTab } from "./audit-center"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("pages.audit.filters")

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "task":
        return t("searchTask")
      case "user":
        return t("searchUser")
      case "defense":
        return t("searchDefense")
      case "disposition":
        return t("searchDisposition")
      default:
        return t("searchDefault")
    }
  }

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Filter className="h-4 w-4 text-blue-500" />
        {t("title")}
      </h3>
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">{t("timeRange")}</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              <SelectValue placeholder={t("timeRangePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">{t("last1d")}</SelectItem>
              <SelectItem value="7d">{t("last7d")}</SelectItem>
              <SelectItem value="30d">{t("last30d")}</SelectItem>
              <SelectItem value="90d">{t("last90d")}</SelectItem>
              <SelectItem value="custom">{t("custom")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateRange === "custom" && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("startDate")}</label>
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
                    {customDateFrom ? format(customDateFrom, "yyyy-MM-dd") : t("chooseDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("endDate")}</label>
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
                    {customDateTo ? format(customDateTo, "yyyy-MM-dd") : t("chooseDate")}
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
