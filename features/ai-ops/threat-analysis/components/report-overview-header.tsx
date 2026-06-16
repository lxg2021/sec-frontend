"use client"

import { useState } from "react"
import { BadgeCheck, ChartNoAxesCombined, Check, Clock, Copy, Cpu, Hash } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"
import type {
  AttackAIReport,
  AttackAIReportTask,
  ReportValidation,
  Severity,
} from "@/features/ai-ops/threat-analysis/report-types"

type ResolvedReportTask = Omit<AttackAIReportTask, "report" | "validation"> & {
  report: AttackAIReport
  validation: ReportValidation | null
}

const severityTextStyles: Record<Severity, string> = {
  critical: "text-destructive",
  high: "text-chart-2",
  medium: "text-chart-3",
  low: "text-chart-4",
  info: "text-muted-foreground",
}

function confidencePct(value: number) {
  return Math.round(value * 100)
}

function MetadataCopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label}: ${value}`}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-chart-3" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function ReportOverviewHeader({ task }: { task: ResolvedReportTask }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const { report, validation } = task
  const severity = report.risk_level || "info"
  const severityText = severityTextStyles[severity] ?? severityTextStyles.info
  const latencyMs = task.latency_ms ?? 0
  const providerName = task.provider_name || "-"
  const modelName = task.model_name || "-"
  const caseId = report.case_id || task.case_id || "-"

  return (
    <header className="relative overflow-hidden border-b border-border">
      <div className="flex flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            <ChartNoAxesCombined className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate text-lg font-semibold text-slate-950">{t("title")}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="text-slate-500">
                {t("header.riskLabel")}
                <span className={cn("px-1 font-semibold", severityText)}>{t(`severity.${severity}`)}</span>
                <span className="px-1 text-slate-200">/</span>
                {t("header.overallConfidence")}
                <span className="px-1 font-mono font-semibold tabular-nums text-slate-950">{confidencePct(report.confidence ?? 0)}%</span>
                <span className="px-1 text-slate-200">/</span>
                {t("header.attackStages")}
                <span className="px-1 font-mono font-semibold tabular-nums text-slate-950">{report.attack_story.length}</span>
                <span className="px-1 text-slate-200">/</span>
                {t("header.threatIndicators")}
                <span className="px-1 font-mono font-semibold tabular-nums text-slate-950">{report.iocs.length}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1 font-mono">
            <Cpu className="h-3.5 w-3.5 text-primary" aria-hidden />
            {providerName} · {modelName}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1 font-mono">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {(latencyMs / 1000).toFixed(1)}s
          </span>
          {validation?.valid ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-chart-4/30 bg-chart-4/10 px-2 py-1 font-mono text-chart-4">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              {t("header.validated")} · {validation.checked_refs?.evidence_refs ?? 0} {t("header.references")}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 py-1 pl-2 pr-1 font-mono">
            <Hash className="h-3.5 w-3.5" aria-hidden />
            <span className="text-foreground/80">Case</span>
            <span className="max-w-[12rem] truncate">{caseId}</span>
            <MetadataCopyButton value={caseId} label={t("header.copy")} />
          </span>
        </div>
      </div>
    </header>
  )
}
