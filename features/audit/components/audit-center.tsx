"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, RefreshCw, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { AuditCategoryTabs } from "./audit-category-tabs"
import { AuditEventDetail } from "./audit-event-detail"
import { AuditSummary } from "./audit-summary"
import { DispatchAuditFilters } from "./dispatch-audit-filters"
import { DispatchAuditTable } from "./dispatch-audit-table"
import { GlobalFilters } from "./global-filters"
import { UserActivityAudit } from "./user-activity-audit"
import { mockDispatchAuditEvents } from "@/features/audit/mock/dispatch-audit-events"
import { mockUserAuditData } from "@/features/audit/mock/user-audit"
import type { AuditCategory, AuditResult, DispatchType } from "@/features/audit/types"

export type AuditTab = "task" | "user" | "defense" | "disposition"

export function AuditCenter() {
  const t = useTranslations("pages.reports")
  const [activeCategory, setActiveCategory] = useState<AuditCategory>("dispatch")
  const [dispatchType, setDispatchType] = useState<DispatchType>("all")
  const [result, setResult] = useState<AuditResult>("all")
  const [actor, setActor] = useState("")
  const [keyword, setKeyword] = useState("")
  const [selectedId, setSelectedId] = useState<string>()
  const [globalSearch, setGlobalSearch] = useState("")
  const [dateRange, setDateRange] = useState("7d")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()

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

    return mockDispatchAuditEvents.filter((event) => {
      const typeMatched = dispatchType === "all" || event.dispatchType === dispatchType
      const resultMatched = result === "all" || event.result === result
      const actorMatched = !normalizedActor || `${event.actorName} ${event.actorId}`.toLowerCase().includes(normalizedActor)
      const keywordMatched = !normalizedKeyword || [event.objectName, event.taskId, event.operationId, event.targetSummary, event.agentSummary].join(" ").toLowerCase().includes(normalizedKeyword)
      return typeMatched && resultMatched && actorMatched && keywordMatched
    })
  }, [actor, dispatchType, keyword, result])

  const selectedEvent = filteredEvents.find((event) => event.id === selectedId)
    ?? mockDispatchAuditEvents.find((event) => event.id === selectedId)
  const abnormalCount = filteredEvents.filter((event) => event.result === "failed" || event.result === "timeout").length

  const resetFilters = () => {
    setDispatchType("all")
    setResult("all")
    setActor("")
    setKeyword("")
    setSelectedId(undefined)
  }

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100 p-4">
      <div className="flex h-full min-h-0 w-full flex-col gap-3">
        <header className="w-full shrink-0 rounded-[28px] border border-slate-200/80 bg-white px-5 py-[13px] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4 xl:w-[260px] xl:flex-none 2xl:w-[430px]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100 text-blue-600">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1.5">
                <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">{t("title")}</h1>
                <p className="min-w-0 truncate text-sm text-slate-500">下发审计 · 用户审计 · 变更审计</p>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-1 flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap xl:justify-end 2xl:gap-3">
              <AuditCategoryTabs
                value={activeCategory}
                onChange={(category) => {
                  setActiveCategory(category)
                  setSelectedId(undefined)
                }}
              />
              <span className="hidden h-6 w-px shrink-0 bg-slate-200 xl:block" aria-hidden="true" />
              <button type="button" className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <Download className="h-4 w-4" aria-hidden="true" />
                导出记录
              </button>
              <span className="hidden h-6 w-px shrink-0 bg-slate-200 xl:block" aria-hidden="true" />
              <button type="button" className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                自动刷新
              </button>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
          {activeCategory === "dispatch" && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <DispatchAuditFilters
                dispatchType={dispatchType}
                result={result}
                actor={actor}
                keyword={keyword}
                onDispatchTypeChange={setDispatchType}
                onResultChange={setResult}
                onActorChange={setActor}
                onKeywordChange={setKeyword}
                onReset={resetFilters}
              />
              <AuditSummary
                total={filteredEvents.length}
                policy={filteredEvents.filter((event) => event.dispatchType === "policy").length}
                command={filteredEvents.filter((event) => event.dispatchType === "command").length}
                config={filteredEvents.filter((event) => event.dispatchType === "config").length}
                abnormal={abnormalCount}
              />
              <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
                <DispatchAuditTable events={filteredEvents} selectedId={selectedEvent?.id} onSelect={(event) => setSelectedId(event.id)} />
                <AuditEventDetail event={selectedEvent} onClose={() => setSelectedId(undefined)} />
              </div>
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







