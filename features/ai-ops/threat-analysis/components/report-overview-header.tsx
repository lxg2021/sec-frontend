"use client"

import { ChartNoAxesCombined, Clock, Cpu, FileCheck2, Hash } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"
import { CopyButton } from "@/features/ai-ops/threat-analysis/components/report/copy-button"
import type {
  AttackAIReport,
  AttackAIReportTask,
  ReportValidation,
} from "@/features/ai-ops/threat-analysis/report-types"
import { confidencePct, normalizeSeverity, severityStyles } from "@/features/ai-ops/threat-analysis/report-utils"

type ResolvedReportTask = Omit<AttackAIReportTask, "report" | "validation"> & {
  report: AttackAIReport
  validation: ReportValidation | null
}

export function ReportOverviewHeader({ task }: { task: ResolvedReportTask }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const { report, validation } = task
  const severity = normalizeSeverity(report.risk_level)
  const severityText = severityStyles[severity].text
  const latencyMs = task.latency_ms ?? 0
  const providerName = task.provider_name || "-"
  const modelName = task.model_name || "-"
  const caseId = report.case_id || task.case_id || "-"

  return (
    <header className="relative overflow-hidden border-b border-border">
      <div className="flex flex-col gap-4 py-6 sm:py-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            <ChartNoAxesCombined className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate text-lg font-semibold text-foreground">{t("title")}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="text-muted-foreground">
                {t("header.riskLabel")}
                <span className={cn("px-1 font-semibold", severityText)}>{t(`severity.${severity}`)}</span>
                <span className="px-1 text-border">/</span>
                {t("header.overallConfidence")}
                <span className="px-1 font-mono font-semibold tabular-nums text-foreground">{confidencePct(report.confidence)}%</span>
                <span className="px-1 text-border">/</span>
                {t("header.attackStages")}
                <span className="px-1 font-mono font-semibold tabular-nums text-foreground">{report.attack_story.length}</span>
                <span className="px-1 text-border">/</span>
                {t("header.threatIndicators")}
                <span className="px-1 font-mono font-semibold tabular-nums text-foreground">{report.iocs.length}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1 font-mono">
            <Cpu className="h-3.5 w-3.5 text-primary" aria-hidden />
            {providerName} / {modelName}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1 font-mono">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {(latencyMs / 1000).toFixed(1)}s
          </span>
          {validation?.valid ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1 font-mono">
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden />
              {t("header.validated")} / {validation.checked_refs?.evidence_refs ?? 0} {t("header.references")}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 py-1 pl-2 pr-1 font-mono">
            <Hash className="h-3.5 w-3.5" aria-hidden />
            <span className="text-foreground/80">Case</span>
            <span className="max-w-[12rem] truncate">{caseId}</span>
            <CopyButton value={caseId} label={t("header.copy")} className="h-5 w-5 border-0" />
          </span>
        </div>
      </div>
    </header>
  )
}
