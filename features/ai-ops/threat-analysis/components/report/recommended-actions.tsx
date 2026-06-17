import { ListChecks } from "lucide-react"
import { useTranslations } from "next-intl"

import type { RecommendedAction } from "@/features/ai-ops/threat-analysis/report-types"
import { Section, SectionEmptyState } from "@/features/ai-ops/threat-analysis/components/report/section"
import { EvidenceRefs } from "@/features/ai-ops/threat-analysis/components/report/severity-badge"

export function RecommendedActions({ actions }: { actions: RecommendedAction[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const sorted = [...actions].sort((a, b) => a.priority - b.priority)

  return (
    <Section
      id="actions"
      title={t("actions.title")}
      icon={ListChecks}
      count={actions.length}
      description={t("actions.description")}
    >
      {!sorted.length ? <SectionEmptyState>{t("empty.noActions")}</SectionEmptyState> : null}
      {sorted.length ? (
      <ol className="space-y-3">
        {sorted.map((action, index) => (
          <li key={`${action.priority}-${action.title}-${index}`} className="flex gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">
                {action.priority}
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("actions.priority")}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{action.detail}</p>
              <div className="mt-3">
                <EvidenceRefs refs={action.evidence_refs} />
              </div>
            </div>
          </li>
        ))}
      </ol>
      ) : null}
    </Section>
  )
}
