"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ArrowRight, LayoutGrid, Plus, RefreshCw, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
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
  onCreateBaseline: () => void
  createSelectedCount: number
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
  onCreateBaseline,
  createSelectedCount,
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
    <Card className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg transition-shadow duration-200 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400" />
      <CardHeader className="border-b border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm shadow-blue-200/70">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold text-zinc-950">{t("templateSelector.title")}</CardTitle>
              <CardDescription className="text-sm text-zinc-500">{t("templateSelector.subtitle")}</CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-9 gap-2 rounded-xl border-zinc-200 bg-white px-3 text-zinc-950 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span>{t("templateSelector.refresh")}</span>
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

      <CardContent className="flex min-h-0 flex-1 flex-col p-3">
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
                      ? "border-blue-300 bg-blue-50/80 shadow-sm ring-1 ring-blue-100"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-zinc-950">{getTemplateLabel(template)}</span>
                        {isSelected && (
                          <Badge className="h-5 shrink-0 rounded-full bg-blue-600 px-2 text-[11px] text-white shadow-sm">
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
                    <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-700">
                      {t("templateSelector.standardLabel")}: {template.standard || "STANDARD"}
                    </Badge>
                    <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-700">
                      {t("templateSelector.profileLabel")}: {template.profile || "profile"}
                    </Badge>
                    <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-700">
                      {t("templateSelector.versionLabel")}: {template.os_version || template.baseline_version || "--"}
                    </Badge>
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="h-6 rounded-full bg-zinc-100 px-2 text-xs font-normal text-zinc-700">
                        {t("templateSelector.selected")} {selectedCount}
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="mt-2 border-t border-zinc-200/80 pt-2">
          <div className="mx-auto grid w-full max-w-[320px] grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={onCreateBaseline}
              disabled={createSelectedCount === 0}
              className="h-11 w-full gap-3 rounded-xl bg-gradient-to-r from-zinc-950 to-zinc-800 px-5 text-base font-semibold text-white shadow-sm shadow-zinc-300/40 transition-transform hover:scale-[1.01] hover:from-zinc-900 hover:to-zinc-700 disabled:cursor-not-allowed disabled:opacity-100 disabled:hover:scale-100 disabled:hover:from-zinc-950 disabled:hover:to-zinc-800"
            >
              <Plus className="h-5 w-5" />
              <span>{t("createBaseline")}</span>
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-sm tabular-nums">
                {createSelectedCount}
              </span>
            </Button>
            <Button
              asChild
              className="h-11 w-full gap-3 rounded-xl bg-gradient-to-r from-zinc-950 to-zinc-800 px-5 text-base font-semibold text-white shadow-sm shadow-zinc-300/40 transition-transform hover:scale-[1.01] hover:from-zinc-900 hover:to-zinc-700"
            >
              <Link href="/frame/baseline/dispatch">
                <ArrowRight className="h-5 w-5" />
                <span>{t("goToRules")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
