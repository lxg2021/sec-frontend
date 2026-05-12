"use client"

import { Clock3 } from "lucide-react"

import { ScanScheduleForm, type ScanSchedule } from "@/shared/components/scan-schedule"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface ScanScheduleStepProps {
  canCreatePolicy: boolean
  creating: boolean
  onBack: () => void
  onCreatePolicy: () => void
  onScheduleChange: (value: ScanSchedule) => void
  schedule: ScanSchedule
}

export function ScanScheduleStep({
  canCreatePolicy,
  creating,
  onBack,
  onCreatePolicy,
  onScheduleChange,
  schedule,
}: ScanScheduleStepProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-slate-950 via-slate-700 to-blue-500" />
      <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="rounded-xl bg-slate-950 p-2 text-white">
            <Clock3 className="h-4 w-4" />
          </div>
          任务计划
        </CardTitle>
        <CardDescription>
          配置扫描周期与重试策略，然后创建基线扫描策略对象。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <ScanScheduleForm
          value={schedule}
          onChange={onScheduleChange}
          title="调度计划配置"
          description="当前流程仅支持 interval 模式。"
          className="max-w-none border-slate-200 shadow-none"
        />

        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            返回：基线选择
          </Button>
          <Button
            onClick={onCreatePolicy}
            disabled={!canCreatePolicy || creating}
            className="h-11 px-6"
          >
            {creating ? "创建中..." : "创建策略并继续"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
