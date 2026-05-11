"use client"

import { LayoutGrid, RefreshCw, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"

import type { BaselineTemplate } from "../api"

const standardOptions = [
  { value: "all", label: "全部标准" },
  { value: "cis", label: "CIS" },
  { value: "dod", label: "DOD STIG" },
  { value: "msft", label: "Microsoft" },
  { value: "intune", label: "Intune" },
  { value: "custom", label: "自定义" },
]

const profileOptions = [
  { value: "all", label: "全部配置" },
  { value: "machine", label: "计算机" },
  { value: "user", label: "用户" },
  { value: "both", label: "两者" },
]

interface BaselineTemplateSelectorProps {
  templates: BaselineTemplate[]
  loading: boolean
  selectedTemplateUuid: string
  selectedCountMap: Map<string, number>
  standardFilter: string
  profileFilter: string
  onStandardFilterChange: (value: string) => void
  onProfileFilterChange: (value: string) => void
  onSelectTemplate: (template: BaselineTemplate) => void
  onRefresh: () => void
}

export function BaselineTemplateSelector({
  templates,
  loading,
  selectedTemplateUuid,
  selectedCountMap,
  standardFilter,
  profileFilter,
  onStandardFilterChange,
  onProfileFilterChange,
  onSelectTemplate,
  onRefresh,
}: BaselineTemplateSelectorProps) {
  return (
    <Card className="h-full rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <CardHeader className="border-b border-zinc-200 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <LayoutGrid className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-950">选择基线模板</CardTitle>
              <CardDescription className="mt-1 text-sm text-zinc-500">
                从模板中选择一个基线作为定义起点
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-9 gap-2 rounded-xl border-zinc-200 bg-white px-3 text-zinc-950 shadow-none"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span>刷新</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Select value={standardFilter} onValueChange={onStandardFilterChange}>
            <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white shadow-none">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-zinc-400" />
              <SelectValue placeholder="全部标准" />
            </SelectTrigger>
            <SelectContent>
              {standardOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={profileFilter} onValueChange={onProfileFilterChange}>
            <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white shadow-none">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-zinc-400" />
              <SelectValue placeholder="全部配置" />
            </SelectTrigger>
            <SelectContent>
              {profileOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        <div className="max-h-[calc(100dvh-240px)] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)
          ) : templates.length === 0 ? (
            <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50">
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-950">没有匹配的模板</p>
                <p className="mt-1 text-xs text-zinc-500">调整筛选条件后再试一次</p>
              </div>
            </div>
          ) : (
            templates.map((template) => {
              const isSelected = selectedTemplateUuid === template.uuid
              const selectedCount = selectedCountMap.get(template.uuid) ?? 0

              return (
                <button
                  key={template.uuid}
                  type="button"
                  onClick={() => onSelectTemplate(template)}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-blue-200 bg-blue-50/70 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-zinc-950">{template.display_name}</span>
                        {isSelected && <Badge className="h-5 rounded-full bg-blue-600 px-2 text-[11px] text-white">当前</Badge>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {template.description || `${template.standard.toUpperCase()} · ${template.product} · ${template.os_version}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 rounded-full border-zinc-200 bg-white px-2 text-xs font-normal text-zinc-900">
                      {template.item_count} 项
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-900">
                      {template.standard || "STANDARD"}
                    </Badge>
                    <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-900">
                      {template.profile || "profile"}
                    </Badge>
                    <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-900">
                      {template.os_version || template.baseline_version || "版本"}
                    </Badge>
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-900">
                        已选 {selectedCount}
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
