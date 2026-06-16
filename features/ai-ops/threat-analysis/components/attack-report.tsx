"use client"

import { ReportOverviewHeader } from "@/features/ai-ops/threat-analysis/components/report-overview-header"
import { ReportBody } from "@/features/ai-ops/threat-analysis/components/report/report-body"
import { ReportNav } from "@/features/ai-ops/threat-analysis/components/report/report-nav"
import type {
  AttackAIReport,
  AttackAIReportTask,
  ReportValidation,
} from "@/features/ai-ops/threat-analysis/report-types"
import { parseMaybeJson } from "@/features/ai-ops/threat-analysis/report-utils"

type ReportTask = AttackAIReportTask

export function AttackReport({ task }: { task: ReportTask }) {
  const report = task.report ?? parseMaybeJson<AttackAIReport>(task.report_json)
  const validation = task.validation ?? parseMaybeJson<ReportValidation>(task.validation_json) ?? null

  if (!report) {
    return (
      <article className="mx-auto w-full max-w-[120rem]">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            No report data.
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="mx-auto w-full max-w-[120rem]">
      <ReportOverviewHeader task={{ ...task, report, validation }} />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:px-8 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <ReportNav />
        <ReportBody report={report} />
      </div>
    </article>
  )
}

export default AttackReport
