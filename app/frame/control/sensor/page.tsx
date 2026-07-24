"use client"

import { useState } from "react"
import {
  Boxes,
  CheckCircle2,
  Layers3,
  ListChecks,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"

import { BaselineScanPolicyDialog } from "@/features/baseline/policy/baseline-scan-policy-dialog"
import { GeneralConfigDialog } from "@/features/general-config/general-config-dialog"
import { ConfigTable } from "@/features/sensor-config/config-table"
import { defaultConfigCategory } from "@/features/sensor-config/data/default-config-category"
import {
  countConfigItems,
  countEnabledConfigItems,
} from "@/features/sensor-config/sensor-config-editor"
import { SensorConfigDialog } from "@/features/sensor-config/sensor-config-dialog"
import type { ConfigCategory } from "@/features/sensor-config/types/config-item"
import { PatchScanPolicyDialog } from "@/features/vulnerability/policy/patch-scan-policy-dialog"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Toaster } from "@/shared/ui/toaster"

export default function ConfigManagementPage() {
  const [categories, setCategories] = useState<ConfigCategory[]>(defaultConfigCategory)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showEditorDialog, setShowEditorDialog] = useState(false)
  const [showPatchPolicyDialog, setShowPatchPolicyDialog] = useState(false)
  const [showBaselinePolicyDialog, setShowBaselinePolicyDialog] = useState(false)
  const [showGeneralConfigDialog, setShowGeneralConfigDialog] = useState(true)

  const totalItems = countConfigItems(categories)
  const enabledItems = countEnabledConfigItems(categories)

  const handleConfigSaved = () => {
    setRefreshTrigger((current) => current + 1)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="space-y-6 p-4 sm:p-6">
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl text-slate-900">传感器配置</CardTitle>
                    <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                      Agent 内置
                    </Badge>
                  </div>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    通过大型编辑器调整事件采集开关并创建新版本。保存配置与选择主机下发相互独立，不会直接覆盖 Agent 内置版本。
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  variant="outline"
                  className="h-10 shrink-0 rounded-full border-cyan-200 bg-white px-5 text-cyan-800 hover:bg-cyan-50 hover:text-cyan-900"
                  onClick={() => setShowBaselinePolicyDialog(true)}
                >
                  <ListChecks className="h-4 w-4" />
                  基线扫描策略
                </Button>
                <Button
                  variant="outline"
                  className="h-10 shrink-0 rounded-full border-cyan-200 bg-white px-5 text-cyan-800 hover:bg-cyan-50 hover:text-cyan-900"
                  onClick={() => setShowPatchPolicyDialog(true)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  漏洞扫描策略
                </Button>
                <Button
                  variant="outline"
                  className="h-10 shrink-0 rounded-full border-cyan-200 bg-white px-5 text-cyan-800 hover:bg-cyan-50 hover:text-cyan-900"
                  onClick={() => setShowGeneralConfigDialog(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  通用配置
                </Button>
                <Button
                  className="h-10 shrink-0 rounded-full bg-cyan-700 px-5 hover:bg-cyan-800"
                  onClick={() => setShowEditorDialog(true)}
                >
                  <Settings2 className="h-4 w-4" />
                  传感器配置
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 bg-white p-5 sm:grid-cols-3 sm:p-6">
            <SummaryCard icon={<Layers3 className="h-4 w-4" />} label="配置分类" value={`${categories.length} 类`} tone="blue" />
            <SummaryCard icon={<Boxes className="h-4 w-4" />} label="配置项目" value={`${totalItems} 项`} tone="violet" />
            <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="当前启用" value={`${enabledItems} 项`} tone="emerald" />
          </CardContent>
        </Card>

        <ConfigTable refreshTrigger={refreshTrigger} />
      </div>

      <SensorConfigDialog
        open={showEditorDialog}
        onOpenChange={setShowEditorDialog}
        categories={categories}
        onConfigChange={setCategories}
        onConfigSaved={handleConfigSaved}
      />

      <PatchScanPolicyDialog
        open={showPatchPolicyDialog}
        onOpenChange={setShowPatchPolicyDialog}
      />

      <BaselineScanPolicyDialog
        open={showBaselinePolicyDialog}
        onOpenChange={setShowBaselinePolicyDialog}
      />

      <GeneralConfigDialog
        open={showGeneralConfigDialog}
        onOpenChange={setShowGeneralConfigDialog}
        onUpdated={handleConfigSaved}
      />

      <Toaster />
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "blue" | "violet" | "emerald"
}) {
  const toneClass = {
    blue: "text-blue-600",
    violet: "text-violet-600",
    emerald: "text-emerald-600",
  }[tone]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ${toneClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
