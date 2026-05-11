"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { BarChart3, RefreshCw, Shield } from "lucide-react"

import { Button } from "@/shared/ui/button"
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

function getSelectedOption(options: BaselineOption[], currentUUID: string) {
  return options.find((item) => item.baseline_uuid === currentUUID) ?? options[0] ?? null
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
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [error, setError] = useState("")
  const skipNextStatsLoadRef = useRef(false)

  const selectedOption = useMemo(
    () => options.find((item) => item.baseline_uuid === selectedBaselineUUID) ?? null,
    [options, selectedBaselineUUID],
  )

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    setError("")

    try {
      const nextOptions = await fetchBaselineOptions()
      setOptions(nextOptions)
      setSelectedBaselineUUID((current) => getSelectedOption(nextOptions, current)?.baseline_uuid ?? "")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.options"))
      setOptions([])
      setSelectedBaselineUUID("")
    } finally {
      setLoadingOptions(false)
    }
  }, [t])

  const loadStats = useCallback(async (option: BaselineOption | null) => {
    if (!option) return

    const statDate = toDateOnly(option.latest_check_time)
    setLoadingStats(true)
    setLoadingCategory(true)
    setError("")

    try {
      const [daily, trend, categories] = await Promise.all([
        fetchBaselineDailyStats(option.baseline_uuid, statDate),
        fetchBaselineTrend(option.baseline_uuid, shiftDate(statDate, -6), statDate),
        fetchBaselineCategoryStats(option.baseline_uuid),
      ])

      setDailyStats(daily)
      setTrendData(trend)
      setCategoryData(categories)
    } catch (err) {
      setDailyStats(null)
      setTrendData([])
      setCategoryData([])
      setError(err instanceof Error ? err.message : t("errors.stats"))
    } finally {
      setLoadingStats(false)
      setLoadingCategory(false)
    }
  }, [t])

  const loadCategoryStats = useCallback(async (option: BaselineOption | null) => {
    if (!option) return

    setLoadingCategory(true)
    setError("")

    try {
      const categories = await fetchBaselineCategoryStats(option.baseline_uuid)
      setCategoryData(categories)
    } catch (err) {
      setCategoryData([])
      setError(err instanceof Error ? err.message : t("errors.categoryStats"))
    } finally {
      setLoadingCategory(false)
    }
  }, [t])

  const refreshDashboard = useCallback(async () => {
    setLoadingOptions(true)
    setError("")

    try {
      const nextOptions = await fetchBaselineOptions()
      const nextSelectedOption = getSelectedOption(nextOptions, selectedBaselineUUID)

      skipNextStatsLoadRef.current = Boolean(nextSelectedOption)
      setOptions(nextOptions)
      setSelectedBaselineUUID(nextSelectedOption?.baseline_uuid ?? "")

      if (nextSelectedOption) {
        await loadStats(nextSelectedOption)
      } else {
        setDailyStats(null)
        setTrendData([])
        setCategoryData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.options"))
      setOptions([])
      setSelectedBaselineUUID("")
      setDailyStats(null)
      setTrendData([])
      setCategoryData([])
    } finally {
      setLoadingOptions(false)
    }
  }, [loadStats, selectedBaselineUUID, t])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  useEffect(() => {
    if (!selectedOption) {
      setDailyStats(null)
      setTrendData([])
      setCategoryData([])
      return
    }

    if (skipNextStatsLoadRef.current) {
      skipNextStatsLoadRef.current = false
      return
    }

    void loadStats(selectedOption)
  }, [loadStats, selectedOption])

  const hasOptions = options.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
            </div>
          </div>

          <BaselineSelector
            options={options}
            value={selectedBaselineUUID}
            onValueChange={setSelectedBaselineUUID}
            onRefresh={() => void refreshDashboard()}
            isRefreshing={loadingOptions || loadingStats}
            className="w-full xl:w-auto xl:min-w-[720px]"
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
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-2">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">{t("categoryStats")}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {t("categoryStatsDescription")}
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadCategoryStats(selectedOption)}
                    disabled={!selectedOption || loadingCategory}
                    className="h-9 gap-2 border-border/70 bg-background/80 px-3 shadow-none"
                  >
                    <RefreshCw className={loadingCategory ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    <span>{t("refresh")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CategoryTable
                  data={categoryData}
                  baselineUUID={selectedBaselineUUID}
                  baselineName={selectedOption?.display_name}
                  loading={loadingCategory || loadingOptions}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
