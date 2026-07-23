"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ClipboardList, Download, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/shared/ui/button"
import { AuditCategoryTabs } from "./audit-category-tabs"
import { AuditEventDetail } from "./audit-event-detail"
import { AuditSummary } from "./audit-summary"
import { DispatchAuditFilters } from "./dispatch-audit-filters"
import { DispatchAuditTable } from "./dispatch-audit-table"
import { GlobalFilters } from "./global-filters"
import { UserActivityAudit } from "./user-activity-audit"
import { listDispatchAuditEvents } from "@/features/audit/api"
import { mockUserAuditData } from "@/features/audit/mock/user-audit"
import type { AuditCategory, AuditResult, DispatchAuditEvent, DispatchTimeRange, DispatchType } from "@/features/audit/types"

export type AuditTab = "task" | "user" | "defense" | "disposition"

export function AuditCenter() {
  const t = useTranslations("pages.reports")
  const [activeCategory, setActiveCategory] = useState<AuditCategory>("dispatch")
  const [dispatchTimeRange, setDispatchTimeRange] = useState<DispatchTimeRange>("7d")
  const [dispatchType, setDispatchType] = useState<DispatchType>("all")
  const [result, setResult] = useState<AuditResult>("all")
  const [actor, setActor] = useState("")
  const [keyword, setKeyword] = useState("")
  const [selectedId, setSelectedId] = useState<string>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [dispatchPage, setDispatchPage] = useState(1)
  const [dispatchPageSize, setDispatchPageSize] = useState(10)
  const [dispatchEvents, setDispatchEvents] = useState<DispatchAuditEvent[]>([])
  const [dispatchLoading, setDispatchLoading] = useState(true)
  const [dispatchError, setDispatchError] = useState("")
  const [globalSearch, setGlobalSearch] = useState("")
  const [dateRange, setDateRange] = useState("7d")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()

  const loadDispatchEvents = useCallback(async () => {
    setDispatchLoading(true)
    setDispatchError("")
    try {
      const events = await listDispatchAuditEvents(dispatchTimeRange)
      setDispatchEvents(events)
      setSelectedId((current) => current && events.some((event) => event.id === current) ? current : undefined)
    } catch (error) {
      setDispatchError(error instanceof Error ? error.message : "下发审计数据加载失败")
    } finally {
      setDispatchLoading(false)
    }
  }, [dispatchTimeRange])

  useEffect(() => {
    void loadDispatchEvents()
  }, [loadDispatchEvents])
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  const filteredEvents = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const normalizedActor = actor.trim().toLowerCase()

    return dispatchEvents.filter((event) => {
      const typeMatched = dispatchType === "all" || event.dispatchType === dispatchType
      const resultMatched = result === "all" || event.result === result
      const actorMatched = !normalizedActor || `${event.actorName} ${event.actorId}`.toLowerCase().includes(normalizedActor)
      const keywordMatched = !normalizedKeyword || [event.objectName, event.taskId, event.operationId, event.targetSummary, event.agentSummary].join(" ").toLowerCase().includes(normalizedKeyword)
      return typeMatched && resultMatched && actorMatched && keywordMatched
    })
  }, [actor, dispatchEvents, dispatchType, keyword, result])

  const dispatchTotalPages = Math.max(1, Math.ceil(filteredEvents.length / dispatchPageSize))
  const paginatedEvents = useMemo(() => {
    const start = (dispatchPage - 1) * dispatchPageSize
    return filteredEvents.slice(start, start + dispatchPageSize)
  }, [dispatchPage, dispatchPageSize, filteredEvents])

  useEffect(() => {
    setDispatchPage(1)
  }, [actor, dispatchTimeRange, dispatchType, keyword, result])

  useEffect(() => {
    setDispatchPage((current) => Math.min(current, dispatchTotalPages))
  }, [dispatchTotalPages])
  const selectedEvent = filteredEvents.find((event) => event.id === selectedId)
    ?? dispatchEvents.find((event) => event.id === selectedId)
  const abnormalCount = filteredEvents.filter((event) => event.result === "failed" || event.result === "timeout").length

  const resetFilters = () => {
    setDispatchTimeRange("7d")
    setDispatchType("all")
    setResult("all")
    setActor("")
    setKeyword("")
    setSelectedId(undefined)
    setDetailOpen(false)
  }

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100 p-4">
      <div className="flex h-full min-h-0 w-full flex-col gap-3">
        <header className="w-full shrink-0 rounded-[28px] border border-slate-200/80 bg-white px-5 py-[13px] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4 xl:w-[260px] xl:flex-none 2xl:w-[430px]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100 text-blue-600">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1.5">
                <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">{t("title")}</h1>
                <p className="min-w-0 truncate text-sm text-slate-500">追踪下发、用户与系统变更记录</p>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-1 flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap xl:justify-end 2xl:gap-3">
              <AuditCategoryTabs
                value={activeCategory}
                onChange={(category) => {
                  setActiveCategory(category)
                  setSelectedId(undefined)
                  setDetailOpen(false)
                }}
              />
              <div className="flex items-center gap-1 xl:border-l xl:border-slate-200 xl:pl-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 shrink-0 gap-2 rounded-full px-3.5 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">导出记录</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="刷新审计数据"
                  title="刷新审计数据"
                  disabled={dispatchLoading}
                  onClick={() => void loadDispatchEvents()}
                  className="h-10 w-10 shrink-0 rounded-full text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                >
                  <RefreshCw className={`h-4 w-4 ${dispatchLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
          {activeCategory === "dispatch" && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <DispatchAuditFilters
                timeRange={dispatchTimeRange}
                dispatchType={dispatchType}
                result={result}
                actor={actor}
                keyword={keyword}
                onTimeRangeChange={setDispatchTimeRange}
                onDispatchTypeChange={setDispatchType}
                onResultChange={setResult}
                onActorChange={setActor}
                onKeywordChange={setKeyword}
                onReset={resetFilters}
              />
              {dispatchError && (
                <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  真实审计数据加载失败：{dispatchError}
                </div>
              )}
              <AuditSummary
                total={filteredEvents.length}
                policy={filteredEvents.filter((event) => event.dispatchType === "policy").length}
                command={filteredEvents.filter((event) => event.dispatchType === "command").length}
                config={filteredEvents.filter((event) => event.dispatchType === "config").length}
                abnormal={abnormalCount}
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <DispatchAuditTable
                  events={paginatedEvents}
                  total={filteredEvents.length}
                  page={dispatchPage}
                  pageSize={dispatchPageSize}
                  selectedId={selectedEvent?.id}
                  onPageChange={setDispatchPage}
                  onPageSizeChange={(pageSize) => {
                    setDispatchPageSize(pageSize)
                    setDispatchPage(1)
                  }}
                  onSelect={(event) => setSelectedId(event.id)}
                  onView={(event) => {
                    setSelectedId(event.id)
                    setDetailOpen(true)
                  }}
                />
              </div>
              <AuditEventDetail event={selectedEvent} open={detailOpen} onClose={() => setDetailOpen(false)} />
            </div>
          )}

          {activeCategory === "user" && (
            <div className="min-h-0 flex-1 space-y-5 overflow-auto pr-1">
              <GlobalFilters
                activeTab="user"
                globalSearch={globalSearch}
                setGlobalSearch={setGlobalSearch}
                dateRange={dateRange}
                setDateRange={setDateRange}
                customDateFrom={customDateFrom}
                setCustomDateFrom={setCustomDateFrom}
                customDateTo={customDateTo}
                setCustomDateTo={setCustomDateTo}
              />
              <UserActivityAudit
                data={mockUserAuditData}
                globalSearch={globalSearch}
                dateRange={dateRange}
                customDateFrom={customDateFrom}
                customDateTo={customDateTo}
              />
            </div>
          )}

          {activeCategory === "change" && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <h2 className="text-base font-semibold text-slate-800">变更审计</h2>
              <p className="mt-2 text-sm text-slate-500">用于展示策略、命令和配置对象的创建、更新、删除及版本变化。</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
