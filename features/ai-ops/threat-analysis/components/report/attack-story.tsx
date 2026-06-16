import { GitBranch } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"
import type { AttackStoryStep } from "@/features/ai-ops/threat-analysis/report-types"
import { normalizeSeverity, severityStyles } from "@/features/ai-ops/threat-analysis/report-utils"
import { ConfidenceMeter } from "@/features/ai-ops/threat-analysis/components/report/confidence-meter"
import { Section } from "@/features/ai-ops/threat-analysis/components/report/section"
import { EvidenceRefs, SeverityBadge } from "@/features/ai-ops/threat-analysis/components/report/severity-badge"

export function AttackStory({ steps }: { steps: AttackStoryStep[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")

  return (
    <Section
      id="attack-story"
      title={t("story.title")}
      icon={GitBranch}
      count={steps.length}
      description={t("story.description")}
    >
      <ol className="relative space-y-4 pl-2">
        {steps.map((step, index) => {
          const severity = normalizeSeverity(step.severity)
          const s = severityStyles[severity]
          const isLast = index === steps.length - 1

          return (
            <li key={step.step} className="relative pl-8">
              {!isLast ? <span className="absolute left-[11px] top-7 h-[calc(100%+1rem)] w-px bg-border" aria-hidden /> : null}
              <span
                className={cn(
                  "absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border bg-card font-mono text-xs font-semibold",
                  s.badge,
                )}
              >
                {step.step}
              </span>

              <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <SeverityBadge severity={severity} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <EvidenceRefs refs={step.evidence_refs} />
                  <ConfidenceMeter value={step.confidence} />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
