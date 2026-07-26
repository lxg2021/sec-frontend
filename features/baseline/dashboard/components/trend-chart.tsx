"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"

import PercentageTrendCard from "@/shared/components/percentage-trend-card"

import type { TrendDataPoint } from "../api"

interface TrendChartProps {
  data: TrendDataPoint[]
  loading?: boolean
}

export default function TrendChart({ data, loading = false }: TrendChartProps) {
  const t = useTranslations("pages.baseline.dashboard.trend")

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        date: item.date,
        label: item.date,
        value: Number(item.pass_rate || 0),
      })),
    [data],
  )

  return (
    <PercentageTrendCard
      className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
      data={chartData}
      loading={loading}
      title={t("title")}
      description={t("description")}
      icon={<TrendingUp className="h-5 w-5 text-white" />}
      labels={{
        loading: t("loading"),
        empty: t("empty"),
        highest: t("highest"),
        average: t("average"),
        change: t("change"),
      }}
    />
  )
}
