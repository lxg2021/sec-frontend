"use client"

import { AlertCircle, Search, SquareCheckBig, SquareDashedMousePointer, ShieldCheck } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Skeleton } from "@/shared/ui/skeleton"

import type { BaselineTemplate, BaselineTemplateItemsData } from "../api"
import { CategoryGroup } from "./category-group"

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

function filterGroups(itemsData: BaselineTemplateItemsData | null, searchTerm: string) {
  if (!itemsData) return []

  const keyword = searchTerm.trim().toLowerCase()
  if (!keyword) return itemsData.category_groups

  return itemsData.category_groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        [item.name_zh, item.name, item.description, item.category_zh, item.recommended_value]
          .some((value) => String(value || "").toLowerCase().includes(keyword)),
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
  const handleToggleItem = (itemId: string) => {
    if (!template) return

    const next = new Set(selectedItems)
    next.has(itemId) ? next.delete(itemId) : next.add(itemId)
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

  const filteredGroups = filterGroups(itemsData, searchTerm)
  const totalCount = itemsData?.total_count ?? 0
  const selectedCount = selectedItems.size
  const severityStats = itemsData?.severity_statistics ?? []

  return (
    <Card className="h-full rounded-2xl border border-zinc-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <CardHeader className="border-b border-zinc-200 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg font-semibold text-zinc-950">
              {template?.display_name || "请选择一个模板"}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-500">
              {template ? "勾选需要的检查项，支持跨模板累计选择" : "先从左侧选择基线模板"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} disabled={!template || !itemsData} className="h-9 gap-2 rounded-xl border-zinc-200 bg-white px-3 text-zinc-950 shadow-none">
              <SquareCheckBig className="h-4 w-4" />
              <span>全选</span>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={!template || selectedCount === 0} className="h-9 gap-2 rounded-xl border-zinc-200 bg-white px-3 text-zinc-950 shadow-none">
              <SquareDashedMousePointer className="h-4 w-4" />
              <span>清空</span>
            </Button>
          </div>
        </div>

        {itemsData && (
          <>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {severityStats.map((stat) => (
                <span key={stat.severity} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-900">
                  <span className={stat.severity === "High" ? "text-red-500" : stat.severity === "Medium" ? "text-amber-500" : "text-emerald-500"}>
                    {stat.severity === "High" ? "高" : stat.severity === "Medium" ? "中" : "低"}:
                  </span>
                  <span className="font-medium">{stat.count} ({stat.percentage.toFixed(1)}%)</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  placeholder="搜索检查项..."
                  className="h-10 rounded-xl border-zinc-200 pl-9 shadow-none"
                  disabled={!template}
                />
              </div>
              <div className="flex-shrink-0 text-sm text-zinc-600">
                已选 <span className="font-semibold text-zinc-950">{selectedCount}</span> / {totalCount} 项
              </div>
            </div>
          </>
        )}
      </CardHeader>

      <CardContent className="p-4">
        <div className="max-h-[calc(100dvh-240px)] space-y-3 overflow-y-auto pr-1">
          {!template ? (
            <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
              <div>
                <ShieldCheck className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-3 text-lg font-medium text-zinc-950">请先选择基线模板</p>
                <p className="mt-1 text-sm text-zinc-500">从左侧列表中选择一个模板开始</p>
              </div>
            </div>
          ) : loading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)
          ) : !itemsData ? (
            <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
              <div>
                <AlertCircle className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-3 text-sm font-medium text-zinc-950">{errorMessage || "模板项加载失败"}</p>
                <p className="mt-1 text-xs text-zinc-500">请刷新后重试</p>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
              <div>
                <Search className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-3 text-sm font-medium text-zinc-950">没有匹配的检查项</p>
                <p className="mt-1 text-xs text-zinc-500">调整搜索词后再试一次</p>
              </div>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <CategoryGroup
                key={`${group.category_zh || group.category}-${group.item_count}`}
                group={group}
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onToggleCategory={handleToggleCategory}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
