import { Server } from "lucide-react"
import { useTranslations } from "next-intl"

import type { AffectedAsset } from "@/features/ai-ops/threat-analysis/report-types"
import { CopyButton } from "@/features/ai-ops/threat-analysis/components/report/copy-button"
import { Section, SectionEmptyState } from "@/features/ai-ops/threat-analysis/components/report/section"
import { EvidenceRefs } from "@/features/ai-ops/threat-analysis/components/report/severity-badge"

export function AffectedAssets({ assets }: { assets: AffectedAsset[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")

  return (
    <Section
      id="assets"
      title={t("assets.title")}
      icon={Server}
      count={assets.length}
      description={t("assets.description")}
    >
      {!assets.length ? <SectionEmptyState>{t("empty.noAssets")}</SectionEmptyState> : null}
      {assets.length ? (
      <div className="grid gap-3 lg:grid-cols-2">
        {assets.map((asset, index) => (
          <div key={`${asset.agent_id}-${index}`} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/15 text-destructive">
                <Server className="h-6 w-6" aria-hidden />
              </div>
              <span className="rounded-md border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-destructive">
                {t("assets.compromised")}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-semibold uppercase tracking-wide text-foreground">{asset.asset_type}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agent</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground/90">{asset.agent_id}</code>
                <CopyButton value={asset.agent_id} label={t("header.copy")} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{asset.impact}</p>
              <div className="mt-3 border-t border-border pt-3">
                <EvidenceRefs refs={asset.evidence_refs} />
              </div>
            </div>
          </div>
        ))}
      </div>
      ) : null}
    </Section>
  )
}
