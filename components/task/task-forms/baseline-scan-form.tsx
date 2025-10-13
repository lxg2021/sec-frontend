"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import HostSelector from "@/components/hosts/HostSelector"
import { mockData } from "@/data/mockData"
import { type BaselineScanTask, createBaselineScanTask, type BaselinePolicyType } from "@/lib/task/baseline-scan-task"
import type { PeriodUnit, ScheduleMode } from "@/lib/task/task-base"

// 导入 lucide-react 图标
import {
  Scan,
  Server,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  Globe,
  Save,
  X,
  Plus,
  RotateCcw,
  ListChecks,
  Zap,
  CalendarClock,
  Repeat
} from "lucide-react"

interface BaselineScanFormProps {
  initialData?: BaselineScanTask
  onSubmit: (task: BaselineScanTask) => void
  onCancel?: () => void
}

// 确保这些值与 BaselinePolicyType 完全匹配
const POLICY_OPTIONS: { value: BaselinePolicyType; label: string }[] = [
  { value: "SECURITY_CONFIG", label: "安全配置" },
  { value: "PATCH_COMPLIANCE", label: "补丁合规" },
  { value: "ACCOUNT_POLICY", label: "账号合规" },
  { value: "ATTCK_POLICY", label: "ATTCK预检" },
  { value: "SYSTEM_COMPLIANCE", label: "系统合规" },
  { value: "PREEXECUTION_CHECK", label: "运行预检" },
]

// 验证策略类型的辅助函数
const isValidPolicyType = (value: string): value is BaselinePolicyType => {
  return POLICY_OPTIONS.some(option => option.value === value)
}

export function BaselineScanForm({ initialData, onSubmit, onCancel }: BaselineScanFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true)
  const [targetHosts, setTargetHosts] = useState(initialData?.targetHosts.join("; ") || "")
  const [policies, setPolicies] = useState<BaselinePolicyType[]>([])
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(initialData?.scheduled.mode || "IMMEDIATE")
  const [startTime, setStartTime] = useState(
    initialData?.scheduled.mode === "SCHEDULED" ? initialData.scheduled.startTime : "",
  )
  const [periodValue, setPeriodValue] = useState(
    initialData?.scheduled.mode === "SCHEDULED" ? initialData.scheduled.period.value : 1,
  )
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(
    initialData?.scheduled.mode === "SCHEDULED" ? initialData.scheduled.period.unit : "days",
  )
  const [timezone, setTimezone] = useState(
    initialData?.scheduled.mode === "SCHEDULED" ? initialData.scheduled.timezone || "" : "",
  )
  const [isHostSelectorOpen, setIsHostSelectorOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])

  // 在初始化时验证和过滤策略
  useEffect(() => {
    if (initialData?.policy) {
      const validPolicies = initialData.policy.filter(policy => 
        isValidPolicyType(policy)
      ) as BaselinePolicyType[]
      setPolicies(validPolicies)
      
      // 如果有无效策略，记录警告
      const invalidPolicies = initialData.policy.filter(policy => 
        !isValidPolicyType(policy)
      )
      if (invalidPolicies.length > 0) {
        console.warn('发现无效的策略类型:', invalidPolicies)
      }
    }
  }, [initialData])

  // 使用 useRef 来避免在依赖数组中引起重新渲染
  const policiesRef = useRef(policies)
  policiesRef.current = policies

  // 使用 useCallback 并确保依赖项正确
  const handleHostsSelectionChange = useCallback((nodes: any[], selectedIds: Set<string>) => {
    const hostNodes = nodes.filter((node) => node.type === "host")
    const hostIds = hostNodes.map((node) => node.hostId || node.id)
    setTargetHosts(hostIds.join("; "))
  }, [])

  // 使用函数式更新避免直接依赖 policies
  const togglePolicy = useCallback((policy: BaselinePolicyType) => {
    setPolicies((prev) => (prev.includes(policy) ? prev.filter((p) => p !== policy) : [...prev, policy]))
  }, [])

  // 使用 useCallback 包装全选函数
  const toggleSelectAll = useCallback(() => {
    setPolicies((prev) => (prev.length === POLICY_OPTIONS.length ? [] : POLICY_OPTIONS.map((opt) => opt.value)))
  }, [])

  // 验证表单数据
  const validateForm = useCallback(() => {
    const errors: string[] = []
    
    if (!name.trim()) {
      errors.push("任务名称不能为空")
    }
    
    if (!targetHosts.trim()) {
      errors.push("目标主机不能为空")
    }
    
    if (policies.length === 0) {
      errors.push("请至少选择一个基线策略")
    }
    
    // 验证策略类型
    const invalidPolicies = policies.filter(policy => !isValidPolicyType(policy))
    if (invalidPolicies.length > 0) {
      errors.push(`发现无效的策略类型: ${invalidPolicies.join(", ")}`)
    }
    
    if (scheduleMode === "SCHEDULED") {
      if (!startTime) {
        errors.push("开始时间不能为空")
      }
      if (periodValue < 1) {
        errors.push("周期数值必须大于0")
      }
    }
    
    setFormErrors(errors)
    return errors.length === 0
  }, [name, targetHosts, policies, scheduleMode, startTime, periodValue])

  // 修复：使用 useCallback 包装提交函数
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证表单
    if (!validateForm()) {
      return
    }

    try {
      // 确保只传递有效的策略类型
      const validPolicies = policies.filter(policy => isValidPolicyType(policy))
      
      const task = createBaselineScanTask({
        id: initialData?.id || crypto.randomUUID(),
        name,
        enabled,
        targetHosts: targetHosts
          .split(";")
          .map((h) => h.trim())
          .filter(Boolean),
        policy: validPolicies,
        scheduled:
          scheduleMode === "IMMEDIATE"
            ? { mode: "IMMEDIATE" }
            : {
              mode: "SCHEDULED",
              startTime,
              period: { value: periodValue, unit: periodUnit },
              timezone: timezone || undefined,
            },
        status: initialData?.status || "pending",
        createdAt: initialData?.createdAt,
        updatedAt: initialData?.updatedAt,
      })

      onSubmit(task)
      setFormErrors([])
    } catch (error) {
      console.error('创建任务失败:', error)
      setFormErrors([`创建任务失败: ${error instanceof Error ? error.message : '未知错误'}`])
    }
  }, [name, enabled, targetHosts, policies, scheduleMode, startTime, periodValue, periodUnit, timezone, initialData, onSubmit, validateForm])

  const allSelected = policies.length === POLICY_OPTIONS.length
  const someSelected = policies.length > 0 && policies.length < POLICY_OPTIONS.length

  // 创建独立的策略项组件以避免渲染循环
  const PolicyItem = useCallback(({ option }: { option: typeof POLICY_OPTIONS[0] }) => {
    const isSelected = policies.includes(option.value)
    
    const handleClick = () => {
      togglePolicy(option.value)
    }

    return (
      <div 
        className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors cursor-pointer ${
          isSelected 
            ? "border-primary bg-primary/5" 
            : "hover:bg-accent/50"
        }`}
        onClick={handleClick}
      >
        <Checkbox
          id={option.value}
          checked={isSelected}
          onCheckedChange={() => togglePolicy(option.value)}
          className="flex-shrink-0"
        />
        <Label htmlFor={option.value} className="cursor-pointer flex items-center flex-1">
          {option.label}
        </Label>
      </div>
    )
  }, [policies, togglePolicy])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 错误提示 */}
      {formErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center mb-2">
            <X className="h-5 w-5 text-destructive mr-2" />
            <h3 className="text-lg font-semibold text-destructive">表单验证失败</h3>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {formErrors.map((error, index) => (
              <li key={index} className="text-sm text-destructive">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 基础信息卡片 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <Scan className="h-5 w-5 mr-2 text-blue-500" />
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

      {/* 目标主机卡片 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <Server className="h-5 w-5 mr-2 text-green-500" />
          <h3 className="text-lg font-semibold">扫描目标</h3>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 relative">
              <Input
                id="targetHosts"
                value={targetHosts}
                onChange={(e) => setTargetHosts(e.target.value)}
                placeholder="输入主机 ID，用分号分隔。例如：host-001; host-002"
                required
                className="w-full pl-9"
              />
              <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Dialog open={isHostSelectorOpen} onOpenChange={setIsHostSelectorOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="whitespace-nowrap">
                  <Scan className="mr-2 h-4 w-4" />
                  选择主机
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 mr-2 text-green-500" />
                    <DialogTitle>选择目标主机</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <HostSelector 
                    data={mockData} 
                    onSelectionChange={handleHostsSelectionChange} 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsHostSelectorOpen(false)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setIsHostSelectorOpen(false)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    确认选择
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* 基线策略卡片 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 mr-2 text-purple-500" />
          <h3 className="text-lg font-semibold">基线策略</h3>
        </div>
        
        <div className="space-y-4">
          {/* 全选选项 */}
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
            />
            <Label htmlFor="select-all" className="font-medium cursor-pointer flex items-center">
              <ListChecks className="h-4 w-4 mr-2 text-muted-foreground" />
              全选策略
            </Label>
          </div>

          {/* 策略选项网格 - 使用独立的 PolicyItem 组件 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POLICY_OPTIONS.map((option) => (
              <PolicyItem key={option.value} option={option} />
            ))}
          </div>
        </div>
      </div>

      {/* 调度设置卡片 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 mr-2 text-purple-500" />
          <h3 className="text-lg font-semibold">调度设置</h3>
        </div>

        <div className="space-y-4">
          <RadioGroup 
            value={scheduleMode} 
            onValueChange={(v) => setScheduleMode(v as ScheduleMode)} 
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors flex-1">
              <RadioGroupItem value="IMMEDIATE" id="immediate" className="sr-only" />
              <Label htmlFor="immediate" className="font-normal cursor-pointer flex items-start w-full">
                <Zap className="h-5 w-5 mr-3 text-yellow-500 mt-0.5" />
                <div>
                  <div className="font-medium">立即执行</div>
                  <div className="text-xs text-muted-foreground mt-1">提交后立即开始执行扫描任务</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors flex-1">
              <RadioGroupItem value="SCHEDULED" id="scheduled" className="sr-only" />
              <Label htmlFor="scheduled" className="font-normal cursor-pointer flex items-start w-full">
                <CalendarClock className="h-5 w-5 mr-3 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium">定时执行</div>
                  <div className="text-xs text-muted-foreground mt-1">在指定时间开始执行，并可设置重复周期</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {scheduleMode === "SCHEDULED" && (
            <div className="mt-6 space-y-6 rounded-lg p-4 border">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium flex items-center">
                    <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                    开始时间 <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full pl-9"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-medium flex items-center">
                    <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
                    时区
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

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block flex items-center">
                  <Repeat className="h-4 w-4 mr-1 text-muted-foreground" />
                  重复设置
                </Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="periodValue" className="text-sm font-medium">
                      周期数值 <span className="text-red-500">*</span>
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
                      <Repeat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodUnit" className="text-sm font-medium">
                      周期单位 <span className="text-red-500">*</span>
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
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          disabled={!name.trim() || !targetHosts.trim() || policies.length === 0 || (scheduleMode === "SCHEDULED" && !startTime)}
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