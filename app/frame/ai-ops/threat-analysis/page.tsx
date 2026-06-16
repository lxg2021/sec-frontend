"use client"

import AttackReport from "@/features/ai-ops/threat-analysis/components/attack-report"
import { ThreatAnalysisPageHeader } from "@/features/ai-ops/threat-analysis/components/threat-analysis-page-header"
import { sampleAttackAIReportTask } from "@/features/ai-ops/threat-analysis/fixtures"

export default function ThreatAnalysisPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <ThreatAnalysisPageHeader />
        <AttackReport task={sampleAttackAIReportTask} />
      </div>
    </main>
  )
}
