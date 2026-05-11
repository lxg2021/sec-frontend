"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Checkbox } from "@/shared/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible"

import type { BaselineTemplateCategoryGroup } from "../api"
import { BaselineItemRow } from "./baseline-item-row"
import { getCategoryIconName, getCategoryLabel, isZhLocale } from "./locale-utils"

interface CategoryGroupProps {
  group: BaselineTemplateCategoryGroup
  selectedItems: Set<string>
  onToggleItem: (itemId: string) => void
  onToggleCategory: (itemIds: string[], checked: boolean) => void
}

export function CategoryGroup({ group, selectedItems, onToggleItem, onToggleCategory }: CategoryGroupProps) {
  const locale = useLocale()
  const useZh = isZhLocale(locale)
  const t = useTranslations("pages.baseline.custom")
  const [expanded, setExpanded] = useState(false)

  const itemIds = useMemo(() => group.items.map((item) => item.id), [group.items])
  const selectedCount = useMemo(() => itemIds.filter((itemId) => selectedItems.has(itemId)).length, [itemIds, selectedItems])
  const isAllSelected = selectedCount === group.items.length && group.items.length > 0
  const isPartialSelected = selectedCount > 0 && selectedCount < group.items.length
  const categoryLabel = getCategoryLabel(group, useZh)
  const iconName = getCategoryIconName(group)

  const CategoryIcon = () => (
    <span
      aria-hidden="true"
      className="inline-block h-6 w-6 shrink-0 text-sky-500 transition-colors duration-200 group-hover:text-sky-600"
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(/icons/baseline/${iconName}.svg)`,
        maskImage: `url(/icons/baseline/${iconName}.svg)`,
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  )

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
        <div className="flex min-h-14 items-center gap-3 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 px-4 py-3 transition-colors duration-200 group-hover:from-sky-50/70 group-hover:via-white group-hover:to-sky-50/50">
          <Checkbox
            checked={isPartialSelected ? "indeterminate" : isAllSelected}
            onCheckedChange={(checked) => onToggleCategory(itemIds, checked === true)}
            aria-label={`${t("categoryGroup.selectCategory")} ${categoryLabel}`}
            className="border-zinc-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600"
          />

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left transition-colors duration-200 hover:text-sky-700"
            >
              <span className="text-zinc-500 transition-colors duration-200 group-hover:text-sky-600">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 transition-colors duration-200 group-hover:bg-white">
                <CategoryIcon />
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-zinc-950 transition-colors duration-200 group-hover:text-sky-950">
                  {categoryLabel}
                </span>
                <span className="min-w-[5.25rem] flex-shrink-0 rounded-full bg-white px-2.5 py-1 text-right text-xs font-semibold tabular-nums text-zinc-600 shadow-sm transition-colors duration-200 group-hover:text-sky-700">
                  {selectedCount}/{group.item_count}
                  {useZh ? t("categoryGroup.selected") : ` ${t("categoryGroup.selected")}`}
                </span>
              </div>
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="space-y-2 border-t border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/50 p-3">
            {group.items.map((item) => (
              <BaselineItemRow key={item.id} item={item} isSelected={selectedItems.has(item.id)} onToggle={onToggleItem} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
