"use client"

import { CheckCircle2, Cloud, Copy, Database, Network, ShieldAlert, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  confidenceText,
  isAllowlisted,
  isRemoteHit,
  riskText,
  typeClass,
  verdictFromItem,
} from "@/features/ioc-analysis/components/ioc-verification-display-utils"
import type { IocVerificationItem } from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

function verdictLabelKey(item: IocVerificationItem | null) {
  if (!item) return "verdict.unchecked"
  switch (verdictFromItem(item)) {
    case "malicious":
      return "verdict.malicious"
    case "allow":
      return "verdict.allow"
    case "error":
      return "verdict.error"
    case "checking":
      return "verdict.checking"
    case "ready":
      return "verdict.ready"
    default:
      return "verdict.unknown"
  }
}

function verdictToneClass(item: IocVerificationItem | null) {
  if (!item) return "border-slate-200 bg-slate-50 text-slate-600"
  switch (verdictFromItem(item)) {
    case "malicious":
      return "border-red-200 bg-red-50 text-red-700"
    case "allow":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function VerdictIcon({ item }: { item: IocVerificationItem }) {
  const verdict = verdictFromItem(item)
  if (verdict === "allow") return <ShieldCheck className="h-7 w-7 text-emerald-600" aria-hidden="true" />
  return <ShieldAlert className={cn("h-7 w-7", verdict === "malicious" ? "text-red-600" : "text-slate-500")} aria-hidden="true" />
}

function SummaryMetric({
  icon: Icon,
  label,
  tone = "slate",
  value,
}: {
  icon: typeof Database
  label: string
  tone?: "slate" | "blue" | "green" | "red" | "amber"
  value: string
}) {
  const toneClass = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone]

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", toneClass)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 truncate text-lg font-semibold text-slate-950">{value}</div>
    </div>
  )
}

export function IocSearchResultSummary({
  graphScopeId,
  item,
  localEventCount,
  onCopy,
}: {
  graphScopeId?: string
  item: IocVerificationItem
  localEventCount: number
  onCopy: (value: string) => void
}) {
  const remoteHit = isRemoteHit(item)
  const allowlisted = isAllowlisted(item)
  const checkedAt = item.verification?.checked_at || "-"
  const t = useTranslations("pages.iocAnalysis.search.summary")
  const rawRiskText = riskText(item)
  const localizedRiskText =
    rawRiskText === "High" ? t("risk.high") : rawRiskText === "Low" ? t("risk.low") : rawRiskText
  const localHit =
    item.verification?.local_status === "hit" ||
    item.verification?.hit_status_key === "local_ioc_hit" ||
    (item.verification?.hit_scope === "local" && item.verification?.hit === true)
  const localIntelText = item.verification?.local_status || (localHit ? t("hit") : t("miss"))

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border", verdictToneClass(item))}>
            <VerdictIcon item={item} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all font-mono text-xl font-semibold text-slate-950">{item.value}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => onCopy(item.value)}
                aria-label={t("actions.copyIoc")}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 font-mono text-[11px] uppercase", typeClass(item.type))}>
                {item.type}
              </Badge>
              <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-xs font-medium", verdictToneClass(item))}>
                {t(verdictLabelKey(item))}
              </Badge>
              {allowlisted ? (
                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {t("allowlistHit")}
                </Badge>
              ) : null}
              {graphScopeId ? (
                <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-[11px] text-blue-700">
                  positioning:{graphScopeId}
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {t("checkedAt")}<span className="font-mono text-slate-600">{checkedAt}</span>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:min-w-[720px]">
          <SummaryMetric icon={Database} label={t("metrics.localIntel")} value={localIntelText} tone={localHit ? "red" : "slate"} />
          <SummaryMetric icon={Cloud} label={t("metrics.remoteIntel")} value={remoteHit ? t("hit") : item.verification?.remote_status || t("miss")} tone={remoteHit ? "red" : "slate"} />
          <SummaryMetric icon={ShieldCheck} label={t("metrics.riskScore")} value={localizedRiskText} tone={item.status === "hit" ? "red" : "green"} />
          <SummaryMetric icon={CheckCircle2} label={t("metrics.confidence")} value={confidenceText(item)} tone="blue" />
          <SummaryMetric icon={Network} label={t("metrics.localEvents")} value={String(localEventCount)} tone={localEventCount ? "amber" : "slate"} />
          <SummaryMetric icon={Network} label={t("metrics.graph")} value={graphScopeId ? t("graph.generated") : t("graph.pendingEvent")} tone={graphScopeId ? "blue" : "slate"} />
        </div>
      </div>
    </section>
  )
}
