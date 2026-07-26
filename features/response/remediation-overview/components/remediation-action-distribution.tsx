"use client"

import { AlertCircle, BarChart3, Loader2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { RemediationOverviewActionBucket } from "@/features/attack/remediation-order"
import {
  REMEDIATION_ACTION_TYPE_CATALOG,
  remediationActionType,
  type RemediationActionType,
} from "@/features/response/remediation-orchestration/components/remediation-action-icons"
import { remediationOrderActionLabel } from "@/features/response/remediation-orchestration/components/remediation-order-parameter-editor"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import { countNumber, formatCount } from "../presentation"

interface ActionDistributionProps {
  data: RemediationOverviewActionBucket[]
  error: string
  loading: boolean
  onRetry: () => void
}

interface RemediationActionTypeDetail {
  actionCode: string
  count: number
}

export interface RemediationActionTypeSummary {
  type: RemediationActionType
  total: number
  details: RemediationActionTypeDetail[]
}

interface RemediationActionChartDatum extends RemediationActionTypeSummary {
  label: string
}

export function summarizeRemediationActionsByType(
  data: RemediationOverviewActionBucket[],
): RemediationActionTypeSummary[] {
  const summaries = new Map<RemediationActionType, Map<string, number>>()
  for (const item of data) {
    const type = remediationActionType(item.action_code)
    const actionCode = item.action_code.trim().toLowerCase()
    if (!type || !actionCode) continue
    const actions = summaries.get(type) ?? new Map<string, number>()
    actions.set(actionCode, (actions.get(actionCode) ?? 0) + countNumber(item.item_count))
    summaries.set(type, actions)
  }

  return REMEDIATION_ACTION_TYPE_CATALOG.map(({ type }) => {
    const details = [...(summaries.get(type) ?? new Map<string, number>())]
      .map(([actionCode, count]) => ({ actionCode, count }))
      .sort((left, right) => right.count - left.count || left.actionCode.localeCompare(right.actionCode))
    return {
      type,
      total: details.reduce((total, detail) => total + detail.count, 0),
      details,
    }
  })
}

function ActionDistributionTooltip({
  active,
  locale,
  payload,
}: {
  active?: boolean
  locale: string
  payload?: Array<{ payload?: RemediationActionChartDatum }>
}) {
  const t = useTranslations("pages.response.overview.actions")
  const item = payload?.[0]?.payload
  if (!active || !item) return null

  return (
    <div className="min-w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center justify-between gap-6">
        <span className="font-medium text-slate-700">{item.label}</span>
        <span className="font-semibold tabular-nums text-slate-950">{formatCount(item.total, locale)}</span>
      </div>
      {item.details.length > 0 ? (
        <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
          {item.details.map((detail) => (
            <div className="flex items-center justify-between gap-6" key={detail.actionCode}>
              <span className="text-slate-500">
                {remediationOrderActionLabel({ action_code: detail.actionCode, entity_type: "" }, locale)}
              </span>
              <span className="font-medium tabular-nums text-slate-700">{formatCount(detail.count, locale)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 border-t border-slate-100 pt-2 text-slate-400">{t("noData")}</p>
      )}
    </div>
  )
}

export function RemediationActionDistribution({ data, error, loading, onRetry }: ActionDistributionProps) {
  const t = useTranslations("pages.response.overview.actions")
  const locale = useLocale()
  const chartData: RemediationActionChartDatum[] = summarizeRemediationActionsByType(data).map((item) => ({
    ...item,
    label: t(`types.${item.type}`),
  }))
  const maximum = Math.max(0, ...chartData.map((item) => item.total))
  const yMaximum = maximum <= 4 ? 4 : Math.ceil(maximum * 1.15)

  return (
    <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex shrink-0 flex-row items-center gap-3 px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <BarChart3 className="size-5 text-white" aria-hidden />
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
        ) : (
          <div className="h-full min-h-[190px] overflow-x-auto" aria-label={t("chartAria")} role="img">
            <div className="h-full min-w-[720px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 8, bottom: 4, left: -18 }}>
                  <defs>
                    <linearGradient id="remediationActionColumns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={{ stroke: "#cbd5e1" }}
                    interval={0}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickLine={false}
                    tickMargin={9}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    domain={[0, yMaximum]}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickLine={false}
                    width={34}
                  />
                  <Tooltip content={<ActionDistributionTooltip locale={locale} />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="total" fill="url(#remediationActionColumns)" maxBarSize={34} radius={[7, 7, 0, 0]}>
                    <LabelList dataKey="total" position="top" fill="#475569" fontSize={11} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="sr-only">
              {chartData.map((item) => <li key={item.type}>{item.label}: {formatCount(item.total, locale)}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
