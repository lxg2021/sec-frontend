"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { type AttckScanTask, createAttckScanTask } from "@/features/task/models/attck-scan-task"
import type { PeriodUnit } from "@/features/task/models/task-base"
import { useTranslations } from "next-intl"

// 导入 lucide-react 图标
import {
  Scan,
  Calendar,
  Clock,
  Shield,
  Globe,
  Database,
  Save,
  Plus,
  RotateCcw,
  Zap
} from "lucide-react"

interface AttckScanFormProps {
  initialData?: AttckScanTask
  onSubmit: (task: AttckScanTask) => void
  onCancel?: () => void
}

export function AttckScanForm({ initialData, onSubmit, onCancel }: AttckScanFormProps) {
  const t = useTranslations("pages.control.task.forms.attck")
  const [name, setName] = useState(initialData?.name || "")
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)
  const [periodValue, setPeriodValue] = useState(initialData?.schedule.period.value || 1)
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(initialData?.schedule.period.unit || "hours")
  const [timezone, setTimezone] = useState(initialData?.schedule.timezone || "")

  const handleSubmit = useCallback((e: React.FormEvent) => {
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
  }, [name, enabled, periodValue, periodUnit, timezone, initialData, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基础信息卡片 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 mr-2 text-red-500" />
          <h3 className="text-lg font-semibold">{t("basicInfo")}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
                className="w-full pl-9"
              />
              <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center space-x-2 md:col-span-2">
            <Switch 
              id="enabled" 
              checked={enabled} 
              onCheckedChange={setEnabled} 
            />
            <Label htmlFor="enabled" className="text-sm font-medium flex items-center">
              {t("enableTask")}
            </Label>
          </div>
        </div>
      </div>

      {/* 扫描周期卡片 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 mr-2 text-orange-500" />
          <h3 className="text-lg font-semibold">{t("scanCycle")}</h3>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodValue" className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                {t("periodValue")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="periodValue"
                  type="number"
                  min="1"
                  value={periodValue}
                  onChange={(e) => setPeriodValue(Number.parseInt(e.target.value) || 1)}
                  required
                  className="w-full pl-9"
                />
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodUnit" className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                {t("periodUnit")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Select value={periodUnit} onValueChange={(v) => setPeriodUnit(v as PeriodUnit)}>
                  <SelectTrigger id="periodUnit" className="w-full pl-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">{t("unitMinutes")}</SelectItem>
                    <SelectItem value="hours">{t("unitHours")}</SelectItem>
                    <SelectItem value="days">{t("unitDays")}</SelectItem>
                    <SelectItem value="weeks">{t("unitWeeks")}</SelectItem>
                    <SelectItem value="months">{t("unitMonths")}</SelectItem>
                  </SelectContent>
                </Select>
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
              {t("timezone")}
            </Label>
            <div className="relative">
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder={t("timezonePlaceholder")}
                className="w-full pl-9"
              />
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* 数据源信息卡片 */}
      <div className="rounded-lg border bg-blue-50/50 p-4 shadow-sm">
        <div className="flex items-center mb-3">
          <Database className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-semibold">{t("dataSource")}</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2 text-green-500" />
              <div>
                <p className="text-sm font-medium">{t("sourceTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("sourceDescription")}</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
              {t("sourceDefault")}
            </div>
          </div>
          
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="sm:flex-1 max-sm:w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("cancelAction")}
          </Button>
        )}
        <Button
          type="submit"
          className="sm:flex-1 max-sm:w-full"
          disabled={!name.trim()}
        >
          {initialData ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("updateTask")}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {t("createTask")}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
