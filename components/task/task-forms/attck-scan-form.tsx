"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type AttckScanTask, createAttckScanTask } from "@/lib/task/attck-scan-task"
import type { PeriodUnit } from "@/lib/task/task-base"

interface AttckScanFormProps {
  initialData?: AttckScanTask
  onSubmit: (task: AttckScanTask) => void
  onCancel?: () => void
}

export function AttckScanForm({ initialData, onSubmit, onCancel }: AttckScanFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)
  const [periodValue, setPeriodValue] = useState(initialData?.schedule.period.value || 1)
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(initialData?.schedule.period.unit || "hours")
  const [timezone, setTimezone] = useState(initialData?.schedule.timezone || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const task = createAttckScanTask({
      id: initialData?.id || crypto.randomUUID(),
      name,
      enabled,
      schedule: {
        period: { value: periodValue, unit: periodUnit },
        timezone: timezone || undefined,
      },
      status: initialData?.status || "pending",
      createdAt: initialData?.createdAt,
      updatedAt: initialData?.updatedAt,
    })

    onSubmit(task)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">任务名称</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入任务名称" required />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
        <Label htmlFor="enabled">启用任务</Label>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-medium">扫描周期</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="periodValue">周期数值</Label>
            <Input
              id="periodValue"
              type="number"
              min="1"
              value={periodValue}
              onChange={(e) => setPeriodValue(Number.parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodUnit">周期单位</Label>
            <Select value={periodUnit} onValueChange={(v) => setPeriodUnit(v as PeriodUnit)}>
              <SelectTrigger id="periodUnit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">分钟</SelectItem>
                <SelectItem value="hours">小时</SelectItem>
                <SelectItem value="days">天</SelectItem>
                <SelectItem value="weeks">周</SelectItem>
                <SelectItem value="months">月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">时区（可选）</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="例如: Asia/Singapore"
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>数据源:</strong> EDR_EVENTS（默认）
        </p>
        <p className="mt-2 text-sm text-muted-foreground">ATT&CK 扫描任务将定期对 EDR 事件数据进行威胁检测分析</p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {initialData ? "更新任务" : "创建任务"}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            取消
          </Button>
        )}
      </div>
      
    </form>
  )
}
