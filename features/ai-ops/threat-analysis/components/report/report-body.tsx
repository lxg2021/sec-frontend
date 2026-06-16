import type { AttackAIReport } from "@/features/ai-ops/threat-analysis/report-types"
import { AffectedAssets } from "@/features/ai-ops/threat-analysis/components/report/affected-assets"
import { AttackStory } from "@/features/ai-ops/threat-analysis/components/report/attack-story"
import { ExecutiveSummary } from "@/features/ai-ops/threat-analysis/components/report/executive-summary"
import { HypothesesAndLimitations } from "@/features/ai-ops/threat-analysis/components/report/hypotheses-limitations"
import { IocTable } from "@/features/ai-ops/threat-analysis/components/report/ioc-table"
import { KeyFindings } from "@/features/ai-ops/threat-analysis/components/report/key-findings"
import { RecommendedActions } from "@/features/ai-ops/threat-analysis/components/report/recommended-actions"

export function ReportBody({ report }: { report: AttackAIReport }) {
  return (
    <div className="min-w-0 space-y-10">
      <ExecutiveSummary summary={report.executive_summary || "-"} />
      <AttackStory steps={report.attack_story} />
      <KeyFindings findings={report.key_findings} />
      <IocTable iocs={report.iocs} />
      <AffectedAssets assets={report.affected_assets} />
      <RecommendedActions actions={report.recommended_actions} />
      <HypothesesAndLimitations hypotheses={report.hypotheses} limitations={report.limitations} />
    </div>
  )
}
