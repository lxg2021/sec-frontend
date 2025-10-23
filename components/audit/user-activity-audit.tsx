"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserActivityAudit as UserActivityAuditType } from "@/lib/audit/user-audit"
import { UserActivityCard } from "./user-activity-card"
import { Pagination } from "./pagination"
import { Filter, ClipboardList } from "lucide-react"

interface UserActivityAuditProps {
  data: UserActivityAuditType[]
  globalSearch: string
  dateRange: string
  customDateFrom?: Date
  customDateTo?: Date
}

export function UserActivityAudit({
  data,
  globalSearch,
  dateRange,
  customDateFrom,
  customDateTo,
}: UserActivityAuditProps) {
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
            用户行为筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">操作类型:</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="LOGIN">登录</SelectItem>
                  <SelectItem value="LOGOUT">登出</SelectItem>
                  <SelectItem value="FAILED_LOGIN">登录失败</SelectItem>
                  <SelectItem value="CREATE_TASK">创建任务</SelectItem>
                  <SelectItem value="UPDATE_TASK">更新任务</SelectItem>
                  <SelectItem value="DISPATCH_TASK">下发任务</SelectItem>
                  <SelectItem value="CREATE_CONFIG">创建配置</SelectItem>
                  <SelectItem value="UPDATE_CONFIG">更新配置</SelectItem>
                  <SelectItem value="MANUAL_BLOCK">手动阻断</SelectItem>
                  <SelectItem value="ADD_USER">添加用户</SelectItem>
                  <SelectItem value="DELETE_USER">删除用户</SelectItem>
                  <SelectItem value="ROLE_CHANGE">角色变更</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">操作结果:</label>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="操作结果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="SUCCESS">成功</SelectItem>
                  <SelectItem value="FAILED">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">操作对象:</label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="操作对象" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="TASK">任务</SelectItem>
                  <SelectItem value="POLICY">策略</SelectItem>
                  <SelectItem value="HOST">主机</SelectItem>
                  <SelectItem value="USER">用户</SelectItem>
                  <SelectItem value="SYSTEM">系统</SelectItem>
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
            用户行为审计记录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAudits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无数据</div>
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
