"use client"

import { useMemo } from "react"
import { Boxes, ExternalLink, FileScan, FileText, HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { getCategoryLabel } from "../mappers"
import type { ArtifactCategory, ForensicArtifactDefinitionItem } from "../types"
import { EmptyState, RiskBadge } from "./shared"

interface Props {
  artifacts: ForensicArtifactDefinitionItem[]
  loading: boolean
  onOpenArtifactConfig: () => void
}

const categoryIcon: Partial<Record<ArtifactCategory, React.ComponentType<{ className?: string }>>> =
  {
    file: FileText,
    registry: HardDrive,
    eventlog: FileScan,
    other: Boxes,
  }

const preferredCategoryOrder = ["file", "registry", "eventlog", "forensic", "ntfs", "application", "other"]

function getCategoryIcon(category: ArtifactCategory) {
  return categoryIcon[category] ?? Boxes
}

export function ForensicArtifactCapabilityPanel({
  artifacts,
  loading,
  onOpenArtifactConfig,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<ArtifactCategory, ForensicArtifactDefinitionItem[]>()
    for (const a of artifacts.filter((x) => x.enabled)) {
      const list = map.get(a.category) ?? []
      list.push(a)
      map.set(a.category, list)
    }
    return map
  }, [artifacts])

  const enabledCount = artifacts.filter((a) => a.enabled).length

  const orderedCategories = useMemo(() => {
    const keys = Array.from(grouped.keys())
    return keys.sort((a, b) => {
      const ai = preferredCategoryOrder.indexOf(a)
      const bi = preferredCategoryOrder.indexOf(b)
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      }
      return a.localeCompare(b)
    })
  }, [grouped])

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="size-4 text-primary" />
            工件能力
            <span className="text-sm font-normal text-muted-foreground">
              已启用 {enabledCount}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onOpenArtifactConfig}
          >
            工件配置
            <ExternalLink />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))
        ) : enabledCount === 0 ? (
          <EmptyState
            icon={Boxes}
            title="没有已启用的工件"
            description="请检查 conf/forensic/artifacts.yaml 和工件目录配置。"
          />
        ) : (
          orderedCategories.map((cat) => {
              const Icon = getCategoryIcon(cat)
              const list = grouped.get(cat)!
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Icon className="size-3.5" />
                    {getCategoryLabel(cat)}
                    <span className="text-muted-foreground/70">
                      ({list.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {list.map((a) => (
                      <div
                        key={a.artifact_key}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.name}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">
                            {a.artifact_key}
                            {a.version ? ` · v${a.version}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[11px] uppercase text-muted-foreground">
                            {a.platform}
                          </span>
                          <RiskBadge level={a.risk_level} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
        )}
      </CardContent>
    </Card>
  )
}

