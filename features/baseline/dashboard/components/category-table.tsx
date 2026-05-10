"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListChecks,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Progress } from "@/shared/ui/progress"

import { fetchBaselineItemStatistics, type BaselineItemResultStatistics, type CategoryGroup } from "../api"
import CountUp from "./count-up"

interface CategoryTableProps {
  data: CategoryGroup[]
  baselineUUID: string
  loading?: boolean
}

function getCategoryLabel(category: CategoryGroup) {
  return category.category_zh || category.category || "Unknown"
}

function getItemLabel(item: CategoryGroup["items"][number]) {
  return item.name_zh || item.name || item.item_id
}

function getAveragePassRate(category: CategoryGroup) {
  if (!category.items.length) return 0
  const total = category.items.reduce((sum, item) => sum + Number(item.passed_rate || 0), 0)
  return Math.round(total / category.items.length)
}

function severityClass(severity: string) {
  const normalized = severity.toLowerCase()
  if (normalized === "high") return "bg-red-50 text-red-700 border-red-200"
  if (normalized === "medium") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-green-50 text-green-700 border-green-200"
}

const detailGridClass =
  "grid grid-cols-[minmax(220px,2.1fr)_minmax(112px,0.9fr)_minmax(84px,0.7fr)_minmax(84px,0.7fr)_minmax(84px,0.7fr)_minmax(136px,1.15fr)_minmax(88px,0.75fr)] gap-4"

function HeaderCell({
  icon,
  label,
  align = "left",
}: {
  icon: ReactNode
  label: string
  align?: "left" | "center"
}) {
  return (
    <div className={`flex items-center gap-1.5 ${align === "center" ? "justify-center" : ""}`}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

export default function CategoryTable({ data, baselineUUID, loading = false }: CategoryTableProps) {
  const t = useTranslations("pages.baseline.dashboard.categoryTable")
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("")
  const [itemStatsById, setItemStatsById] = useState<Record<string, BaselineItemResultStatistics | null>>({})
  const [loadingItemStats, setLoadingItemStats] = useState(false)
  const itemsPerPage = 4

  const totalPages = Math.max(Math.ceil(data.length / itemsPerPage), 1)
  const currentPageData = data.slice(activeIndex * itemsPerPage, (activeIndex + 1) * itemsPerPage)
  const selectedCategory = useMemo(
    () => data.find((category) => category.category === selectedCategoryKey) ?? currentPageData[0] ?? null,
    [currentPageData, data, selectedCategoryKey],
  )
  const selectedItemIdsKey = useMemo(
    () => selectedCategory?.items.map((item) => item.item_id).join("|") ?? "",
    [selectedCategory],
  )

  useEffect(() => {
    setActiveIndex(0)
    setSelectedCategoryKey(data[0]?.category ?? "")
  }, [baselineUUID, data])

  useEffect(() => {
    let cancelled = false

    setItemStatsById({})

    if (!baselineUUID || !selectedCategory || !selectedCategory.items.length) {
      setLoadingItemStats(false)
      return () => {
        cancelled = true
      }
    }

    setLoadingItemStats(true)

    Promise.all(
      selectedCategory.items.map(async (item) => {
        if (!item.item_id) return [item.item_id, null] as const

        try {
          const stats = await fetchBaselineItemStatistics(baselineUUID, item.item_id)
          return [item.item_id, stats] as const
        } catch {
          return [item.item_id, null] as const
        }
      }),
    )
      .then((entries) => {
        if (cancelled) return
        setItemStatsById(Object.fromEntries(entries))
      })
      .finally(() => {
        if (!cancelled) setLoadingItemStats(false)
      })

    return () => {
      cancelled = true
    }
  }, [baselineUUID, selectedCategory?.category, selectedItemIdsKey])

  const goToPrevious = () => {
    const newIndex = activeIndex === 0 ? totalPages - 1 : activeIndex - 1
    setActiveIndex(newIndex)
    setSelectedCategoryKey(data[newIndex * itemsPerPage]?.category ?? "")
  }

  const goToNext = () => {
    const newIndex = activeIndex === totalPages - 1 ? 0 : activeIndex + 1
    setActiveIndex(newIndex)
    setSelectedCategoryKey(data[newIndex * itemsPerPage]?.category ?? "")
  }

  const handleCategoryClick = (category: CategoryGroup) => {
    setSelectedCategoryKey(selectedCategoryKey === category.category ? "" : category.category)
  }

  const handleItemDetail = (category: CategoryGroup, item: CategoryGroup["items"][number]) => {
    const searchParams = new URLSearchParams({
      baseline_uuid: baselineUUID,
      category: category.category,
      item_id: item.item_id,
      item: getItemLabel(item),
    })
    router.push(`/frame/baseline/details?${searchParams.toString()}`)
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">{t("loading")}</div>
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
        <div className="text-lg font-medium text-gray-900">{t("emptyTitle")}</div>
        <div className="mt-2 text-sm text-gray-500">{t("emptyDescription")}</div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 rounded-full border-gray-300 bg-transparent hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index)
                  setSelectedCategoryKey(data[index * itemsPerPage]?.category ?? "")
                }}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === activeIndex ? "w-6 bg-blue-600" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 rounded-full border-gray-300 bg-transparent hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {t("pageSummary", { current: activeIndex + 1, total: totalPages, count: data.length })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {currentPageData.map((category, index) => {
          const passRate = getAveragePassRate(category)
          const isSelected = selectedCategory?.category === category.category

          return (
            <Card
              key={category.category}
              onClick={() => handleCategoryClick(category)}
              className={`relative cursor-pointer border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
                isSelected ? "scale-[1.02] ring-2 ring-blue-500" : ""
              }`}
            >
              {isSelected && (
                <div className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                  <Eye className="h-3 w-3 text-white" />
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  <div className={`rounded-lg p-3 ${isSelected ? "bg-blue-100" : "bg-slate-50"}`}>
                    <ListChecks className={`h-6 w-6 ${isSelected ? "text-blue-600" : "text-slate-500"}`} />
                  </div>
                  <h3 className="line-clamp-2 min-h-10 text-center text-sm font-medium text-gray-900">
                    {getCategoryLabel(category)}
                  </h3>

                  <div className="text-center">
                    <div className="mb-1 text-2xl font-bold text-gray-900">
                      <CountUp end={passRate} duration={1200} delay={index * 80} suffix="%" />
                    </div>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
                      {t("averagePassRate")}
                    </Badge>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{t("categoryItemCount", { count: category.item_count })}</span>
                      <span>{t("resultsCount", { count: category.items.length })}</span>
                    </div>
                    <Progress value={passRate} className="h-2 w-full bg-gray-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedCategory && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          <Card className="border-l-4 border-l-blue-500 border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <ListChecks className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-lg font-medium text-gray-900">
                      <span>{getCategoryLabel(selectedCategory)}</span>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        {t("details")}
                      </Badge>
                    </CardTitle>
                    <p className="mt-1 text-sm text-gray-500">
                      {t("detailSummary", {
                        items: selectedCategory.item_count,
                        results: selectedCategory.items.length,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="mb-1 text-2xl font-bold text-blue-900">
                      <CountUp end={getAveragePassRate(selectedCategory)} duration={1200} delay={100} suffix="%" />
                    </div>
                    <div className="text-sm text-gray-500">{t("averagePassRate")}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCategoryKey("")}
                    className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className={`${detailGridClass} rounded-lg border-b border-gray-200 bg-gray-50 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-gray-500`}>
                  <HeaderCell icon={<ListChecks className="h-3.5 w-3.5" />} label={t("checkItemName")} />
                  <HeaderCell icon={<ShieldAlert className="h-3.5 w-3.5" />} label={t("severity")} />
                  <HeaderCell icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label={t("passed")} />
                  <HeaderCell icon={<XCircle className="h-3.5 w-3.5 text-rose-500" />} label={t("failed")} />
                  <HeaderCell icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} label={t("error")} />
                  <HeaderCell icon={<BarChart3 className="h-3.5 w-3.5" />} label={t("passRate")} />
                  <HeaderCell icon={<ArrowRight className="h-3.5 w-3.5" />} label={t("action")} align="center" />
                </div>

                {selectedCategory.items.map((item, index) => {
                  const itemStats = itemStatsById[item.item_id]
                  const passRate = itemStats?.pass_rate ?? item.passed_rate ?? 0

                  return (
                    <div
                      key={`${item.item_id}-${index}`}
                      className={`${detailGridClass} items-center rounded-lg border-b border-gray-100 px-4 py-4 transition-colors duration-200 last:border-b-0 hover:bg-blue-50`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">{getItemLabel(item)}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {loadingItemStats
                            ? t("itemStatsLoading")
                            : itemStats
                              ? t("hostStats", {
                                  total: itemStats.total_hosts,
                                  passed: itemStats.passed_hosts,
                                  failed: itemStats.failed_hosts,
                                  error: itemStats.error_hosts,
                                })
                              : t("itemStatsUnavailable")}
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className={`text-xs ${severityClass(item.severity)}`}>
                          {item.severity || t("unknown")}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-emerald-600">
                        {loadingItemStats ? "..." : itemStats?.passed_hosts ?? "0"}
                      </div>
                      <div className="text-sm font-medium text-rose-600">
                        {loadingItemStats ? "..." : itemStats?.failed_hosts ?? "0"}
                      </div>
                      <div className="text-sm font-medium text-amber-600">
                        {loadingItemStats ? "..." : itemStats?.error_hosts ?? "0"}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-2.5 flex-1 rounded-full bg-gray-200">
                          <div
                            className="h-2.5 rounded-full bg-blue-500 transition-all duration-1000"
                            style={{ width: `${Math.max(0, Math.min(100, passRate))}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-gray-500">{passRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleItemDetail(selectedCategory, item)}
                          className="h-7 border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                        >
                          {t("details")}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
