"use client"

import { useLocale, useTranslations } from "next-intl"
import { Info } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Checkbox } from "@/shared/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import type { BaselineTemplateItem } from "../api"
import { getItemDescription, getItemLabel, getRecommendedValue, isZhLocale } from "./locale-utils"

interface BaselineItemRowProps {
  item: BaselineTemplateItem
  isSelected: boolean
  onToggle: (itemId: string) => void
}

const severityConfig: Record<string, { className: string; dot: string }> = {
  High: { className: "text-red-600", dot: "bg-red-500" },
  Medium: { className: "text-amber-600", dot: "bg-amber-500" },
  Low: { className: "text-emerald-600", dot: "bg-emerald-500" },
}

export function BaselineItemRow({ item, isSelected, onToggle }: BaselineItemRowProps) {
  const locale = useLocale()
  const useZh = isZhLocale(locale)
  const t = useTranslations("pages.baseline.custom")
  const severity = severityConfig[item.severity] || severityConfig.Low
  const severityLabel =
    item.severity.toLowerCase() === "high"
      ? t("itemRow.severity.high")
      : item.severity.toLowerCase() === "medium"
        ? t("itemRow.severity.medium")
        : t("itemRow.severity.low")

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
        isSelected ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:bg-zinc-50",
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(item.id)}
        aria-label={`${t("itemRow.selectItem")} ${getItemLabel(item, useZh)}`}
        className="mt-0.5"
      />

      <button type="button" onClick={() => onToggle(item.id)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-950">{getItemLabel(item, useZh)}</span>
          <Badge variant="secondary" className="h-5 rounded-full bg-zinc-100 px-1.5 text-[11px] font-normal text-zinc-900">
            <span className={cn("inline-flex items-center gap-1", severity.className)}>
              <span className={cn("h-2 w-2 rounded-full", severity.dot)} />
              {severityLabel}
            </span>
          </Badge>
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{getItemDescription(item, useZh)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
            {t("itemRow.recommend")}: {getRecommendedValue(item) || t("itemRow.notProvided")}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-zinc-700">
                  <Info className="h-3.5 w-3.5" />
                  {t("itemRow.detail")}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-sm space-y-1.5">
                <p className="text-sm font-medium">{getItemLabel(item, useZh)}</p>
                <p className="text-xs text-zinc-500">
                  {t("itemRow.detection")}: {item.method || t("itemRow.notProvided")}
                </p>
                <p className="text-xs text-zinc-500">
                  {t("itemRow.defaultValue")}: {item.default_value || t("itemRow.notProvided")}
                </p>
                <p className="text-xs text-zinc-500">
                  {t("itemRow.operator")}: {item.operator || t("itemRow.notProvided")}
                </p>
                {item.references && (
                  <p className="text-xs text-zinc-500">
                    {t("itemRow.references")}: {item.references}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </button>
    </div>
  )
}
