"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TaskDispatchReport } from "@/lib/audit/task-dispatch-report"
import { TaskDispatchCard } from "./task-dispatch-card"
import { Pagination } from "./pagination"
import { Filter, ClipboardList } from "lucide-react"

interface TaskDispatchAuditProps {
  data: TaskDispatchReport[]
  globalSearch: string
  dateRange: string
  customDateFrom?: Date
  customDateTo?: Date
}

export function TaskDispatchAudit({
  data,
  globalSearch,
  dateRange,
  customDateFrom,
  customDateTo,
}: TaskDispatchAuditProps) {
  const [taskType, setTaskType] = useState<string>("all")
  const [priority, setPriority] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [operator, setOperator] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredReports = useMemo(() => {
    return data.filter((report) => {
      // Global search filter
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase()
        const matchesSearch =
          report.name.toLowerCase().includes(searchLower) ||
          report.id.toLowerCase().includes(searchLower) ||
          report.dispatchedBy?.toLowerCase().includes(searchLower) ||
          report.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }

      const reportDate = new Date(report.createdAt)

      // Validate date
      if (isNaN(reportDate.getTime())) {
        console.error("Invalid timestamp:", report.createdAt)
        return false
      }

      if (dateRange === "custom") {
        // Custom date range filtering
        if (customDateFrom) {
          const startOfDay = new Date(customDateFrom)
          startOfDay.setHours(0, 0, 0, 0)
          if (reportDate < startOfDay) return false
        }
        if (customDateTo) {
          const endOfDay = new Date(customDateTo)
          endOfDay.setHours(23, 59, 59, 999)
          if (reportDate > endOfDay) return false
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
          if (reportDate < cutoffDate) return false
        }
      }

      // Task type filter
      if (taskType !== "all" && report.taskType !== taskType) return false

      // Priority filter
      if (priority !== "all" && report.priority !== priority) return false

      // Status filter
      if (status !== "all") {
        if (status === "success" && report.successCount === 0) return false
        if (status === "failed" && report.failedCount === 0) return false
        if (status === "pending" && report.pendingCount === 0) return false
      }

      // Operator filter
      if (operator !== "all" && report.dispatchedBy !== operator) return false

      return true
    })
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, taskType, priority, status, operator])

  useEffect(() => {
    setCurrentPage(1)
  }, [data, globalSearch, dateRange, customDateFrom, customDateTo, taskType, priority, status, operator])

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredReports.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredReports, currentPage, itemsPerPage])

  const operators = useMemo(() => {
    const ops = new Set(data.map((r) => r.dispatchedBy).filter(Boolean))
    return Array.from(ops) as string[]
  }, [data])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-500" />
            任务下发筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">任务类型:</label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="任务类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="TASK">TASK</SelectItem>
                  <SelectItem value="CONFIG">CONFIG</SelectItem>
                  <SelectItem value="POLICY">POLICY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">优先级:</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">下发状态:</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="下发状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                  <SelectItem value="pending">待执行</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">操作人:</label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="操作人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
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
            任务下发记录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无数据</div>
          ) : (
            <>
              {paginatedReports.map((report) => (
                <TaskDispatchCard key={report.id} report={report} />
              ))}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setPage={setCurrentPage}
                totalItems={filteredReports.length}
                itemsPerPage={itemsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
