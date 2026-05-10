"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import { fetchBaselineItemStatistics, type BaselineItemResultStatistics, type CategoryGroup } from "../api"
import {
  getAveragePassRate,
  getCategoryIconName,
  getCategoryLabel,
  getCategoryProgressMeta,
  getCategoryRiskScore,
  getItemLabel,
  getItemSearchText,
  severityClass,
  type CategoryProgressTone,
} from "./category-table-utils"

interface CategoryTableProps {
  data: CategoryGroup[]
  baselineUUID: string
  loading?: boolean
}

type CategoryRow = CategoryGroup & {
  categoryKey: string
  iconName: string
}

const FALLBACK_ITEM_PAGE_SIZE = 15
const TABLE_ROW_HEIGHT = 46
const CATEGORY_PAGE_SIZE = 10
function CategoryIcon({
  name,
  color,
  className,
}: {
  name: string
  color: string
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0", className)}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(/icons/baseline/${name}.svg)`,
        maskImage: `url(/icons/baseline/${name}.svg)`,
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  )
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
  const locale = useLocale()
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
  const categoryProgressByKey = useMemo<Record<string, ReturnType<typeof getCategoryProgressMeta>>>(() => {
    const maxItemCount = Math.max(
      1,
      ...categoryRows.map((category) => Math.max(category.item_count || 0, category.items.length)),
    )
    const scoredRows = categoryRows.map((category) => ({
      category,
      passRate: getAveragePassRate(category),
      riskScore: getCategoryRiskScore(category, maxItemCount),
    }))
    const nonPerfectRows = scoredRows
      .filter((row) => row.passRate < 100)
      .sort((left, right) => left.riskScore - right.riskScore || right.passRate - left.passRate)
    const rankMap = new Map(nonPerfectRows.map((row, index) => [row.category.categoryKey, index]))
    const nonGreenTones: Exclude<CategoryProgressTone, "emerald">[] = ["teal", "yellow", "orange", "rose"]
    const totalNonPerfect = Math.max(nonPerfectRows.length, 1)

    return scoredRows.reduce<Record<string, ReturnType<typeof getCategoryProgressMeta>>>((acc, row) => {
      const rank = rankMap.get(row.category.categoryKey) ?? 0
      const tone =
        row.passRate >= 100
          ? "emerald"
          : nonGreenTones[Math.min(nonGreenTones.length - 1, Math.floor(((rank + 0.5) / totalNonPerfect) * nonGreenTones.length))]
      acc[row.category.categoryKey] = getCategoryProgressMeta(row.category, tone)
      return acc
    }, {})
  }, [categoryRows])

  const [selectedCategoryKey, setSelectedCategoryKey] = useState("")
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemPageSize, setItemPageSize] = useState(FALLBACK_ITEM_PAGE_SIZE)
  const [rightTableHeight, setRightTableHeight] = useState<number | null>(null)
  const [itemStatsById, setItemStatsById] = useState<Record<string, BaselineItemResultStatistics | null>>({})
  const rightSectionRef = useRef<HTMLElement | null>(null)
  const leftPaginationRef = useRef<HTMLDivElement | null>(null)
  const tableContainerRef = useRef<HTMLDivElement | null>(null)
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null)

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
        getItemSearchText(item).includes(keyword) ||
        item.item_id.toLowerCase().includes(keyword)

      const matchesSeverity =
        severityFilter === "all" || (item.severity || "").toLowerCase() === severityFilter.toLowerCase()

      return matchesSearch && matchesSeverity
    })
  }, [currentCategory, searchQuery, severityFilter])

  const paginatedItems = useMemo(() => {
    const safePageSize = Math.max(itemPageSize, 1)
    const startIndex = (currentPage - 1) * safePageSize
    return filteredItems.slice(startIndex, startIndex + safePageSize)
  }, [filteredItems, currentPage, itemPageSize])

  const totalPages = Math.max(Math.ceil(filteredItems.length / Math.max(itemPageSize, 1)), 1)

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
  }, [baselineUUID, categoryRows])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategoryKey, searchQuery, severityFilter])

  useLayoutEffect(() => {
    const updateItemPageSize = () => {
      const shouldAlignWithLeftPagination = window.matchMedia("(min-width: 1024px)").matches
      const tableContainerTop = tableContainerRef.current?.getBoundingClientRect().top || 0
      const tableBodyTop = tableBodyRef.current?.getBoundingClientRect().top || 0
      const limitTop = leftPaginationRef.current?.getBoundingClientRect().top || 0

      if (
        !shouldAlignWithLeftPagination ||
        !tableContainerTop ||
        !tableBodyTop ||
        !limitTop ||
        limitTop <= tableContainerTop ||
        !filteredItems.length
      ) {
        setRightTableHeight(null)
        setItemPageSize(FALLBACK_ITEM_PAGE_SIZE)
        return
      }

      const availableContainerHeight = Math.max(Math.floor(limitTop - tableContainerTop), 0)
      const rowHeight =
        tableBodyRef.current?.querySelector("tr")?.getBoundingClientRect().height || TABLE_ROW_HEIGHT
      const availableRowsHeight = Math.max(limitTop - tableBodyTop - 1, 0)
      const rowsUntilLeftPagination = Math.max(1, Math.floor(availableRowsHeight / rowHeight))
      setRightTableHeight(availableContainerHeight)
      setItemPageSize(Math.min(filteredItems.length, rowsUntilLeftPagination))
    }

    updateItemPageSize()
    const frameId = window.requestAnimationFrame(updateItemPageSize)

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateItemPageSize)
      return () => {
        window.cancelAnimationFrame(frameId)
        window.removeEventListener("resize", updateItemPageSize)
      }
    }

    const observer = new ResizeObserver(updateItemPageSize)
    if (rightSectionRef.current) observer.observe(rightSectionRef.current)
    if (leftPaginationRef.current) observer.observe(leftPaginationRef.current)
    if (tableBodyRef.current) observer.observe(tableBodyRef.current)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [filteredItems.length, categoryTotalPages])

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages))
  }, [totalPages])

  useEffect(() => {
    if (!currentCategory) return

    const itemsToLoad = currentCategory.items
    if (!itemsToLoad.length) return

    let cancelled = false

    Promise.all(
      itemsToLoad.map(async (item) => {
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
      results.forEach(([id, stats]) => {
        newStats[id] = stats
      })

      setItemStatsById((prev) => ({ ...prev, ...newStats }))
    })

    return () => {
      cancelled = true
    }
  }, [baselineUUID, currentCategory])

  const handleItemDetail = (item: CategoryGroup["items"][number]) => {
    if (!currentCategory) return

    const searchParams = new URLSearchParams({
      baseline_uuid: baselineUUID,
      category: currentCategory.category,
      item_id: item.item_id,
      item: getItemLabel(item, locale),
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
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">{t("categoryList")}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex h-5 w-5 origin-center items-center justify-center rounded-full text-blue-600 transition-[transform,color] duration-200 ease-out hover:scale-105 hover:text-blue-700 active:scale-[1.03] focus-visible:scale-105 focus-visible:outline-none"
                      aria-label={t("progressLegendLabel")}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                <TooltipContent side="right" align="center" className="max-w-[18rem] text-xs leading-5">
                  <div>{t("progressLegendLine1")}</div>
                  <div>{t("progressLegendLine2")}</div>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("categoryCount", { count: data.length })}</p>
        </div>
        <ScrollArea className="h-[520px] lg:h-full">
          <div className="space-y-1.5 p-2">
            {visibleCategoryRows.map((category) => {
              const progress = categoryProgressByKey[category.categoryKey] ?? getCategoryProgressMeta(category, "teal")
              const isSelected = selectedCategoryKey === category.categoryKey

              return (
                <button
                  key={category.categoryKey}
                  onClick={() => setSelectedCategoryKey(category.categoryKey)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200",
                    isSelected
                      ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-blue-600"
                    />
                  )}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <CategoryIcon name={category.iconName} color={progress.color} className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={cn(
                          "truncate text-sm font-medium transition-colors duration-200",
                          isSelected ? "text-blue-700" : "text-slate-600 group-hover:text-slate-950",
                        )}
                      >
                        {getCategoryLabel(category, locale)}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 shrink-0 px-1.5 text-[10px] transition-colors duration-200",
                          isSelected && "border-blue-200 bg-white/80 text-blue-700",
                        )}
                      >
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
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-200",
                      isSelected ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                </button>
              )
            })}
          </div>
        </ScrollArea>
        {categoryTotalPages > 1 && (
          <div ref={leftPaginationRef} className="border-t border-border bg-slate-50/70 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="text-xs font-medium text-slate-600">
                {t("categoryPageInfo", {
                  current: categoryCurrentPage,
                  total: categoryTotalPages,
                  count: categoryRows.length,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategoryPageChange(categoryCurrentPage - 1)}
                  disabled={categoryCurrentPage === 1}
                  className="h-8 gap-1.5 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{t("previousPage")}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategoryPageChange(categoryCurrentPage + 1)}
                  disabled={categoryCurrentPage === categoryTotalPages}
                  className="h-8 gap-1.5 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                >
                  <span>{t("nextPage")}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </aside>

      <section ref={rightSectionRef} className="flex flex-1 flex-col overflow-hidden">
        {currentCategory && (
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">{getCategoryLabel(currentCategory, locale)}</h3>
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

        <div
          ref={tableContainerRef}
          className={cn("overflow-auto", rightTableHeight === null && "flex-1")}
          style={rightTableHeight !== null ? { height: rightTableHeight } : undefined}
        >
          {currentCategory && paginatedItems.length > 0 ? (
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">
                    <HeaderCell icon={<ListChecks className="h-3.5 w-3.5" />} label={t("checkItemName")} />
                  </th>
                  <th className="px-4 py-2.5 text-center">
                    <HeaderCell icon={<ShieldAlert className="h-3.5 w-3.5" />} label={t("severity")} align="center" />
                  </th>
                  <th className="px-4 py-2.5 text-center">
                    <HeaderCell icon={<BarChart3 className="h-3.5 w-3.5" />} label={t("totalHosts")} align="center" />
                  </th>
                  <th className="px-4 py-2.5 text-center">
                    <HeaderCell
                      icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      label={t("passed")}
                      align="center"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-center">
                    <HeaderCell icon={<XCircle className="h-3.5 w-3.5 text-rose-500" />} label={t("failed")} align="center" />
                  </th>
                  <th className="px-4 py-2.5 text-center">
                    <HeaderCell
                      icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      label={t("error")}
                      align="center"
                    />
                  </th>
                  <th className="w-36 px-4 py-2.5">
                    <HeaderCell icon={<BarChart3 className="h-3.5 w-3.5" />} label={t("passRate")} />
                  </th>
                  <th className="px-4 py-2.5 text-center">
                    <HeaderCell icon={<ArrowRight className="h-3.5 w-3.5" />} label={t("action")} align="center" />
                  </th>
                </tr>
              </thead>

              <tbody ref={tableBodyRef} className="divide-y divide-border">
                {paginatedItems.map((item, index) => {
                  const itemStats = itemStatsById[item.item_id]
                  const passRate = itemStats?.pass_rate ?? 0

                  return (
                    <tr key={`${item.item_id}-${index}`} className="h-[46px] transition-colors hover:bg-muted/50">
                      <td className="px-4 py-2.5 align-middle">
                        <div className="max-w-xs">
                          <div className="truncate text-sm font-medium text-foreground">{getItemLabel(item, locale)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {(() => {
                          const severity = severityClass(item.severity)
                          return (
                            <div
                              className={cn(
                                "relative inline-flex h-[22px] w-16 items-center justify-center overflow-hidden rounded-md border px-2 text-xs font-medium",
                                severity.container,
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn("absolute left-0 top-0 h-full w-[3px]", severity.strip)}
                              />
                              <span className="relative z-10">{getSeverityLabel(item.severity, t)}</span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm font-medium text-foreground">
                          {itemStats ? itemStats.total_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm font-medium text-emerald-600">
                          {itemStats ? itemStats.passed_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm font-medium text-rose-600">
                          {itemStats ? itemStats.failed_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm font-medium text-amber-600">
                          {itemStats ? itemStats.error_hosts : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
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
                      <td className="px-4 py-2.5 text-center">
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
          <div className="border-t border-border bg-slate-50/70 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <div className="text-xs font-medium text-slate-600">
                {t("pageInfo", { current: currentPage, total: totalPages, count: filteredItems.length })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                >
                  {t("firstPage")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="h-8 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
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
                        className="h-8 w-8 rounded-md p-0 text-xs"
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
                  className="h-8 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                >
                  {t("nextPage")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                >
                  {t("lastPage")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
