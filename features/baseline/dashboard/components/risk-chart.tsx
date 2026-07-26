"use client"

import { PieChart } from "lucide-react"
import { useTranslations } from "next-intl"

import { DistributionRingCard } from "@/shared/components/distribution-ring-card"

import type { BaselineDailyStatsData } from "../api"

interface RiskChartProps {
  data: BaselineDailyStatsData | null
  loading?: boolean
}

export default function RiskChart({ data, loading = false }: RiskChartProps) {
  const t = useTranslations("pages.baseline.dashboard.risk")

  const itemStats = data?.item_stats
  const totalItems = itemStats?.total_items ?? 0

  const riskData = [
    { key: "low", label: t("low"), value: itemStats?.low_items ?? 0, color: "#10b981" },
    { key: "medium", label: t("medium"), value: itemStats?.medium_items ?? 0, color: "#f59e0b" },
    { key: "high", label: t("high"), value: itemStats?.high_items ?? 0, color: "#ef4444" },
  ]

  return (
    <DistributionRingCard
      className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
      title={t("title")}
      description={t("description")}
      totalLabel={t("total")}
      items={riskData}
      totalValue={totalItems}
      loading={loading}
      icon={<PieChart className="h-5 w-5 text-white" />}
      formatValue={(value) => t("count", { count: value })}
    />
  )
}
