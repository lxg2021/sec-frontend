"use client"

import type { ReactNode } from "react"
import { Info, LayoutGrid } from "lucide-react"

import type { BaselineTemplate } from "@/features/baseline/custom/api"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface BaselineSelectionStepProps {
  canNext: boolean
  onNext: () => void
  selectedTemplate: BaselineTemplate | null
  selector: ReactNode
}

export function BaselineSelectionStep({
  canNext,
  onNext,
  selectedTemplate,
  selector,
}: BaselineSelectionStepProps) {
  const detailRows = selectedTemplate
    ? [
        { label: "UUID", value: selectedTemplate.uuid },
        { label: "租户 ID", value: selectedTemplate.tenant_id || "-" },
        { label: "基线类型", value: selectedTemplate.baseline_type || "-" },
        { label: "原始文件名", value: selectedTemplate.original_filename || "-" },
        { label: "显示名称", value: selectedTemplate.display_name || "-" },
        { label: "标准", value: selectedTemplate.standard || "-" },
        { label: "产品", value: selectedTemplate.product || "-" },
        { label: "OS 版本", value: selectedTemplate.os_version || "-" },
        { label: "基线版本", value: selectedTemplate.baseline_version || "-" },
        { label: "画像", value: selectedTemplate.profile || "-" },
        { label: "检查项数量", value: String(selectedTemplate.item_count ?? 0) },
        { label: "低风险数量", value: String(selectedTemplate.low_count ?? 0) },
        { label: "中风险数量", value: String(selectedTemplate.medium_count ?? 0) },
        { label: "高风险数量", value: String(selectedTemplate.high_count ?? 0) },
        { label: "创建时间", value: selectedTemplate.created_at || "-" },
        { label: "更新时间", value: selectedTemplate.updated_at || "-" },
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">基线详情</div>
                  <div className="text-xs text-slate-500">当前选中基线的完整信息</div>
                </div>
              </div>

              <dl className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {detailRows.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
                    <dd className="mt-1 break-all text-sm font-medium text-slate-950">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-medium text-slate-500">依赖基线 UUID</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTemplate.based_on_uuids.length > 0 ? (
                    selectedTemplate.based_on_uuids.map((uuid) => (
                      <Badge key={uuid} variant="secondary" className="rounded-full bg-slate-100 px-3 text-slate-700">
                        {uuid}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">无</span>
                  )}
                </div>
              </div>
            </div>
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
