import type { ElementType } from "react"
import { Activity, AlertTriangle, ClipboardList, Monitor } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import type { RemediationOverviewTotals } from "@/features/attack/remediation-order"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

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
    <div className="grid h-[116px] grid-cols-2 gap-4 xl:grid-cols-4">
      {metrics.map(({ key, icon: Icon, value, color }) => (
        <Card key={key} className="group relative h-full overflow-hidden border-0 shadow-md transition-shadow hover:shadow-lg">
          <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.055]`} />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 px-5 pb-1 pt-4">
            <CardTitle className="text-sm font-medium text-slate-600">{t(`${key}.title`)}</CardTitle>
            <span className={`flex size-8 items-center justify-center rounded-lg bg-gradient-to-br ${color}`}>
              <Icon className="size-4 text-white" aria-hidden />
            </span>
          </CardHeader>
          <CardContent className="relative px-5 pb-4 pt-0">
            <div className="text-2xl font-bold tabular-nums text-slate-900">{formatCount(value, locale)}</div>
            <p className="mt-0.5 truncate text-xs text-slate-400">{t(`${key}.description`)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
