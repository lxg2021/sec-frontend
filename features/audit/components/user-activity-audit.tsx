"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { UserActivityAudit as UserActivityAuditType } from "@/features/audit/types"
import { UserActivityCard } from "./user-activity-card"
import { Pagination } from "./pagination"
import { Filter, ClipboardList } from "lucide-react"
import { useTranslations } from "next-intl"

interface UserActivityAuditProps {
  data: UserActivityAuditType[]
  loading?: boolean
  globalSearch: string
  dateRange: string
  customDateFrom?: Date
  customDateTo?: Date
}

export function UserActivityAudit({
  data,
  loading = false,
  globalSearch,
  dateRange,
  customDateFrom,
  customDateTo,
}: UserActivityAuditProps) {
  const t = useTranslations("pages.audit.userActivity")
  const [actionType, setActionType] = useState<string>("all")
  const [result, setResult] = useState<string>("all")
  const [targetType, setTargetType] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredAudits = useMemo(() => {
    return data.filter((audit) => {
      // Global search filter
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase()
        const matchesSearch =
          audit.username.toLowerCase().includes(searchLower) ||
          audit.userId.toLowerCase().includes(searchLower) ||
          audit.targetName?.toLowerCase().includes(searchLower) ||
          audit.sourceIp?.toLowerCase().includes(searchLower) ||
          audit.targetId?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Date range filter
      const auditDate = new Date(audit.timestamp)

      // Validate date
      if (isNaN(auditDate.getTime())) {
        console.error("Invalid timestamp:", audit.timestamp)
        return false
      }

      if (dateRange === "custom") {
        // Custom date range filtering
        if (customDateFrom) {
          const startOfDay = new Date(customDateFrom)
          startOfDay.setHours(0, 0, 0, 0)
          if (auditDate < startOfDay) return false
        }
        if (customDateTo) {
          const endOfDay = new Date(customDateTo)
          endOfDay.setHours(23, 59, 59, 999)
          if (auditDate > endOfDay) return false
        }
      } else if (dateRange !== "all") {
        // Preset date range filtering
        const daysMap: Record<string, number> = {
          "1d": 1,
          "7d": 7,
          "30d": 30,
          "90d": 90,
        }
        const days = daysMap[dateRange]
        if (days) {
          const now = new Date()
          const cutoffDate = new Date(now)
          cutoffDate.setDate(cutoffDate.getDate() - days)
          cutoffDate.setHours(0, 0, 0, 0)
          if (auditDate < cutoffDate) return false
        }
      }

      // Action type filter
      if (actionType !== "all" && audit.actionType !== actionType) return false

      // Result filter
      if (result !== "all" && audit.result !== result) return false

      // Target type filter
      if (targetType !== "all" && audit.targetType !== targetType) return false

      return true
    })
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, actionType, result, targetType])

  useEffect(() => {
    setCurrentPage(1)
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, actionType, result, targetType])

  const totalPages = Math.ceil(filteredAudits.length / itemsPerPage)
  const paginatedAudits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAudits.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAudits, currentPage, itemsPerPage])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-500" />
            {t("filterTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("actionType")}</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("actionTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="ADD_USER">{t("addUser")}</SelectItem>
                  <SelectItem value="UPDATE_USER">{t("updateUser")}</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">{t("passwordChange")}</SelectItem>
                  <SelectItem value="STATUS_CHANGE">{t("statusChange")}</SelectItem>
                  <SelectItem value="DELETE_USER">{t("deleteUser")}</SelectItem>
                  <SelectItem value="ROLE_CHANGE">{t("roleChange")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("result")}</label>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("resultPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="SUCCESS">{t("success")}</SelectItem>
                  <SelectItem value="FAILED">{t("failed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("target")}</label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("targetPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="USER">{t("user")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            {t("listTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && data.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{t("loading")}</div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("empty")}</div>
          ) : (
            <>
              {paginatedAudits.map((audit) => (
                <UserActivityCard key={audit.eventId} audit={audit} />
              ))}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setPage={setCurrentPage}
                totalItems={filteredAudits.length}
                itemsPerPage={itemsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
