"use client"

import Link from "next/link"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink, ListChecks, Loader2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  RemediationSourceType,
  queryRemediationOrderById,
  type RemediationOrder,
  type RemediationOrderList,
  type RemediationOverviewOrderStatusBucket,
  type RemediationOverviewSourceBucket,
} from "@/features/attack/remediation-order"
import { RemediationExecutionItemsTable } from "@/features/response/remediation-orchestration/components/remediation-case-execution-panel"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/lib/utils"

import {
  ORDER_STATUS_FILTERS,
  countNumber,
  formatCount,
  formatTimestamp,
  humanizeIdentifier,
  remediationSourceType,
  shortId,
  sourceReference,
  sourceTranslationKey,
  type OrderStatusFilter,
  type SourceTypeFilter,
} from "../presentation"
import {
  RemediationOverviewViewTabs,
  type RemediationOverviewViewMode,
} from "./remediation-overview-view-tabs"

interface RemediationOrderOverviewListProps {
  data: RemediationOrderList
  error: string
  loading: boolean
  onPageChange: (page: number) => void
  onRetry: () => void
  onSourceChange: (source: SourceTypeFilter) => void
  onStatusChange: (status: OrderStatusFilter) => void
  orderStatuses: RemediationOverviewOrderStatusBucket[]
  selectedSource: SourceTypeFilter
  selectedStatus: OrderStatusFilter
  sources: RemediationOverviewSourceBucket[]
  viewMode: RemediationOverviewViewMode
  onViewModeChange: (mode: RemediationOverviewViewMode) => void
}

const statusTone: Record<string, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  prepared: "border-blue-200 bg-blue-50 text-blue-700",
  running: "border-cyan-200 bg-cyan-50 text-cyan-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  canceled: "border-slate-200 bg-slate-100 text-slate-500",
  expired: "border-amber-200 bg-amber-50 text-amber-700",
}

const outcomeTone: Record<string, string> = {
  success: "text-emerald-700",
  partial_success: "text-amber-700",
  failed: "text-red-700",
  no_action: "text-slate-500",
}

function normalizedStatus(value: string) {
  return value.trim().toLowerCase()
}

function orderNeedsPolling(order: RemediationOrder) {
  return order.items.some((item) => {
    const status = normalizedStatus(item.status)
    const executionStatus = normalizedStatus(item.execution?.execution_status ?? "")
    return (
      status === "pending" ||
      status === "running" ||
      executionStatus === "accepted" ||
      executionStatus === "running" ||
      item.execution?.publish_acceptance_unknown === true
    )
  })
}

function sortedOrderItems(order: RemediationOrder) {
  return [...order.items].sort(
    (left, right) =>
      right.round_no - left.round_no ||
      left.position - right.position ||
      left.item_id.localeCompare(right.item_id),
  )
}

export function RemediationOrderOverviewList({
  data,
  error,
  loading,
  onPageChange,
  onRetry,
  onSourceChange,
  onStatusChange,
  orderStatuses,
  selectedSource,
  selectedStatus,
  sources,
  viewMode,
  onViewModeChange,
}: RemediationOrderOverviewListProps) {
  const t = useTranslations("pages.response.overview.list")
  const locale = useLocale()
  const detailRequests = useRef(new Set<string>())
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [orderDetails, setOrderDetails] = useState<Record<string, RemediationOrder>>({})
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({})
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({})
  const statusCounts = new Map(orderStatuses.map((item) => [normalizedStatus(item.status), item.count]))
  const sourceCounts = new Map(
    sources.flatMap((item) => {
      const type = remediationSourceType(item.source_type)
      return type === null ? [] : [[type, item.order_count] as const]
    }),
  )
  const total = countNumber(data.total)
  const pageSize = Math.max(1, data.page_size || 10)
  const page = Math.max(1, data.page || 1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const loadOrderDetail = useCallback(async (orderId: string, silent = false) => {
    if (detailRequests.current.has(orderId)) return
    detailRequests.current.add(orderId)
    if (!silent) {
      setDetailLoading((current) => ({ ...current, [orderId]: true }))
    }
    try {
      const detail = await queryRemediationOrderById({ order_id: orderId })
      setOrderDetails((current) => ({ ...current, [orderId]: detail }))
      setDetailErrors((current) => ({ ...current, [orderId]: "" }))
    } catch (cause) {
      if (!silent) {
        setDetailErrors((current) => ({
          ...current,
          [orderId]: cause instanceof Error ? cause.message : "request failed",
        }))
      }
    } finally {
      detailRequests.current.delete(orderId)
      if (!silent) {
        setDetailLoading((current) => ({ ...current, [orderId]: false }))
      }
    }
  }, [])

  useEffect(() => {
    setExpandedOrderId(null)
  }, [data.page, selectedSource, selectedStatus])

  const expandedDetail = expandedOrderId ? orderDetails[expandedOrderId] : undefined
  useEffect(() => {
    if (!expandedOrderId || !expandedDetail || !orderNeedsPolling(expandedDetail)) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadOrderDetail(expandedOrderId, true)
      }
    }, 8_000)
    return () => window.clearInterval(timer)
  }, [expandedDetail, expandedOrderId, loadOrderDetail])

  const toggleOrder = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      return
    }
    setExpandedOrderId(orderId)
    if (!orderDetails[orderId] || detailErrors[orderId]) {
      void loadOrderDetail(orderId)
    }
  }

  const statusLabel = (value: string) => {
    const status = normalizedStatus(value)
    return ORDER_STATUS_FILTERS.includes(status as (typeof ORDER_STATUS_FILTERS)[number])
      ? t(`statuses.${status as (typeof ORDER_STATUS_FILTERS)[number]}`)
      : humanizeIdentifier(value) || "-"
  }
  const outcomeLabel = (value: string) => {
    const outcome = normalizedStatus(value)
    if (!outcome) return "-"
    if (["success", "partial_success", "failed", "no_action"].includes(outcome)) {
      return t(`outcomes.${outcome as "success" | "partial_success" | "failed" | "no_action"}`)
    }
    return humanizeIdentifier(value)
  }

  return (
    <Card className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] 2xl:min-h-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ListChecks className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-medium leading-6 text-slate-950">{t("title")}</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{t("description", { count: formatCount(data.total, locale) })}</p>
          </div>
          <RemediationOverviewViewTabs mode={viewMode} onChange={onViewModeChange} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(selectedSource)} onValueChange={(value) => onSourceChange(value === "all" ? "all" : Number(value) as RemediationSourceType)}>
            <SelectTrigger className="h-9 w-[154px] rounded-full border-slate-200 bg-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allSources")}</SelectItem>
              {[RemediationSourceType.CaseGraph, RemediationSourceType.DrillGraph, RemediationSourceType.LocateGraph].map((type) => (
                <SelectItem key={type} value={String(type)}>
                  <span className="grid w-[108px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="truncate">{t(`sources.${sourceTranslationKey(type)}`)}</span>
                    <span className="text-right tabular-nums text-slate-500">
                      ({formatCount(sourceCounts.get(type) ?? "0", locale)})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(value) => onStatusChange(value as OrderStatusFilter)}>
            <SelectTrigger className="h-9 w-[154px] rounded-full border-slate-200 bg-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {ORDER_STATUS_FILTERS.map((status) => (
                <SelectItem key={status} value={status}>
                  <span className="grid w-[108px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="truncate">{t(`statuses.${status}`)}</span>
                    <span className="text-right tabular-nums text-slate-500">
                      ({formatCount(statusCounts.get(status) ?? "0", locale)})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading && data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" aria-hidden />{t("loading")}</div>
        ) : error && data.items.length === 0 ? (
          <button type="button" onClick={onRetry} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50">
            <AlertCircle className="size-5" aria-hidden /><span>{t("loadFailed")}</span><span className="text-xs text-slate-400">{t("retry")}</span>
          </button>
        ) : data.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400"><ListChecks className="size-7 opacity-40" aria-hidden />{t("empty")}</div>
        ) : (
          <table className="min-w-[1040px] w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[140px]" />
              <col className="w-[116px]" />
              <col className="w-[170px]" />
              <col className="w-[82px]" />
              <col className="w-[58px]" />
              <col className="w-[58px]" />
              <col className="w-[58px]" />
              <col className="w-[64px]" />
              <col className="w-[86px]" />
              <col className="w-[142px]" />
              <col className="w-[112px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-slate-100 text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="h-10 px-4 text-left font-medium">{t("columns.name")}</th>
                <th className="h-10 px-3 text-left font-medium">{t("columns.orderId")}</th>
                <th className="h-10 px-3 text-left font-medium">{t("columns.source")}</th>
                <th className="h-10 px-3 text-center font-medium">{t("columns.status")}</th>
                <th className="h-10 px-3 text-center font-medium">{t("columns.targets")}</th>
                <th className="h-10 px-3 text-center font-medium">{t("columns.success")}</th>
                <th className="h-10 px-3 text-center font-medium">{t("columns.failed")}</th>
                <th className="h-10 px-3 text-center font-medium">{t("columns.uncertain")}</th>
                <th className="h-10 px-3 text-center font-medium">{t("columns.result")}</th>
                <th className="h-10 px-3 text-center font-medium">{t("columns.updatedAt")}</th>
                <th className="h-10 px-4 text-right font-medium">{t("columns.action")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => {
                const status = normalizedStatus(order.status)
                const outcome = normalizedStatus(order.outcome)
                const sourceKey = sourceTranslationKey(order.source.source_type)
                const expanded = expandedOrderId === order.order_id
                const detail = orderDetails[order.order_id]
                return (
                  <Fragment key={order.order_id}>
                    <tr
                      aria-expanded={expanded}
                      aria-label={expanded ? t("collapseOrder", { title: order.title || t("untitled") }) : t("expandOrder", { title: order.title || t("untitled") })}
                      tabIndex={0}
                      onClick={() => toggleOrder(order.order_id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          toggleOrder(order.order_id)
                        }
                      }}
                      className={cn(
                        "h-12 cursor-pointer border-b border-slate-100 text-slate-700 transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                        expanded && "bg-sky-50/70 shadow-[inset_4px_0_0_#0284c7]",
                      )}
                    >
                      <td className="max-w-[220px] px-4 font-medium text-slate-900" title={order.title || order.order_id}>
                        <span className="flex min-w-0 items-center gap-2">
                          <ChevronRight className={cn("size-3.5 shrink-0 text-slate-400 transition-transform", expanded && "rotate-90")} aria-hidden />
                          <span className="truncate">{order.title || t("untitled")}</span>
                        </span>
                      </td>
                      <td className="px-3 font-mono text-xs text-slate-500" title={order.order_id}>{shortId(order.order_id)}</td>
                      <td className="px-3">
                        <span className="inline-flex max-w-[190px] items-center gap-1.5" title={sourceReference(order.source)}>
                          <Badge variant="outline" className="shrink-0 border-slate-200 px-1.5 text-[10px] font-medium text-slate-500">{t(`sources.${sourceKey}`)}</Badge>
                          <span className="truncate font-mono text-xs text-slate-600">{shortId(sourceReference(order.source), 8, 4)}</span>
                        </span>
                      </td>
                      <td className="px-3 text-center"><Badge variant="outline" className={cn("font-medium", statusTone[status] ?? statusTone.draft)}>{statusLabel(order.status)}</Badge></td>
                      <td className="px-3 text-center font-medium tabular-nums">{order.summary.total}</td>
                      <td className="px-3 text-center font-medium tabular-nums text-emerald-700">{order.summary.success}</td>
                      <td className="px-3 text-center font-medium tabular-nums text-red-700">{order.summary.failed}</td>
                      <td className="px-3 text-center font-medium tabular-nums text-amber-700">{order.summary.uncertain}</td>
                      <td className={cn("px-3 text-center text-xs font-medium", outcomeTone[outcome] ?? "text-slate-500")}>{outcomeLabel(order.outcome)}</td>
                      <td className="whitespace-nowrap px-3 text-center text-xs tabular-nums text-slate-500">{formatTimestamp(order.updated_at, locale)}</td>
                      <td className="px-4 text-right">
                        <Button asChild variant="outline" size="sm" className="h-8 rounded-full border-slate-200 px-3 text-xs text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                          <Link
                            href={`/frame/response/orchestration?order_id=${encodeURIComponent(order.order_id)}`}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            {t("view")}<ExternalLink className="ml-1.5 size-3" aria-hidden />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-slate-200 bg-white">
                        <td colSpan={11} className="p-0">
                          <div className="border-y border-slate-100 bg-white">
                            {detailLoading[order.order_id] ? (
                              <div className="flex min-h-28 items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="size-4 animate-spin" aria-hidden />{t("detailLoading")}</div>
                            ) : detailErrors[order.order_id] ? (
                              <button type="button" onClick={() => void loadOrderDetail(order.order_id)} className="flex min-h-28 w-full flex-col items-center justify-center gap-2 text-xs text-red-600 hover:bg-red-50">
                                <AlertCircle className="size-5" aria-hidden /><span>{t("detailLoadFailed")}</span><span className="text-slate-400">{t("detailRetry")}</span>
                              </button>
                            ) : detail ? (
                              <RemediationExecutionItemsTable items={sortedOrderItems(detail)} emptyText={t("detailEmpty")} headerClassName="bg-slate-100" />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex h-11 shrink-0 items-center justify-between border-t border-slate-100 px-4 text-xs text-slate-500">
        <span>{t("pagination.total", { count: formatCount(data.total, locale) })}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} aria-label={t("pagination.previous")}><ChevronLeft className="size-4" /></Button>
          <span className="min-w-20 text-center tabular-nums">{t("pagination.page", { page, total: totalPages })}</span>
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} aria-label={t("pagination.next")}><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </Card>
  )
}
