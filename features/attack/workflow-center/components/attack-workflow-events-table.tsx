"use client"

import { ChevronDown, History, Loader2, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"

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
  detected: "statuses.detected",
  investigating: "statuses.investigating",
  confirmed: "statuses.confirmed",
  forensics: "statuses.forensics",
  responding: "statuses.responding",
  contained: "statuses.contained",
  remediated: "statuses.remediated",
  closed: "statuses.closed",
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

type WorkflowCenterT = ReturnType<typeof useTranslations>

function displayValue(value?: string | number) {
  const normalized = String(value ?? "").trim()
  return normalized || "-"
}

function statusLabel(t: WorkflowCenterT, status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? t(STATUS_LABELS[normalized]) : displayValue(status)
}

function compactPayloadValue(t: WorkflowCenterT, value: unknown) {
  if (value == null) return ""
  if (typeof value === "string") {
    if (value.length <= 22) return value
    return `...${value.slice(-18)}`
  }
  if (typeof value === "number" || typeof value === "boolean")
    return String(value)
  if (Array.isArray(value))
    return t("events.payloadItems", { count: value.length })
  return t("events.payloadObject")
}

function summarizeJsonPayload(t: WorkflowCenterT, value: unknown) {
  if (Array.isArray(value))
    return t("events.payloadItems", { count: value.length })
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
      const compactValue = compactPayloadValue(t, record[key])
      return compactValue ? `${key}: ${compactValue}` : ""
    })
    .filter(Boolean)

  if (summaryParts.length > 0) return summaryParts.slice(0, 3).join(" / ")
  return t("events.payloadFields", { count: keys.length })
}

function eventPayloadDisplay(
  t: WorkflowCenterT,
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
      summary: summarizeJsonPayload(t, parsed),
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

function EventTransition({
  event,
  t,
}: {
  event: AttackWorkflowEventItem
  t: WorkflowCenterT
}) {
  const oldStatus = event.old_status ? statusLabel(t, event.old_status) : "-"
  const newStatus = event.new_status ? statusLabel(t, event.new_status) : "-"

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

function PayloadPreview({
  payload,
  t,
}: {
  payload: EventPayloadDisplay
  t: WorkflowCenterT
}) {
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
          {t("events.payload")}
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

function EmptyState({ t }: { t: WorkflowCenterT }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {t("events.empty")}
    </div>
  )
}

function LoadingState({ t }: { t: WorkflowCenterT }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      <Loader2 className="mr-2 size-4 animate-spin text-sky-500" />
      {t("events.loading")}
    </div>
  )
}

function EventMobileCard({
  event,
  t,
}: {
  event: AttackWorkflowEventItem
  t: WorkflowCenterT
}) {
  const payload = eventPayloadDisplay(t, event)
  const operator = eventOperatorName(event)

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-slate-500">
            {workflowEventTime(event)}
          </div>
          <div className="mt-1">
            <EventTransition event={event} t={t} />
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
        <PayloadPreview payload={payload} t={t} />
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
  const t = useTranslations("pages.attack.workflowCenter")

  if (loading) return <LoadingState t={t} />
  if (events.length === 0) return <EmptyState t={t} />

  return (
    <div className="min-w-0">
      <div className="grid gap-3 md:hidden">
        {events.map((event) => (
          <EventMobileCard
            key={`${event.event_id}:${event.event_key}:${event.created_at}`}
            event={event}
            t={t}
          />
        ))}
      </div>

      <div className="hidden min-w-0 rounded-xl border border-slate-200 md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50">
            <TableRow className="hover:bg-slate-50">
              <TableHead className="h-11 w-[13rem] text-xs font-semibold text-slate-500">
                {t("events.columns.time")}
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                {t("events.columns.transition")}
              </TableHead>
              <TableHead className="h-11 min-w-[28rem] text-xs font-semibold text-slate-500">
                {t("events.columns.commentPayload")}
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                {t("events.columns.operator")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const payload = eventPayloadDisplay(t, event)
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
                      <EventTransition event={event} t={t} />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <PayloadPreview payload={payload} t={t} />
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
