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
      setError(err instanceof Error ? err.message : "加载基线列表失败")
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
        setError(err instanceof Error ? err.message : "加载基线统计失败")
      })
      .finally(() => {
        setLoadingStats(false)
      })
  }, [selectedOption])

  const hasOptions = options.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center space-x-3">
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
            onRefresh={() => void loadOptions()}
            isRefreshing={loadingOptions}
            className="w-full bg-white xl:w-auto xl:min-w-[720px]"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loadingOptions && !hasOptions ? (
          <Card className="border-dashed bg-white shadow-sm">
            <CardContent className="py-14 text-center">
              <div className="text-lg font-medium text-gray-900">暂无基线检查数据</div>
              <div className="mt-2 text-sm text-gray-500">当前租户还没有可用于统计的基线报告。</div>
            </CardContent>
          </Card>
        ) : (
          <>
            <OverviewCards data={dailyStats} loading={loadingStats || loadingOptions} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TrendChart data={trendData} loading={loadingStats || loadingOptions} />
              <RiskChart data={dailyStats} loading={loadingStats || loadingOptions} />
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <Card className="border-gray-200 bg-white shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-purple-50 p-2">
                        <BarChart3 className="h-5 w-5 text-purple-300" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-medium text-gray-900">{t("categoryStats")}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">
                          {t("categoryStatsDescription")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CategoryTable
                      data={categoryData}
                      baselineUUID={selectedBaselineUUID}
                      loading={loadingStats || loadingOptions}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
