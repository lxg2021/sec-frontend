"use client"

import { History, Loader2, UserRound } from "lucide-react"

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

function displayValue(value?: string | number) {
  const normalized = String(value ?? "").trim()
  return normalized || "-"
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : displayValue(status)
}

function eventPayloadText(event: AttackWorkflowEventItem) {
  return workflowEventComment(event) || event.payload_json || "-"
}

function eventOperatorName(event: AttackWorkflowEventItem) {
  return event.operator_name || event.operator_id || "-"
}

function EventTransition({ event }: { event: AttackWorkflowEventItem }) {
  const oldStatus = event.old_status ? statusLabel(event.old_status) : "-"
  const newStatus = event.new_status ? statusLabel(event.new_status) : "-"

  return (
    <div className="grid w-full min-w-0 grid-cols-[7.25rem_1.5rem_minmax(0,1fr)] items-center text-sm leading-5">
      <span className="min-w-0 truncate whitespace-nowrap text-slate-500" title={oldStatus}>
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
  const payload = eventPayloadText(event)
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
      <div
        className="mt-3 line-clamp-3 break-all font-mono text-xs leading-5 text-slate-600"
        title={payload}
      >
        {payload}
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-slate-500">
        <UserRound className="size-3.5 shrink-0 text-slate-400" />
        <span className="truncate font-medium text-slate-700">{operator}</span>
        <span className="shrink-0 text-slate-300">/</span>
        <span className="truncate font-mono">
          {displayValue(event.operator_type)} / {displayValue(event.operator_id)}
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
              const payload = eventPayloadText(event)
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
                    <div
                      className="line-clamp-2 max-w-[52rem] break-all font-mono text-xs leading-5 text-slate-600"
                      title={payload}
                    >
                      {payload}
                    </div>
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
