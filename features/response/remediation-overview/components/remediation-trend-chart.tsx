"use client"

import { useMemo } from "react"
import { Activity, AlertCircle, Loader2, TrendingUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { RemediationOverviewTrendPoint } from "@/features/attack/remediation-order"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import { countNumber, formatTrendDate } from "../presentation"

interface TrendChartProps {
  data: RemediationOverviewTrendPoint[]
  error: string
  loading: boolean
  onRetry: () => void
}

function TrendTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string
  payload?: Array<{ color?: string; name?: string; value?: number; payload?: { total: number } }>
}) {
  const t = useTranslations("pages.response.overview.trend")
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-slate-700">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div className="flex items-center justify-between gap-5" key={item.name}>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{item.value ?? 0}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-slate-500">
        <span>{t("terminalTotal")}</span>
        <span className="font-semibold tabular-nums text-slate-700">{payload[0]?.payload?.total ?? 0}</span>
      </div>
    </div>
  )
}

export function RemediationTrendChart({ data, error, loading, onRetry }: TrendChartProps) {
  const t = useTranslations("pages.response.overview.trend")
  const locale = useLocale()
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: point.bucket_start_at,
        label: formatTrendDate(point.bucket_start_at, locale),
        success: countNumber(point.success_count),
        failed: countNumber(point.failed_count),
        uncertain: countNumber(point.uncertain_count),
        total: countNumber(point.terminal_item_count),
      })),
    [data, locale],
  )
  const hasData = chartData.some((point) => point.total > 0)

  return (
    <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex shrink-0 flex-row items-center gap-3 px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
          <TrendingUp className="size-5 text-white" aria-hidden />
        </span>
        <div className="min-w-0">
          <CardTitle className="text-base font-medium leading-6 text-slate-950">{t("title")}</CardTitle>
          <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">{t("description")}</p>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-3 pb-3 pt-0">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" aria-hidden />{t("loading")}
          </div>
        ) : error ? (
          <button type="button" onClick={onRetry} className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl text-sm text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500">
            <AlertCircle className="size-5" aria-hidden />
            <span>{t("loadFailed")}</span>
            <span className="text-xs text-slate-400">{t("retry")}</span>
          </button>
        ) : !hasData ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400">
            <Activity className="size-7 opacity-40" aria-hidden />{t("empty")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="remediationSuccess" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0} /></linearGradient>
                <linearGradient id="remediationFailed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dc2626" stopOpacity={0.16} /><stop offset="100%" stopColor="#dc2626" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} interval="preserveStartEnd" minTickGap={28} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={38} />
              <Tooltip content={<TrendTooltip />} />
              <Area type="monotone" dataKey="success" name={t("success")} stroke="#16a34a" strokeWidth={2} fill="url(#remediationSuccess)" dot={false} activeDot={{ r: 3 }} />
              <Area type="monotone" dataKey="failed" name={t("failed")} stroke="#dc2626" strokeWidth={2} fill="url(#remediationFailed)" dot={false} activeDot={{ r: 3 }} />
              <Area type="monotone" dataKey="uncertain" name={t("uncertain")} stroke="#d97706" strokeWidth={2} fill="transparent" strokeDasharray="5 3" dot={false} activeDot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <div className="flex shrink-0 items-center gap-4 border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-green-600" />{t("success")}</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-red-600" />{t("failed")}</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-600" />{t("uncertain")}</span>
      </div>
    </Card>
  )
}
