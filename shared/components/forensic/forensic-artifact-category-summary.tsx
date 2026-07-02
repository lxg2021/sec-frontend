"use client"

import Link from "next/link"
import { Boxes } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicArtifactSummary } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader } from "./forensic-panel-chrome"

interface Props {
  summary: ForensicArtifactSummary
}

const CATEGORIES = [
  { key: "file", label: "文件", source: "FileFinder", empty: "未启用" },
  { key: "registry", label: "注册表", source: "Registry", empty: "未启用" },
  { key: "eventlog", label: "日志", source: "EventLog", empty: "未启用" },
  { key: "ntfs", label: "NTFS", source: "NTFS.MFT", empty: "未启用" },
  { key: "application", label: "应用", source: "AppCompat", empty: "待扩展" },
  { key: "forensic", label: "其他", source: "Forensic", empty: "待扩展" },
]

export function ForensicArtifactCategorySummary({ summary }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="p-5 pb-4">
        <ForensicPanelHeader
          icon={Boxes}
          tone="slate"
          title="工件分类摘要"
          description="展示已启用工件覆盖面，不展示底层执行细节"
          action={
            <span className="mt-1 inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
              共 <span className="mx-1 font-semibold tabular-nums text-foreground">{summary.total_enabled}</span> 个
            </span>
          }
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
                    {cat.label}
                  </span>
                  <span className={cn("text-sm font-semibold tabular-nums", active ? "text-foreground" : "text-muted-foreground")}>
                    {value}
                  </span>
                </div>
                <span className="truncate text-[10px] text-muted-foreground">
                  {active ? cat.source : cat.empty}
                </span>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
