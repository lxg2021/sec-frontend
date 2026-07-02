"use client"

import { ExternalLink, RefreshCw, RotateCw, ScanSearch } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { formatUnixTime } from "../mappers"
import type { ForensicContext } from "../types"

interface Props {
  ctx: ForensicContext
  lastRefreshAt: number | null
  syncing: boolean
  refreshing: boolean
  onRefresh: () => void
  onSync: () => Promise<{ synced_count: number }>
  onOpenTaskCenter: () => void
}

export function ForensicOverviewToolbar({
  ctx,
  lastRefreshAt,
  syncing,
  refreshing,
  onRefresh,
  onSync,
  onOpenTaskCenter,
}: Props) {
  const contextChips: { label: string; value: string }[] = []
  if (ctx.case_id) contextChips.push({ label: "案件", value: ctx.case_id })
  if (ctx.workflow_id)
    contextChips.push({ label: "工作流", value: ctx.workflow_id })
  if (ctx.workflow_action_id)
    contextChips.push({ label: "动作", value: ctx.workflow_action_id })
  if (ctx.agent_id) contextChips.push({ label: "Agent", value: ctx.agent_id })

  const handleSync = async () => {
    try {
      const res = await onSync()
      if (res.synced_count > 0) {
        toast.success(`同步完成，共 ${res.synced_count} 个终端`)
      } else {
        toast.warning("没有同步到任何终端", {
          description: "请确认 Velociraptor 客户端是否已上线。",
        })
      }
    } catch (e) {
      const msg = (e as Error).message || ""
      toast.error("同步终端失败", {
        description: msg.includes("disabled")
          ? "后端未启用 Velociraptor 同步（forensic dispatch disabled）。"
          : msg || "接口不可用或后端异常。",
      })
    }
  }

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ScanSearch className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              取证概览
            </h1>
            <p className="text-sm text-muted-foreground">
              远程取证工作台 · 最近刷新 {formatUnixTime(lastRefreshAt ?? undefined)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={refreshing ? "animate-spin" : undefined}
            />
            刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RotateCw className={syncing ? "animate-spin" : undefined} />
            同步终端
          </Button>
          <Button size="sm" onClick={onOpenTaskCenter}>
            任务中心
            <ExternalLink />
          </Button>
        </div>
      </div>

      {contextChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">当前上下文：</span>
          {contextChips.map((c) => (
            <Badge
              key={c.label}
              variant="secondary"
              className="gap-1 font-normal"
            >
              <span className="text-muted-foreground">{c.label}</span>
              <span className="font-mono">{c.value}</span>
            </Badge>
          ))}
        </div>
      ) : null}
    </header>
  )
}

