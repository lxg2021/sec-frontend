"use client"

import { useTranslations } from "next-intl"
import { LayoutGrid, RefreshCw, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"

import type { BaselineTemplate } from "../api"
import { getTemplateLabel } from "./locale-utils"

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
  const t = useTranslations("pages.baseline.custom")

  const standardOptions = [
    { value: "all", label: t("templateSelector.standards.all") },
    { value: "cis", label: t("templateSelector.standards.cis") },
    { value: "dod", label: t("templateSelector.standards.dod") },
    { value: "msft", label: t("templateSelector.standards.msft") },
    { value: "intune", label: t("templateSelector.standards.intune") },
    { value: "custom", label: t("templateSelector.standards.custom") },
  ]

  const profileOptions = [
    { value: "all", label: t("templateSelector.profiles.all") },
    { value: "machine", label: t("templateSelector.profiles.machine") },
    { value: "user", label: t("templateSelector.profiles.user") },
    { value: "both", label: t("templateSelector.profiles.both") },
  ]

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold text-slate-950">{t("templateSelector.title")}</CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            aria-label={t("templateSelector.refresh")}
            title={t("templateSelector.refresh")}
            className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3">
          <Select value={standardFilter} onValueChange={onStandardFilterChange}>
            <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white shadow-none transition-colors hover:border-zinc-300">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-zinc-400" />
              <SelectValue placeholder={t("templateSelector.standardPlaceholder")} />
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
            <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white shadow-none transition-colors hover:border-zinc-300">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-zinc-400" />
              <SelectValue placeholder={t("templateSelector.profilePlaceholder")} />
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

      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)
          ) : templates.length === 0 ? (
            <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
              <div className="text-center">
                <LayoutGrid className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-950">{t("templateSelector.emptyTitle")}</p>
                <p className="mt-1 text-xs text-zinc-500">{t("templateSelector.emptyDescription")}</p>
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
                    "group w-full rounded-2xl border p-3 text-left transition-all duration-200",
                    isSelected
                      ? "border-teal-300 bg-teal-50/80 shadow-sm ring-1 ring-teal-100"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-zinc-950">{getTemplateLabel(template)}</span>
                        {isSelected && (
                          <Badge className="h-5 shrink-0 rounded-full bg-teal-700 px-2 text-[11px] text-white shadow-sm">
                            {t("templateSelector.current")}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {template.description || `${template.standard.toUpperCase()} - ${template.product} - ${template.os_version}`}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="flex-shrink-0 rounded-full border-zinc-200 bg-white px-2 text-xs font-normal text-zinc-700 shadow-none"
                    >
                      {template.item_count} {t("templateSelector.itemsSuffix")}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="h-6 rounded-full bg-slate-100 px-2 text-xs font-normal text-slate-700">
                      {t("templateSelector.standardLabel")}: {template.standard || "STANDARD"}
                    </Badge>
                    <Badge variant="secondary" className="h-6 rounded-full bg-slate-100 px-2 text-xs font-normal text-slate-700">
                      {t("templateSelector.profileLabel")}: {template.profile || "profile"}
                    </Badge>
                    <Badge variant="secondary" className="h-6 rounded-full bg-slate-100 px-2 text-xs font-normal text-slate-700">
                      {t("templateSelector.versionLabel")}: {template.os_version || template.baseline_version || "--"}
                    </Badge>
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="h-6 rounded-full bg-slate-100 px-2 text-xs font-normal text-slate-700">
                        {t("templateSelector.selected")} {selectedCount}
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
