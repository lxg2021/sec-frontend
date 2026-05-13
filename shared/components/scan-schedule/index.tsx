"use client"

import * as React from "react"
import { CalendarClock, Clock, Play, RefreshCw, Shuffle } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Slider } from "@/shared/ui/slider"
import { Switch } from "@/shared/ui/switch"

import { mergeScanScheduleDefaults } from "./defaults"
import type { ScanScheduleFormProps } from "./types"

export { DEFAULT_SCAN_SCHEDULE, mergeScanScheduleDefaults } from "./defaults"
export type {
  ScanSchedule,
  ScanScheduleFormField,
  ScanScheduleFormProps,
  ScanScheduleFormText,
} from "./types"

const defaultText = {
  title: "调度计划配置",
  description: "配置任务执行周期、随机延迟与重试策略。",
  modeLabel: "调度模式",
  modePlaceholder: "选择调度模式",
  modeInterval: "固定间隔",
  intervalLabel: "间隔",
  intervalValue: (hours: number) => `${hours}小时`,
  fixedTimeLabel: "固定执行时间",
  randomDelayLabel: "随机延迟",
  randomDelayValue: (minutes: number) => `${minutes}分钟`,
  retryCountLabel: "重试次数",
  retryIntervalLabel: "重试间隔",
  retryNone: "不重试",
  retryTimes: (count: number) => `${count} 次`,
  minutesUnit: "分钟",
  startupTitle: "Agent 启动时执行扫描",
  startupDescription: "启动后立即补跑一次扫描任务",
}

export function ScanScheduleForm({
  value,
  onChange,
  title = "调度计划配置",
  description = "配置任务执行周期、随机延迟与重试策略。",
  className,
  disabled = false,
  fields,
  showStartup = true,
  text,
}: ScanScheduleFormProps) {
  const schedule = mergeScanScheduleDefaults(value)
  const mergedText = {
    ...defaultText,
    ...text,
    title,
    description,
  }

  const handleChange = React.useCallback(
    (updates: Partial<typeof schedule>) => {
      onChange?.({ ...schedule, ...updates })
    },
    [onChange, schedule],
  )

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      {mergedText.title || mergedText.description ? (
        <CardHeader className="pb-3">
          {mergedText.title ? (
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-sky-600" />
              {mergedText.title}
            </CardTitle>
          ) : null}
          {mergedText.description ? <CardDescription>{mergedText.description}</CardDescription> : null}
        </CardHeader>
      ) : null}

      <CardContent className="space-y-4">
        {fields?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center gap-2">
                  {field.icon}
                  {field.label}
                </Label>
                <div className="flex h-12 items-center">
                  <Input
                    id={field.id}
                    value={field.value}
                    onChange={(event) => field.onChange?.(event.target.value)}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly ?? !field.onChange}
                    disabled={disabled}
                    className={cn("h-9", field.inputClassName)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <div className="space-y-2">
            <Label htmlFor="mode" className="flex items-center gap-2">
              <Clock className="size-3.5 text-sky-600" />
              {mergedText.modeLabel}
            </Label>
            <div className="flex h-12 items-center">
              <Select
                value={schedule.mode}
                onValueChange={(mode: "interval") => handleChange({ mode })}
                disabled={disabled}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder={mergedText.modePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interval">{mergedText.modeInterval}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="interval_hours" className="flex items-center gap-2">
                <RefreshCw className="size-3.5 text-amber-600" />
                {mergedText.intervalLabel}
              </Label>
              <span className="text-xs font-medium text-muted-foreground">
                {mergedText.intervalValue(schedule.interval_hours ?? 24)}
              </span>
            </div>
            <div className="flex h-12 items-center">
              <Slider
                id="interval_hours"
                min={1}
                max={168}
                step={1}
                value={[schedule.interval_hours ?? 24]}
                onValueChange={([val]) => handleChange({ interval_hours: val })}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <div className="space-y-2">
            <Label htmlFor="specific_time" className="flex items-center gap-2">
              <CalendarClock className="size-3.5 text-blue-600" />
              {mergedText.fixedTimeLabel}
            </Label>
            <div className="flex h-12 items-center">
              <Input
                id="specific_time"
                type="time"
                value={schedule.specific_time ?? ""}
                onChange={(event) =>
                  handleChange({ specific_time: event.target.value || undefined })
                }
                disabled={disabled}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="random_delay" className="flex items-center gap-1">
                <Shuffle className="size-3.5 text-violet-600" />
                {mergedText.randomDelayLabel}
              </Label>
              <span className="text-xs text-muted-foreground">
                {mergedText.randomDelayValue(schedule.random_delay_minutes ?? 0)}
              </span>
            </div>
            <div className="flex h-12 items-center">
              <Slider
                id="random_delay"
                min={0}
                max={120}
                step={5}
                value={[schedule.random_delay_minutes ?? 0]}
                onValueChange={([val]) => handleChange({ random_delay_minutes: val })}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="flex items-end gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex-1 space-y-1">
            <Label className="flex items-center gap-2 font-medium">
              <RefreshCw className="size-3.5 text-amber-600" />
              {mergedText.retryCountLabel}
            </Label>
            <Select
              value={String(schedule.retry_limit ?? 3)}
              onValueChange={(val) => handleChange({ retry_limit: Number(val) })}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {index === 0 ? mergedText.retryNone : mergedText.retryTimes(index)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1">
            <Label className="flex items-center gap-2 font-medium">
              <RefreshCw className="size-3.5 text-amber-600" />
              {mergedText.retryIntervalLabel}
            </Label>
            <div className="flex items-center gap-1">
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
                className="h-8"
              />
              <span className="text-xs text-muted-foreground">{mergedText.minutesUnit}</span>
            </div>
          </div>
        </div>

        {showStartup ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Play className="size-4 text-emerald-600" />
              <div>
                <Label htmlFor="scan_on_startup" className="cursor-pointer text-sm">
                  {mergedText.startupTitle}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {mergedText.startupDescription}
                </p>
              </div>
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
