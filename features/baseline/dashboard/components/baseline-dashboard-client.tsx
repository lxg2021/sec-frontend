"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { BarChart3, Shield } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import {
  type BaselineDailyStatsData,
  type BaselineOption,
  type CategoryGroup,
  type TrendDataPoint,
  fetchBaselineCategoryStats,
  fetchBaselineDailyStats,
  fetchBaselineOptions,
  fetchBaselineTrend,
} from "../api"
import { BaselineSelector } from "./baseline-selector"
import CategoryTable from "./category-table"
import OverviewCards from "./overview-cards"
import RiskChart from "./risk-chart"
import TrendChart from "./trend-chart"

function toDateOnly(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return new Date().toISOString().slice(0, 10)
  return trimmed.slice(0, 10).replaceAll("/", "-")
}

function shiftDate(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  parsed.setDate(parsed.getDate() + days)
  return parsed.toISOString().slice(0, 10)
}

export default function BaselineDashboardClient() {
  const t = useTranslations("pages.baseline.dashboard")
  const [options, setOptions] = useState<BaselineOption[]>([])
  const [selectedBaselineUUID, setSelectedBaselineUUID] = useState("")
  const [dailyStats, setDailyStats] = useState<BaselineDailyStatsData | null>(null)
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryGroup[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState("")

  const selectedOption = useMemo(
    () => options.find((item) => item.baseline_uuid === selectedBaselineUUID) ?? null,
    [options, selectedBaselineUUID],
  )

  const loadOptions = async () => {
    setLoadingOptions(true)
    setError("")

    try {
      const nextOptions = await fetchBaselineOptions()
      setOptions(nextOptions)
      setSelectedBaselineUUID((current) => {
        if (current && nextOptions.some((item) => item.baseline_uuid === current)) return current
        return nextOptions[0]?.baseline_uuid ?? ""
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.options"))
      setOptions([])
      setSelectedBaselineUUID("")
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    void loadOptions()
  }, [])

  useEffect(() => {
    if (!selectedOption) {
      setDailyStats(null)
      setTrendData([])
      setCategoryData([])
      return
    }

    const statDate = toDateOnly(selectedOption.latest_check_time)
    setLoadingStats(true)
    setError("")

    Promise.all([
      fetchBaselineDailyStats(selectedOption.baseline_uuid, statDate),
      fetchBaselineTrend(selectedOption.baseline_uuid, shiftDate(statDate, -6), statDate),
      fetchBaselineCategoryStats(selectedOption.baseline_uuid),
    ])
      .then(([daily, trend, categories]) => {
        setDailyStats(daily)
        setTrendData(trend)
        setCategoryData(categories)
      })
      .catch((err) => {
        setDailyStats(null)
        setTrendData([])
        setCategoryData([])
        setError(err instanceof Error ? err.message : t("errors.stats"))
      })
      .finally(() => {
        setLoadingStats(false)
      })
  }, [selectedOption])

  const hasOptions = options.length > 0

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-[1680px] space-y-6 p-6">
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>

          <BaselineSelector
            options={options}
            value={selectedBaselineUUID}
            onValueChange={setSelectedBaselineUUID}
            onRefresh={() => void loadOptions()}
            isRefreshing={loadingOptions}
            className="w-full bg-card xl:w-auto xl:min-w-[720px]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loadingOptions && !hasOptions ? (
          <Card className="border-dashed bg-card shadow-sm">
            <CardContent className="py-14 text-center">
              <div className="text-lg font-medium text-foreground">{t("empty.title")}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t("empty.description")}</div>
            </CardContent>
          </Card>
        ) : (
          <>
            <OverviewCards data={dailyStats} loading={loadingStats || loadingOptions} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <TrendChart data={trendData} loading={loadingStats || loadingOptions} />
              <RiskChart data={dailyStats} loading={loadingStats || loadingOptions} />
            </div>

            <Card className="border bg-card shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">{t("categoryStats")}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {t("categoryStatsDescription")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CategoryTable
                  data={categoryData}
                  baselineUUID={selectedBaselineUUID}
                  loading={loadingStats || loadingOptions}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
