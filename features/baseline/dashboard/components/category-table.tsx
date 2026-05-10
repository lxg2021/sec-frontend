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
  Filter,
  ListChecks,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/lib/utils"

import { fetchBaselineItemStatistics, type BaselineItemResultStatistics, type CategoryGroup } from "../api"

interface CategoryTableProps {
  data: CategoryGroup[]
  baselineUUID: string
  loading?: boolean
}

type CategoryRow = CategoryGroup & {
  categoryKey: string
  iconName: string
}

const PAGE_SIZE = 10
const CATEGORY_PAGE_SIZE = 10

const CATEGORY_ICON_MAP: Record<string, string> = {
  "account policies": "account",
  "administrative templates: control panel": "template",
  "administrative templates: network": "network",
  "administrative templates: powershellcore": "system",
  "administrative templates: printers": "system",
  "administrative templates: start menu and taskbar": "windows",
  "administrative templates: system": "system",
  "administrative templates: windows components": "windows",
  "advanced audit policy configuration": "audit",
  features: "baseline",
  "microsoft defender exploit guard": "security",
  "ms security guide": "security",
  "mss (legacy)": "security",
  "scheduled task": "service",
  "security options": "security",
  "system services": "service",
  "user rights assignment": "account",
  "windows firewall": "network",
  "mss（旧版）": "security",
  "ms安全指南": "security",
  "windows 防火墙": "network",
  安全选项: "security",
  高级审核策略配置: "audit",
  功能: "baseline",
  "管理模板：powershellcore": "system",
  "管理模板：windows 组件": "windows",
  "管理模板：windows组件": "windows",
  "管理模板：打印机": "system",
  "管理模板：开始菜单和任务栏": "windows",
  "管理模板：控制面板": "template",
  "管理模板：网络": "network",
  "管理模板：系统": "system",
  计划任务: "service",
  系统服务: "service",
  用户权限分配: "account",
  账户策略: "account",
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

function normalizeCategoryKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function getCategorySeverityMix(category: CategoryGroup) {
  return category.items.reduce(
    (acc, item) => {
      acc.total += 1
      const severity = (item.severity || "").trim().toLowerCase()
      if (severity === "high") acc.high += 1
      else if (severity === "medium") acc.medium += 1
      else acc.low += 1
      return acc
    },
    { total: 0, high: 0, medium: 0, low: 0 },
  )
}

function severityClass(severity: string) {
  const normalized = severity.toLowerCase()
  if (normalized === "high") return "bg-red-50 text-red-700 border-red-200"
  if (normalized === "medium") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-emerald-50 text-emerald-700 border-emerald-200"
}

function getCategoryIconName(category: CategoryGroup) {
  const normalizedCategory = normalizeCategoryKey(category.category || "")
  const normalizedCategoryZh = normalizeCategoryKey(category.category_zh || "")

  if (CATEGORY_ICON_MAP[normalizedCategory]) return CATEGORY_ICON_MAP[normalizedCategory]
  if (CATEGORY_ICON_MAP[normalizedCategoryZh]) return CATEGORY_ICON_MAP[normalizedCategoryZh]

  const text = `${normalizedCategory} ${normalizedCategoryZh}`

  if (text.includes("template") || text.includes("policy")) return "template"
  if (text.includes("windows")) return "windows"
  if (text.includes("account") || text.includes("user rights") || text.includes("password") || text.includes("login")) return "account"
  if (text.includes("audit") || text.includes("event log") || text.includes("log")) return "audit"
  if (text.includes("network") || text.includes("firewall") || text.includes("dns") || text.includes("vpn")) return "network"
  if (text.includes("registry")) return "registry"
  if (text.includes("service") || text.includes("task")) return "service"
  if (text.includes("security") || text.includes("defender") || text.includes("shield") || text.includes("antivirus")) return "security"
  if (text.includes("system") || text.includes("os")) return "system"
  if (text.includes("file") || text.includes("permission") || text.includes("directory") || text.includes("acl")) return "file"
  return "default"
}

function getCategoryProgressMeta(category: CategoryGroup) {
  const rate = getAveragePassRate(category)
  const mix = getCategorySeverityMix(category)
  const total = Math.max(mix.total, 1)
  const highShare = mix.high / total
  const mediumShare = mix.medium / total
  const lowShare = mix.low / total
  const completion = rate / 100
  const severityPressure = (mix.high * 3 + mix.medium * 2 + mix.low) / (total * 3)
  const volumePressure = Math.min(1, total / 25)
  const riskScore = severityPressure * 0.45 + (1 - completion) * 0.4 + volumePressure * 0.15

  if (rate >= 99.5) {
    return {
      rate,
      trackClass: "bg-emerald-100",
      fillClass: "bg-emerald-500",
      textClass: "text-emerald-600",
    }
  }

  if (riskScore >= 0.62 || (highShare >= 0.45 && rate < 85)) {
    return {
      rate,
      trackClass: "bg-rose-100",
      fillClass: "bg-rose-500",
      textClass: "text-rose-600",
    }
  }

  if (riskScore >= 0.35 || mediumShare >= 0.45 || lowShare <= 0.3) {
    return {
      rate,
      trackClass: "bg-amber-100",
      fillClass: "bg-amber-500",
      textClass: "text-amber-600",
    }
  }

  return {
    rate,
    trackClass: "bg-emerald-100",
    fillClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  }
}

function getSeverityLabel(severity: string, t: ReturnType<typeof useTranslations>) {
  const normalized = severity.toLowerCase()
  if (normalized === "high") return t("severityLabels.high")
  if (normalized === "medium") return t("severityLabels.medium")
  if (normalized === "low") return t("severityLabels.low")
  return severity || t("unknown")
}

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
    <div className={cn("flex items-center gap-1.5", align === "center" && "justify-center")}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

export default function CategoryTable({ data, baselineUUID, loading = false }: CategoryTableProps) {
  const t = useTranslations("pages.baseline.dashboard.categoryTable")
  const router = useRouter()
  const categoryRows = useMemo<CategoryRow[]>(
    () =>
      data.map((category, index) => ({
        ...category,
        categoryKey: `${category.baseline_uuid}:${category.tenant_id}:${category.category}:${index}`,
        iconName: getCategoryIconName(category),
      })),
    [data],
  )

  const [selectedCategoryKey, setSelectedCategoryKey] = useState("")
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemStatsById, setItemStatsById] = useState<Record<string, BaselineItemResultStatistics | null>>({})
  const [loadingItemStats, setLoadingItemStats] = useState<Record<string, boolean>>({})

  const currentCategory = useMemo(() => {
    return categoryRows.find((category) => category.categoryKey === selectedCategoryKey) ?? categoryRows[0] ?? null
  }, [categoryRows, selectedCategoryKey])

  const categoryTotalPages = Math.max(Math.ceil(categoryRows.length / CATEGORY_PAGE_SIZE), 1)
  const visibleCategoryRows = useMemo(() => {
    const startIndex = (categoryCurrentPage - 1) * CATEGORY_PAGE_SIZE
    return categoryRows.slice(startIndex, startIndex + CATEGORY_PAGE_SIZE)
  }, [categoryCurrentPage, categoryRows])

  const filteredItems = useMemo(() => {
    if (!currentCategory) return []

    const keyword = searchQuery.trim().toLowerCase()

    return currentCategory.items.filter((item) => {
      const matchesSearch =
        !keyword ||
        getItemLabel(item).toLowerCase().includes(keyword) ||
        item.item_id.toLowerCase().includes(keyword)

      const matchesSeverity =
        severityFilter === "all" || (item.severity || "").toLowerCase() === severityFilter.toLowerCase()

      return matchesSearch && matchesSeverity
    })
  }, [currentCategory, searchQuery, severityFilter])

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredItems, currentPage])

  const totalPages = Math.max(Math.ceil(filteredItems.length / PAGE_SIZE), 1)

  useEffect(() => {
    if (categoryRows.length > 0 && !selectedCategoryKey) {
      setSelectedCategoryKey(categoryRows[0].categoryKey)
    }
  }, [categoryRows, selectedCategoryKey])

  useEffect(() => {
    setSelectedCategoryKey(categoryRows.length > 0 ? categoryRows[0].categoryKey : "")
    setCategoryCurrentPage(1)
    setSearchQuery("")
    setSeverityFilter("all")
    setCurrentPage(1)
    setItemStatsById({})
    setLoadingItemStats({})
  }, [baselineUUID, categoryRows])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategoryKey, searchQuery, severityFilter])

  useEffect(() => {
    if (!currentCategory) return

    const allMissingItems = currentCategory.items.filter(
      (item) => itemStatsById[item.item_id] === undefined && !loadingItemStats[item.item_id],
    )
    if (!allMissingItems.length) return

    let cancelled = false
    const nextLoadingState: Record<string, boolean> = {}
    allMissingItems.forEach((item) => {
      nextLoadingState[item.item_id] = true
    })
    setLoadingItemStats((prev) => ({ ...prev, ...nextLoadingState }))

    Promise.all(
      allMissingItems.map(async (item) => {
        try {
          const stats = await fetchBaselineItemStatistics(baselineUUID, item.item_id)
          return [item.item_id, stats] as const
        } catch {
          return [item.item_id, null] as const
        }
      }),
    ).then((results) => {
      if (cancelled) return

      const newStats: Record<string, BaselineItemResultStatistics | null> = {}
      const clearedLoading: Record<string, boolean> = {}
      results.forEach(([id, stats]) => {
        newStats[id] = stats
        clearedLoading[id] = false
      })

      setItemStatsById((prev) => ({ ...prev, ...newStats }))
      setLoadingItemStats((prev) => ({ ...prev, ...clearedLoading }))
    })

    return () => {
      cancelled = true
    }
  }, [baselineUUID, currentCategory?.categoryKey])

  const handleItemDetail = (item: CategoryGroup["items"][number]) => {
    if (!currentCategory) return

    const searchParams = new URLSearchParams({
      baseline_uuid: baselineUUID,
      category: currentCategory.category,
      item_id: item.item_id,
      item: getItemLabel(item),
    })
    router.push(`/frame/baseline/details?${searchParams.toString()}`)
  }

  const handleCategoryPageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(categoryTotalPages, nextPage))
    const firstCategory = categoryRows[(safePage - 1) * CATEGORY_PAGE_SIZE]

    setCategoryCurrentPage(safePage)
    if (firstCategory) setSelectedCategoryKey(firstCategory.categoryKey)
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {t("loading")}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 py-12 text-center">
        <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <div className="mt-3 text-lg font-medium text-foreground">{t("emptyTitle")}</div>
        <div className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[680px] flex-col overflow-hidden rounded-lg border bg-card lg:flex-row">
      <aside className="flex w-full flex-col border-b border-border lg:w-[30rem] lg:border-b-0 lg:border-r">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">{t("categoryList")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("categoryCount", { count: data.length })}</p>
        </div>
        <ScrollArea className="h-[520px] lg:h-full">
          <div className="p-2">
            {visibleCategoryRows.map((category) => {
              const progress = getCategoryProgressMeta(category)
              const isSelected = selectedCategoryKey === category.categoryKey

              return (
                <button
                  key={category.categoryKey}
                  onClick={() => setSelectedCategoryKey(category.categoryKey)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                    isSelected ? "text-primary" : "text-foreground hover:bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    )}
                  >
                    <img src={`/icons/baseline/${category.iconName}.svg`} alt="" className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={cn("truncate text-sm font-medium", isSelected && "text-primary")}>
                        {getCategoryLabel(category)}
                      </div>
                      <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px]">
                        {category.item_count || category.items.length}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={cn("h-1.5 flex-1 rounded-full", progress.trackClass)}>
                        <div
                          className={cn("h-1.5 rounded-full transition-all", progress.fillClass)}
                          style={{ width: `${progress.rate}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", progress.textClass)}>
                        {progress.rate}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", isSelected ? "text-primary" : "text-muted-foreground")} />
                </button>
              )
            })}
          </div>
        </ScrollArea>
        {categoryTotalPages > 1 && (
          <div className="border-t border-border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {t("categoryPageInfo", {
                  current: categoryCurrentPage,
                  total: categoryTotalPages,
                  count: categoryRows.length,
                })}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCategoryPageChange(categoryCurrentPage - 1)}
                  disabled={categoryCurrentPage === 1}
                  className="h-7 w-7"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCategoryPageChange(categoryCurrentPage + 1)}
                  disabled={categoryCurrentPage === categoryTotalPages}
                  className="h-7 w-7"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </aside>

      <section className="flex flex-1 flex-col overflow-hidden">
        {currentCategory && (
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">{getCategoryLabel(currentCategory)}</h3>
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-xs text-primary">
                  {t("details")}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("detailSummary", {
                  items: currentCategory.item_count,
                  results: currentCategory.items.length,
                })}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-8 w-full pl-8 text-sm sm:w-52"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-8 w-full sm:w-36">
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  <SelectValue placeholder={t("severityFilter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allSeverities")}</SelectItem>
                  <SelectItem value="high">{t("severityLabels.high")}</SelectItem>
                  <SelectItem value="medium">{t("severityLabels.medium")}</SelectItem>
                  <SelectItem value="low">{t("severityLabels.low")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {currentCategory && paginatedItems.length > 0 ? (
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">
                    <HeaderCell icon={<ListChecks className="h-3.5 w-3.5" />} label={t("checkItemName")} />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <HeaderCell icon={<ShieldAlert className="h-3.5 w-3.5" />} label={t("severity")} align="center" />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <HeaderCell icon={<BarChart3 className="h-3.5 w-3.5" />} label={t("totalHosts")} align="center" />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <HeaderCell
                      icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      label={t("passed")}
                      align="center"
                    />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <HeaderCell icon={<XCircle className="h-3.5 w-3.5 text-rose-500" />} label={t("failed")} align="center" />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <HeaderCell
                      icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      label={t("error")}
                      align="center"
                    />
                  </th>
                  <th className="w-36 px-4 py-3">
                    <HeaderCell icon={<BarChart3 className="h-3.5 w-3.5" />} label={t("passRate")} />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <HeaderCell icon={<ArrowRight className="h-3.5 w-3.5" />} label={t("action")} align="center" />
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {paginatedItems.map((item, index) => {
                  const itemStats = itemStatsById[item.item_id]
                  const passRate = itemStats?.pass_rate ?? 0

                  return (
                    <tr key={`${item.item_id}-${index}`} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-xs">
                          <div className="truncate text-sm font-medium text-foreground">{getItemLabel(item)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={cn("text-xs", severityClass(item.severity))}>
                          {getSeverityLabel(item.severity, t)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-foreground">
                          {itemStats ? itemStats.total_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-emerald-600">
                          {itemStats ? itemStats.passed_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-rose-600">
                          {itemStats ? itemStats.failed_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-amber-600">
                          {itemStats ? itemStats.error_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 flex-1 rounded-full", passRate >= 99.5 ? "bg-emerald-100" : passRate >= 60 ? "bg-amber-100" : "bg-rose-100")}>
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-500",
                                passRate >= 99.5 ? "bg-emerald-500" : passRate >= 60 ? "bg-amber-500" : "bg-rose-500",
                              )}
                              style={{ width: `${Math.max(0, Math.min(100, passRate))}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "w-12 text-right text-xs font-medium",
                              passRate >= 99.5 ? "text-emerald-600" : passRate >= 60 ? "text-amber-600" : "text-rose-600",
                            )}
                          >
                            {itemStats ? `${passRate.toFixed(1)}%` : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleItemDetail(item)}
                          className="h-7 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          {t("details")}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery || severityFilter !== "all" ? t("noResults") : t("selectCategory")}
                </p>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-border px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {t("pageInfo", { current: currentPage, total: totalPages, count: filteredItems.length })}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                {t("firstPage")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("previousPage")}
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = index + 1
                  } else if (currentPage <= 3) {
                    pageNum = index + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index
                  } else {
                    pageNum = currentPage - 2 + index
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                {t("nextPage")}
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                {t("lastPage")}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
