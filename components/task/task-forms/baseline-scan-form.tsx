"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import HostSelector from "@/components/hosts/HostSelector"
import { mockData } from "@/data/mockData"
import { type BaselineScanTask, createBaselineScanTask, type BaselinePolicyType } from "@/lib/task/baseline-scan-task"
import type { PeriodUnit } from "@/lib/task/task-base"

interface BaselineScanFormProps {
  initialData?: BaselineScanTask
  onSubmit: (task: BaselineScanTask) => void
  onCancel?: () => void
}

const POLICY_OPTIONS: { value: BaselinePolicyType; label: string }[] = [
  { value: "SECURITY_CONFIG", label: "安全配置" },
  { value: "PATCH_COMPLIANCE", label: "补丁合规" },
  { value: "ACCOUNT_POLICY", label: "账号合规" },
  { value: "ATTCK_POLICY", label: "ATTCK预检" },
  { value: "SYSTEM_COMPLIANCE", label: "系统合规" },
  { value: "PREEXECUTION_CHECK", label: "运行预检" },
]

export function BaselineScanForm({ initialData, onSubmit, onCancel }: BaselineScanFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)
  const [targetHosts, setTargetHosts] = useState(initialData?.targetHosts.join("; ") || "")
  const [policies, setPolicies] = useState<BaselinePolicyType[]>(initialData?.policy || [])
  const [periodValue, setPeriodValue] = useState(initialData?.schedule.period.value || 1)
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(initialData?.schedule.period.unit || "days")
  const [timezone, setTimezone] = useState(initialData?.schedule.timezone || "")
  const [isHostSelectorOpen, setIsHostSelectorOpen] = useState(false)

  const handleHostsSelectionChange = useCallback((nodes: any[], selectedIds: Set<string>) => {
    const hostNodes = nodes.filter((node) => node.type === "host")
    const hostIds = hostNodes.map((node) => node.hostId || node.id)
    setTargetHosts(hostIds.join("; "))
    console.log("[v0] 选中的节点:", hostNodes)
    console.log("[v0] 选中的ID集合:", Array.from(selectedIds))
  }, [])

  const togglePolicy = (policy: BaselinePolicyType) => {
    setPolicies((prev) => (prev.includes(policy) ? prev.filter((p) => p !== policy) : [...prev, policy]))
  }

  const toggleSelectAll = () => {
    if (policies.length === POLICY_OPTIONS.length) {
      setPolicies([])
    } else {
      setPolicies(POLICY_OPTIONS.map((opt) => opt.value))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const task = createBaselineScanTask({
      id: initialData?.id || crypto.randomUUID(),
      name,
      enabled,
      targetHosts: targetHosts
        .split(";")
        .map((h) => h.trim())
        .filter(Boolean),
      policy: policies,
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

  const allSelected = policies.length === POLICY_OPTIONS.length
  const someSelected = policies.length > 0 && policies.length < POLICY_OPTIONS.length

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

      <div className="space-y-2">
        <Label htmlFor="targetHosts">目标主机</Label>
        <div className="flex gap-2">
          <Input
            id="targetHosts"
            value={targetHosts}
            onChange={(e) => setTargetHosts(e.target.value)}
            placeholder="输入主机 ID，用分号分隔"
            required
            className="flex-1"
          />
          <Dialog open={isHostSelectorOpen} onOpenChange={setIsHostSelectorOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                选择主机
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>选择目标主机</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto">
                <HostSelector data={mockData} onSelectionChange={handleHostsSelectionChange} />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsHostSelectorOpen(false)}>
                  取消
                </Button>
                <Button type="button" onClick={() => setIsHostSelectorOpen(false)}>
                  确认
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">例如: WEB-001; WEB-002</p>
      </div>

      <div className="space-y-3">
        <Label>基线策略（可多选）</Label>
        <div className="rounded-lg border p-4 space-y-3">
          {/* 全选 */}
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
            />
            <Label htmlFor="select-all" className="font-medium cursor-pointer">
              全选
            </Label>
          </div>

          {/* 策略选项网格，每行3个 */}
          <div className="grid grid-cols-3 gap-2">
            {POLICY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={policies.includes(option.value)}
                  onCheckedChange={() => togglePolicy(option.value)}
                />
                <Label htmlFor={option.value} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* 提示信息 */}
        {policies.length === 0 && (
          <p className="text-sm text-destructive">请至少选择一个基线策略</p>
        )}
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
