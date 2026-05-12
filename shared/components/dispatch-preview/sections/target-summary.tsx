"use client"

import { useState, type LucideIcon } from "react"
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Monitor,
  Server,
  Users,
  WifiOff,
} from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"

import type { DispatchGroup, DispatchTarget } from "../types"

interface TargetSummaryProps {
  target: DispatchTarget
  sampleSize?: number
}

interface SummaryRowProps {
  icon: LucideIcon
  iconClassName: string
  label: string
  value: string
}

function SummaryRow({
  icon: Icon,
  iconClassName,
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border/70 py-4 last:border-b-0">
      <Icon className={`size-4 shrink-0 ${iconClassName}`} />
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{value}</span>
    </div>
  )
}

function GroupDetail({
  group,
  sampleSize,
}: {
  group: DispatchGroup
  sampleSize: number
}) {
  const [showAll, setShowAll] = useState(false)
  const hosts = group.hosts || []
  const displayHosts = showAll ? hosts : hosts.slice(0, sampleSize)
  const hasMore = hosts.length > sampleSize

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <FolderOpen className="size-4 shrink-0 text-amber-600" />
          <span className="truncate text-sm font-medium">{group.name}</span>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {group.hostCount} 台主机
        </Badge>
      </div>

      {hosts.length > 0 ? (
        <div className="space-y-1">
          {displayHosts.map((host) => (
            <div
              key={host.agentId}
              className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2 py-1.5 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Monitor className="size-3.5 shrink-0 text-sky-600" />
                <span className="truncate">{host.hostname}</span>
                {host.ip ? (
                  <span className="shrink-0 text-xs text-muted-foreground">({host.ip})</span>
                ) : null}
              </div>
              {host.valid === false ? (
                <Badge variant="destructive" className="shrink-0 text-xs">
                  不可下发
                </Badge>
              ) : null}
            </div>
          ))}

          {hasMore && !showAll ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowAll(true)}
            >
              查看更多（剩余 {hosts.length - sampleSize} 台）
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function TargetSummary({ target, sampleSize = 5 }: TargetSummaryProps) {
  const [expanded, setExpanded] = useState(false)
  const hasWarnings =
    (target.offlineHostCount ?? 0) > 0 ||
    (target.invalidHostCount ?? 0) > 0 ||
    (target.ungroupedHostCount ?? 0) > 0
  const rows = [
    {
      icon: Users,
      iconClassName: "text-violet-600",
      label: "逻辑组",
      value: `${target.groupCount} 组`,
    },
    {
      icon: Monitor,
      iconClassName: "text-sky-600",
      label: "去重主机数",
      value: `${target.deduplicatedHostCount} 台`,
    },
    {
      icon: Server,
      iconClassName: "text-slate-600",
      label: "原始目标数",
      value: `${target.hostCount} 台`,
    },
    {
      icon: AlertCircle,
      iconClassName: "text-rose-600",
      label: "不可下发",
      value: `${target.invalidHostCount ?? 0} 台`,
    },
    {
      icon: WifiOff,
      iconClassName: "text-amber-600",
      label: "离线主机",
      value: `${target.offlineHostCount ?? 0} 台`,
    },
    {
      icon: FolderOpen,
      iconClassName: "text-amber-600",
      label: "未分组",
      value: `${target.ungroupedHostCount ?? 0} 台`,
    },
  ]
  const midpoint = Math.ceil(rows.length / 2)
  const leftRows = rows.slice(0, midpoint)
  const rightRows = rows.slice(midpoint)

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Server className="size-4 text-slate-500" />
        <span>目标范围</span>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="space-y-4 p-4">
          <div className="grid gap-x-10 xl:grid-cols-2">
            <div>
              {leftRows.map((row) => (
                <SummaryRow key={row.label} {...row} />
              ))}
            </div>
            <div>
              {rightRows.map((row) => (
                <SummaryRow key={row.label} {...row} />
              ))}
            </div>
          </div>

          {hasWarnings ? (
            <div className="flex flex-wrap gap-2 border-t pt-2">
              {(target.offlineHostCount ?? 0) > 0 ? (
                <div className="flex items-center gap-1.5 text-sm text-amber-600">
                  <WifiOff className="size-3.5" />
                  <span>离线 {target.offlineHostCount} 台</span>
                </div>
              ) : null}
              {(target.invalidHostCount ?? 0) > 0 ? (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="size-3.5" />
                  <span>不可下发 {target.invalidHostCount} 台</span>
                </div>
              ) : null}
              {(target.ungroupedHostCount ?? 0) > 0 ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FolderOpen className="size-3.5" />
                  <span>未分组 {target.ungroupedHostCount} 台</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {target.groups && target.groups.length > 0 ? (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-full justify-between rounded-none border-t px-4"
              >
                <span className="text-sm font-normal">
                  {expanded ? "收起目标明细" : "展开目标明细"}
                </span>
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y border-t">
                {target.groups.map((group) => (
                  <GroupDetail key={group.id} group={group} sampleSize={sampleSize} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>
    </section>
  )
}
