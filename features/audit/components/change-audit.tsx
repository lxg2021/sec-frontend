"use client"

import { useEffect, useMemo, useState } from "react"
import { TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ChangeAuditEvent, DispatchTimeRange, DispatchType } from "@/features/audit/types"
import { Button } from "@/shared/ui/button"
import {
  ChangeAuditFilters,
  type ChangeAuditActionFilter,
} from "./change-audit-filters"
import { ChangeAuditList } from "./change-audit-list"

interface ChangeAuditProps {
  data: ChangeAuditEvent[]
  loading?: boolean
  error?: string
  truncated?: boolean
  onRetry: () => void
  timeRange: DispatchTimeRange
  setTimeRange: (value: DispatchTimeRange) => void
  customDateFrom?: Date
  setCustomDateFrom: (value: Date | undefined) => void
  customDateTo?: Date
  setCustomDateTo: (value: Date | undefined) => void
}

const ITEMS_PER_PAGE = 10

export function ChangeAudit({
  data,
  loading = false,
  error = "",
  truncated = false,
  onRetry,
  timeRange,
  setTimeRange,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
}: ChangeAuditProps) {
  const t = useTranslations("pages.audit.changeAudit")
  const [action, setAction] = useState<ChangeAuditActionFilter>("all")
  const [objectType, setObjectType] = useState<DispatchType>("all")
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return data.filter((event) => {
      if (action !== "all" && event.action !== action) return false
      if (objectType !== "all" && event.objectType !== objectType) return false
      if (!normalizedQuery) return true

      return [
        event.objectName,
        event.objectId,
        event.objectVersion,
        event.previousVersion,
        event.newVersion,
        event.actorId,
        event.requestedBy,
        event.actorType,
        event.outcome,
        event.reason,
        event.operationId,
        event.requestId,
        event.eventType,
      ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery)
    })
  }, [action, data, objectType, query])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE))
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [currentPage, filteredEvents])

  useEffect(() => {
    setCurrentPage(1)
  }, [action, data, objectType, query, timeRange, customDateFrom, customDateTo])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const resetFilters = () => {
    setTimeRange("7d")
    setCustomDateFrom(undefined)
    setCustomDateTo(undefined)
    setAction("all")
    setObjectType("all")
    setQuery("")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto xl:overflow-hidden">
      <ChangeAuditFilters
        timeRange={timeRange}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        action={action}
        objectType={objectType}
        query={query}
        onTimeRangeChange={setTimeRange}
        onCustomDateFromChange={setCustomDateFrom}
        onCustomDateToChange={setCustomDateTo}
        onActionChange={setAction}
        onObjectTypeChange={setObjectType}
        onQueryChange={setQuery}
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

      <ChangeAuditList
        events={paginatedEvents}
        total={filteredEvents.length}
        page={currentPage}
        pageSize={ITEMS_PER_PAGE}
        loading={loading}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
