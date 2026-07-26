"use client"

import { Shield } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { ReportOverviewHeader } from "@/features/ai-ops/threat-analysis/components/report-overview-header"
import { ReportBody } from "@/features/ai-ops/threat-analysis/components/report/report-body"
import { ReportNav } from "@/features/ai-ops/threat-analysis/components/report/report-nav"
import type {
  AttackAIReport,
  AttackAIReportTask,
  ReportValidation,
} from "@/features/ai-ops/threat-analysis/report-types"
import { normalizeAttackReport, parseMaybeJson } from "@/features/ai-ops/threat-analysis/report-utils"

type ReportTask = AttackAIReportTask

function shouldUseLocalizedReport(locale: string) {
  return locale.toLowerCase().startsWith("zh")
}

function normalizeTaskStatus(status?: string) {
  return status?.trim().toLowerCase() || "unknown"
}

function localizedEmptyMessageKey(task: ReportTask) {
  const status = normalizeTaskStatus(task.localized_status)

  if (status === "pending" || status === "running") {
    return "empty.localizedPending"
  }

  if (status === "invalid") {
    return "empty.localizedInvalid"
  }

  if (status === "failed") {
    return "empty.localizedFailed"
  }

  return "empty.localizedMissing"
}

export function AttackReport({ task }: { task: ReportTask }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const locale = useLocale()
  const useLocalizedReport = shouldUseLocalizedReport(locale)
  const parsedLocalizedReport = task.localized_report ?? parseMaybeJson<AttackAIReport>(task.localized_report_json)
  const parsedCanonicalReport = task.report ?? parseMaybeJson<AttackAIReport>(task.report_json)
  const parsedReport = useLocalizedReport ? parsedLocalizedReport : parsedCanonicalReport
  const report = parsedReport ? normalizeAttackReport(parsedReport) : null
  const canonicalValidation = task.validation ?? parseMaybeJson<ReportValidation>(task.validation_json) ?? null

  if (!report) {
    return (
      <article className="flex min-h-0 w-full flex-1 items-center justify-center px-6 py-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
            <Shield className="h-5 w-5 text-slate-500" aria-hidden />
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {t(useLocalizedReport ? localizedEmptyMessageKey(task) : "empty.noReport")}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="w-full">
      <ReportOverviewHeader task={{ ...task, report, validation: canonicalValidation }} />
      <div className="grid gap-8 py-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[14rem_minmax(0,1fr)] 2xl:grid-cols-[15rem_minmax(0,1fr)]">
        <ReportNav />
        <ReportBody report={report} />
      </div>
    </article>
  )
}

export default AttackReport
