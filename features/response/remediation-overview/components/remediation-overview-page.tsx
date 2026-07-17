"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Clock3, Loader2, Monitor, RefreshCcw, ShieldCheck } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  RemediationSourceType,
  queryRemediationOrderList,
  queryRemediationOverviewSummary,
  type RemediationOrderList,
  type RemediationOverviewSummary,
} from "@/features/attack/remediation-order"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

import { formatTimestamp, type OrderStatusFilter, type SourceTypeFilter } from "../presentation"
import { OverviewMetricCards } from "./overview-metric-cards"
import { RemediationActionDistribution } from "./remediation-action-distribution"
import { RemediationOrderOverviewList } from "./remediation-order-overview-list"
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "request failed"
}

export function RemediationOverviewPage() {
  const t = useTranslations("pages.response.overview")
  const locale = useLocale()
  const summarySequence = useRef(0)
  const listSequence = useRef(0)
  const [summary, setSummary] = useState(EMPTY_OVERVIEW)
  const [orders, setOrders] = useState(EMPTY_ORDERS)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [listLoading, setListLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summaryError, setSummaryError] = useState("")
  const [listError, setListError] = useState("")
  const [status, setStatus] = useState<OrderStatusFilter>("all")
  const [source, setSource] = useState<SourceTypeFilter>("all")
  const [page, setPage] = useState(1)

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
    const sequence = ++listSequence.current
    setListLoading(true)
    try {
      const result = await queryRemediationOrderList({
        page,
        page_size: 10,
        ...(status === "all" ? {} : { status }),
        ...(source === "all" ? {} : { source_type: source }),
      })
      if (sequence !== listSequence.current) return
      setOrders(result)
      setListError("")
    } catch (error) {
      if (sequence === listSequence.current) setListError(errorMessage(error))
    } finally {
      if (sequence === listSequence.current) setListLoading(false)
    }
  }, [page, source, status])

  useEffect(() => {
    void loadSummary()
    return () => { summarySequence.current += 1 }
  }, [loadSummary])

  useEffect(() => {
    void loadOrders()
    return () => { listSequence.current += 1 }
  }, [loadOrders])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadSummary(true)
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [loadSummary])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await Promise.allSettled([loadSummary(), loadOrders()])
    setRefreshing(false)
  }, [loadOrders, loadSummary])

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-50">
      <main className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(190px,0.8fr)_minmax(250px,1.2fr)] gap-4 p-6">
        <section className="flex min-h-[92px] items-center rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 text-blue-600"><ShieldCheck className="size-5" aria-hidden /></span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-950">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
            </div>
          </div>

          <div className="mx-4 hidden shrink-0 rounded-2xl bg-slate-100/80 p-1 lg:flex" aria-label={t("viewMode") }>
            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-slate-900 shadow-sm"><ShieldCheck className="size-4 text-blue-600" aria-hidden />{t("byOrder")}</button>
            <button type="button" disabled title={t("hostViewPending")} className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-400"><Monitor className="size-4" aria-hidden />{t("byHost")}</button>
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

        <section className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <RemediationTrendChart data={summary.trend} error={summaryError} loading={summaryLoading} onRetry={() => void loadSummary()} />
          <RemediationActionDistribution data={summary.actions} error={summaryError} loading={summaryLoading} onRetry={() => void loadSummary()} />
        </section>

        <RemediationOrderOverviewList
          data={orders}
          error={listError}
          loading={listLoading}
          orderStatuses={summary.order_statuses}
          sources={summary.sources}
          selectedStatus={status}
          selectedSource={source}
          onStatusChange={(value) => { setStatus(value); setPage(1) }}
          onSourceChange={(value) => { setSource(value); setPage(1) }}
          onPageChange={setPage}
          onRetry={() => void loadOrders()}
        />
      </main>
    </div>
  )
}
