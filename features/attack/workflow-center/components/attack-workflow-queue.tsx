"use client"

import { useId, useMemo, type ReactNode } from "react"
import {
  AlertCircle,
  ChevronRight,
  CircleDot,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

import type { AttackWorkflowStatus } from "@/features/attack/workflow/types"
import { cn } from "@/shared/lib/utils"

export type AttackWorkflowQueueStatusScope = "open" | "all" | "closed"

export interface AttackWorkflowQueueFilters {
  statusScope: AttackWorkflowQueueStatusScope
  statuses: string[]
  severities: string[]
  pendingOnly?: boolean
}

export interface AttackWorkflowQueueItem {
  workflow_id: string
  case_id: string
  tenant_id?: string
  title: string
  severity: string
  status: AttackWorkflowStatus | string
  recommended_next_status?: AttackWorkflowStatus | string
  next_action_label?: string
  primary_agent_id?: string
  agent_ids?: string[]
  rule_ids?: string[]
  detected_at?: string
  updated_at?: string
  open_action_count?: number
  event_count?: number
}

export interface AttackWorkflowQueueProps {
  items: AttackWorkflowQueueItem[]
  selectedWorkflowId?: string
  selectedCaseId?: string
  loading?: boolean
  refreshing?: boolean
  error?: string
  keyword: string
  filters: AttackWorkflowQueueFilters
  onKeywordChange: (keyword: string) => void
  onFiltersChange: (filters: AttackWorkflowQueueFilters) => void
  onSelectWorkflow: (item: AttackWorkflowQueueItem) => void
  onRefresh: () => void
  total?: number
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  className?: string
}

const STATUS_OPTIONS: { value: AttackWorkflowStatus; label: string }[] = [
  { value: "detected", label: "Detected" },
  { value: "investigating", label: "Investigating" },
  { value: "confirmed", label: "Confirmed" },
  { value: "forensics", label: "Forensics" },
  { value: "responding", label: "Responding" },
  { value: "contained", label: "Contained" },
  { value: "remediated", label: "Remediated" },
  { value: "closed", label: "Closed" },
]

const SEVERITY_OPTIONS: { value: string; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
]

const SCOPE_OPTIONS: { value: AttackWorkflowQueueStatusScope; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
  { value: "closed", label: "Closed" },
]

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((status) => [status.value, status.label]),
)

const STATUS_BADGE: Record<string, string> = {
  detected: "bg-slate-100 text-slate-700 ring-slate-200",
  investigating: "bg-blue-50 text-blue-700 ring-blue-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  forensics: "bg-violet-50 text-violet-700 ring-violet-200",
  responding: "bg-amber-50 text-amber-700 ring-amber-200",
  contained: "bg-teal-50 text-teal-700 ring-teal-200",
  remediated: "bg-green-50 text-green-700 ring-green-200",
  closed: "bg-slate-100 text-slate-500 ring-slate-200",
}

const STATUS_DOT: Record<string, string> = {
  detected: "bg-slate-400",
  investigating: "bg-blue-500",
  confirmed: "bg-emerald-500",
  forensics: "bg-violet-500",
  responding: "bg-amber-500",
  contained: "bg-teal-500",
  remediated: "bg-green-500",
  closed: "bg-slate-400",
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
  high: "bg-red-50 text-red-700 ring-red-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-blue-50 text-blue-700 ring-blue-200",
  info: "bg-slate-100 text-slate-600 ring-slate-200",
  unknown: "bg-slate-100 text-slate-600 ring-slate-200",
}

const NEXT_ACTION_FALLBACK: Record<string, string> = {
  detected: "Start investigation",
  investigating: "Open Threat Analysis",
  confirmed: "Start Forensics",
  forensics: "Review Evidence",
  responding: "Open Response",
  contained: "Verify Containment",
  remediated: "Close Workflow",
  closed: "Resolved",
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase()
}

function statusLabel(status: string) {
  const normalized = normalizeToken(status)
  return (STATUS_LABELS[normalized] ?? status.trim()) || "Unknown"
}

function severityLabel(severity: string) {
  const normalized = severity.trim().toLowerCase()
  if (!normalized) return "Unknown"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function nextActionText(item: AttackWorkflowQueueItem) {
  if (item.next_action_label?.trim()) return item.next_action_label.trim()
  return NEXT_ACTION_FALLBACK[normalizeToken(String(item.status))] ?? "Review workflow"
}

function formatTime(item: AttackWorkflowQueueItem) {
  const raw = item.updated_at?.trim() || item.detected_at?.trim()
  if (!raw) return "-"
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function agentSummary(item: AttackWorkflowQueueItem) {
  const ids = item.agent_ids ?? []
  if (item.primary_agent_id?.trim()) return item.primary_agent_id.trim()
  if (ids.length === 1) return ids[0]
  if (ids.length > 1) return `${ids.length} agents`
  return ""
}

function ruleSummary(item: AttackWorkflowQueueItem) {
  const count = item.rule_ids?.length ?? 0
  if (count <= 0) return ""
  return `${count} ${count === 1 ? "rule" : "rules"}`
}

function isClosedStatus(status: string) {
  return normalizeToken(status) === "closed"
}

function filtersAreActive(keyword: string, filters: AttackWorkflowQueueFilters) {
  return (
    keyword.trim().length > 0 ||
    filters.statusScope !== "open" ||
    filters.statuses.length > 0 ||
    filters.severities.length > 0 ||
    Boolean(filters.pendingOnly)
  )
}

export function AttackWorkflowQueue({
  items,
  selectedWorkflowId,
  selectedCaseId,
  loading = false,
  refreshing = false,
  error,
  keyword,
  filters,
  onKeywordChange,
  onFiltersChange,
  onSelectWorkflow,
  onRefresh,
  total,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  className,
}: AttackWorkflowQueueProps) {
  const searchId = useId()
  const statusId = useId()
  const severityId = useId()

  const showSkeletons = loading && items.length === 0
  const showEmpty = !loading && !showSkeletons && items.length === 0
  const hasActiveFilters = useMemo(
    () => filtersAreActive(keyword, filters),
    [keyword, filters],
  )
  const selectedStatus = filters.statuses[0] ?? ""
  const selectedSeverity = filters.severities[0] ?? ""

  function handleScope(scope: AttackWorkflowQueueStatusScope) {
    if (scope === filters.statusScope) return
    onFiltersChange({ ...filters, statusScope: scope })
  }

  function handleStatus(value: string) {
    onFiltersChange({ ...filters, statuses: value ? [value] : [] })
  }

  function handleSeverity(value: string) {
    onFiltersChange({ ...filters, severities: value ? [value] : [] })
  }

  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        "max-h-[60dvh] lg:max-h-none",
        className,
      )}
      aria-label="Workflow queue"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">
            Workflow Queue
          </h2>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            Open attack workflows
            {typeof total === "number" ? (
              <>
                {" / "}
                <span className="font-medium text-slate-600">
                  {items.length < total ? `${items.length} of ${total}` : total}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh workflow queue"
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600",
            "transition-colors hover:bg-slate-50 hover:text-slate-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
        </button>
      </header>

      <div className="flex flex-col gap-2.5 border-b border-slate-100 bg-white px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="text"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Search case id / title / agent / rule"
            aria-label="Search workflow queue"
            className={cn(
              "h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm text-slate-900 placeholder:text-slate-400",
              "focus-visible:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
            )}
          />
          {keyword.length > 0 ? (
            <button
              type="button"
              onClick={() => onKeywordChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Workflow scope"
          className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
        >
          {SCOPE_OPTIONS.map((option) => {
            const active = filters.statusScope === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => handleScope(option.value)}
                className={cn(
                  "h-7 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  active
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={statusId} className="sr-only">
              Filter by status
            </label>
            <select
              id={statusId}
              value={selectedStatus}
              onChange={(event) => handleStatus(event.target.value)}
              className={cn(
                "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700",
                "focus-visible:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
              )}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={severityId} className="sr-only">
              Filter by severity
            </label>
            <select
              id={severityId}
              value={selectedSeverity}
              onChange={(event) => handleSeverity(event.target.value)}
              className={cn(
                "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700",
                "focus-visible:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
              )}
            >
              <option value="">All severities</option>
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{error}</span>
            <button
              type="button"
              onClick={onRefresh}
              className="shrink-0 rounded font-medium text-rose-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {showSkeletons ? (
          <ul className="flex flex-col gap-2" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <li
                key={index}
                className="rounded-xl border border-slate-100 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              </li>
            ))}
          </ul>
        ) : showEmpty ? (
          <EmptyState hasActiveFilters={hasActiveFilters} error={error} />
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const selected =
                  (selectedWorkflowId != null &&
                    item.workflow_id === selectedWorkflowId) ||
                  (selectedCaseId != null && item.case_id === selectedCaseId)

                return (
                  <li key={item.workflow_id || item.case_id}>
                    <QueueItemCard
                      item={item}
                      selected={selected}
                      onSelect={onSelectWorkflow}
                    />
                  </li>
                )
              })}
            </ul>

            {hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className={cn(
                  "mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700",
                  "transition-colors hover:bg-slate-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {loadingMore ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

function QueueItemCard({
  item,
  selected,
  onSelect,
}: {
  item: AttackWorkflowQueueItem
  selected: boolean
  onSelect: (item: AttackWorkflowQueueItem) => void
}) {
  const severity = normalizeToken(item.severity || "unknown")
  const status = normalizeToken(String(item.status))
  const closed = isClosedStatus(status)
  const agent = agentSummary(item)
  const rules = ruleSummary(item)
  const time = formatTime(item)

  return (
    <button
      type="button"
      aria-selected={selected}
      onClick={() => onSelect(item)}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border p-3 pl-3.5 text-left transition-all duration-150",
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        selected
          ? "border-blue-300 bg-blue-50/60 shadow-sm before:bg-blue-600"
          : "border-slate-200 bg-white before:bg-transparent hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <CircleDot
            className={cn(
              "size-3.5 shrink-0",
              selected ? "text-blue-600" : "text-slate-400",
            )}
            aria-hidden="true"
          />
          <span className="truncate font-mono text-xs font-medium text-slate-700">
            {item.case_id || item.workflow_id || "-"}
          </span>
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full py-0.5 pl-1.5 pr-2 text-[11px] font-medium ring-1 ring-inset",
            STATUS_BADGE[status] ?? STATUS_BADGE.detected,
          )}
        >
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              STATUS_DOT[status] ?? STATUS_DOT.detected,
            )}
            aria-hidden="true"
          />
          {statusLabel(status)}
        </span>
      </div>

      <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
        {item.title || "Untitled workflow"}
      </h3>

      <p
        className={cn(
          "mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
          closed
            ? "text-slate-500"
            : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
        )}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0",
            closed ? "" : "transition-transform group-hover:translate-x-0.5",
          )}
          aria-hidden="true"
        />
        <span className="truncate">
          {closed ? nextActionText(item) : `Next: ${nextActionText(item)}`}
        </span>
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 font-medium ring-1 ring-inset",
            SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.unknown,
          )}
        >
          {severityLabel(severity)}
        </span>
        {agent ? <MetaChip>{agent}</MetaChip> : null}
        {rules ? <MetaChip>{rules}</MetaChip> : null}
        {typeof item.open_action_count === "number" &&
        item.open_action_count > 0 ? (
          <MetaChip>{`${item.open_action_count} open`}</MetaChip>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1 text-slate-400">
          <Clock3 className="size-3" aria-hidden="true" />
          {time}
        </span>
      </div>
    </button>
  )
}

function MetaChip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center text-slate-500">{children}</span>
}

function EmptyState({
  hasActiveFilters,
  error,
}: {
  hasActiveFilters: boolean
  error?: string
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-slate-700">
          Failed to load workflow queue.
        </p>
        <p className="max-w-[18rem] text-xs text-slate-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-slate-700">
        {hasActiveFilters
          ? "No workflow matches the current filters."
          : "No workflow case is waiting for action."}
      </p>
      <a
        href="/frame/attack/detail"
        className="text-xs font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Open Attack Cases
      </a>
    </div>
  )
}

export default AttackWorkflowQueue
