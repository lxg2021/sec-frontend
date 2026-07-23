"use client"

import { useEffect, useMemo, useState } from "react"
import { TriangleAlert } from "lucide-react"
import type { UserActivityAudit as UserActivityAuditType, UserAuditDateRange } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import { useTranslations } from "next-intl"
import {
  UserActivityFilters,
  type UserAuditActionFilter,
  type UserAuditResultFilter,
} from "./user-activity-filters"
import { UserActivityList } from "./user-activity-list"

interface UserActivityAuditProps {
  data: UserActivityAuditType[]
  loading?: boolean
  error?: string
  truncated?: boolean
  onRetry: () => void
  dateRange: UserAuditDateRange
  setDateRange: (value: UserAuditDateRange) => void
  customDateFrom?: Date
  setCustomDateFrom: (value: Date | undefined) => void
  customDateTo?: Date
  setCustomDateTo: (value: Date | undefined) => void
}

const ITEMS_PER_PAGE = 10

export function UserActivityAudit({
  data,
  loading = false,
  error = "",
  truncated = false,
  onRetry,
  dateRange,
  setDateRange,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
}: UserActivityAuditProps) {
  const t = useTranslations("pages.audit.userActivity")
  const [actionType, setActionType] = useState<UserAuditActionFilter>("all")
  const [result, setResult] = useState<UserAuditResultFilter>("all")
  const [actorQuery, setActorQuery] = useState("")
  const [targetQuery, setTargetQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAudits = useMemo(() => {
    const normalizedActor = actorQuery.trim().toLowerCase()
    const normalizedTarget = targetQuery.trim().toLowerCase()

    return data.filter((audit) => {
      if (normalizedActor && !`${audit.username} ${audit.userId}`.toLowerCase().includes(normalizedActor)) return false
      if (normalizedTarget && !`${audit.targetName ?? ""} ${audit.targetId ?? ""}`.toLowerCase().includes(normalizedTarget)) return false

      const auditDate = new Date(audit.timestamp)
      if (Number.isNaN(auditDate.getTime())) return false

      if (dateRange === "custom") {
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
      } else {
        const days = Number.parseInt(dateRange, 10)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        cutoffDate.setHours(0, 0, 0, 0)
        if (auditDate < cutoffDate) return false
      }

      if (actionType !== "all" && audit.actionType !== actionType) return false
      if (result !== "all" && audit.result !== result) return false
      return true
    })
  }, [actionType, actorQuery, customDateFrom, customDateTo, data, dateRange, result, targetQuery])

  const totalPages = Math.max(1, Math.ceil(filteredAudits.length / ITEMS_PER_PAGE))
  const paginatedAudits = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAudits.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [currentPage, filteredAudits])

  useEffect(() => {
    setCurrentPage(1)
  }, [actionType, actorQuery, customDateFrom, customDateTo, data, dateRange, result, targetQuery])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const resetFilters = () => {
    setDateRange("7d")
    setCustomDateFrom(undefined)
    setCustomDateTo(undefined)
    setActionType("all")
    setResult("all")
    setActorQuery("")
    setTargetQuery("")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto xl:overflow-hidden">
      <UserActivityFilters
        dateRange={dateRange}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        actionType={actionType}
        result={result}
        actorQuery={actorQuery}
        targetQuery={targetQuery}
        onDateRangeChange={setDateRange}
        onCustomDateFromChange={setCustomDateFrom}
        onCustomDateToChange={setCustomDateTo}
        onActionTypeChange={setActionType}
        onResultChange={setResult}
        onActorQueryChange={setActorQuery}
        onTargetQueryChange={setTargetQuery}
        onReset={resetFilters}
      />
      {error && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          <span className="flex min-w-0 items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="break-words">{t("loadFailed", { error })}</span>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="h-9 border-rose-200 bg-white text-rose-800 hover:bg-rose-100">
            {t("retry")}
          </Button>
        </div>
      )}
      {truncated && (
        <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900" role="status">
          {t("truncated", { count: data.length })}
        </div>
      )}
      <UserActivityList
        events={paginatedAudits}
        total={filteredAudits.length}
        page={currentPage}
        pageSize={ITEMS_PER_PAGE}
        loading={loading}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
