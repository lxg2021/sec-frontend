import { FileText } from "lucide-react"
import { useTranslations } from "next-intl"

export function ExecutiveSummary({ summary }: { summary: string }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")

  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("summary.title")}</h2>
      </div>
      <p className="text-pretty text-base leading-relaxed text-foreground/90">{summary}</p>
    </div>
  )
}
