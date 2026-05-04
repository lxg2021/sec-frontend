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
          <h3 className="text-lg font-semibold">基础信息</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入任务名称"
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
              启用任务
            </Label>
          </div>
        </div>
      </div>

      {/* 扫描周期卡片 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 mr-2 text-orange-500" />
          <h3 className="text-lg font-semibold">扫描周期</h3>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodValue" className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                周期数值 <span className="text-red-500 ml-1">*</span>
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
                周期单位 <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Select value={periodUnit} onValueChange={(v) => setPeriodUnit(v as PeriodUnit)}>
                  <SelectTrigger id="periodUnit" className="w-full pl-9">
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
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
              时区（可选）
            </Label>
            <div className="relative">
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="例如: Asia/Shanghai"
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
          <h3 className="text-lg font-semibold">数据源配置</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2 text-green-500" />
              <div>
                <p className="text-sm font-medium">EDR 事件数据</p>
                <p className="text-xs text-muted-foreground">端点检测与响应系统事件</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
              默认
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
            取消
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
              更新任务
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              创建任务
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
