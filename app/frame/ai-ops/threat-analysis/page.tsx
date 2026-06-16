"use client"

import AttackReport from "@/features/ai-ops/threat-analysis/components/attack-report"
import { sampleAttackAIReportTask } from "@/features/ai-ops/threat-analysis/fixtures"

export default function ThreatAnalysisPage() {
  return (
    <main className="min-h-screen bg-background">
      <AttackReport task={sampleAttackAIReportTask} />
    </main>
  )
}
