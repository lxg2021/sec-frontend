"use client"

import { useState } from "react"
import { Calendar, Clock, Settings, Save, CalendarCheck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { SelectedPatchPool } from "@/lib/patchSelection"
import type { InstallTask, TaskOperation, TaskSchedule, InstallPolicy } from "@/lib/taskInstall"

interface InstallTaskDialogProps {
  selectedPatches: SelectedPatchPool
  operation: TaskOperation
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: (task: InstallTask) => void
}

export function InstallTaskDialog({
  selectedPatches,
  operation,
  open,
  onOpenChange,
  onTaskCreated,
}: InstallTaskDialogProps) {
  const [taskName, setTaskName] = useState(`${operation.toLowerCase()}-task-${Date.now()}`)
  const [scheduleType, setScheduleType] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE")
  const [scheduledTime, setScheduledTime] = useState("")
  const [policy, setPolicy] = useState<InstallPolicy>({
    rebootAfterInstall: false,
    rollbackOnFailure: true,
    retryCount: 3,
  })

  const handleCreateTask = () => {
    const schedule: TaskSchedule =
      scheduleType === "IMMEDIATE" ? { type: "IMMEDIATE" } : { type: "SCHEDULED", executeAt: scheduledTime }

    const task: InstallTask = {
      taskId: `task-${Date.now()}`,
      taskName,
      createdAt: new Date().toISOString(),
      operation,
      schedule,
      policy,
      patches: selectedPatches.items,
    }

    onTaskCreated(task)
  }

  const isValid = taskName.trim() !== "" && (scheduleType === "IMMEDIATE" || scheduledTime !== "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
            创建{operation === "INSTALL" ? "安装" : "卸载"}任务
          </DialogTitle>
          <DialogDescription>
            已选择 {selectedPatches.totalPatches} 个补丁，适用于 {selectedPatches.totalHosts} 台主机
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="space-y-6">
            {/* Task Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-4 w-4 text-blue-500" />
                <h3 className="text-base font-medium">任务信息</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="taskName"
                    className="h-10 leading-10 px-2 whitespace-nowrap font-medium text-sm text-[#333]"
                    style={{ minWidth: 60, textAlign: "right" }} // 可选，保证对齐
                  >
                    任务名
                  </Label>
                  <Input
                    id="taskName"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="请输入任务名"
                    className="flex-1 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>执行方式</Label>
                  <RadioGroup value={scheduleType} onValueChange={(value) => setScheduleType(value as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="IMMEDIATE" id="immediate" />
                      <Label htmlFor="immediate" className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        立即执行
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SCHEDULED" id="scheduled" />
                      <Label htmlFor="scheduled" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        计划执行
                      </Label>
                    </div>
                  </RadioGroup>

                  {scheduleType === "SCHEDULED" && (
                    <div className="ml-6 space-y-1">
                      <Label htmlFor="scheduledTime">执行时间</Label>
                      <Input
                        id="scheduledTime"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                
              </div>
            </div>

            <Separator />

            {/* Task Policy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-purple-500" />
                <h3 className="text-base font-medium">安装策略</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reboot"
                    checked={policy.rebootAfterInstall}
                    onCheckedChange={(checked) =>
                      setPolicy((prev) => ({ ...prev, rebootAfterInstall: checked as boolean }))
                    }
                  />
                  <Label htmlFor="reboot">安装完成后自动重启主机</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rollback"
                    checked={policy.rollbackOnFailure}
                    onCheckedChange={(checked) =>
                      setPolicy((prev) => ({ ...prev, rollbackOnFailure: checked as boolean }))
                    }
                  />
                  <Label htmlFor="rollback">安装失败时回滚</Label>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="retryCount">最多重试次数</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min="0"
                    max="10"
                    value={policy.retryCount}
                    onChange={(e) => setPolicy((prev) => ({ ...prev, retryCount: Number.parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Task Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-4 w-4 text-cyan-500" />
                <h3 className="text-base font-medium">任务摘要</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-xl font-bold">{selectedPatches.totalPatches}</div>
                    <div className="text-xs text-muted-foreground">补丁</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-xl font-bold">{selectedPatches.totalHosts}</div>
                    <div className="text-xs text-muted-foreground">主机</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {selectedPatches.items.map((item) => (
                      <div key={item.patch.patchGuid} className="flex items-center justify-between text-sm py-1">
                        <span className="truncate">{item.patch.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.selectedHosts.length} 台主机
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消任务
          </Button>
          <Button onClick={handleCreateTask} disabled={!isValid}>
            <Save className="h-4 w-4 mr-2" />
            创建任务
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}