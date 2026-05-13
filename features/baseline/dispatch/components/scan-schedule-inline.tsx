"use client"

import { useLocale, useTranslations } from "next-intl"
import { Clock, Play, RefreshCw, RotateCcw, Shuffle, Timer } from "lucide-react"

import {
  mergeScanScheduleDefaults,
  type ScanSchedule,
} from "@/shared/components/scan-schedule"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

interface ScanScheduleInlineProps {
  embedded?: boolean
  value?: Partial<ScanSchedule>
  onChange?: (value: ScanSchedule) => void
}

export function ScanScheduleInline({
  embedded = false,
  value,
  onChange,
}: ScanScheduleInlineProps) {
  const t = useTranslations("pages.baseline.dispatch")
  const locale = useLocale()
  const schedule = mergeScanScheduleDefaults(value)
  const isZh = locale.toLowerCase().startsWith("zh")

  const copy = {
    hourUnit: isZh ? "\u5c0f\u65f6" : "h",
    minuteUnit: isZh ? "\u5206" : "min",
    retryCountUnit: isZh ? "\u6b21" : "x",
    modeValue: t("schedule.form.modeInterval"),
    startupLabel: isZh ? "\u542f\u52a8\u626b\u63cf" : "Startup Scan",
  }

  function updateSchedule(updates: Partial<ScanSchedule>) {
    onChange?.({ ...schedule, ...updates })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full overflow-x-auto">
        <div
          className={
            embedded
              ? "flex min-w-max items-center justify-between gap-6 px-0 py-0"
              : "flex min-w-max items-center justify-between gap-6 rounded-lg border bg-card px-4 py-3"
          }
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-cyan-500" />
                <Select
                  value={schedule.mode}
                  onValueChange={(mode: "interval") => updateSchedule({ mode })}
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue placeholder={copy.modeValue} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interval">{copy.modeValue}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("schedule.form.modeLabel")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-500" />
                <Input
                  type="number"
                  min={1}
                  value={schedule.interval_hours ?? ""}
                  onChange={(event) =>
                    updateSchedule({ interval_hours: Number(event.target.value) || undefined })
                  }
                  className="h-8 w-14 text-center"
                  placeholder="24"
                />
                <span className="text-sm text-muted-foreground">{copy.hourUnit}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("schedule.form.intervalLabel")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-emerald-500" />
                <Input
                  type="time"
                  value={schedule.specific_time ?? ""}
                  onChange={(event) =>
                    updateSchedule({ specific_time: event.target.value || undefined })
                  }
                  className="h-8 w-24"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("schedule.form.fixedTimeLabel")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Shuffle className="h-4 w-4 text-amber-500" />
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={schedule.random_delay_minutes ?? ""}
                  onChange={(event) =>
                    updateSchedule({ random_delay_minutes: Number(event.target.value) || undefined })
                  }
                  className="h-8 w-12 text-center"
                  placeholder="30"
                />
                <span className="text-sm text-muted-foreground">{copy.minuteUnit}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("schedule.form.randomDelayLabel")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-rose-500" />
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={schedule.retry_limit ?? ""}
                  onChange={(event) =>
                    updateSchedule({ retry_limit: Number(event.target.value) || undefined })
                  }
                  className="h-8 w-10 text-center"
                  placeholder="3"
                />
                <span className="text-sm text-muted-foreground">{copy.retryCountUnit}</span>
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  min={1}
                  value={schedule.retry_interval_minutes ?? ""}
                  onChange={(event) =>
                    updateSchedule({ retry_interval_minutes: Number(event.target.value) || undefined })
                  }
                  className="h-8 w-12 text-center"
                  placeholder="5"
                />
                <span className="text-sm text-muted-foreground">{copy.minuteUnit}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("schedule.form.retryIntervalLabel")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Play className="h-4 w-4 text-violet-500" />
                <Switch
                  id="scan-on-startup-inline"
                  checked={schedule.scan_on_startup}
                  onCheckedChange={(checked) => updateSchedule({ scan_on_startup: checked })}
                />
                <Label
                  htmlFor="scan-on-startup-inline"
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  {copy.startupLabel}
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("schedule.form.startupDescription")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
