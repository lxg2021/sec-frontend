"use client"

import { useState } from "react"
import { format } from "date-fns"
import { enUS, zhCN } from "date-fns/locale"
import { CalendarClock, ChevronLeft, ChevronRight, ExternalLink, FileJson, Loader2, Search } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

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
import { Calendar } from "@/shared/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
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
  uniqueId: string
  target: string
  time: string
  type: string
}

const tableActionButtonBaseClass =
  "h-9 gap-2 rounded-full px-3 transition-colors duration-150 disabled:pointer-events-none"
const rawDataActionButtonClass =
  "text-slate-600 hover:bg-slate-900 hover:text-white active:bg-slate-950"
const graphActionButtonClass =
  "text-cyan-600 hover:bg-cyan-600 hover:text-white active:bg-cyan-700"

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

function twoDigits(value: number) {
  return String(value).padStart(2, "0")
}

function formatDateTimeInputValue(date: Date) {
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}T${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`
}

function parseDateTimeInputValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return null

  const [, year, month, day, hour, minute] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function mergeDateTime(date: Date, timeSource: Date | null) {
  const next = new Date(date)
  const source = timeSource ?? new Date()
  next.setHours(source.getHours(), source.getMinutes(), 0, 0)
  return next
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
    uniqueId: lowerDisplayValue(localEventUniqueId(event)),
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
    <section className={cn("flex min-h-0 flex-col overflow-hidden bg-white", className)}>
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
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <div className="flex h-9 items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100/80 p-0.5 shadow-inner shadow-slate-200/60">
              {(["30d", "90d", "custom"] as LocalTimeRangeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200",
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
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50/70 px-3 py-2">
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
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-white">
            <div className="min-h-0 flex-1 overflow-hidden">
              <Table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[4%]" />
                  <col className="w-[11%]" />
                  <col className="w-[9%]" />
                  <col className="w-[15%]" />
                  <col className="w-[25%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <TableHeader className="sticky top-0 z-10 bg-slate-100">
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="h-10 px-3 text-xs font-semibold text-slate-500">{t("columns.time")}</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold text-slate-500">{t("columns.endpoint")}</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold text-slate-500">{t("columns.type")}</TableHead>
                    <TableHead className="h-10 px-3 text-center text-xs font-semibold text-slate-500">{t("columns.event")}</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold text-slate-500">{t("columns.uniqueId")}</TableHead>
                    <TableHead className="h-10 px-3 text-center text-xs font-semibold text-slate-500">{t("columns.actor")}</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold text-slate-500">{t("columns.target")}</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold text-slate-500">{t("columns.context")}</TableHead>
                    <TableHead className="h-10 px-3 text-center text-xs font-semibold text-slate-500">{t("columns.rawData")}</TableHead>
                    <TableHead className="h-10 px-3 text-center text-xs font-semibold text-slate-500">{t("columns.action")}</TableHead>
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
                          selected && "bg-blue-50/70 shadow-[inset_4px_0_0_#0284c7] hover:bg-blue-50/80"
                        )}
                      >
                        <TableCell className="px-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={cn("h-2 w-2 shrink-0 rounded-full", selected ? "bg-blue-600" : "bg-slate-300 group-hover:bg-blue-400")} />
                            <span className="truncate font-mono text-xs text-slate-500 tabular-nums" title={row.time}>
                              {row.time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="truncate text-xs font-normal text-slate-700" title={row.endpoint}>
                            {row.endpoint}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="truncate font-mono text-xs font-normal text-slate-600" title={row.type}>
                            {row.type}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-center">
                          <div className="truncate font-mono text-xs font-normal text-slate-800 tabular-nums" title={row.event}>
                            {row.event}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="truncate font-mono text-xs font-normal text-slate-600" title={row.uniqueId}>
                            {row.uniqueId}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-center">
                          <div className="truncate text-xs font-normal text-slate-700" title={row.actor}>
                            {row.actor}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="truncate text-xs font-normal text-slate-700" title={row.target}>
                            {row.target}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="truncate text-xs font-normal text-slate-600" title={row.context}>
                            {row.context}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(tableActionButtonBaseClass, rawDataActionButtonClass, "text-xs")}
                            onClick={() => setRawEvent(event)}
                          >
                            <FileJson className="h-4 w-4" />
                            <span className="font-medium">{t("rawDataAction")}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              tableActionButtonBaseClass,
                              graphActionButtonClass,
                              "text-xs",
                              selected && "bg-cyan-50 text-cyan-700 shadow-sm shadow-cyan-100"
                            )}
                            disabled={!uniqueId || locating}
                            onClick={() => onLocateGraph(event, index)}
                          >
                            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                            <span className="font-medium">{t("graphAction")}</span>
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
  const locale = useLocale()
  const isChinese = locale.toLowerCase().startsWith("zh")
  const dateLocale = isChinese ? zhCN : enUS
  const selectedDate = parseDateTimeInputValue(value)
  const displayValue = selectedDate
    ? format(selectedDate, isChinese ? "yyyy/MM/dd HH:mm" : "MMM dd, yyyy HH:mm", { locale: dateLocale })
    : "--"
  const selectedHour = selectedDate?.getHours() ?? 0
  const selectedMinute = selectedDate?.getMinutes() ?? 0
  const currentYear = new Date().getFullYear()
  const todayLabel = isChinese ? "今天" : "Today"
  const hourLabel = isChinese ? "时" : "HH"
  const minuteLabel = isChinese ? "分" : "MM"

  function commitDateTime(date: Date) {
    onChange(formatDateTimeInputValue(date))
  }

  function handleDateSelect(date?: Date) {
    if (!date) return
    commitDateTime(mergeDateTime(date, selectedDate))
  }

  function handleHourSelect(hour: number) {
    const next = selectedDate ? new Date(selectedDate) : new Date()
    next.setHours(hour, selectedMinute, 0, 0)
    commitDateTime(next)
  }

  function handleMinuteSelect(minute: number) {
    const next = selectedDate ? new Date(selectedDate) : new Date()
    next.setHours(selectedHour, minute, 0, 0)
    commitDateTime(next)
  }

  function handleToday() {
    commitDateTime(new Date())
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40 disabled:pointer-events-none disabled:opacity-60"
        >
          <span className="shrink-0 text-xs font-semibold text-slate-500">{label}</span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-800">{displayValue}</span>
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-[80] w-auto rounded-2xl border-slate-200 bg-white p-0 shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
      >
        <div className="flex gap-3 p-3">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
            locale={dateLocale}
            captionLayout="dropdown"
            startMonth={new Date(currentYear - 20, 0)}
            endMonth={new Date(currentYear + 1, 11)}
            initialFocus
            className="p-0"
          />
          <div className="flex gap-2 border-l border-slate-100 pl-3">
            <TimeValueColumn
              label={hourLabel}
              max={23}
              selected={selectedHour}
              onSelect={handleHourSelect}
            />
            <TimeValueColumn
              label={minuteLabel}
              max={59}
              selected={selectedMinute}
              onSelect={handleMinuteSelect}
            />
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-slate-100 px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={handleToday}
          >
            {todayLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TimeValueColumn({
  label,
  max,
  onSelect,
  selected,
}: {
  label: string
  max: number
  onSelect: (value: number) => void
  selected: number
}) {
  return (
    <div className="w-12">
      <div className="mb-1 text-center text-[11px] font-semibold uppercase text-slate-400">{label}</div>
      <div className="max-h-[252px] overflow-y-auto pr-1">
        {Array.from({ length: max + 1 }, (_, value) => (
          <button
            key={value}
            type="button"
            className={cn(
              "mb-1 flex h-7 w-full items-center justify-center rounded-lg font-mono text-xs transition-colors",
              selected === value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
            )}
            onClick={() => onSelect(value)}
          >
            {twoDigits(value)}
          </button>
        ))}
      </div>
    </div>
  )
}
