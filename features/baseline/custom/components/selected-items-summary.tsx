"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2, Layers3, Trash2, X } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import type { BaselineTemplate, BaselineTemplateItem, BaselineTemplateItemsData } from "../api"
import { getItemLabel, isZhLocale } from "./locale-utils"

interface SelectedItemsSummaryProps {
  templates: BaselineTemplate[]
  itemsDataMap: Map<string, BaselineTemplateItemsData>
  selectedItems: Map<string, Set<string>>
  onClearAll: () => void
  onRemoveTemplate: (templateUuid: string) => void
  onRemoveItem: (templateUuid: string, itemId: string) => void
}

export function SelectedItemsSummary({
  templates,
  itemsDataMap,
  selectedItems,
  onClearAll,
  onRemoveTemplate,
  onRemoveItem,
}: SelectedItemsSummaryProps) {
  const locale = useLocale()
  const useZh = isZhLocale(locale)
  const t = useTranslations("pages.baseline.custom")
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())

  const summary = useMemo(() => {
    let totalSelected = 0
    let highCount = 0
    let mediumCount = 0
    let lowCount = 0
    const templateStats: Array<{
      templateUuid: string
      template: BaselineTemplate
      items: BaselineTemplateItem[]
      high: number
      medium: number
      low: number
    }> = []
    const categoryStats = new Map<string, number>()

    selectedItems.forEach((itemIds, templateUuid) => {
      const template = templates.find((item) => item.uuid === templateUuid)
      const itemsData = itemsDataMap.get(templateUuid)
      if (!template || !itemsData) return

      const items: BaselineTemplateItem[] = []
      let templateHigh = 0
      let templateMedium = 0
      let templateLow = 0

      itemsData.category_groups.forEach((group) => {
        group.items.forEach((item) => {
          if (!itemIds.has(item.id)) return

          items.push(item)
          totalSelected += 1

          if (item.severity === "High") {
            highCount += 1
            templateHigh += 1
          } else if (item.severity === "Medium") {
            mediumCount += 1
            templateMedium += 1
          } else {
            lowCount += 1
            templateLow += 1
          }

          const categoryKey = (useZh ? item.category_zh : item.category) || item.category || item.category_zh || "Uncategorized"
          categoryStats.set(categoryKey, (categoryStats.get(categoryKey) || 0) + 1)
        })
      })

      templateStats.push({
        templateUuid,
        template,
        items,
        high: templateHigh,
        medium: templateMedium,
        low: templateLow,
      })
    })

    return {
      totalSelected,
      highCount,
      mediumCount,
      lowCount,
      templateStats,
      categoryStats: Array.from(categoryStats.entries()).sort((a, b) => b[1] - a[1]),
    }
  }, [itemsDataMap, selectedItems, templates, useZh])

  const hasSelections = summary.totalSelected > 0

  const toggleTemplate = (templateUuid: string) => {
    setExpandedTemplates((current) => {
      const next = new Set(current)
      next.has(templateUuid) ? next.delete(templateUuid) : next.add(templateUuid)
      return next
    })
  }

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
      <CardHeader className="border-b border-zinc-200 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-950">{t("summary.title")}</CardTitle>
              <CardDescription className="mt-1 text-sm text-zinc-500">{t("summary.fromTemplates", { count: selectedItems.size })}</CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            disabled={!hasSelections}
            className="h-9 gap-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            <span>{t("summary.clear")}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        {!hasSelections ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
            <div>
              <CheckCircle2 className="mx-auto h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-950">{t("summary.noItemsTitle")}</p>
              <p className="mt-1 text-xs text-zinc-500">{t("summary.noItemsDescription")}</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-zinc-900" />
                  <span className="text-sm font-medium text-zinc-950">{t("summary.totalSelected")}</span>
                </div>
                <span className="text-4xl font-semibold tabular-nums text-zinc-950">{summary.totalSelected}</span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
                <div className="flex h-full">
                  <div className="bg-red-500" style={{ width: `${summary.totalSelected ? (summary.highCount / summary.totalSelected) * 100 : 0}%` }} />
                  <div className="bg-amber-500" style={{ width: `${summary.totalSelected ? (summary.mediumCount / summary.totalSelected) * 100 : 0}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${summary.totalSelected ? (summary.lowCount / summary.totalSelected) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  {t("summary.high")} <span className="font-semibold text-zinc-950">{summary.highCount}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  {t("summary.medium")} <span className="font-semibold text-zinc-950">{summary.mediumCount}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {t("summary.low")} <span className="font-semibold text-zinc-950">{summary.lowCount}</span>
                </span>
              </div>
            </div>

            {summary.categoryStats.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Layers3 className="h-3.5 w-3.5" />
                  <span>{t("summary.categories")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.categoryStats.slice(0, 5).map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-900">
                      {category}
                      <span className="ml-1 font-medium text-zinc-950">{count}</span>
                    </Badge>
                  ))}
                  {summary.categoryStats.length > 5 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="h-6 cursor-help rounded-full border-zinc-200 bg-white px-2 text-xs font-normal text-zinc-900">
                            +{summary.categoryStats.length - 5}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[220px]">
                          <div className="flex flex-wrap gap-1.5">
                            {summary.categoryStats.slice(5).map(([category, count]) => (
                              <span key={category} className="text-xs text-zinc-500">
                                {category}({count})
                              </span>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )}

            <ScrollArea className="min-h-0 flex-1 pr-2">
              <div className="space-y-2">
                {summary.templateStats.map(({ templateUuid, template, items, high, medium, low }) => {
                  const isExpanded = expandedTemplates.has(templateUuid)

                  return (
                    <div key={templateUuid} className="rounded-2xl border border-zinc-200 bg-white">
                      <div className="flex items-start gap-3 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleTemplate(templateUuid)}
                          className="min-w-0 flex-1 text-left transition-colors hover:text-zinc-950"
                        >
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-zinc-950">{template.display_name}</span>
                            <Badge variant="outline" className="h-5 rounded-full border-zinc-200 bg-white px-1.5 text-[11px] font-normal text-zinc-900">
                              {t("summary.templateItems", { count: items.length })}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            {high > 0 && <span className="text-red-600">{t("summary.high")} {high}</span>}
                            {medium > 0 && <span className="text-amber-600">{t("summary.medium")} {medium}</span>}
                            {low > 0 && <span className="text-emerald-600">{t("summary.low")} {low}</span>}
                          </div>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => onRemoveTemplate(templateUuid)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-zinc-200 bg-zinc-50 p-2">
                          <div className="space-y-1">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onRemoveItem(templateUuid, item.id)}
                                title={getItemLabel(item, useZh)}
                                className={cn(
                                  "group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left transition-colors hover:bg-zinc-50",
                                )}
                              >
                                <span className="min-w-0 truncate text-sm text-zinc-900">
                                  {getItemLabel(item, useZh)}
                                </span>
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors group-hover:bg-zinc-100 group-hover:text-zinc-700">
                                  <X className="h-3.5 w-3.5" />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
