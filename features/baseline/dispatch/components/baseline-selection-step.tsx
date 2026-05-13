"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  Flame,
  Hash,
  ImageIcon,
  KeyRound,
  LayoutGrid,
  Monitor,
  Package,
  Ruler,
  Tags,
} from "lucide-react"

import type { BaselineTemplate } from "@/features/baseline/custom/api"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import {
  getDispatchBaselineTypeLabel,
  getDispatchProfileLabel,
  getDispatchStandardLabel,
} from "./value-mapping"

interface BaselineSelectionStepProps {
  canNext: boolean
  onNext: () => void
  selectedTemplate: BaselineTemplate | null
  selector: ReactNode
}

interface DetailRow {
  icon: LucideIcon
  label: string
  mono?: boolean
  strong?: boolean
  value: string
}

export function BaselineSelectionStep({
  canNext,
  onNext,
  selectedTemplate,
  selector,
}: BaselineSelectionStepProps) {
  const t = useTranslations("pages.baseline.dispatch")
  const detailRows: DetailRow[] = selectedTemplate
    ? [
        { icon: KeyRound, label: "UUID", value: selectedTemplate.uuid, mono: true },
        {
          icon: Tags,
          label: t("baselineSelection.detail.displayName"),
          value: selectedTemplate.display_name || "-",
          strong: true,
        },
        { icon: Building2, label: t("baselineSelection.detail.tenantId"), value: selectedTemplate.tenant_id || "-" },
        {
          icon: Ruler,
          label: t("baselineSelection.detail.standard"),
          value: selectedTemplate.standard
            ? getDispatchStandardLabel(selectedTemplate.standard, t, t("selector.unknown"))
            : "-",
        },
        {
          icon: Package,
          label: t("baselineSelection.detail.baselineType"),
          value: selectedTemplate.baseline_type
            ? getDispatchBaselineTypeLabel(selectedTemplate.baseline_type, t)
            : "-",
        },
        { icon: Monitor, label: t("baselineSelection.detail.product"), value: selectedTemplate.product || "-" },
        {
          icon: FileText,
          label: t("baselineSelection.detail.originalFilename"),
          value: selectedTemplate.original_filename || "-",
          mono: true,
        },
        { icon: Monitor, label: t("baselineSelection.detail.osVersion"), value: selectedTemplate.os_version || "-" },
        { icon: Tags, label: t("baselineSelection.detail.baselineVersion"), value: selectedTemplate.baseline_version || "-" },
        {
          icon: ImageIcon,
          label: t("baselineSelection.detail.profile"),
          value: selectedTemplate.profile
            ? getDispatchProfileLabel(selectedTemplate.profile, t, t("selector.unknown"))
            : "-",
        },
        {
          icon: Hash,
          label: t("baselineSelection.detail.itemCount"),
          value: t("baselineSelection.detail.itemCountValue", { count: selectedTemplate.item_count ?? 0 }),
          strong: true,
        },
        { icon: CalendarClock, label: t("baselineSelection.detail.createdAt"), value: selectedTemplate.created_at || "-" },
      ]
    : []

  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <LayoutGrid className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{t("steps.baselineSelection.title")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t("baselineSelection.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {selector}

        <div className="border-t pt-6">
          {selectedTemplate ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid divide-y divide-slate-200 bg-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="bg-white px-4 py-5 text-center transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {t("baselineSelection.risk.low")}
                  </div>
                  <div className="mt-2 text-4xl font-bold leading-none text-emerald-600">
                    {selectedTemplate.low_count ?? 0}
                  </div>
                </div>
                <div className="bg-white px-4 py-5 text-center transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {t("baselineSelection.risk.medium")}
                  </div>
                  <div className="mt-2 text-4xl font-bold leading-none text-amber-500">
                    {selectedTemplate.medium_count ?? 0}
                  </div>
                </div>
                <div className="bg-white px-4 py-5 text-center transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <Flame className="h-4 w-4 text-red-500" />
                    {t("baselineSelection.risk.high")}
                  </div>
                  <div className="mt-2 text-4xl font-bold leading-none text-red-600">
                    {selectedTemplate.high_count ?? 0}
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                  {detailRows.map((item) => {
                    const Icon = item.icon

                    return (
                      <div key={item.label} className="flex gap-3 border-b border-slate-100 pb-3">
                        <dt className="flex w-28 shrink-0 items-center gap-2 text-sm font-medium text-slate-500">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </dt>
                        <dd
                          className={[
                            "min-w-0 flex-1 break-all text-sm text-slate-900",
                            item.strong ? "font-semibold" : "font-medium",
                            item.mono
                              ? "rounded-md bg-slate-50 px-2 py-0.5 font-mono text-xs"
                              : "",
                          ].join(" ")}
                        >
                          {item.value}
                        </dd>
                      </div>
                    )
                  })}
                </dl>

              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
              {t("baselineSelection.empty")}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={onNext} disabled={!canNext} className="h-11 px-6">
            {t("steps.baselineSelection.title")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
