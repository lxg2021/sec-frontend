"use client"

import { ChevronDown, History, Loader2, UserRound } from "lucide-react"

import type {
  AttackWorkflowEventItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import {
  normalizeWorkflowStatus,
  workflowEventComment,
  workflowEventTime,
} from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

const STATUS_LABELS: Record<AttackWorkflowStatus, string> = {
  detected: "Detected",
  investigating: "Investigating",
  confirmed: "Confirmed",
  forensics: "Forensics",
  responding: "Responding",
  contained: "Contained",
  remediated: "Remediated",
  closed: "Closed",
}

interface AttackWorkflowEventsTableProps {
  events: AttackWorkflowEventItem[]
  loading?: boolean
}

interface EventPayloadDisplay {
  isJson: boolean
  raw: string
  summary: string
}

function displayValue(value?: string | number) {
  const normalized = String(value ?? "").trim()
  return normalized || "-"
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : displayValue(status)
}

function compactPayloadValue(value: unknown) {
  if (value == null) return ""
  if (typeof value === "string") {
    if (value.length <= 22) return value
    return `...${value.slice(-18)}`
  }
  if (typeof value === "number" || typeof value === "boolean")
    return String(value)
  if (Array.isArray(value)) return `${value.length} items`
  return "object"
}

function summarizeJsonPayload(value: unknown) {
  if (Array.isArray(value)) return `${value.length} payload items`
  if (!value || typeof value !== "object")
    return displayValue(String(value ?? ""))

  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  const priorityKeys = [
    "comment",
    "trigger_source",
    "request_id",
    "case_id",
    "workflow_id",
    "close_reason",
    "status",
  ]
  const summaryParts = priorityKeys
    .filter((key) => key in record)
    .map((key) => {
      const compactValue = compactPayloadValue(record[key])
      return compactValue ? `${key}: ${compactValue}` : ""
    })
    .filter(Boolean)

  if (summaryParts.length > 0) return summaryParts.slice(0, 3).join(" · ")
  return `${keys.length} payload ${keys.length === 1 ? "field" : "fields"}`
}

function eventPayloadDisplay(
  event: AttackWorkflowEventItem,
): EventPayloadDisplay {
  const comment = workflowEventComment(event).trim()
  if (comment) {
    return {
      isJson: false,
      raw: comment,
      summary: comment,
    }
  }

  const rawPayload = event.payload_json?.trim() || ""
  if (!rawPayload) {
    return {
      isJson: false,
      raw: "",
      summary: "-",
    }
  }

  try {
    const parsed = JSON.parse(rawPayload) as unknown
    return {
      isJson: true,
      raw: JSON.stringify(parsed, null, 2),
      summary: summarizeJsonPayload(parsed),
    }
  } catch {
    return {
      isJson: false,
      raw: rawPayload,
      summary: rawPayload,
    }
  }
}

function eventOperatorName(event: AttackWorkflowEventItem) {
  return event.operator_name || event.operator_id || "-"
}

function EventTransition({ event }: { event: AttackWorkflowEventItem }) {
  const oldStatus = event.old_status ? statusLabel(event.old_status) : "-"
  const newStatus = event.new_status ? statusLabel(event.new_status) : "-"

  return (
    <div className="grid w-full min-w-0 grid-cols-[7.25rem_1.5rem_minmax(0,1fr)] items-center text-sm leading-5">
      <span
        className="min-w-0 truncate whitespace-nowrap text-slate-500"
        title={oldStatus}
      >
        {oldStatus}
      </span>
      <span className="shrink-0 text-center text-slate-300">-&gt;</span>
      <span
        className="min-w-0 truncate whitespace-nowrap font-semibold text-slate-950"
        title={newStatus}
      >
        {newStatus}
      </span>
    </div>
  )
}

function PayloadPreview({ payload }: { payload: EventPayloadDisplay }) {
  if (!payload.isJson) {
    return (
      <div
        className="line-clamp-2 max-w-[52rem] break-all text-xs leading-5 text-slate-600"
        title={payload.raw || payload.summary}
      >
        {payload.summary}
      </div>
    )
  }

  return (
    <details className="group max-w-[52rem]">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md py-0.5 text-xs text-slate-700 transition-colors hover:text-slate-950 [&::-webkit-details-marker]:hidden">
        <Badge
          variant="outline"
          className="shrink-0 rounded-full border-slate-200 bg-slate-50 px-2 py-0 text-[10px] font-medium text-slate-500"
        >
          Payload
        </Badge>
        <span className="min-w-0 flex-1 truncate font-medium">
          {payload.summary}
        </span>
        <ChevronDown
          className="size-3.5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <pre className="mt-2 max-h-36 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] leading-5 text-slate-500">
        {payload.raw}
      </pre>
    </details>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      No workflow event has been recorded yet.
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      <Loader2 className="mr-2 size-4 animate-spin text-sky-500" />
      Loading workflow events...
    </div>
  )
}

function EventMobileCard({ event }: { event: AttackWorkflowEventItem }) {
  const payload = eventPayloadDisplay(event)
  const operator = eventOperatorName(event)

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-slate-500">
            {workflowEventTime(event)}
          </div>
          <div className="mt-1">
            <EventTransition event={event} />
          </div>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 rounded-full border-slate-200 bg-slate-50 text-slate-600"
        >
          {displayValue(event.event_type)}
        </Badge>
      </div>
      <div className="mt-3">
        <PayloadPreview payload={payload} />
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-slate-500">
        <UserRound className="size-3.5 shrink-0 text-slate-400" />
        <span className="truncate font-medium text-slate-700">{operator}</span>
        <span className="shrink-0 text-slate-300">/</span>
        <span className="truncate font-mono">
          {displayValue(event.operator_type)} /{" "}
          {displayValue(event.operator_id)}
        </span>
      </div>
    </article>
  )
}

export function AttackWorkflowEventsTable({
  events,
  loading = false,
}: AttackWorkflowEventsTableProps) {
  if (loading) return <LoadingState />
  if (events.length === 0) return <EmptyState />

  return (
    <div className="min-w-0">
      <div className="grid gap-3 md:hidden">
        {events.map((event) => (
          <EventMobileCard
            key={`${event.event_id}:${event.event_key}:${event.created_at}`}
            event={event}
          />
        ))}
      </div>

      <div className="hidden min-w-0 rounded-xl border border-slate-200 md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50">
            <TableRow className="hover:bg-slate-50">
              <TableHead className="h-11 w-[13rem] text-xs font-semibold text-slate-500">
                Time
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                Transition
              </TableHead>
              <TableHead className="h-11 min-w-[28rem] text-xs font-semibold text-slate-500">
                Comment / payload
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                Operator
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const payload = eventPayloadDisplay(event)
              const operator = eventOperatorName(event)

              return (
                <TableRow
                  key={`${event.event_id}:${event.event_key}:${event.created_at}`}
                  className="hover:bg-slate-50/80"
                >
                  <TableCell className="whitespace-nowrap py-3 align-top font-mono text-xs text-slate-500">
                    {workflowEventTime(event)}
                  </TableCell>
                  <TableCell className="py-3 align-top text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <History className="size-3.5 shrink-0 text-slate-400" />
                      <EventTransition event={event} />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <PayloadPreview payload={payload} />
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <div className="flex min-w-0 items-start gap-2">
                      <UserRound className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-medium text-slate-700"
                          title={operator}
                        >
                          {operator}
                        </div>
                        <div
                          className={cn(
                            "mt-1 truncate font-mono text-[11px] text-slate-400",
                          )}
                          title={`${displayValue(event.operator_type)} / ${displayValue(event.operator_id)}`}
                        >
                          {displayValue(event.operator_type)} /{" "}
                          {displayValue(event.operator_id)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
