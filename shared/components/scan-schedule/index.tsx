"use client"

import * as React from "react"
import {
  Calendar,
  Clock,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Timer,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Slider } from "@/shared/ui/slider"
import { Switch } from "@/shared/ui/switch"

import {
  MAX_INTERVAL_HOURS,
  MAX_RANDOM_DELAY_MINUTES,
  sanitizeScanSchedule,
} from "./defaults"
import type { ScanScheduleFormField, ScanScheduleFormProps } from "./types"

export {
  DEFAULT_SCAN_SCHEDULE,
  MAX_INTERVAL_HOURS,
  MAX_RANDOM_DELAY_MINUTES,
  mergeScanScheduleDefaults,
  sanitizeScanSchedule,
} from "./defaults"
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
  intervalLabel: "执行间隔",
  intervalValue: (hours: number) => `${hours} 小时`,
  fixedTimeLabel: "固定执行时间",
  randomDelayLabel: "随机延迟",
  randomDelayValue: (minutes: number) => `${minutes} 分钟`,
  retryCountLabel: "重试次数",
  retryIntervalLabel: "重试间隔",
  retryNone: "不重试",
  retryTimes: (count: number) => `${count} 次`,
  minutesUnit: "分钟",
  startupTitle: "Agent 启动时执行",
  startupDescription: "启动后立即补跑一次扫描任务",
  startupInlineLabel: "启动时扫描",
}

function FieldShell({
  label,
  icon,
  children,
}: {
  label: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  )
}

function TextInputField({
  field,
  disabled,
}: {
  field: ScanScheduleFormField
  disabled: boolean
}) {
  const hasError = Boolean(field.error)
  const errorId = hasError ? `${field.id}-error` : undefined

  return (
    <FieldShell label={field.label} icon={field.icon}>
      <div className="space-y-1.5">
        <Input
          id={field.id}
          value={field.value}
          onChange={(event) => field.onChange?.(event.target.value)}
          placeholder={field.placeholder}
          readOnly={field.readOnly ?? !field.onChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={errorId}
          className={cn(
            "h-9 w-full",
            hasError && "border-rose-400 focus-visible:ring-rose-500/30",
            field.inputClassName,
          )}
        />
        {hasError ? (
          <p id={errorId} className="text-xs text-rose-500">
            {field.error}
          </p>
        ) : null}
      </div>
    </FieldShell>
  )
}

export function ScanScheduleForm({
  value,
  onChange,
  title = "调度计划配置",
  description = "配置任务执行周期、随机延迟与重试策略。",
  action,
  className,
  disabled = false,
  fields,
  showStartup = true,
  text,
}: ScanScheduleFormProps) {
  const schedule = sanitizeScanSchedule(value)
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

  const policyNameField = fields?.[0]
  const policyVersionField = fields?.[1]
  const intervalHours = schedule.interval_hours ?? 24
  const randomDelayMinutes = schedule.random_delay_minutes ?? 0
  const retryLimit = schedule.retry_limit ?? 3
  const retryIntervalMinutes = schedule.retry_interval_minutes ?? 5

  return (
    <Card className={cn("mx-auto w-full max-w-4xl border border-border/50 shadow-sm", className)}>
      {mergedText.title || mergedText.description ? (
        <CardHeader className="pb-4">
          {mergedText.title ? (
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Plus className="h-5 w-5 text-sky-600" />
              {mergedText.title}
            </CardTitle>
          ) : null}
          {mergedText.description ? <CardDescription>{mergedText.description}</CardDescription> : null}
        </CardHeader>
      ) : null}

      <CardContent className="space-y-6">
        <div
          className={cn(
            "grid grid-cols-1 gap-4 md:grid-cols-2",
            fields?.length ? "xl:grid-cols-4" : "xl:grid-cols-2",
          )}
        >
          {policyNameField ? <TextInputField field={policyNameField} disabled={disabled} /> : null}
          {policyVersionField ? <TextInputField field={policyVersionField} disabled={disabled} /> : null}

          <FieldShell
            label={mergedText.modeLabel}
            icon={<Clock className="h-3.5 w-3.5 text-cyan-500" />}
          >
            <Select
              value={schedule.mode}
              onValueChange={(mode: "interval") => handleChange({ mode })}
              disabled={disabled}
            >
              <SelectTrigger id="mode" className="h-9 w-full">
                <SelectValue placeholder={mergedText.modePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interval">{mergedText.modeInterval}</SelectItem>
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell
            label={mergedText.fixedTimeLabel}
            icon={<Calendar className="h-3.5 w-3.5 text-blue-500" />}
          >
            <Input
              id="specific_time"
              type="time"
              value={schedule.specific_time ?? ""}
              onChange={(event) =>
                handleChange({ specific_time: event.target.value || undefined })
              }
              disabled={disabled}
              className="h-9 w-full"
            />
          </FieldShell>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="interval_hours"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                {mergedText.intervalLabel}
              </Label>
              <span className="text-sm font-medium tabular-nums">
                {mergedText.intervalValue(intervalHours)}
              </span>
            </div>
            <Slider
              id="interval_hours"
              value={[intervalHours]}
              onValueChange={([nextValue]) => handleChange({ interval_hours: nextValue })}
              min={1}
              max={MAX_INTERVAL_HOURS}
              step={1}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{mergedText.intervalValue(1)}</span>
              <span>{mergedText.intervalValue(MAX_INTERVAL_HOURS)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="random_delay"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
              >
                <Shuffle className="h-3.5 w-3.5 text-violet-500" />
                {mergedText.randomDelayLabel}
              </Label>
              <span className="text-sm font-medium tabular-nums">
                {mergedText.randomDelayValue(randomDelayMinutes)}
              </span>
            </div>
            <Slider
              id="random_delay"
              value={[randomDelayMinutes]}
              onValueChange={([nextValue]) =>
                handleChange({ random_delay_minutes: nextValue })
              }
              min={0}
              max={MAX_RANDOM_DELAY_MINUTES}
              step={5}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{mergedText.randomDelayValue(0)}</span>
              <span>{mergedText.randomDelayValue(MAX_RANDOM_DELAY_MINUTES)}</span>
            </div>
          </div>
        </div>

        <div className={cn("grid gap-4", showStartup ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
          <FieldShell
            label={mergedText.retryCountLabel}
            icon={<RotateCcw className="h-3.5 w-3.5 text-orange-500" />}
          >
            <Select
              value={String(retryLimit)}
              onValueChange={(nextValue) => handleChange({ retry_limit: Number(nextValue) })}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 11 }, (_, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {index === 0 ? mergedText.retryNone : mergedText.retryTimes(index)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell
            label={mergedText.retryIntervalLabel}
            icon={<Timer className="h-3.5 w-3.5 text-rose-500" />}
          >
            <div className="flex h-9">
              <Input
                id="retry_interval"
                type="number"
                min={1}
                value={retryIntervalMinutes}
                onChange={(event) =>
                  handleChange({
                    retry_interval_minutes: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                disabled={disabled || retryLimit === 0}
                className="h-full flex-1 rounded-r-none border-r-0"
              />
              <span className="inline-flex h-full items-center justify-center rounded-r-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {mergedText.minutesUnit}
              </span>
            </div>
          </FieldShell>

          {showStartup ? (
            <FieldShell
              label={mergedText.startupTitle}
              icon={<Play className="h-3.5 w-3.5 text-emerald-500" />}
            >
              <div className="flex h-9 items-center justify-between rounded-md border border-input bg-background px-3">
                <span className="text-sm text-slate-900">{mergedText.startupInlineLabel}</span>
                <Switch
                  id="scan_on_startup"
                  checked={schedule.scan_on_startup}
                  onCheckedChange={(checked) => handleChange({ scan_on_startup: checked })}
                  disabled={disabled}
                />
              </div>
            </FieldShell>
          ) : null}
        </div>

        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
