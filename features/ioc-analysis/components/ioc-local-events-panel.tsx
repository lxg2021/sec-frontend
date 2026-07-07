"use client"

import { useState } from "react"
import { CalendarClock, ChevronLeft, ChevronRight, ExternalLink, FileJson, Loader2, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  BatchDescribeEventSourceItem,
  EventSourceDescription,
  EventSourceDescriptionSlot,
} from "@/features/attack/dashboard/types"
import {
  localEventAgent,
  localEventDescriptionKey,
  localEventKey,
  localEventStringField,
  localEventSummary,
  localEventTime,
  localEventUniqueId,
  parseLocalEventContent,
  type IocLocalEventSource,
} from "@/features/ioc-analysis/components/ioc-search-event-utils"
import { IocPanelEmptyState } from "@/features/ioc-analysis/components/ioc-panel-empty-state"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type LocalLocateStatus = "idle" | "loading" | "success" | "unsupported" | "error"
type LocalTimeRangeMode = "30d" | "90d" | "custom"

export type IocLocalEventDescriptionMap = Record<string, BatchDescribeEventSourceItem | undefined>

export type IocLocalLocatePanelResult = {
  status: LocalLocateStatus
  message: string
  source: string
  positionType: number | null
  items: IocLocalEventSource[]
  rangeLabel: string
  pageToken: string
  nextPageToken: string
  hasNext: boolean
}

type LocalEventRowMeta = {
  actor: string
  context: string
  endpoint: string
  event: string
  target: string
  time: string
  type: string
}

function cleanText(value?: string | null) {
  return (value || "").trim()
}

function valueOrDash(value?: string | null) {
  return cleanText(value) || "-"
}

function lowerDisplayValue(value?: string | null) {
  const text = valueOrDash(value)
  return text === "-" ? text : text.toLocaleLowerCase()
}

function sameDisplayValue(left?: string | null, right?: string | null) {
  const normalizedLeft = cleanText(left).toLocaleLowerCase()
  const normalizedRight = cleanText(right).toLocaleLowerCase()
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight)
}

function flattenSlots(slots: EventSourceDescriptionSlot[] = []): EventSourceDescriptionSlot[] {
  const flattened: EventSourceDescriptionSlot[] = []
  for (const slot of slots) {
    flattened.push(slot)
    if (slot.children?.length) {
      flattened.push(...flattenSlots(slot.children))
    }
  }
  return flattened
}

function slotValue(slot?: EventSourceDescriptionSlot) {
  if (!slot) return ""
  return cleanText(slot.display_value) || cleanText(slot.raw_value) || cleanText(slot.label)
}

function findSlotValue(
  slots: EventSourceDescriptionSlot[],
  predicate: (slot: EventSourceDescriptionSlot) => boolean,
) {
  return slotValue(slots.find((slot) => predicate(slot) && Boolean(slotValue(slot))))
}

function fieldValue(content: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const raw = content[key]
    if (Array.isArray(raw)) {
      const joined = raw
        .map((item) => typeof item === "string" || typeof item === "number" ? String(item).trim() : "")
        .filter(Boolean)
        .join(", ")
      if (joined) return joined
    }
    if (typeof raw === "boolean") return String(raw)
  }
  return localEventStringField(content, ...keys)
}

function networkEndpoint(content: Record<string, unknown>, ipKeys: string[], portKeys: string[]) {
  const ip = fieldValue(content, ...ipKeys)
  const port = fieldValue(content, ...portKeys)
  if (!ip) return ""
  return port ? `${ip}:${port}` : ip
}

function networkPair(content: Record<string, unknown>) {
  const source = networkEndpoint(content, ["SourceIP", "SourceIp", "LocalIP", "LocalIp"], ["SourcePort", "LocalPort"])
  const destination = networkEndpoint(
    content,
    ["DestinationIP", "DestinationIp", "RemoteIP", "RemoteIp", "Ip", "IP"],
    ["DestinationPort", "RemotePort"],
  )
  if (source && destination) return `${source} -> ${destination}`
  return destination || source
}

function describeActor(content: Record<string, unknown>, slots: EventSourceDescriptionSlot[]) {
  const semanticActor =
    findSlotValue(slots, (slot) => ["actor", "operator", "parent"].includes(slot.role)) ||
    findSlotValue(slots, (slot) => slot.slot_id.includes("actor.process") || slot.slot_id.includes("parent.process"))

  return (
    semanticActor ||
    fieldValue(content, "ProcessName", "ProcessImage", "OperatorProcessName", "ParentProcessName", "Image")
  )
}

function describeTarget({
  content,
  currentValue,
  event,
  positionType,
  slots,
}: {
  content: Record<string, unknown>
  currentValue: string
  event: IocLocalEventSource
  positionType: number | null
  slots: EventSourceDescriptionSlot[]
}) {
  const eventName = cleanText(event.event_name).toLowerCase()

  if (positionType === 1) {
    if (eventName.includes("service")) {
      return (
        fieldValue(content, "ServiceName", "ServiceDisplayName", "ServiceBinaryPathName") ||
        findSlotValue(slots, (slot) => slot.slot_id.includes("target.service") || slot.slot_id.includes("service_binary"))
      )
    }
    if (eventName.includes("driver") || eventName.includes("dll")) {
      return (
        fieldValue(content, "Image", "ImagePath", "FileName", "FilePath") ||
        findSlotValue(slots, (slot) => slot.slot_id.includes("target.image"))
      )
    }
    return (
      fieldValue(content, "ProcessName", "ProcessImage", "Image", "FileName", "FilePath") ||
      findSlotValue(slots, (slot) => slot.slot_id.includes("target.process") || slot.slot_id.includes("target.file"))
    )
  }

  if (positionType === 2) {
    return (
      fieldValue(content, "Domain", "QueryName", "DnsName", "Host", "Hostname", "URL", "Url") ||
      findSlotValue(slots, (slot) => slot.slot_id.includes("target.domain") || slot.slot_id.includes("target.url")) ||
      cleanText(currentValue)
    )
  }

  if (positionType === 3 || positionType === 4) {
    const pair = networkPair(content)
    if (pair) return pair

    const domain = fieldValue(content, "Domain", "QueryName", "DnsName")
    const resolvedIps = fieldValue(content, "IPS", "IPs", "IpList")
    if (domain && resolvedIps) return `${domain} -> ${resolvedIps}`

    return (
      fieldValue(content, "DestinationIP", "DestinationIp", "RemoteIP", "SourceIP", "SourceIp", "IPS", "IPs") ||
      findSlotValue(slots, (slot) => ["destination", "target", "source"].includes(slot.role)) ||
      cleanText(currentValue)
    )
  }

  return (
    findSlotValue(slots, (slot) => ["target", "destination", "source"].includes(slot.role) && slot.primary) ||
    findSlotValue(slots, (slot) => ["target", "destination", "source"].includes(slot.role)) ||
    cleanText(currentValue)
  )
}

function describeContext({
  actor,
  description,
  event,
  target,
}: {
  actor: string
  description?: EventSourceDescription | null
  event: IocLocalEventSource
  target: string
}) {
  const candidates = [
    cleanText(description?.summary),
    cleanText(description?.short_summary),
    localEventSummary(event),
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (!sameDisplayValue(candidate, target)) return candidate
  }

  const cleanActor = cleanText(actor)
  const cleanTarget = cleanText(target)
  if (cleanActor && cleanTarget && cleanTarget !== "-") {
    return `${cleanActor} -> ${cleanTarget}`
  }

  return cleanText(description?.title) || cleanText(event.event_name) || candidates[0] || ""
}

function buildLocalEventRowMeta({
  currentValue,
  description,
  event,
  positionType,
}: {
  currentValue: string
  description?: EventSourceDescription | null
  event: IocLocalEventSource
  positionType: number | null
}): LocalEventRowMeta {
  const content = parseLocalEventContent(event.content)
  const slots = flattenSlots(description?.slots ?? [])
  const actor = valueOrDash(describeActor(content, slots))
  const target = valueOrDash(describeTarget({ content, currentValue, event, positionType, slots }))
  const context = valueOrDash(describeContext({ actor, description, event, target }))

  return {
    actor: lowerDisplayValue(actor),
    context: lowerDisplayValue(context),
    endpoint: lowerDisplayValue(localEventAgent(event)),
    event: valueOrDash(event.event_type ? String(event.event_type) : ""),
    target: lowerDisplayValue(target),
    time: valueOrDash(localEventTime(event)),
    type: lowerDisplayValue(event.event_name || description?.source_table || (event.event_type ? String(event.event_type) : "")),
  }
}

function formatRawEventContent(event: IocLocalEventSource | null) {
  if (!event) return "{}"
  if (!event.content) return JSON.stringify(event, null, 2)

  const parsed = parseLocalEventContent(event.content)
  if (Object.keys(parsed).length > 0) return JSON.stringify(parsed, null, 2)
  return event.content
}

export function IocLocalEventsPanel({
  className,
  customEnd,
  customStart,
  descriptions = {},
  currentValue,
  graphLoadingEventKey,
  onCustomEndChange,
  onCustomStartChange,
  onNextPage,
  onLocateGraph,
  onPreviousPage,
  onRefresh,
  onTimeRangeModeChange,
  pageIndex,
  result,
  selectedEventKey,
  timeRangeLabel,
  timeRangeMode,
}: {
  className?: string
  customEnd: string
  customStart: string
  descriptions?: IocLocalEventDescriptionMap
  currentValue: string
  graphLoadingEventKey?: string
  onCustomEndChange: (value: string) => void
  onCustomStartChange: (value: string) => void
  onNextPage?: () => void
  onLocateGraph: (event: IocLocalEventSource, index: number) => void
  onPreviousPage?: () => void
  onRefresh?: () => void
  onTimeRangeModeChange: (mode: LocalTimeRangeMode) => void
  pageIndex: number
  result: IocLocalLocatePanelResult
  selectedEventKey?: string
  timeRangeLabel: string
  timeRangeMode: LocalTimeRangeMode
}) {
  const loading = result.status === "loading"
  const hasEvents = result.items.length > 0
  const t = useTranslations("pages.iocAnalysis.search.local")
  const activeRangeLabel = result.rangeLabel || timeRangeLabel
  const [rawEvent, setRawEvent] = useState<IocLocalEventSource | null>(null)
  const rawEventContent = formatRawEventContent(rawEvent)

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white", className)}>
      <div className="border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-950">{t("title")}</h2>
              <p className="mt-1 truncate text-xs text-slate-500">
                <span className="font-medium text-slate-600">{activeRangeLabel}</span>
                <span className="mx-1.5 text-slate-300">/</span>
                <code className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 ring-1 ring-slate-200">
                  {result.source || currentValue || "-"}
                </code>
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <div className="flex h-9 items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-inner shadow-slate-200/60">
              {(["30d", "90d", "custom"] as LocalTimeRangeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    "h-7 rounded-full px-3 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200",
                    timeRangeMode === mode
                      ? "bg-slate-950 text-white shadow-sm shadow-slate-300"
                      : "text-slate-500 hover:bg-white hover:text-slate-900",
                  )}
                  disabled={loading}
                  onClick={() => onTimeRangeModeChange(mode)}
                >
                  {t(`range.${mode}`)}
                </button>
              ))}
            </div>
            {onRefresh ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-blue-100 bg-blue-600 px-4 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:text-white"
                disabled={loading}
                onClick={onRefresh}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {t("refresh")}
              </Button>
            ) : null}
          </div>
        </div>

        {timeRangeMode === "custom" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
            <TimeInputField
              label={t("customStartShort")}
              ariaLabel={t("customStart")}
              disabled={loading}
              value={customStart}
              onChange={onCustomStartChange}
            />
            <span className="hidden h-px w-5 bg-slate-300 sm:block" aria-hidden="true" />
            <TimeInputField
              label={t("customEndShort")}
              ariaLabel={t("customEnd")}
              disabled={loading}
              value={customEnd}
              onChange={onCustomEndChange}
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {loading && !hasEvents ? (
          <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" />
            {t("loading")}
          </div>
        ) : null}

        {result.status === "unsupported" || result.status === "error" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            {result.message}
          </div>
        ) : null}

        {result.status === "success" && !hasEvents ? (
          <IocPanelEmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription", { range: activeRangeLabel })}
          />
        ) : null}

        {hasEvents ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100">
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
              <Table className="min-w-[1420px] table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="h-10 w-[170px] px-4 text-xs font-semibold text-slate-500">{t("columns.time")}</TableHead>
                    <TableHead className="h-10 w-[150px] px-4 text-xs font-semibold text-slate-500">{t("columns.endpoint")}</TableHead>
                    <TableHead className="h-10 w-[150px] px-4 text-xs font-semibold text-slate-500">{t("columns.type")}</TableHead>
                    <TableHead className="h-10 w-[170px] px-4 text-xs font-semibold text-slate-500">{t("columns.event")}</TableHead>
                    <TableHead className="h-10 w-[190px] px-4 text-xs font-semibold text-slate-500">{t("columns.actor")}</TableHead>
                    <TableHead className="h-10 w-[250px] px-4 text-xs font-semibold text-slate-500">{t("columns.target")}</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-semibold text-slate-500">{t("columns.context")}</TableHead>
                    <TableHead className="h-10 w-[96px] px-4 text-right text-xs font-semibold text-slate-500">{t("columns.rawData")}</TableHead>
                    <TableHead className="h-10 w-[96px] px-4 text-right text-xs font-semibold text-slate-500">{t("columns.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((event, index) => {
                    const uniqueId = localEventUniqueId(event)
                    const key = localEventKey(event, index)
                    const description = descriptions[localEventDescriptionKey(event)]?.description
                    const row = buildLocalEventRowMeta({
                      currentValue: result.source || currentValue,
                      description,
                      event,
                      positionType: result.positionType,
                    })
                    const selected = selectedEventKey === key
                    const locating = graphLoadingEventKey === key

                    return (
                      <TableRow
                        key={key}
                        className={cn(
                          "group border-slate-100 transition-colors hover:bg-blue-50/40",
                          selected && "bg-blue-50/70 hover:bg-blue-50/80"
                        )}
                      >
                        <TableCell className="px-4 py-2.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={cn("h-2 w-2 shrink-0 rounded-full", selected ? "bg-blue-600" : "bg-slate-300 group-hover:bg-blue-400")} />
                            <span className="truncate font-mono text-xs text-slate-500 tabular-nums" title={row.time}>
                              {row.time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="truncate text-sm font-normal text-slate-700" title={row.endpoint}>
                            {row.endpoint}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="truncate font-mono text-xs font-normal text-slate-600" title={row.type}>
                            {row.type}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="truncate text-sm font-normal text-slate-800" title={row.event}>
                            {row.event}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="truncate text-sm font-normal text-slate-700" title={row.actor}>
                            {row.actor}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="truncate text-sm font-normal text-slate-700" title={row.target}>
                            {row.target}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="truncate text-sm font-normal text-slate-600" title={row.context}>
                            {row.context}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full border-slate-200 bg-white px-3 text-xs hover:bg-slate-50"
                            onClick={() => setRawEvent(event)}
                          >
                            <FileJson className="h-3.5 w-3.5" />
                            {t("rawDataAction")}
                          </Button>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right">
                          <Button
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-8 rounded-full px-3 text-xs",
                              selected ? "bg-blue-600 text-white hover:bg-blue-700" : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                            disabled={!uniqueId || locating}
                            onClick={() => onLocateGraph(event, index)}
                          >
                            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                            {t("graphAction")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </div>

      {hasEvents ? (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">
            {t("pagination.page", { page: pageIndex + 1 })}
            <span className="mx-2 text-slate-300">/</span>
            {t("pagination.returned", { count: result.items.length })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-slate-200 px-3 text-xs"
              disabled={loading || !onPreviousPage || pageIndex <= 0}
              onClick={onPreviousPage}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("pagination.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-slate-200 px-3 text-xs"
              disabled={loading || !onNextPage || !result.hasNext}
              onClick={onNextPage}
            >
              {t("pagination.next")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(rawEvent)} onOpenChange={(open) => !open && setRawEvent(null)}>
        <DialogContent className="flex max-h-[86vh] max-w-4xl flex-col overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-4 py-3 pr-12">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <FileJson className="h-4 w-4 text-blue-600" />
              {t("rawDataTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto bg-white p-3">
            <pre className="rounded-lg bg-slate-950 p-4 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-100">
              {rawEventContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function TimeInputField({
  ariaLabel,
  disabled,
  label,
  onChange,
  value,
}: {
  ariaLabel: string
  disabled: boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      <Input
        aria-label={ariaLabel}
        className="h-7 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 font-mono text-xs text-slate-800 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={disabled}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
