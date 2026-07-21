"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Layers3, Plus, Trash2, X } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
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
  onCreateBaseline: () => void
  createDisabled: boolean
  metadataValid: boolean
  metadataMessage?: string
}

export function SelectedItemsSummary({
  templates,
  itemsDataMap,
  selectedItems,
  onClearAll,
  onRemoveTemplate,
  onRemoveItem,
  onCreateBaseline,
  createDisabled,
  metadataValid,
  metadataMessage,
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
    <Card className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <CardHeader className="bg-slate-50/70 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <CardTitle className="truncate text-sm font-semibold text-slate-950">{t("summary.title")}</CardTitle>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="whitespace-nowrap text-xs text-slate-500">{t("summary.fromTemplates", { count: selectedItems.size })}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={!hasSelections}
              className="h-9 gap-2 rounded-xl px-3 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("summary.clear")}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4">
        {!hasSelections ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50 to-white text-center">
            <div>
              <CheckCircle2 className="mx-auto h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-950">{t("summary.noItemsTitle")}</p>
              <p className="mt-1 text-xs text-zinc-500">{t("summary.noItemsDescription")}</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-4 overflow-hidden">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">{t("summary.totalSelected")}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{t("summary.fromTemplates", { count: selectedItems.size })}</p>
                </div>
                <span className="text-2xl font-semibold tabular-nums text-slate-950">{summary.totalSelected}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 text-center text-[11px] font-semibold">
                <span className="border-r border-red-100 bg-red-50/80 px-2 py-1.5 text-red-600">{t("summary.high")} {summary.highCount}</span>
                <span className="border-r border-amber-100 bg-amber-50/80 px-2 py-1.5 text-amber-600">{t("summary.medium")} {summary.mediumCount}</span>
                <span className="bg-emerald-50/80 px-2 py-1.5 text-emerald-600">{t("summary.low")} {summary.lowCount}</span>
              </div>
            </div>
            {summary.categoryStats.length > 0 ? (
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Layers3 className="h-3.5 w-3.5" />
                  <span>{t("summary.categories")}</span>
                </div>
                <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    {summary.categoryStats.slice(0, 3).map(([category, count]) => (
                      <Badge key={category} variant="secondary" className="flex h-6 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-2 text-xs font-normal text-slate-600">
                        <span className="min-w-0 flex-1 truncate">{category}</span>
                        <span className="ml-1 shrink-0 font-medium tabular-nums text-zinc-950">{count}</span>
                      </Badge>
                    ))}
                  </div>
                  {summary.categoryStats.length > 3 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="h-6 shrink-0 cursor-help rounded-full border-slate-200 bg-slate-50 px-2 text-xs font-normal text-slate-700">
                            +{summary.categoryStats.length - 3}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[220px]">
                          <div className="flex flex-wrap gap-1.5">
                            {summary.categoryStats.slice(3).map(([category, count]) => (
                              <span key={category} className="text-xs text-zinc-500">
                                {category}({count})
                              </span>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>
              </div>
            ) : null}

            <ScrollArea className="min-h-0 min-w-0 max-w-full flex-1 overflow-hidden pr-2">
              <div className="w-full min-w-0 max-w-full space-y-2 overflow-hidden">
                {summary.templateStats.map(({ templateUuid, template, items, high, medium, low }) => {
                  const isExpanded = expandedTemplates.has(templateUuid)

                  return (
                    <div key={templateUuid} className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleTemplate(templateUuid)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="shrink-0 text-slate-400">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-semibold text-slate-950">{template.display_name}</span>
                              <Badge variant="secondary" className="h-5 shrink-0 rounded-full bg-slate-100 px-1.5 text-[11px] font-normal text-slate-600">
                                {items.length}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[11px]">
                              {high > 0 ? <span className="text-red-600">{t("summary.high")} {high}</span> : null}
                              {medium > 0 ? <span className="text-amber-600">{t("summary.medium")} {medium}</span> : null}
                              {low > 0 ? <span className="text-emerald-600">{t("summary.low")} {low}</span> : null}
                            </div>
                          </div>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => onRemoveTemplate(templateUuid)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {isExpanded ? (
                        <div className="min-w-0 max-w-full divide-y divide-slate-200 overflow-hidden border-t border-slate-200 bg-slate-50/40">
                          {items.map((item) => {
                            const itemLabel = getItemLabel(item, useZh)

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onRemoveItem(templateUuid, item.id)}
                                title={`${t("summary.removeItem")}: ${itemLabel}`}
                                aria-label={`${t("summary.removeItem")}: ${itemLabel}`}
                                className="group flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden px-3 py-2 text-left transition-colors hover:bg-red-50/50 focus-visible:bg-red-50/50 focus-visible:outline-none"
                              >
                                <span className="min-w-0 flex-1 truncate text-xs text-slate-700 group-hover:text-red-700">{itemLabel}</span>
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
      <div className="shrink-0 space-y-2 border-t border-slate-200 bg-white p-4">
        {hasSelections ? (
          <div className={metadataValid ? "flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5" : "flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"}>
            {metadataValid ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />}
            <div className="min-w-0">
              <p className={metadataValid ? "text-xs font-semibold text-emerald-800" : "text-xs font-semibold text-amber-800"}>
                {metadataValid ? t("createForm.selectedDescription", { selectedItemCount: summary.totalSelected, selectedTemplateCount: selectedItems.size }) : metadataMessage}
              </p>
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          onClick={onCreateBaseline}
          disabled={createDisabled}
          className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-600 text-white shadow-sm shadow-teal-900/10 hover:from-teal-800 hover:to-cyan-700"
        >
          <Plus className="h-4 w-4" />
          <span>{t("createBaseline")}</span>
          {summary.totalSelected > 0 ? <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs tabular-nums">{summary.totalSelected}</span> : null}
        </Button>
      </div>
    </Card>
  )
}
