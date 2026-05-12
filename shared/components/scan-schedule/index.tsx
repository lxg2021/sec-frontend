"use client"

import * as React from "react"
import { Clock, Play, RefreshCw, Shuffle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Slider } from "@/shared/ui/slider"
import { Switch } from "@/shared/ui/switch"
import { cn } from "@/shared/lib/utils"

import { mergeScanScheduleDefaults } from "./defaults"
import type { ScanScheduleFormProps } from "./types"

export { DEFAULT_SCAN_SCHEDULE, mergeScanScheduleDefaults } from "./defaults"
export type { ScanSchedule, ScanScheduleFormProps } from "./types"

export function ScanScheduleForm({
  value,
  onChange,
  title = "调度计划配置",
  description = "配置任务执行周期、随机延迟与重试策略。",
  className,
  disabled = false,
  showStartup = true,
}: ScanScheduleFormProps) {
  const schedule = mergeScanScheduleDefaults(value)

  const handleChange = React.useCallback(
    (updates: Partial<typeof schedule>) => {
      onChange?.({ ...schedule, ...updates })
    },
    [onChange, schedule],
  )

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mode">调度模式</Label>
          <Select
            value={schedule.mode}
            onValueChange={(mode: "interval") => handleChange({ mode })}
            disabled={disabled}
          >
            <SelectTrigger id="mode" className="w-full">
              <SelectValue placeholder="选择调度模式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interval">固定间隔</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="interval_hours" className="flex items-center gap-2">
              <RefreshCw className="size-4 text-muted-foreground" />
              执行间隔
            </Label>
            <span className="text-sm text-muted-foreground">
              {schedule.interval_hours ?? 24} 小时
            </span>
          </div>
          <Slider
            id="interval_hours"
            min={1}
            max={168}
            step={1}
            value={[schedule.interval_hours ?? 24]}
            onValueChange={([val]) => handleChange({ interval_hours: val })}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 小时</span>
            <span>168 小时（7 天）</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specific_time">固定执行时间（可选）</Label>
          <Input
            id="specific_time"
            type="time"
            value={schedule.specific_time ?? ""}
            onChange={(event) =>
              handleChange({ specific_time: event.target.value || undefined })
            }
            placeholder="选择执行时间"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            设置后，任务会在每日该时间点按间隔策略执行。
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="random_delay" className="flex items-center gap-2">
              <Shuffle className="size-4 text-muted-foreground" />
              随机延迟
            </Label>
            <span className="text-sm text-muted-foreground">
              {schedule.random_delay_minutes ?? 0} 分钟
            </span>
          </div>
          <Slider
            id="random_delay"
            min={0}
            max={120}
            step={5}
            value={[schedule.random_delay_minutes ?? 0]}
            onValueChange={([val]) => handleChange({ random_delay_minutes: val })}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>无延迟</span>
            <span>120 分钟</span>
          </div>
          <p className="text-xs text-muted-foreground">
            为任务增加随机延迟，避免同一时刻触发大量扫描。
          </p>
        </div>

        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <h4 className="text-sm font-medium">重试策略</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retry_limit">最大重试次数</Label>
              <Select
                value={String(schedule.retry_limit ?? 3)}
                onValueChange={(val) => handleChange({ retry_limit: Number(val) })}
                disabled={disabled}
              >
                <SelectTrigger id="retry_limit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {index === 0 ? "不重试" : `${index} 次`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry_interval">重试间隔（分钟）</Label>
              <Input
                id="retry_interval"
                type="number"
                min={1}
                value={schedule.retry_interval_minutes ?? 5}
                onChange={(event) =>
                  handleChange({
                    retry_interval_minutes: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                disabled={disabled || (schedule.retry_limit ?? 0) === 0}
              />
            </div>
          </div>
        </div>

        {showStartup ? (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="scan_on_startup"
                className="flex cursor-pointer items-center gap-2"
              >
                <Play className="size-4 text-muted-foreground" />
                Agent 启动时执行扫描
              </Label>
              <p className="text-xs text-muted-foreground">
                在 Agent 启动后立即补跑一次扫描任务。
              </p>
            </div>
            <Switch
              id="scan_on_startup"
              checked={schedule.scan_on_startup}
              onCheckedChange={(checked) => handleChange({ scan_on_startup: checked })}
              disabled={disabled}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
