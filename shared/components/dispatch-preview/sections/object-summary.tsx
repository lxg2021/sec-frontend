"use client"

import {
  FileText,
  GitBranch,
  Hash,
  Layers,
  Tag,
  type LucideIcon,
} from "lucide-react"

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

function SummaryRow({
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
    <div className="flex items-center gap-3 border-b border-border/70 py-4 last:border-b-0">
      <Icon className={`size-4 shrink-0 ${iconClassName}`} />
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={value}>
        {value}
      </span>
    </div>
  )
}

export function ObjectSummary({ object }: ObjectSummaryProps) {
  const rows = [
    {
      icon: FileText,
      iconClassName: "text-blue-500",
      label: "任务名称",
      value: object.name,
    },
    object.description
      ? {
          icon: Tag,
          iconClassName: "text-amber-600",
          label: "目标基线",
          value: object.description,
        }
      : null,
    object.id
      ? {
          icon: Hash,
          iconClassName: "text-slate-500",
          label: "对象 ID",
          value: object.id,
        }
      : null,
    object.version
      ? {
          icon: GitBranch,
          iconClassName: "text-emerald-600",
          label: "版本",
          value: object.version,
        }
      : null,
    {
      icon: Layers,
      iconClassName: "text-violet-600",
      label: "类型",
      value: typeMap[object.type] ?? object.type,
    },
    object.sourceType
      ? {
          icon: Layers,
          iconClassName: "text-violet-500",
          label: "来源",
          value: sourceMap[object.sourceType] ?? object.sourceType,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: LucideIcon
    iconClassName: string
    label: string
    value: string
  }>

  const columnCount = 3
  const rowsPerColumn = Math.ceil(rows.length / columnCount)
  const columns = Array.from({ length: columnCount }, (_, index) =>
    rows.slice(index * rowsPerColumn, (index + 1) * rowsPerColumn),
  ).filter((column) => column.length > 0)

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="size-4 text-blue-500" />
        <span>下发对象</span>
      </div>

      <div className="rounded-xl border bg-card p-4">
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
    </section>
  )
}
