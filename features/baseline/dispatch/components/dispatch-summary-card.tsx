"use client"

import { CheckCircle2, Clock3, LayoutGrid, Server, Shield } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface DispatchSummaryCardProps {
  createdPolicyName?: string
  currentStep: number
  invalidHostCount: number
  offlineHostCount: number
  policyName: string
  scheduleSummary: string
  selectedBaselineName?: string
  selectedHostCount: number
  stepLabel: string
  version: string
}

export function DispatchSummaryCard({
  createdPolicyName,
  currentStep,
  invalidHostCount,
  offlineHostCount,
  policyName,
  scheduleSummary,
  selectedBaselineName,
  selectedHostCount,
  stepLabel,
  version,
}: DispatchSummaryCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-lg xl:sticky xl:top-6">
      <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-600 to-cyan-400" />
      <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="rounded-xl bg-slate-950 p-2 text-white">
            <Shield className="h-4 w-4" />
          </div>
          策略摘要
        </CardTitle>
        <CardDescription>右侧固定查看当前流程的关键信息。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Shield className="h-4 w-4 text-slate-500" />
            策略信息
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500">策略名称</div>
              <div className="mt-1 text-sm font-medium text-slate-950">
                {policyName || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">版本</div>
              <div className="mt-1">
                <Badge variant="outline">{version || "-"}</Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <LayoutGrid className="h-4 w-4 text-slate-500" />
            基线模板
          </div>
          <div className="text-sm text-slate-950">{selectedBaselineName || "未选择"}</div>
        </section>

        <section className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Clock3 className="h-4 w-4 text-slate-500" />
            扫描计划
          </div>
          <div className="space-y-2 text-sm text-slate-950">
            <div>{scheduleSummary}</div>
            {createdPolicyName ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                已创建策略对象
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Server className="h-4 w-4 text-slate-500" />
            目标主机
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">主机 {selectedHostCount} 台</Badge>
            <Badge variant="outline">离线 {offlineHostCount}</Badge>
            <Badge variant="outline">不可下发 {invalidHostCount}</Badge>
          </div>
        </section>

        <section className="space-y-3 border-t pt-4">
          <div className="text-xs text-slate-500">当前步骤</div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-950">{stepLabel}</div>
            <Badge variant="outline">Step {currentStep}</Badge>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
