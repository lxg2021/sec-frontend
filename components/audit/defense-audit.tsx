"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DefenseAudit as DefenseAuditType } from "@/lib/audit/defense-audit"
import { DefenseAuditCard } from "./defense-audit-card"
import { Pagination } from "./pagination"
import { Filter, ClipboardList } from "lucide-react"

interface DefenseAuditProps {
  data: DefenseAuditType[]
  globalSearch: string
  dateRange: string
  customDateFrom?: Date
  customDateTo?: Date
}

export function DefenseAudit({ data, globalSearch, dateRange, customDateFrom, customDateTo }: DefenseAuditProps) {
  const [actionType, setActionType] = useState<string>("all")
  const [severity, setSeverity] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [source, setSource] = useState<string>("all")
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
          audit.ruleId.toLowerCase().includes(searchLower)
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

      // Source filter
      if (source !== "all" && audit.executionSource !== source) return false

      return true
    })
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, actionType, severity, status, source])

  useEffect(() => {
    setCurrentPage(1)
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, actionType, severity, status, source])

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
            防御动作筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">防御类型:</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="防御类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="ALERT">告警</SelectItem>
                  <SelectItem value="BLOCK">阻断</SelectItem>
                  <SelectItem value="PROMPT">提示</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">严重等级:</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="严重等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">执行状态:</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="执行状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="SUCCESS">成功</SelectItem>
                  <SelectItem value="FAILED">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">执行来源:</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="执行来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="ENDPOINT">终端防护</SelectItem>
                  <SelectItem value="FIREWALL">防火墙</SelectItem>
                  <SelectItem value="HIDS">主机入侵检测</SelectItem>
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
            防御动作审计记录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAudits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无数据</div>
          ) : (
            <>
              {paginatedAudits.map((audit) => (
                <DefenseAuditCard key={audit.id} audit={audit} />
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
