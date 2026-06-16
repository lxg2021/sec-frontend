import { AlertCircle, Lightbulb } from "lucide-react"
import { useTranslations } from "next-intl"

import type { Hypothesis } from "@/features/ai-ops/threat-analysis/report-types"
import { ConfidenceMeter } from "@/features/ai-ops/threat-analysis/components/report/confidence-meter"
import { Section } from "@/features/ai-ops/threat-analysis/components/report/section"
import { EvidenceRefs } from "@/features/ai-ops/threat-analysis/components/report/severity-badge"

export function HypothesesAndLimitations({ hypotheses, limitations }: { hypotheses: Hypothesis[]; limitations: string[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")

  return (
    <>
      <Section
        id="hypotheses"
        title={t("hypotheses.title")}
        icon={Lightbulb}
        count={hypotheses.length}
        description={t("hypotheses.description")}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {hypotheses.map((hypothesis) => (
            <div key={hypothesis.title} className="rounded-lg border border-dashed border-border bg-card/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{hypothesis.title}</h3>
                <ConfidenceMeter value={hypothesis.confidence} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hypothesis.detail}</p>
              <div className="mt-3 border-t border-border pt-3">
                <EvidenceRefs refs={hypothesis.evidence_refs} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="limitations"
        title={t("limitations.title")}
        icon={AlertCircle}
        count={limitations.length}
        description={t("limitations.description")}
      >
        <ul className="space-y-2 rounded-lg border border-border bg-card p-4">
          {limitations.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
