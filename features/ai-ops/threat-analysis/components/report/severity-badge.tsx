import { FileText } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"
import type { Severity } from "@/features/ai-ops/threat-analysis/report-types"
import { severityStyles } from "@/features/ai-ops/threat-analysis/report-utils"

export function SeverityBadge({ severity }: { severity: Severity }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const s = severityStyles[severity]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        s.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {t(`severity.${severity}`)}
    </span>
  )
}

export function EvidenceRefs({ refs }: { refs: string[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")

  if (!refs?.length) return null

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <FileText className="h-3.5 w-3.5" aria-hidden />
      {refs.length} {t("evidenceRefs")}
    </span>
  )
}
