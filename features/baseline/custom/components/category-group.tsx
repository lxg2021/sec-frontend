"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Checkbox } from "@/shared/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible"

import type { BaselineTemplateCategoryGroup } from "../api"
import { BaselineItemRow } from "./baseline-item-row"
import { getCategoryLabel, isZhLocale } from "./locale-utils"

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

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex min-h-14 items-center gap-3 bg-zinc-50 px-4 py-3">
          <Checkbox
            checked={isPartialSelected ? "indeterminate" : isAllSelected}
            onCheckedChange={(checked) => onToggleCategory(itemIds, checked === true)}
            aria-label={`${t("categoryGroup.selectCategory")} ${categoryLabel}`}
          />

          <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:text-zinc-950">
            <span className="text-zinc-500">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="truncate text-base font-semibold text-zinc-950">{categoryLabel}</span>
              <span className="flex-shrink-0 text-sm text-zinc-500">
                {selectedCount} / {group.item_count} {t("categoryGroup.selected")}
              </span>
            </div>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="space-y-2 border-t border-zinc-200 bg-white p-3">
            {group.items.map((item) => (
              <BaselineItemRow key={item.id} item={item} isSelected={selectedItems.has(item.id)} onToggle={onToggleItem} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
