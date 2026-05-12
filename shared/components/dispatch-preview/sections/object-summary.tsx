"use client"

import {
  FileText,
  GitBranch,
  Hash,
  Layers,
  Settings,
} from "lucide-react"

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

export function ObjectSummary({ object }: ObjectSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="size-4" />
        <span>下发对象</span>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-base font-medium text-foreground">
                {object.name}
              </h4>
              {object.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {object.description}
                </p>
              ) : null}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {typeMap[object.type] ?? object.type}
            </Badge>
          </div>

          <div className="grid gap-x-6 gap-y-2 border-t pt-3 text-sm sm:grid-cols-2">
            {object.id ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="size-3.5 shrink-0" />
                <span className="truncate">{object.id}</span>
              </div>
            ) : null}

            {object.version ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <GitBranch className="size-3.5 shrink-0" />
                <span>版本 {object.version}</span>
              </div>
            ) : null}

            {object.sourceType ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="size-3.5 shrink-0" />
                <span>{sourceMap[object.sourceType] ?? object.sourceType}</span>
              </div>
            ) : null}

            {object.mode ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Settings className="size-3.5 shrink-0" />
                <span>{modeMap[object.mode] ?? object.mode}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
