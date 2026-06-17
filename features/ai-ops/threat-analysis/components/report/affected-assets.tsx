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
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden grid-cols-[6rem_minmax(14rem,18rem)_minmax(0,1fr)_10rem] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:grid">
            <span>{t("fields.status")}</span>
            <span>{t("fields.host")}</span>
            <span>{t("assets.title")}</span>
            <span>{t("fields.evidenceRefs")}</span>
          </div>
          <ul className="divide-y divide-border">
            {assets.map((asset, index) => (
              <li
                key={`${asset.agent_id}-${index}`}
                className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-accent/40 md:grid-cols-[6rem_minmax(14rem,18rem)_minmax(0,1fr)_10rem] md:items-center md:gap-4"
              >
                <div className="flex items-center">
                  <span className="inline-flex rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                    {t("assets.compromised")}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-1.5">
                  <code className="truncate rounded bg-muted px-2 py-1 font-mono text-xs text-foreground/90">{asset.agent_id}</code>
                  <CopyButton value={asset.agent_id} label={t("header.copy")} />
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground md:line-clamp-2">{asset.impact}</p>

                <div className="flex items-center md:justify-start">
                  <EvidenceRefs refs={asset.evidence_refs} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  )
}
