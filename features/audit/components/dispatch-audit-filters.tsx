"use client"

import { CalendarDays, RotateCcw, Search, SlidersHorizontal } from "lucide-react"
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

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm font-normal text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"

export function DispatchAuditFilters({
  dispatchType,
  result,
  actor,
  keyword,
  onDispatchTypeChange,
  onResultChange,
  onActorChange,
  onKeywordChange,
  onReset,
}: DispatchAuditFiltersProps) {
  return (
    <section
      className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      aria-labelledby="dispatch-filter-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="dispatch-filter-title" className="text-sm font-semibold text-foreground">
              下发审计筛选
            </h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              按下发类型、执行状态、操作者和目标范围查询
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          重置
        </button>
      </header>

      <div className="grid gap-x-4 gap-y-4 p-5 sm:grid-cols-2 xl:grid-cols-[160px_160px_160px_160px_minmax(280px,1fr)] 2xl:grid-cols-[180px_180px_180px_180px_minmax(360px,1fr)]">
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">时间范围</span>
          <span className={`${fieldClass} flex cursor-default items-center gap-2`}>
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">最近 7 天</span>
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="sr-only">下发类型</span>
          <select
            value={dispatchType}
            onChange={(event) => onDispatchTypeChange(event.target.value as DispatchType)}
            className={fieldClass}
          >
            {Object.entries(dispatchTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="sr-only">执行状态</span>
          <select
            value={result}
            onChange={(event) => onResultChange(event.target.value as AuditResult)}
            className={fieldClass}
          >
            {Object.entries(auditResultLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="sr-only">操作者</span>
          <input
            value={actor}
            onChange={(event) => onActorChange(event.target.value)}
            placeholder="用户 / ID"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
          <span className="sr-only">关键字</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="对象名称、任务 ID、主机或 Agent"
              className={`${fieldClass} pl-10`}
            />
          </span>
        </label>
      </div>
    </section>
  )
}


