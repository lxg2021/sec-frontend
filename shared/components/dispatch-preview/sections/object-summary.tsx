"use client"

import { FileText, GitBranch, Hash, Layers, Settings, type LucideIcon } from "lucide-react"

import { Badge } from "@/shared/ui/badge"

import type { DispatchObject } from "../types"

interface ObjectSummaryProps {
  object: DispatchObject
}

const typeMap: Record<string, string> = {
  baseline: "基线",
  patch: "补丁策略",
  scan: "扫描任务",
  config: "配置策略",
}

const modeMap: Record<string, string> = {
  create: "新增下发",
  override: "覆盖已有配置",
  rerun: "重新执行",
}

const sourceMap: Record<string, string> = {
  template: "模板",
  custom: "自定义",
}

function MetaItem({
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  icon: LucideIcon
  iconClassName: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 shrink-0 ${iconClassName}`} />
        <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
        <span className="ml-auto min-w-0 truncate text-sm text-foreground" title={value}>
          {value}
        </span>
      </div>
    </div>
  )
}

export function ObjectSummary({ object }: ObjectSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="size-4 text-blue-500" />
        <span>下发对象</span>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="truncate text-base font-medium text-foreground">{object.name}</div>
                {object.description ? (
                  <p className="min-w-0 truncate text-sm text-muted-foreground">{object.description}</p>
                ) : null}
              </div>
              <Badge variant="secondary" className="shrink-0">
                {typeMap[object.type] ?? object.type}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {object.id ? (
              <MetaItem
                icon={Hash}
                iconClassName="text-slate-500"
                label="对象 ID"
                value={object.id}
              />
            ) : null}

            {object.version ? (
              <MetaItem
                icon={GitBranch}
                iconClassName="text-emerald-600"
                label="版本"
                value={object.version}
              />
            ) : null}

            {object.sourceType ? (
              <MetaItem
                icon={Layers}
                iconClassName="text-violet-600"
                label="来源"
                value={sourceMap[object.sourceType] ?? object.sourceType}
              />
            ) : null}

            {object.mode ? (
              <MetaItem
                icon={Settings}
                iconClassName="text-amber-600"
                label="下发方式"
                value={modeMap[object.mode] ?? object.mode}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
