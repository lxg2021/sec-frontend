"use client"

import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react"
import type { AuditResult, DispatchType } from "@/features/audit/types"
import { auditResultLabels, dispatchTypeLabels } from "@/features/audit/types"

interface DispatchAuditFiltersProps {
  dispatchType: DispatchType
  result: AuditResult
  actor: string
  keyword: string
  onDispatchTypeChange: (value: DispatchType) => void
  onResultChange: (value: AuditResult) => void
  onActorChange: (value: string) => void
  onKeywordChange: (value: string) => void
  onReset: () => void
}

export function DispatchAuditFilters({ dispatchType, result, actor, keyword, onDispatchTypeChange, onResultChange, onActorChange, onKeywordChange, onReset }: DispatchAuditFiltersProps) {
  return (
    <section className="shrink-0 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-slate-50 p-4" aria-labelledby="dispatch-filter-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <div><h2 id="dispatch-filter-title" className="text-sm font-semibold text-slate-800">下发审计筛选</h2><p className="text-xs text-slate-500">按下发类型、执行状态、操作者和目标范围查询</p></div>
        </div>
        <button type="button" onClick={onReset} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-medium text-slate-500 hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="h-3.5 w-3.5" aria-hidden="true" />重置</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[140px_140px_140px_minmax(200px,1fr)_130px] 2xl:grid-cols-[180px_180px_180px_minmax(240px,1fr)_160px]">
        <label className="space-y-1.5 text-xs font-medium text-slate-600"><span>时间范围</span><span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-normal text-slate-700"><CalendarDays className="h-4 w-4 text-blue-500" aria-hidden="true" />最近 7 天</span></label>
        <label className="space-y-1.5 text-xs font-medium text-slate-600"><span>下发类型</span><select value={dispatchType} onChange={(event) => onDispatchTypeChange(event.target.value as DispatchType)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{Object.entries(dispatchTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1.5 text-xs font-medium text-slate-600"><span>执行状态</span><select value={result} onChange={(event) => onResultChange(event.target.value as AuditResult)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{Object.entries(auditResultLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1.5 text-xs font-medium text-slate-600"><span>关键字</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="对象名称、任务 ID、主机或 Agent" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></span></label>
        <label className="space-y-1.5 text-xs font-medium text-slate-600"><span>操作者</span><input value={actor} onChange={(event) => onActorChange(event.target.value)} placeholder="用户 / ID" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
      </div>
    </section>
  )
}



