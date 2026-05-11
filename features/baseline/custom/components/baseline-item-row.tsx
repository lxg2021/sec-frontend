"use client"

import { Info } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Checkbox } from "@/shared/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import type { BaselineTemplateItem } from "../api"

interface BaselineItemRowProps {
  item: BaselineTemplateItem
  isSelected: boolean
  onToggle: (itemId: string) => void
}

const severityConfig: Record<string, { label: string; className: string; dot: string }> = {
  High: { label: "高", className: "text-red-600", dot: "bg-red-500" },
  Medium: { label: "中", className: "text-amber-600", dot: "bg-amber-500" },
  Low: { label: "低", className: "text-emerald-600", dot: "bg-emerald-500" },
}

export function BaselineItemRow({ item, isSelected, onToggle }: BaselineItemRowProps) {
  const severity = severityConfig[item.severity] || severityConfig.Low

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
        aria-label={`选择检查项 ${item.name_zh || item.name}`}
        className="mt-0.5"
      />

      <button type="button" onClick={() => onToggle(item.id)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-950">{item.name_zh}</span>
          <Badge variant="secondary" className="h-5 rounded-full bg-zinc-100 px-1.5 text-[11px] font-normal text-zinc-900">
            <span className={cn("inline-flex items-center gap-1", severity.className)}>
              <span className={cn("h-2 w-2 rounded-full", severity.dot)} />
              {severity.label}
            </span>
          </Badge>
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{item.description || item.name}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
            推荐值 {item.recommended_value || "未提供"}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-zinc-700">
                  <Info className="h-3.5 w-3.5" />
                  详情
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-sm space-y-1.5">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-zinc-500">检测方式: {item.method || "未提供"}</p>
                <p className="text-xs text-zinc-500">默认值: {item.default_value || "未提供"}</p>
                <p className="text-xs text-zinc-500">操作符: {item.operator || "未提供"}</p>
                {item.references && <p className="text-xs text-zinc-500">参考: {item.references}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </button>
    </div>
  )
}
