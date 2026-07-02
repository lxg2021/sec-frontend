"use client"

import Link from "next/link"
import { ListChecks, RadioTower, RefreshCw } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { Button, buttonVariants } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import type { ForensicOverviewContext } from "@/shared/lib/forensic/types"

interface Props {
  context: ForensicOverviewContext
  loading?: boolean
  syncing?: boolean
  onRefresh?: () => void
  onSync?: () => void
}

const CONTEXT_LABELS: Record<keyof ForensicOverviewContext, string> = {
  case_id: "案件",
  workflow_id: "工作流",
  workflow_action_id: "工作流动作",
  agent_id: "Agent",
  endpoint_id: "终端",
}

export function ForensicOverviewHeader({
  context,
  loading,
  syncing,
  onRefresh,
  onSync,
}: Props) {
  const contextEntries = (Object.keys(CONTEXT_LABELS) as (keyof ForensicOverviewContext)[])
    .map((key) => ({ key, value: context[key] }))
    .filter((item) => Boolean(item.value))

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">取证概览</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            远程取证能力、任务运行状态和异常情况总览
          </p>
        </div>
        {contextEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {contextEntries.map((item) => (
              <Badge key={item.key} variant="secondary" className="font-normal">
                {CONTEXT_LABELS[item.key]}：{item.value}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          刷新
        </Button>
        <Button variant="outline" size="sm" onClick={onSync} disabled={syncing}>
          <RadioTower className={syncing ? "animate-pulse" : ""} />
          同步终端
        </Button>
        <Link href="/frame/investigation/tasks" className={cn(buttonVariants({ size: "sm" }))}>
          <ListChecks />
          任务中心
        </Link>
      </div>
    </header>
  )
}

