"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { DispositionAudit as DispositionAuditType } from "@/features/audit/types"
import { DispositionAuditCard } from "./disposition-audit-card"
import { Pagination } from "./pagination"
import { Filter, ClipboardList } from "lucide-react"
import { useTranslations } from "next-intl"

interface DispositionAuditProps {
  data: DispositionAuditType[]
  globalSearch: string
  dateRange: string
  customDateFrom?: Date
  customDateTo?: Date
}

export function DispositionAudit({
  data,
  globalSearch,
  dateRange,
  customDateFrom,
  customDateTo,
}: DispositionAuditProps) {
  const t = useTranslations("pages.audit.disposition")
  const [actionType, setActionType] = useState<string>("all")
  const [severity, setSeverity] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [handler, setHandler] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredAudits = useMemo(() => {
    return data.filter((audit) => {
      // Global search filter
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase()
        const matchesSearch =
          audit.name.toLowerCase().includes(searchLower) ||
          audit.ruleName.toLowerCase().includes(searchLower) ||
          audit.handledBy?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      const auditDate = new Date(audit.triggeredAt)

      // Validate date
      if (isNaN(auditDate.getTime())) {
        console.error("Invalid timestamp:", audit.triggeredAt)
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

      // Severity filter
      if (severity !== "all" && audit.severity !== severity) return false

      // Status filter
      if (status !== "all" && audit.status !== status) return false

      // Handler filter
      if (handler !== "all" && audit.handledBy !== handler) return false

      return true
    })
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, actionType, severity, status, handler])

  useEffect(() => {
    setCurrentPage(1)
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, actionType, severity, status, handler])

  const totalPages = Math.ceil(filteredAudits.length / itemsPerPage)
  const paginatedAudits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAudits.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAudits, currentPage, itemsPerPage])

  const handlers = useMemo(() => {
    const h = new Set(data.map((a) => a.handledBy).filter(Boolean))
    return Array.from(h) as string[]
  }, [data])

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
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("actionTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="ISOLATE">{t("isolate")}</SelectItem>
                  <SelectItem value="TERMINATE">{t("terminate")}</SelectItem>
                  <SelectItem value="DISCONNECT">{t("disconnect")}</SelectItem>
                  <SelectItem value="QUARANTINE">{t("quarantine")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("severity")}</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("severityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("status")}</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="SUCCESS">{t("success")}</SelectItem>
                  <SelectItem value="FAILED">{t("failed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t("handler")}</label>
              <Select value={handler} onValueChange={setHandler}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("handlerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  {handlers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
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
          {filteredAudits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("empty")}</div>
          ) : (
            <>
              {paginatedAudits.map((audit) => (
                <DispositionAuditCard key={audit.id} audit={audit} />
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
