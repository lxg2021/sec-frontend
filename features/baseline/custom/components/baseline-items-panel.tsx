"use client"

import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, Search, SquareCheckBig, SquareDashedMousePointer, ShieldCheck } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Skeleton } from "@/shared/ui/skeleton"

import type { BaselineTemplate, BaselineTemplateItemsData } from "../api"
import { CategoryGroup } from "./category-group"
import { getItemDescription, getItemLabel, getRecommendedValue, isZhLocale } from "./locale-utils"

interface BaselineItemsPanelProps {
  template: BaselineTemplate | null
  itemsData: BaselineTemplateItemsData | null
  loading: boolean
  errorMessage?: string
  searchTerm: string
  onSearchTermChange: (value: string) => void
  selectedItems: Set<string>
  onSelectionChange: (templateUuid: string, itemIds: Set<string>) => void
}

function filterGroups(itemsData: BaselineTemplateItemsData | null, searchTerm: string, useZh: boolean) {
  if (!itemsData) return []

  const keyword = searchTerm.trim().toLowerCase()
  if (!keyword) return itemsData.category_groups

  return itemsData.category_groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        [
          getItemLabel(item, useZh),
          getItemDescription(item, useZh),
          item.description,
          item.description_en,
          item.category,
          item.category_zh,
          getRecommendedValue(item),
        ].some((value) => String(value || "").toLowerCase().includes(keyword)),
      ),
    }))
    .filter((group) => group.items.length > 0)
}

export function BaselineItemsPanel({
  template,
  itemsData,
  loading,
  errorMessage,
  searchTerm,
  onSearchTermChange,
  selectedItems,
  onSelectionChange,
}: BaselineItemsPanelProps) {
  const locale = useLocale()
  const useZh = isZhLocale(locale)
  const t = useTranslations("pages.baseline.custom")

  const handleToggleItem = (itemId: string) => {
    if (!template) return

    const next = new Set(selectedItems)
    if (next.has(itemId)) {
      next.delete(itemId)
    } else {
      next.add(itemId)
    }
    onSelectionChange(template.uuid, next)
  }

  const handleToggleCategory = (itemIds: string[], checked: boolean) => {
    if (!template) return

    const next = new Set(selectedItems)
    if (checked) {
      itemIds.forEach((id) => next.add(id))
    } else {
      itemIds.forEach((id) => next.delete(id))
    }
    onSelectionChange(template.uuid, next)
  }

  const handleSelectAll = () => {
    if (!template || !itemsData) return

    const next = new Set<string>()
    itemsData.category_groups.forEach((group) => {
      group.items.forEach((item) => next.add(item.id))
    })
    onSelectionChange(template.uuid, next)
  }

  const handleClear = () => {
    if (!template) return
    onSelectionChange(template.uuid, new Set())
  }

  const filteredGroups = filterGroups(itemsData, searchTerm, useZh)
  const totalCount = itemsData?.total_count ?? 0
  const selectedCount = selectedItems.size
  const severityStats = itemsData?.severity_statistics ?? []

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <SquareCheckBig className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-sm font-semibold text-slate-950">
                {template?.display_name || t("itemsPanel.chooseTemplateTitle")}
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={!template || !itemsData}
              className="h-9 gap-2 rounded-xl border-zinc-200 bg-white px-3 text-zinc-950 shadow-none transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              <SquareCheckBig className="h-4 w-4" />
              <span>{t("itemsPanel.selectAll")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!template || selectedCount === 0}
              className="h-9 gap-2 rounded-xl border-zinc-200 bg-white px-3 text-zinc-950 shadow-none transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              <SquareDashedMousePointer className="h-4 w-4" />
              <span>{t("itemsPanel.clear")}</span>
            </Button>
          </div>
        </div>

        {itemsData && (
          <div className="space-y-3 pt-3">
            <div className="grid grid-cols-3 gap-2">
              {severityStats.map((stat) => (
                <div
                  key={stat.severity}
                  className={
                    stat.severity === "High"
                      ? "flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50/80 px-3 py-2 text-xs text-red-600"
                      : stat.severity === "Medium"
                        ? "flex items-center justify-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-600"
                        : "flex items-center justify-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-600"
                  }
                >
                  <span>{stat.severity === "High" ? t("itemsPanel.high") : stat.severity === "Medium" ? t("itemsPanel.medium") : t("itemsPanel.low")}</span>
                  <span className="font-semibold tabular-nums">
                    {stat.count} ({stat.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  placeholder={t("itemsPanel.searchPlaceholder")}
                  className="h-10 rounded-xl border-zinc-200 bg-white pl-9 shadow-none transition-colors hover:border-zinc-300 focus-visible:border-teal-300"
                  disabled={!template}
                />
              </div>
              <Badge variant="secondary" className="h-10 rounded-xl bg-teal-50 px-3 text-xs font-semibold tabular-nums text-teal-700">
                {selectedCount} / {totalCount} {t("itemsPanel.itemsSuffix")}
              </Badge>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {!template ? (
            <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50 to-white text-center">
              <div>
                <ShieldCheck className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-3 text-lg font-medium text-zinc-950">{t("itemsPanel.chooseTemplateTitle")}</p>
                <p className="mt-1 text-xs text-slate-500">{t("itemsPanel.chooseTemplateDescription")}</p>
              </div>
            </div>
          ) : loading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)
          ) : !itemsData ? (
            <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50 to-white text-center">
              <div>
                <AlertCircle className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-3 text-sm font-medium text-zinc-950">{errorMessage || t("itemsPanel.loadErrorTitle")}</p>
                <p className="mt-1 text-xs text-zinc-500">{t("itemsPanel.loadErrorDescription")}</p>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50 to-white text-center">
              <div>
                <Search className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-3 text-sm font-medium text-zinc-950">{t("itemsPanel.noResultsTitle")}</p>
                <p className="mt-1 text-xs text-zinc-500">{t("itemsPanel.noResultsDescription")}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {filteredGroups.map((group) => (
                <CategoryGroup
                  key={`${group.category_zh || group.category}-${group.item_count}`}
                  group={group}
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  onToggleCategory={handleToggleCategory}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
