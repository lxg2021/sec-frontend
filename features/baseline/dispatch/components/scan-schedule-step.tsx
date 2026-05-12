"use client"

import { ArrowRight, CalendarClock, ChevronLeft } from "lucide-react"

import { ScanScheduleForm, type ScanSchedule } from "@/shared/components/scan-schedule"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

interface ScanScheduleStepProps {
  canCreatePolicy: boolean
  creating: boolean
  onBack: () => void
  onCreatePolicy: () => void
  onNameChange: (value: string) => void
  onScheduleChange: (value: ScanSchedule) => void
  onVersionChange: (value: string) => void
  policyName: string
  schedule: ScanSchedule
  version: string
}

export function ScanScheduleStep({
  canCreatePolicy,
  creating,
  onBack,
  onCreatePolicy,
  onNameChange,
  onScheduleChange,
  onVersionChange,
  policyName,
  schedule,
  version,
}: ScanScheduleStepProps) {
  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <CalendarClock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">任务计划</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              填写策略名称、版本，并配置扫描周期与重试策略。
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Label htmlFor="policy-name" className="shrink-0 sm:w-24">
                策略名称 *
              </Label>
              <Input
                id="policy-name"
                value={policyName}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="例如：Windows 基线巡检策略"
                className="flex-1"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Label htmlFor="policy-version" className="shrink-0 sm:w-20">
                版本号 *
              </Label>
              <Input
                id="policy-version"
                value={version}
                onChange={(event) => onVersionChange(event.target.value)}
                placeholder="例如：1.0.0"
                className="flex-1"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <ScanScheduleForm
            value={schedule}
            onChange={onScheduleChange}
            title="调度计划配置"
            description={null}
            className="max-w-none border-0 shadow-none [&_[class*='text-2xl']]:text-base"
          />
        </section>

        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">
            {canCreatePolicy ? "策略信息已完整，可创建策略对象。" : "请先填写策略名称和版本号。"}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="h-11 px-5">
              <ChevronLeft className="mr-2 h-4 w-4" />
              返回基线选择
            </Button>
            <Button
              onClick={onCreatePolicy}
              disabled={!canCreatePolicy || creating}
              className="h-11 px-6"
            >
              {creating ? "创建中..." : "创建策略并继续"}
              {!creating ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
