"use client"

import { Fingerprint, RotateCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  evidenceEndpointLabel,
  evidencePrimaryLabel,
  evidenceTypeLabel,
  formatBytes,
  formatUnixTime,
} from "../mappers"
import type { ForensicEndpointItem, ForensicEvidenceItem } from "../types"
import { CopyButton, EmptyState, MonoText } from "./shared"

interface Props {
  evidence: ForensicEvidenceItem[]
  endpoints: ForensicEndpointItem[]
  loading: boolean
  onRefresh: () => void
}

export function ForensicRecentEvidencePanel({
  evidence,
  endpoints,
  loading,
  onRefresh,
}: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="size-4 text-primary" aria-hidden="true" />
            最近证据
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <RotateCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))
        ) : evidence.length === 0 ? (
          <EmptyState
            icon={Fingerprint}
            title="暂无证据"
            description="任务完成后采集到的证据文件将显示在此处。"
          />
        ) : (
          evidence.map((item) => (
            <div
              key={item.artifact_id}
              className="rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {evidencePrimaryLabel(item)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                      {evidenceTypeLabel(item.artifact_type)}
                    </span>
                    <span>{formatBytes(item.size)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatUnixTime(item.created_at)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{evidenceEndpointLabel(item, endpoints)}</span>
                  </div>
                  {item.source_path ? (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span className="shrink-0">路径</span>
                      <MonoText value={item.source_path} className="truncate" />
                    </div>
                  ) : null}
                  {item.sha256 ? (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span className="shrink-0">SHA256</span>
                      <MonoText value={item.sha256} truncate />
                      <CopyButton value={item.sha256} label="已复制哈希" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

