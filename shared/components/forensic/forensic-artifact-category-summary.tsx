"use client"

import Link from "next/link"
import { Boxes } from "lucide-react"
import { useTranslations } from "next-intl"
import { CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicArtifactSummary } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader, ForensicSummaryCard } from "./forensic-panel-chrome"

interface Props {
  summary: ForensicArtifactSummary
}

const CATEGORIES = [
  { key: "file", source: "FileFinder", emptyKey: "notEnabled" },
  { key: "registry", source: "Registry", emptyKey: "notEnabled" },
  { key: "eventlog", source: "EventLog", emptyKey: "notEnabled" },
  { key: "ntfs", source: "NTFS.MFT", emptyKey: "notEnabled" },
  { key: "application", source: "AppCompat", emptyKey: "pendingExtension" },
  { key: "forensic", source: "Forensic", emptyKey: "pendingExtension" },
]

export function ForensicArtifactCategorySummary({ summary }: Props) {
  const t = useTranslations("pages.investigation.collection.artifactSummary")
  return (
    <ForensicSummaryCard color="from-yellow-400 to-amber-600">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={Boxes}
          iconColor="from-yellow-400 to-amber-600"
          title={t("title")}
        />
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const value = summary.by_category[cat.key] ?? 0
            const active = value > 0
            return (
              <Link
                key={cat.key}
                href={`/frame/investigation/artifacts?category=${cat.key}`}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md border px-2.5 py-2 transition-colors",
                  active
                    ? "border-border bg-background hover:bg-accent"
                    : "border-dashed border-border bg-muted/30 hover:bg-accent/50"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("truncate text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                    {t(`categories.${cat.key}`)}
                  </span>
                  <span className={cn("text-sm font-semibold tabular-nums", active ? "text-foreground" : "text-muted-foreground")}>
                    {value}
                  </span>
                </div>
                <span className="truncate text-[10px] text-muted-foreground">
                  {active ? cat.source : t(cat.emptyKey)}
                </span>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </ForensicSummaryCard>
  )
}
