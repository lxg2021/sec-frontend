"use client"

import type { ReactNode } from "react"
import { BarChart3, Boxes, Layers3, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import type { BaselineTemplate, BaselineTemplateItemsData } from "@/features/baseline/custom/api"
import { cn } from "@/shared/lib/utils"
import { Skeleton } from "@/shared/ui/skeleton"

import {
  getDispatchBaselineTypeLabel,
  getDispatchProfileLabel,
  getDispatchStandardLabel,
} from "./value-mapping"

interface BaselineSummaryProps {
  itemsData: BaselineTemplateItemsData | null
  loading: boolean
  template: BaselineTemplate | null
}

type RiskTone = "rose" | "amber" | "emerald"

const riskToneStyles: Record<RiskTone, { bar: string; dot: string; value: string }> = {
  rose: {
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    value: "text-rose-600",
  },
  amber: {
    bar: "bg-amber-400",
    dot: "bg-amber-400",
    value: "text-amber-600",
  },
  emerald: {
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    value: "text-emerald-600",
  },
}

function percentage(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

export function BaselineSummary({ itemsData, loading, template }: BaselineSummaryProps) {
  const t = useTranslations("pages.baseline.dispatch")
  const workspace = useTranslations("pages.baseline.dispatch.workspace")

  const totalChecks = template?.item_count ?? 0
  const highCount = template?.high_count ?? 0
  const mediumCount = template?.medium_count ?? 0
  const lowCount = template?.low_count ?? 0
  const categoryCount = itemsData?.category_groups.length

  const standard = template
    ? getDispatchStandardLabel(template.standard, t, t("selector.unknownUpper"))
    : workspace("summaryUnknown")
  const profile = template
    ? getDispatchProfileLabel(template.profile, t, t("selector.unknownProfile"))
    : workspace("summaryUnknown")
  const baselineType = template
    ? getDispatchBaselineTypeLabel(template.baseline_type, t) || workspace("summaryUnknown")
    : workspace("summaryUnknown")
  const isCustomBaseline = template?.baseline_type.trim().toLowerCase() === "custom"

  return (
    <section className="flex min-h-[270px] flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-5 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">{workspace("baselineOverview")}</h2>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{workspace("baselineOverviewDescription")}</p>
        </div>
      </div>

      {!template ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center">
          <div>
            <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-800">{workspace("summarySelectBaseline")}</p>
            <p className="mt-1 text-xs text-slate-500">{workspace("summarySelectBaselineDescription")}</p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 p-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm">
                <Layers3 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-900">
                  {workspace("summaryCurrentBaseline")}
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-slate-950" title={template.display_name || template.baseline_uuid}>
                    {template.display_name || template.baseline_uuid}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      isCustomBaseline
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-violet-200 bg-violet-50 text-violet-700",
                    )}
                  >
                    {baselineType}
                  </span>
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-200 pt-4">
              <SummaryField label={workspace("summaryStandard")} value={standard} tone="violet" />
              <SummaryField
                label={workspace("summaryProduct")}
                value={template.product || workspace("summaryUnknown")}
                tone="cyan"
              />
              <SummaryField
                label={workspace("summaryOperatingSystem")}
                value={template.os_version || template.baseline_version || workspace("summaryUnknown")}
                tone="emerald"
              />
              <SummaryField label={workspace("summaryProfile")} value={profile} tone="amber" />
            </dl>
          </div>

          <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-2 gap-3">
              <SummaryMetric
                icon={<Boxes className="h-4 w-4" />}
                label={workspace("totalChecks")}
                value={totalChecks}
                tone="cyan"
              />
              <SummaryMetric
                icon={<Layers3 className="h-4 w-4" />}
                label={workspace("summaryCategories")}
                value={categoryCount}
                loading={loading}
                tone="amber"
              />
            </div>

            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                <BarChart3 className="h-3.5 w-3.5 text-rose-500" />
                {workspace("summaryRiskDistribution")}
              </p>
              <div
                className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={workspace("summaryRiskAriaLabel", {
                  high: highCount,
                  medium: mediumCount,
                  low: lowCount,
                })}
              >
                <RiskBar count={highCount} total={totalChecks} tone="rose" />
                <RiskBar count={mediumCount} total={totalChecks} tone="amber" />
                <RiskBar count={lowCount} total={totalChecks} tone="emerald" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/70 py-3">
              <RiskLegend label={workspace("highRisk")} count={highCount} total={totalChecks} tone="rose" />
              <RiskLegend label={workspace("mediumRisk")} count={mediumCount} total={totalChecks} tone="amber" />
              <RiskLegend label={workspace("lowRisk")} count={lowCount} total={totalChecks} tone="emerald" />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function SummaryField({
  label,
  tone,
  value,
}: {
  label: string
  tone: "violet" | "cyan" | "emerald" | "amber"
  value: string
}) {
  const styles = {
    violet: {
      container: "border-violet-100 bg-violet-50/70",
      dot: "bg-violet-600",
    },
    cyan: {
      container: "border-cyan-100 bg-cyan-50/70",
      dot: "bg-cyan-600",
    },
    emerald: {
      container: "border-emerald-100 bg-emerald-50/70",
      dot: "bg-emerald-600",
    },
    amber: {
      container: "border-amber-100 bg-amber-50/70",
      dot: "bg-amber-600",
    },
  }[tone]

  return (
    <div className={cn("min-w-0 rounded-lg border px-3 py-2.5", styles.container)}>
      <dt className="flex items-center gap-1.5 text-[10px] font-medium text-slate-900">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 truncate text-xs font-semibold text-slate-900" title={value}>{value}</dd>
    </div>
  )
}

function SummaryMetric({
  icon,
  label,
  loading = false,
  tone,
  value,
}: {
  icon: ReactNode
  label: string
  loading?: boolean
  tone: "cyan" | "amber"
  value?: number
}) {
  const styles = {
    cyan: {
      icon: "bg-cyan-50 text-cyan-600",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
    },
  }[tone]

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm", styles.icon)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-slate-900">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-10 rounded" />
        ) : (
          <p className="mt-0.5 text-lg font-semibold leading-none tabular-nums text-slate-950">
            {value ?? "-"}
          </p>
        )}
      </div>
    </div>
  )
}

function RiskBar({ count, tone, total }: { count: number; tone: RiskTone; total: number }) {
  const width = percentage(count, total)
  if (width <= 0) return null

  return <span className={riskToneStyles[tone].bar} style={{ width: `${width}%` }} />
}

function RiskLegend({
  count,
  label,
  tone,
  total,
}: {
  count: number
  label: string
  tone: RiskTone
  total: number
}) {
  return (
    <div className="min-w-0 px-3 text-center">
      <p className="flex items-center justify-center gap-1.5 truncate text-[10px] text-slate-500">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", riskToneStyles[tone].dot)} />
        {label}
      </p>
      <p className={cn("mt-1 text-base font-semibold tabular-nums", riskToneStyles[tone].value)}>{count}</p>
      <p className="text-[9px] tabular-nums text-slate-400">{percentage(count, total)}%</p>
    </div>
  )
}
