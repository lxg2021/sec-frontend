import type { ElementType } from "react"
import { Activity, AlertTriangle, ClipboardList, Monitor } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import type { RemediationOverviewTotals } from "@/features/attack/remediation-order"
import { Card, CardContent } from "@/shared/ui/card"

import { formatCount } from "../presentation"

interface MetricDefinition {
  key: "orders" | "hosts" | "active" | "attention"
  icon: ElementType
  value: RemediationOverviewTotals[keyof Pick<RemediationOverviewTotals, "order_count" | "host_count" | "active_order_count" | "attention_order_count">]
  color: string
}

export function OverviewMetricCards({ totals }: { totals: RemediationOverviewTotals }) {
  const t = useTranslations("pages.response.overview.metrics")
  const locale = useLocale()
  const metrics: MetricDefinition[] = [
    { key: "orders", icon: ClipboardList, value: totals.order_count, color: "from-blue-500 to-blue-700" },
    { key: "hosts", icon: Monitor, value: totals.host_count, color: "from-cyan-500 to-cyan-700" },
    { key: "active", icon: Activity, value: totals.active_order_count, color: "from-emerald-500 to-emerald-700" },
    { key: "attention", icon: AlertTriangle, value: totals.attention_order_count, color: "from-amber-500 to-orange-600" },
  ]

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ key, icon: Icon, value, color }) => (
        <Card key={key} className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <CardContent className="flex min-h-[104px] items-center justify-between gap-3 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                <Icon className="size-5 text-white" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-medium leading-6 text-slate-950">{t(`${key}.title`)}</p>
                <p className="mt-1 truncate text-xs leading-5 text-slate-500">{t(`${key}.description`)}</p>
              </div>
            </div>
            <div className="shrink-0 text-2xl font-semibold tabular-nums text-slate-950">{formatCount(value, locale)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
