"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Clock3, Loader2, RefreshCcw, ShieldCheck } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  RemediationSourceType,
  queryRemediationHostList,
  queryRemediationOrderList,
  queryRemediationOverviewSummary,
  type RemediationHostList,
  type RemediationOrderList,
  type RemediationOverviewSummary,
} from "@/features/attack/remediation-order"
import { Button } from "@/shared/ui/button"

import { formatTimestamp, type ItemStatusFilter, type OrderStatusFilter, type SourceTypeFilter } from "../presentation"
import { OverviewMetricCards } from "./overview-metric-cards"
import { RemediationActionDistribution } from "./remediation-action-distribution"
import { RemediationHostOverviewList } from "./remediation-host-overview-list"
import { RemediationOrderOverviewList } from "./remediation-order-overview-list"
import type { RemediationOverviewViewMode } from "./remediation-overview-view-tabs"
import { RemediationTrendChart } from "./remediation-trend-chart"

const EMPTY_OVERVIEW: RemediationOverviewSummary = {
  totals: {
    order_count: "0",
    host_count: "0",
    active_order_count: "0",
    attention_order_count: "0",
    item_count: "0",
    last_activity_at: "",
  },
  order_statuses: ["draft", "prepared", "running", "completed", "canceled", "expired"].map((status) => ({ status, count: "0" })),
  sources: [RemediationSourceType.CaseGraph, RemediationSourceType.DrillGraph, RemediationSourceType.LocateGraph].map((source_type) => ({ source_type, order_count: "0" })),
  actions: [],
  trend: [],
}

const EMPTY_ORDERS: RemediationOrderList = { items: [], total: "0", page: 1, page_size: 10 }
const EMPTY_HOSTS: RemediationHostList = { items: [], total: "0", page: 1, page_size: 10 }

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "request failed"
}

export function RemediationOverviewPage() {
  const t = useTranslations("pages.response.overview")
  const locale = useLocale()
  const summarySequence = useRef(0)
  const orderSequence = useRef(0)
  const hostSequence = useRef(0)
  const [summary, setSummary] = useState(EMPTY_OVERVIEW)
  const [orders, setOrders] = useState(EMPTY_ORDERS)
  const [hosts, setHosts] = useState(EMPTY_HOSTS)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(true)
  const [hostLoading, setHostLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [summaryError, setSummaryError] = useState("")
  const [orderError, setOrderError] = useState("")
  const [hostError, setHostError] = useState("")
  const [viewMode, setViewMode] = useState<RemediationOverviewViewMode>("order")
  const [orderStatus, setOrderStatus] = useState<OrderStatusFilter>("all")
  const [hostStatus, setHostStatus] = useState<ItemStatusFilter>("all")
  const [source, setSource] = useState<SourceTypeFilter>("all")
  const [orderPage, setOrderPage] = useState(1)
  const [hostPage, setHostPage] = useState(1)
  const [hostKeyword, setHostKeyword] = useState("")

  const loadSummary = useCallback(async (silent = false) => {
    const sequence = ++summarySequence.current
    if (!silent) setSummaryLoading(true)
    try {
      const result = await queryRemediationOverviewSummary()
      if (sequence !== summarySequence.current) return
      setSummary(result)
      setSummaryError("")
    } catch (error) {
      if (sequence === summarySequence.current) setSummaryError(errorMessage(error))
    } finally {
      if (sequence === summarySequence.current && !silent) setSummaryLoading(false)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    const sequence = ++orderSequence.current
    setOrderLoading(true)
    try {
      const result = await queryRemediationOrderList({
        page: orderPage,
        page_size: 10,
        ...(orderStatus === "all" ? {} : { status: orderStatus }),
        ...(source === "all" ? {} : { source_type: source }),
      })
      if (sequence !== orderSequence.current) return
      setOrders(result)
      setOrderError("")
    } catch (error) {
      if (sequence === orderSequence.current) setOrderError(errorMessage(error))
    } finally {
      if (sequence === orderSequence.current) setOrderLoading(false)
    }
  }, [orderPage, orderStatus, source])

  const loadHosts = useCallback(async () => {
    const sequence = ++hostSequence.current
    setHostLoading(true)
    try {
      const result = await queryRemediationHostList({
        page: hostPage,
        page_size: 10,
        ...(hostKeyword ? { keyword: hostKeyword } : {}),
        ...(hostStatus === "all" ? {} : { item_status: hostStatus }),
        ...(source === "all" ? {} : { source_type: source }),
      })
      if (sequence !== hostSequence.current) return
      setHosts(result)
      setHostError("")
    } catch (error) {
      if (sequence === hostSequence.current) setHostError(errorMessage(error))
    } finally {
      if (sequence === hostSequence.current) setHostLoading(false)
    }
  }, [hostKeyword, hostPage, hostStatus, source])

  useEffect(() => {
    void loadSummary()
    return () => { summarySequence.current += 1 }
  }, [loadSummary])

  useEffect(() => {
    void loadOrders()
    return () => { orderSequence.current += 1 }
  }, [loadOrders])

  useEffect(() => {
    if (viewMode !== "host") return
    void loadHosts()
    return () => { hostSequence.current += 1 }
  }, [loadHosts, viewMode])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadSummary(true)
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [loadSummary])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await Promise.allSettled([
      loadSummary(),
      viewMode === "order" ? loadOrders() : loadHosts(),
    ])
    setRefreshing(false)
  }, [loadHosts, loadOrders, loadSummary, viewMode])

  return (
    <div className="min-h-dvh min-w-0 overflow-x-hidden bg-slate-50 2xl:h-full 2xl:min-h-0 2xl:overflow-hidden">
      <main className="grid min-h-[calc(100dvh-3rem)] min-w-0 grid-rows-[auto_auto_auto_auto] gap-4 p-6 2xl:h-full 2xl:min-h-0 2xl:grid-rows-[auto_auto_minmax(180px,0.8fr)_minmax(230px,1.2fr)]">
        <section className="flex min-h-[92px] items-center rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 text-blue-600"><ShieldCheck className="size-5" aria-hidden /></span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-950">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-l border-slate-200 pl-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-slate-50 text-slate-500"><Clock3 className="size-4" aria-hidden /></span>
            <div className="hidden min-w-[170px] xl:block">
              <p className="text-xs text-slate-400">{t("lastActivity")}</p>
              <p className="mt-0.5 text-sm font-medium tabular-nums text-slate-700">{formatTimestamp(summary.totals.last_activity_at, locale)}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full text-slate-500" onClick={() => void refreshAll()} disabled={refreshing} aria-label={t("refresh")}>
              {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            </Button>
          </div>
        </section>

        <OverviewMetricCards totals={summary.totals} />

        <section className="grid min-h-[280px] min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:min-h-0">
          <RemediationTrendChart data={summary.trend} error={summaryError} loading={summaryLoading} onRetry={() => void loadSummary()} />
          <RemediationActionDistribution data={summary.actions} error={summaryError} loading={summaryLoading} onRetry={() => void loadSummary()} />
        </section>

        {viewMode === "order" ? (
          <RemediationOrderOverviewList
            data={orders}
            error={orderError}
            loading={orderLoading}
            orderStatuses={summary.order_statuses}
            sources={summary.sources}
            selectedStatus={orderStatus}
            selectedSource={source}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onStatusChange={(value) => { setOrderStatus(value); setOrderPage(1) }}
            onSourceChange={(value) => { setSource(value); setOrderPage(1); setHostPage(1) }}
            onPageChange={setOrderPage}
            onRetry={() => void loadOrders()}
          />
        ) : (
          <RemediationHostOverviewList
            data={hosts}
            error={hostError}
            keyword={hostKeyword}
            loading={hostLoading}
            selectedSource={source}
            selectedStatus={hostStatus}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onKeywordChange={(value) => { setHostKeyword(value); setHostPage(1) }}
            onStatusChange={(value) => { setHostStatus(value); setHostPage(1) }}
            onSourceChange={(value) => { setSource(value); setOrderPage(1); setHostPage(1) }}
            onPageChange={setHostPage}
            onRetry={() => void loadHosts()}
          />
        )}
      </main>
    </div>
  )
}
