"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Hash,
  ImageIcon,
  KeyRound,
  LayoutGrid,
  Monitor,
  Package,
  Ruler,
  Tags,
} from "lucide-react"

import type { BaselineTemplate } from "@/features/baseline/custom/api"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface BaselineSelectionStepProps {
  canNext: boolean
  onNext: () => void
  selectedTemplate: BaselineTemplate | null
  selector: ReactNode
}

interface DetailRow {
  icon: LucideIcon
  label: string
  mono?: boolean
  strong?: boolean
  value: string
}

export function BaselineSelectionStep({
  canNext,
  onNext,
  selectedTemplate,
  selector,
}: BaselineSelectionStepProps) {
  const detailRows: DetailRow[] = selectedTemplate
    ? [
        { icon: KeyRound, label: "UUID", value: selectedTemplate.uuid, mono: true },
        {
          icon: Tags,
          label: "显示名称",
          value: selectedTemplate.display_name || "-",
          strong: true,
        },
        { icon: Building2, label: "租户 ID", value: selectedTemplate.tenant_id || "-" },
        { icon: Ruler, label: "标准", value: selectedTemplate.standard || "-" },
        { icon: Package, label: "基线类型", value: selectedTemplate.baseline_type || "-" },
        { icon: Monitor, label: "产品", value: selectedTemplate.product || "-" },
        {
          icon: FileText,
          label: "原始文件名",
          value: selectedTemplate.original_filename || "-",
          mono: true,
        },
        { icon: Monitor, label: "OS 版本", value: selectedTemplate.os_version || "-" },
        { icon: Tags, label: "基线版本", value: selectedTemplate.baseline_version || "-" },
        { icon: ImageIcon, label: "画像", value: selectedTemplate.profile || "-" },
        {
          icon: Hash,
          label: "检查项数量",
          value: `${selectedTemplate.item_count ?? 0} 项`,
          strong: true,
        },
        { icon: CalendarClock, label: "创建时间", value: selectedTemplate.created_at || "-" },
        { icon: Clock3, label: "更新时间", value: selectedTemplate.updated_at || "-" },
      ]
    : []

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-600 to-cyan-400" />
      <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <LayoutGrid className="h-4 w-4" />
          </div>
          基线选择
        </CardTitle>
        <CardDescription>选择本次下发所依赖的基线模板。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {selector}

        <div className="border-t pt-6">
          {selectedTemplate ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid divide-y divide-slate-200 bg-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="bg-white px-4 py-5 text-center transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    低风险数量
                  </div>
                  <div className="mt-2 text-4xl font-bold leading-none text-emerald-600">
                    {selectedTemplate.low_count ?? 0}
                  </div>
                </div>
                <div className="bg-white px-4 py-5 text-center transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    中风险数量
                  </div>
                  <div className="mt-2 text-4xl font-bold leading-none text-amber-500">
                    {selectedTemplate.medium_count ?? 0}
                  </div>
                </div>
                <div className="bg-white px-4 py-5 text-center transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <Flame className="h-4 w-4 text-red-500" />
                    高风险数量
                  </div>
                  <div className="mt-2 text-4xl font-bold leading-none text-red-600">
                    {selectedTemplate.high_count ?? 0}
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                  {detailRows.map((item) => {
                    const Icon = item.icon

                    return (
                      <div key={item.label} className="flex gap-3 border-b border-slate-100 pb-3">
                        <dt className="flex w-28 shrink-0 items-center gap-2 text-sm font-medium text-slate-500">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </dt>
                        <dd
                          className={[
                            "min-w-0 flex-1 break-all text-sm text-slate-900",
                            item.strong ? "font-semibold" : "font-medium",
                            item.mono
                              ? "rounded-md bg-slate-50 px-2 py-0.5 font-mono text-xs"
                              : "",
                          ].join(" ")}
                        >
                          {item.value}
                        </dd>
                      </div>
                    )
                  })}
                </dl>

              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
              选择一个基线后，这里会显示完整详情。
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={onNext} disabled={!canNext} className="h-11 px-6">
            下一步：任务计划
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
