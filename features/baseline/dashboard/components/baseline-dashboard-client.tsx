"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { BarChart3, Loader2, Play, RefreshCw, Sparkles } from "lucide-react"

import { useToast } from "@/shared/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import {
  baselineImmediateScan,
  baselineOneClickRepair,
  type BaselineOneClickRepairPayload,
  type BaselineDailyStatsData,
  type BaselineOption,
  type CategoryGroup,
  type TrendDataPoint,
  fetchBaselineCategoryStats,
  fetchBaselineDailyStats,
  fetchBaselineOptions,
  fetchBaselineTrend,
} from "../api"
import { BaselineRepairDialog } from "./baseline-repair-dialog"
import { BaselineSelector } from "./baseline-selector"
import CategoryTable from "./category-table"
import OverviewCards from "./overview-cards"
import RiskChart from "./risk-chart"
import TrendChart from "./trend-chart"

function toDateOnly(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return toLocalDateOnly(new Date())
  return trimmed.slice(0, 10).replaceAll("/", "-")
}

function toLocalDateOnly(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
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
  const locale = useLocale()
  const t = useTranslations("pages.baseline.dashboard")
  const { toast } = useToast()
  const [options, setOptions] = useState<BaselineOption[]>([])
  const [selectedBaselineUUID, setSelectedBaselineUUID] = useState("")
  const [dailyStats, setDailyStats] = useState<BaselineDailyStatsData | null>(null)
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryGroup[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [triggeringImmediateScan, setTriggeringImmediateScan] = useState(false)
  const [triggeringRepair, setTriggeringRepair] = useState(false)
  const [error, setError] = useState("")
  const skipNextStatsLoadRef = useRef(false)
  const repairCopy = useMemo(
    () =>
      locale.toLowerCase().startsWith("zh")
        ? {
            repairing: "修复中...",
            successTitle: "已触发一键修复",
            successDescription: "一键修复命令已下发，目标主机将开始执行修复。",
            successDescriptionWithRescan: "一键修复命令已下发，目标主机将开始执行修复，并在完成后触发重扫。",
            failedTitle: "一键修复失败",
          }
        : {
            repairing: "Repairing...",
            successTitle: "One-click repair started",
            successDescription: "The one-click repair command has been dispatched. Target hosts will begin repair shortly.",
            successDescriptionWithRescan:
              "The one-click repair command has been dispatched. Target hosts will begin repair and trigger a rescan after completion.",
            failedTitle: "Failed to start one-click repair",
          },
    [locale],
  )

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
    const trendEndDate = toLocalDateOnly(new Date())
    const trendStartDate = shiftDate(trendEndDate, -6)
    setLoadingStats(true)
    setLoadingCategory(true)
    setError("")

    try {
      const [daily, trend, categories] = await Promise.all([
        fetchBaselineDailyStats(option.baseline_uuid, statDate),
        fetchBaselineTrend(option.baseline_uuid, trendStartDate, trendEndDate),
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

  const handleImmediateScan = useCallback(async () => {
    setTriggeringImmediateScan(true)

    try {
      await baselineImmediateScan()
      toast({
        title: t("scanNowSuccessTitle"),
        description: t("scanNowSuccessDescription"),
      })
    } catch (err) {
      toast({
        title: t("scanNowFailedTitle"),
        description: err instanceof Error ? err.message : t("errors.stats"),
        variant: "destructive",
      })
    } finally {
      setTriggeringImmediateScan(false)
    }
  }, [t, toast])

  const handleRepair = useCallback(async (payload: BaselineOneClickRepairPayload) => {
    if (!selectedOption) {
      throw new Error(t("errors.options"))
    }

    setTriggeringRepair(true)

    try {
      await baselineOneClickRepair(payload)
      toast({
        title: repairCopy.successTitle,
        description: payload.rescanAfterRepair
          ? repairCopy.successDescriptionWithRescan
          : repairCopy.successDescription,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.stats")
      toast({
        title: repairCopy.failedTitle,
        description: message,
        variant: "destructive",
      })
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setTriggeringRepair(false)
    }
  }, [repairCopy, selectedOption, t, toast])

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

  return (
    <div className="h-full min-h-0 bg-gray-50">
      <div className="flex min-h-full flex-col gap-6 p-6">
        <BaselineSelector
          actions={
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleImmediateScan()}
                disabled={triggeringImmediateScan}
                className="h-10 gap-2 rounded-full px-3 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
              >
                {triggeringImmediateScan ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                <span className="font-medium">{triggeringImmediateScan ? t("scanning") : t("scanNow")}</span>
              </Button>

              <BaselineRepairDialog
                baselineUuid={selectedOption?.baseline_uuid ?? ""}
                baselineName={selectedOption?.display_name}
                hostCount={selectedOption?.host_count}
                disabled={!selectedOption || triggeringRepair}
                onConfirm={handleRepair}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!selectedOption || triggeringRepair}
                    className="h-10 gap-2 rounded-full px-3 text-teal-500 hover:bg-teal-50 hover:text-teal-700"
                  >
                    {triggeringRepair ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="font-medium">{triggeringRepair ? repairCopy.repairing : t("repair")}</span>
                  </Button>
                }
              />
            </>
          }
          options={options}
          value={selectedBaselineUUID}
          onValueChange={setSelectedBaselineUUID}
          onRefresh={() => void refreshDashboard()}
          isRefreshing={loadingOptions || loadingStats}
          className="w-full"
        />

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <OverviewCards data={dailyStats} loading={loadingStats || loadingOptions} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TrendChart data={trendData} loading={loadingStats || loadingOptions} />
          <RiskChart data={dailyStats} loading={loadingStats || loadingOptions} />
        </div>

        <Card className="flex min-h-[220px] flex-1 flex-col border bg-card shadow-sm">
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
          <CardContent className="flex min-h-0 flex-1 flex-col p-4">
            <CategoryTable
              data={categoryData}
              baselineUUID={selectedBaselineUUID}
              baselineName={selectedOption?.display_name}
              loading={loadingCategory || loadingOptions}
            />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
