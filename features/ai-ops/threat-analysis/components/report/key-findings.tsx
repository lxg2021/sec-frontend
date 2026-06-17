import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

import type { KeyFinding } from "@/features/ai-ops/threat-analysis/report-types"
import { normalizeSeverity } from "@/features/ai-ops/threat-analysis/report-utils"
import { ConfidenceMeter } from "@/features/ai-ops/threat-analysis/components/report/confidence-meter"
import { Section, SectionEmptyState } from "@/features/ai-ops/threat-analysis/components/report/section"
import { EvidenceRefs, SeverityBadge } from "@/features/ai-ops/threat-analysis/components/report/severity-badge"

export function KeyFindings({ findings }: { findings: KeyFinding[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")

  return (
    <Section
      id="key-findings"
      title={t("findings.title")}
      icon={Search}
      count={findings.length}
      description={t("findings.description")}
    >
      {!findings.length ? <SectionEmptyState>{t("empty.noFindings")}</SectionEmptyState> : null}
      {findings.length ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {findings.map((finding, index) => {
          const severity = normalizeSeverity(finding.severity)

          return (
            <div key={`${finding.title}-${index}`} className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug text-foreground">{finding.title}</h3>
                <SeverityBadge severity={severity} />
              </div>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{finding.reason}</p>
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <ConfidenceMeter value={finding.confidence} />
                <EvidenceRefs refs={finding.evidence_refs} />
              </div>
            </div>
          )
        })}
      </div>
      ) : null}
    </Section>
  )
}
