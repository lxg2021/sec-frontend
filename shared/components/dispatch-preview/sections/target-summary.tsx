"use client"

import { useState } from "react"
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  type LucideIcon,
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
  text?: {
    sectionTitle: string
    group: string
    deduplicatedHosts: string
    originalTargets: string
    invalidHosts: string
    offlineHosts: string
    ungroupedHosts: string
    hostUnit: string
    groupUnit: string
    hostCountBadge: (count: number) => string
    invalidDispatch: string
    viewMore: (count: number) => string
    expandDetails: string
    collapseDetails: string
  }
}
const defaultText = {
  sectionTitle: "目标范围",
  group: "逻辑组",
  deduplicatedHosts: "去重主机数",
  originalTargets: "原始目标数",
  invalidHosts: "不可下发",
  offlineHosts: "离线主机",
  ungroupedHosts: "未分组",
  hostUnit: "台",
  groupUnit: "组",
  hostCountBadge: (count: number) => `${count} 台主机`,
  invalidDispatch: "不可下发",
  viewMore: (count: number) => `查看更多（剩余 ${count} 台）`,
  expandDetails: "展开目标明细",
  collapseDetails: "收起目标明细",
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
  text = defaultText,
}: {
  group: DispatchGroup
  sampleSize: number
  text?: NonNullable<TargetSummaryProps["text"]>
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
          {text.hostCountBadge(group.hostCount)}
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
                  {text.invalidDispatch}
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
              {text.viewMore(hosts.length - sampleSize)}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function TargetSummary({ target, sampleSize = 5, text = defaultText }: TargetSummaryProps) {
  const [expanded, setExpanded] = useState(false)
  const rows = [
    {
      icon: Users,
      iconClassName: "text-violet-600",
      label: text.group,
      value: `${target.groupCount} ${text.groupUnit}`,
    },
    {
      icon: Monitor,
      iconClassName: "text-sky-600",
      label: text.deduplicatedHosts,
      value: `${target.deduplicatedHostCount} ${text.hostUnit}`,
    },
    {
      icon: Server,
      iconClassName: "text-slate-600",
      label: text.originalTargets,
      value: `${target.hostCount} ${text.hostUnit}`,
    },
    {
      icon: AlertCircle,
      iconClassName: "text-rose-600",
      label: text.invalidHosts,
      value: `${target.invalidHostCount ?? 0} ${text.hostUnit}`,
    },
    {
      icon: WifiOff,
      iconClassName: "text-amber-600",
      label: text.offlineHosts,
      value: `${target.offlineHostCount ?? 0} ${text.hostUnit}`,
    },
    {
      icon: FolderOpen,
      iconClassName: "text-amber-600",
      label: text.ungroupedHosts,
      value: `${target.ungroupedHostCount ?? 0} ${text.hostUnit}`,
    },
  ]
  const columnCount = 3
  const rowsPerColumn = Math.ceil(rows.length / columnCount)
  const columns = Array.from({ length: columnCount }, (_, index) =>
    rows.slice(index * rowsPerColumn, (index + 1) * rowsPerColumn),
  ).filter((column) => column.length > 0)

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Server className="size-4 text-slate-500" />
        <span>{text.sectionTitle}</span>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="space-y-4 p-4">
          <div className="grid gap-x-10 xl:grid-cols-3">
            {columns.map((column, index) => (
              <div key={index}>
                {column.map((row) => (
                  <SummaryRow key={row.label} {...row} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {target.groups && target.groups.length > 0 ? (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 w-full justify-start rounded-none border-t px-4 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              >
                <span className="inline-flex items-center gap-2">
                  {expanded ? (
                    <ChevronUp className="size-4 shrink-0" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0" />
                  )}
                  {expanded ? text.collapseDetails : text.expandDetails}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y border-t">
                {target.groups.map((group) => (
                  <GroupDetail key={group.id} group={group} sampleSize={sampleSize} text={text} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>
    </section>
  )
}
