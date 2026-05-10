"use client"

import { AlertTriangle, CheckCircle, Shield, XCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import type { BaselineDailyStatsData } from "../api"

interface OverviewCardsProps {
  data: BaselineDailyStatsData | null
  loading?: boolean
}

function formatRate(value: number) {
  return `${(value || 0).toFixed(2)}%`
}

export default function OverviewCards({ data, loading = false }: OverviewCardsProps) {
  const t = useTranslations("pages.baseline.dashboard.overview")
  const locale = useLocale()
  const itemStats = data?.item_stats
  const passRateStats = data?.pass_rate_stats
  const formatCount = (value: number) => new Intl.NumberFormat(locale).format(value || 0)

  const overviewData = [
    {
      title: t("complianceRate"),
      value: formatRate(passRateStats?.total_pass_rate ?? 0),
      icon: Shield,
      color: "from-green-500 to-green-600",
      description: t("complianceRateDescription"),
    },
    {
      title: t("totalItems"),
      value: formatCount(itemStats?.total_items ?? 0),
      icon: CheckCircle,
      color: "from-blue-500 to-blue-600",
      description: t("totalItemsDescription"),
    },
    {
      title: t("failedItems"),
      value: formatCount(itemStats?.failed_items ?? 0),
      icon: XCircle,
      color: "from-orange-500 to-orange-600",
      description: t("failedItemsDescription"),
    },
    {
      title: t("highRiskItems"),
      value: formatCount(itemStats?.high_items ?? 0),
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      description: t("highRiskItemsDescription"),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item) => {
        const IconComponent = item.icon
        return (
          <Card
            key={item.title}
            className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-5 transition-opacity group-hover:opacity-10`}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.title}</CardTitle>
              <div className={`rounded-lg bg-gradient-to-br p-2 ${item.color}`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                  {loading ? "..." : item.value}
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
