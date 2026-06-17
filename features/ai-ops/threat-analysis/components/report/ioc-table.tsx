import { Crosshair, Database, FileWarning, Globe, Hash, Link2, TerminalSquare } from "lucide-react"
import { useTranslations } from "next-intl"

import type { Ioc, IocType } from "@/features/ai-ops/threat-analysis/report-types"
import { CopyButton } from "@/features/ai-ops/threat-analysis/components/report/copy-button"
import { Section, SectionEmptyState } from "@/features/ai-ops/threat-analysis/components/report/section"

const iocIcon: Record<IocType, typeof Globe> = {
  ip: Globe,
  url: Link2,
  hash: Hash,
  md5: Hash,
  sha1: Hash,
  sha256: Hash,
  file: FileWarning,
  process: TerminalSquare,
  domain: Globe,
  registry: Database,
}

function formatUnknownIocType(type: string) {
  return type
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unknown"
}

export function IocTable({ iocs }: { iocs: Ioc[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")

  return (
    <Section
      id="iocs"
      title={t("iocs.title")}
      icon={Crosshair}
      count={iocs.length}
      description={t("iocs.description")}
    >
      {!iocs.length ? <SectionEmptyState>{t("empty.noIocs")}</SectionEmptyState> : null}
      {iocs.length ? (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden grid-cols-[7rem_minmax(0,1fr)_14rem] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:grid xl:grid-cols-[7rem_minmax(0,1fr)_18rem]">
          <span>{t("iocHeaders.type")}</span>
          <span>{t("iocHeaders.value")}</span>
          <span>{t("iocHeaders.source")}</span>
        </div>
        <ul className="divide-y divide-border">
          {iocs.map((ioc, index) => {
            const Icon = iocIcon[ioc.type] || Globe
            const iocTypeKey = `iocType.${ioc.type}`
            const iocTypeLabel = t.has(iocTypeKey) ? t(iocTypeKey) : formatUnknownIocType(ioc.type)
            return (
              <li key={`${ioc.type}-${index}`} className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-accent/40 md:grid-cols-[7rem_minmax(0,1fr)_14rem] md:items-center md:gap-4 xl:grid-cols-[7rem_minmax(0,1fr)_18rem]">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="text-xs font-medium text-foreground">{iocTypeLabel}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <code className="truncate rounded bg-muted/60 px-2 py-1 font-mono text-xs text-foreground/90">{ioc.value}</code>
                  <CopyButton value={ioc.value} className="h-7 w-7" label={t("header.copy")} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{ioc.source}</span>
              </li>
            )
          })}
        </ul>
      </div>
      ) : null}
    </Section>
  )
}
