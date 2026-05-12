"use client"

import { useState } from "react"
import { Clock, Code2 } from "lucide-react"

import { ScanScheduleForm, type ScanSchedule } from "@/shared/components/scan-schedule"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

const initialSchedule: ScanSchedule = {
  mode: "interval",
  interval_hours: 24,
  random_delay_minutes: 10,
  retry_limit: 3,
  retry_interval_minutes: 5,
  scan_on_startup: false,
}

export default function ScanSchedulePreviewPage() {
  const [schedule, setSchedule] = useState<ScanSchedule>(initialSchedule)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">调度计划预览页</h1>
            <p className="mt-1 text-sm text-slate-500">用于查看 `ScanScheduleForm` 的实际显示效果和交互。</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <ScanScheduleForm value={schedule} onChange={setSchedule} />
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code2 className="h-5 w-5" />
                当前值
              </CardTitle>
              <CardDescription>组件双向绑定后的实时数据</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-6 text-slate-100">
                {JSON.stringify(schedule, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
