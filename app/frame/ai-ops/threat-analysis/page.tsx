"use client"

import AttackReport from "@/features/ai-ops/threat-analysis/components/attack-report"
import { sampleAttackAIReportTask } from "@/features/ai-ops/threat-analysis/fixtures"

export default function ThreatAnalysisPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="space-y-6 px-6 pb-6 pt-2">
        <AttackReport task={sampleAttackAIReportTask} />
      </div>
    </main>
  )
}
