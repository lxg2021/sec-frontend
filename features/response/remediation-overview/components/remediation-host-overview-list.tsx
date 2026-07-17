"use client"

import Link from "next/link"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Monitor,
  Search,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  RemediationSourceType,
  queryRemediationItemsByAgentId,
  type RemediationHostActionList,
  type RemediationHostList,
} from "@/features/attack/remediation-order"
import {
  itemStatusPresentation,
  resultPresentation as itemResultPresentation,
} from "@/features/response/remediation-orchestration/components/remediation-case-execution-panel"
import {
  remediationActionIcon,
  remediationActionIconClassName,
} from "@/features/response/remediation-orchestration/components/remediation-action-icons"
import { remediationOrderActionLabel } from "@/features/response/remediation-orchestration/components/remediation-order-parameter-editor"
import { remediationTargetPresentation } from "@/features/response/remediation-orchestration/components/remediation-target-presentation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/lib/utils"

import {
  ITEM_STATUS_FILTERS,
  countNumber,
  formatCount,
  formatTimestamp,
  shortId,
  sourceTranslationKey,
  type ItemStatusFilter,
  type SourceTypeFilter,
} from "../presentation"
import {
  RemediationOverviewViewTabs,
  type RemediationOverviewViewMode,
} from "./remediation-overview-view-tabs"

interface RemediationHostOverviewListProps {
  data: RemediationHostList
  error: string
  keyword: string
  loading: boolean
  onKeywordChange: (keyword: string) => void
  onPageChange: (page: number) => void
  onRetry: () => void
  onSourceChange: (source: SourceTypeFilter) => void
  onStatusChange: (status: ItemStatusFilter) => void
  onViewModeChange: (mode: RemediationOverviewViewMode) => void
  selectedSource: SourceTypeFilter
  selectedStatus: ItemStatusFilter
  viewMode: RemediationOverviewViewMode
}

const connectivityTone = {
  online: "border-emerald-200 bg-emerald-50 text-emerald-700",
  offline: "border-slate-200 bg-slate-100 text-slate-600",
  unknown: "border-amber-200 bg-amber-50 text-amber-700",
} as const

function normalizedStatus(value: string) {
  return value.trim().toLowerCase()
}

function actionListNeedsPolling(list: RemediationHostActionList) {
  return list.items.some(({ item }) => {
    const status = normalizedStatus(item.status)
    const executionStatus = normalizedStatus(item.execution?.execution_status ?? "")
    return status === "pending" || status === "running" || executionStatus === "accepted" || executionStatus === "running"
  })
}

export function RemediationHostOverviewList({
  data,
  error,
  keyword,
  loading,
  onKeywordChange,
  onPageChange,
  onRetry,
  onSourceChange,
  onStatusChange,
  onViewModeChange,
  selectedSource,
  selectedStatus,
  viewMode,
}: RemediationHostOverviewListProps) {
  const t = useTranslations("pages.response.overview")
  const hostT = useTranslations("pages.response.overview.hostList")
  const locale = useLocale()
  const detailRequests = useRef(new Set<string>())
  const [keywordInput, setKeywordInput] = useState(keyword)
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null)
  const [detailPages, setDetailPages] = useState<Record<string, number>>({})
  const [details, setDetails] = useState<Record<string, RemediationHostActionList>>({})
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({})
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({})
  const total = countNumber(data.total)
  const pageSize = Math.max(1, data.page_size || 10)
  const page = Math.max(1, data.page || 1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => setKeywordInput(keyword), [keyword])

  const loadDetail = useCallback(async (agentId: string, detailPage = 1, silent = false) => {
    const requestKey = `${agentId}:${detailPage}`
    if (detailRequests.current.has(requestKey)) return
    detailRequests.current.add(requestKey)
    if (!silent) setDetailLoading((current) => ({ ...current, [agentId]: true }))
    try {
      const detail = await queryRemediationItemsByAgentId({
        agent_id: agentId,
        page: detailPage,
        page_size: 20,
        ...(selectedSource === "all" ? {} : { source_type: selectedSource }),
        ...(selectedStatus === "all" ? {} : { item_status: selectedStatus }),
      })
      setDetails((current) => ({ ...current, [agentId]: detail }))
      setDetailPages((current) => ({ ...current, [agentId]: detailPage }))
      setDetailErrors((current) => ({ ...current, [agentId]: "" }))
    } catch (cause) {
      if (!silent) {
        setDetailErrors((current) => ({
          ...current,
          [agentId]: cause instanceof Error ? cause.message : "request failed",
        }))
      }
    } finally {
      detailRequests.current.delete(requestKey)
      if (!silent) setDetailLoading((current) => ({ ...current, [agentId]: false }))
    }
  }, [selectedSource, selectedStatus])

  useEffect(() => {
    setExpandedAgentId(null)
    setDetails({})
    setDetailPages({})
    setDetailErrors({})
  }, [data.page, selectedSource, selectedStatus])

  const expandedDetail = expandedAgentId ? details[expandedAgentId] : undefined
  const expandedDetailPage = expandedAgentId ? detailPages[expandedAgentId] ?? 1 : 1
  useEffect(() => {
    if (!expandedAgentId || !expandedDetail || !actionListNeedsPolling(expandedDetail)) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDetail(expandedAgentId, expandedDetailPage, true)
      }
    }, 8_000)
    return () => window.clearInterval(timer)
  }, [expandedAgentId, expandedDetail, expandedDetailPage, loadDetail])

  const toggleHost = (agentId: string) => {
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null)
      return
    }
    setExpandedAgentId(agentId)
    if (!details[agentId] || detailErrors[agentId]) {
      void loadDetail(agentId, detailPages[agentId] ?? 1)
    }
  }

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden border-0 shadow-md">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Monitor className="size-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{hostT("title")}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{hostT("description", { count: formatCount(data.total, locale) })}</p>
          </div>
          <RemediationOverviewViewTabs mode={viewMode} onChange={onViewModeChange} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault()
              onKeywordChange(keywordInput.trim())
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder={hostT("searchPlaceholder")}
              aria-label={hostT("searchPlaceholder")}
              className="h-9 w-[210px] rounded-xl border-slate-200 bg-white pl-9 text-xs"
            />
          </form>
          <Select value={String(selectedSource)} onValueChange={(value) => onSourceChange(value === "all" ? "all" : Number(value) as RemediationSourceType)}>
            <SelectTrigger className="h-9 w-[146px] rounded-xl border-slate-200 bg-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{hostT("allSources")}</SelectItem>
              {[RemediationSourceType.CaseGraph, RemediationSourceType.DrillGraph, RemediationSourceType.LocateGraph].map((type) => (
                <SelectItem key={type} value={String(type)}>{hostT(`sources.${sourceTranslationKey(type)}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(value) => onStatusChange(value as ItemStatusFilter)}>
            <SelectTrigger className="h-9 w-[146px] rounded-xl border-slate-200 bg-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{hostT("allStatuses")}</SelectItem>
              {ITEM_STATUS_FILTERS.map((status) => (
                <SelectItem key={status} value={status}>{hostT(`itemStatuses.${status}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading && data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" aria-hidden />{hostT("loading")}</div>
        ) : error && data.items.length === 0 ? (
          <button type="button" onClick={onRetry} className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-sm text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500">
            <AlertCircle className="size-5" aria-hidden /><span>{hostT("loadFailed")}</span><span className="text-xs text-slate-400">{hostT("retry")}</span>
          </button>
        ) : data.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400"><Monitor className="size-7 opacity-40" aria-hidden />{hostT("empty")}</div>
        ) : (
          <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[260px]" />
              <col className="w-[190px]" />
              <col className="w-[190px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs text-slate-500 backdrop-blur">
              <tr className="border-b border-slate-200">
                <th className="h-10 px-4 text-left font-medium">{hostT("columns.hostId")}</th>
                <th className="h-10 px-3 text-left font-medium">{hostT("columns.hostName")}</th>
                <th className="h-10 px-3 text-left font-medium">IP</th>
                <th className="h-10 px-3 text-center font-medium">{hostT("columns.connectivity")}</th>
                <th className="h-10 px-3 text-center font-medium">{hostT("columns.actions")}</th>
                <th className="h-10 px-4 text-center font-medium">{hostT("columns.lastActivity")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => {
                const host = row.agent_snapshot
                const expanded = expandedAgentId === host.agent_id
                const detail = details[host.agent_id]
                const ips = host.ip_addresses.length ? host.ip_addresses.join(", ") : host.primary_ip
                const connectivity = host.connectivity_status
                return (
                  <Fragment key={host.agent_id}>
                    <tr
                      tabIndex={0}
                      aria-expanded={expanded}
                      aria-label={expanded ? hostT("collapseHost", { host: host.agent_id }) : hostT("expandHost", { host: host.agent_id })}
                      onClick={() => toggleHost(host.agent_id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          toggleHost(host.agent_id)
                        }
                      }}
                      className={cn(
                        "h-12 cursor-pointer border-b border-slate-100 text-slate-700 transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                        expanded && "bg-slate-50",
                      )}
                    >
                      <td className="px-4 font-mono text-xs text-slate-700" title={host.agent_id}>
                        <span className="flex min-w-0 items-center gap-2">
                          <ChevronRight className={cn("size-3.5 shrink-0 text-slate-400 transition-transform", expanded && "rotate-90")} aria-hidden />
                          <span className="truncate">{host.agent_id || "-"}</span>
                        </span>
                      </td>
                      <td className="truncate px-3 text-slate-800" title={host.host_name || undefined}>{host.host_name || "-"}</td>
                      <td className="truncate px-3 font-mono text-xs text-slate-600" title={ips || undefined}>{ips || "-"}</td>
                      <td className="px-3 text-center">
                        <Badge variant="outline" className={cn("font-medium", connectivityTone[connectivity])}>{hostT(`connectivity.${connectivity}`)}</Badge>
                      </td>
                      <td className="px-3 text-center font-medium tabular-nums text-slate-800">{formatCount(row.remediation_item_count, locale)}</td>
                      <td className="whitespace-nowrap px-4 text-center text-xs tabular-nums text-slate-500">{formatTimestamp(row.last_activity_at, locale)}</td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-slate-200 bg-white">
                        <td colSpan={6} className="p-0">
                          <div className="border-y border-slate-100 bg-white">
                            {detailLoading[host.agent_id] ? (
                              <div className="flex min-h-28 items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="size-4 animate-spin" aria-hidden />{hostT("detailLoading")}</div>
                            ) : detailErrors[host.agent_id] ? (
                              <button type="button" onClick={() => void loadDetail(host.agent_id, detailPages[host.agent_id] ?? 1)} className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 text-xs text-red-600 hover:bg-red-50">
                                <AlertCircle className="size-5" aria-hidden /><span>{hostT("detailLoadFailed")}</span><span className="text-slate-400">{hostT("retry")}</span>
                              </button>
                            ) : detail ? (
                              <HostActionDetailTable
                                data={detail}
                                locale={locale}
                                onPageChange={(nextPage) => void loadDetail(host.agent_id, nextPage)}
                              />
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
        <span>{hostT("pagination.total", { count: formatCount(data.total, locale) })}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} aria-label={hostT("pagination.previous")}><ChevronLeft className="size-4" /></Button>
          <span className="min-w-20 text-center tabular-nums">{hostT("pagination.page", { page, total: totalPages })}</span>
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} aria-label={hostT("pagination.next")}><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </Card>
  )
}

function HostActionDetailTable({
  data,
  locale,
  onPageChange,
}: {
  data: RemediationHostActionList
  locale: string
  onPageChange: (page: number) => void
}) {
  const t = useTranslations("pages.response.overview.hostList")
  const total = countNumber(data.total)
  const pageSize = Math.max(1, data.page_size || 20)
  const page = Math.max(1, data.page || 1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (!data.items.length) {
    return <div className="px-5 py-9 text-center text-xs text-slate-500">{t("detailEmpty")}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1280px] table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[220px]" />
          <col className="w-[210px]" />
          <col className="w-[155px]" />
          <col className="w-[110px]" />
          <col className="w-[150px]" />
          <col className="w-[260px]" />
          <col className="w-[170px]" />
          <col className="w-[110px]" />
        </colgroup>
        <thead className="bg-slate-50 text-slate-500">
          <tr className="border-b border-slate-100">
            <th className="h-9 px-4 text-left font-medium">{t("detailColumns.order")}</th>
            <th className="h-9 px-3 text-left font-medium">{t("detailColumns.target")}</th>
            <th className="h-9 px-3 text-left font-medium">{t("detailColumns.action")}</th>
            <th className="h-9 px-3 text-center font-medium">{t("detailColumns.status")}</th>
            <th className="h-9 px-3 text-center font-medium">{t("detailColumns.result")}</th>
            <th className="h-9 px-3 text-left font-medium">{t("detailColumns.reason")}</th>
            <th className="h-9 px-3 text-center font-medium">{t("detailColumns.updatedAt")}</th>
            <th className="h-9 px-4 text-right font-medium">{t("detailColumns.operation")}</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map(({ order, item }) => {
            const target = remediationTargetPresentation(item)
            const status = itemStatusPresentation(item, locale)
            const result = itemResultPresentation(item, locale)
            const ActionIcon = remediationActionIcon(item.action_code)
            const actionLabel = remediationOrderActionLabel(item, locale)
            return (
              <tr key={item.item_id} className="h-12 border-b border-slate-100 text-slate-700 last:border-b-0 hover:bg-slate-50/70">
                <td className="px-4" title={`${order.title || order.order_id}\n${order.order_id}`}>
                  <div className="truncate font-medium text-slate-900">{order.title || t("untitled")}</div>
                  <div className="truncate font-mono text-[10px] text-slate-400">{shortId(order.order_id)}</div>
                </td>
                <td className="px-3" title={target.detail || target.displayName}>
                  <span className="block truncate font-medium text-slate-800">{target.displayName || "-"}</span>
                </td>
                <td className="px-3 font-medium text-slate-700" title={actionLabel}>
                  <span className="flex min-w-0 items-center gap-2">
                    <ActionIcon className={cn("size-3.5 shrink-0", remediationActionIconClassName(item.action_code))} aria-hidden />
                    <span className="truncate">{actionLabel}</span>
                  </span>
                </td>
                <td className="px-3 text-center"><Badge variant="outline" className={cn("border-0 font-medium", status.className)}>{status.label}</Badge></td>
                <td className="truncate px-3 text-center font-medium text-slate-700" title={result.result}>{result.result}</td>
                <td className="truncate px-3 text-slate-500" title={result.reason}>{result.reason}</td>
                <td className="whitespace-nowrap px-3 text-center tabular-nums text-slate-500">{formatTimestamp(item.updated_at, locale)}</td>
                <td className="px-4 text-right">
                  <Button asChild variant="outline" size="sm" className="h-7 rounded-full border-slate-200 px-2.5 text-[11px]">
                    <Link href={`/frame/response/orchestration?order_id=${encodeURIComponent(order.order_id)}`}>
                      {t("view")}<ExternalLink className="ml-1 size-3" aria-hidden />
                    </Link>
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex h-10 items-center justify-end gap-2 border-t border-slate-100 px-4 text-[11px] text-slate-500">
        <span className="mr-auto">{t("detailTotal", { count: formatCount(data.total, locale) })}</span>
        <Button type="button" variant="ghost" size="icon" className="size-7 rounded-full" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={t("pagination.previous")}><ChevronLeft className="size-3.5" /></Button>
        <span className="min-w-16 text-center tabular-nums">{t("pagination.page", { page, total: totalPages })}</span>
        <Button type="button" variant="ghost" size="icon" className="size-7 rounded-full" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label={t("pagination.next")}><ChevronRight className="size-3.5" /></Button>
      </div>
    </div>
  )
}
