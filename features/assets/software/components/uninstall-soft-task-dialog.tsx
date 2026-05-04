"use client"

import { useState } from "react"
import { Calendar, Clock, Settings, Save, CalendarCheck, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Card, CardContent } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"
import type { TaskSchedule, CreateUninstallTaskRequest } from "@/features/assets/software/types/task-soft-uninstall"
import type { SoftItem } from "@/features/assets/software/types/software-aggregate"
import { useTranslations } from "next-intl"

interface UninstallTaskDialogProps {
  /** 选中的软件项目 */
  selectedSoftware: SoftItem[]
  /** 卸载类型：普通卸载 | 静默卸载 */
  uninstallType: "uninstall" | "quietUninstall"
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: (task: CreateUninstallTaskRequest) => void
}

export function UninstallSoftTaskDialog({
  selectedSoftware,
  uninstallType,
  open,
  onOpenChange,
  onTaskCreated,
}: UninstallTaskDialogProps) {
  const t = useTranslations("pages.assets.software.taskDialog")
  const [taskName, setTaskName] = useState(`${uninstallType}-task-${Date.now()}`)
  const [scheduleType, setScheduleType] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE")
  const [scheduledTime, setScheduledTime] = useState("")
  const [retryCount, setRetryCount] = useState(3)

  const handleCreateTask = () => {
    const schedule: TaskSchedule =
      scheduleType === "IMMEDIATE" ? { type: "IMMEDIATE" } : { type: "SCHEDULED", executeAt: scheduledTime }

    selectedSoftware.forEach((software) => {
      const task: CreateUninstallTaskRequest = {
        taskId: `task-${software.hash}-${Date.now()}`,
        taskName: `${taskName}-${software.name}`,
        createdAt: new Date().toISOString(),
        type: uninstallType,
        schedule,
        retryCount,
        hash: software.hash,
        name: software.name,
        version: software.version,
        vendor: software.vendor,
        targets: software.installations.map((installation) => ({
          hostId: installation.hostId,
          hostName: installation.hostName,
          command:
            uninstallType === "quietUninstall"
              ? installation.uninstallCommand?.replace(/\/I/g, "/S") || installation.uninstallCommand || ""
              : installation.uninstallCommand || "",
        })),
      }
      onTaskCreated(task)
    })

    onOpenChange(false)
  }

  const getTotalHosts = () => {
    return selectedSoftware.reduce((total, software) => total + software.installations.length, 0)
  }

  const isValid = taskName.trim() !== "" && (scheduleType === "IMMEDIATE" || scheduledTime !== "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            {t("createTitle", { type: uninstallType === "uninstall" ? "卸载" : "静默卸载" })}
          </DialogTitle>
          <DialogDescription>
            {t("selectedSummary", { software: selectedSoftware.length, hosts: getTotalHosts() })}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="space-y-6">
            {/* Task Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-4 w-4 text-blue-500" />
                <h3 className="text-base font-medium">{t("taskInfo")}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="taskName"
                    className="h-10 leading-10 px-2 whitespace-nowrap font-medium text-sm text-[#333]"
                    style={{ minWidth: 60, textAlign: "right" }}
                  >
                    {t("taskName")}
                  </Label>
                  <Input
                    id="taskName"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder={t("taskNamePlaceholder")}
                    className="flex-1 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("executionMode")}</Label>
                  <RadioGroup value={scheduleType} onValueChange={(value) => setScheduleType(value as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="IMMEDIATE" id="immediate" />
                      <Label htmlFor="immediate" className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        {t("immediate")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SCHEDULED" id="scheduled" />
                      <Label htmlFor="scheduled" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        {t("scheduled")}
                      </Label>
                    </div>
                  </RadioGroup>

                  {scheduleType === "SCHEDULED" && (
                    <div className="ml-6 space-y-1">
                      <Label htmlFor="scheduledTime">{t("executeTime")}</Label>
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
                <h3 className="text-base font-medium">{t("taskPolicy")}</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="retryCount">{t("retryCount")}</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min="0"
                    max="10"
                    value={retryCount}
                    onChange={(e) => setRetryCount(Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Task Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-4 w-4 text-cyan-500" />
                <h3 className="text-base font-medium">{t("summary")}</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-xl font-bold">{selectedSoftware.length}</div>
                    <div className="text-xs text-muted-foreground">{t("software")}</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-xl font-bold">{getTotalHosts()}</div>
                    <div className="text-xs text-muted-foreground">{t("hosts")}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {selectedSoftware.map((software) => (
                      <div key={software.hash} className="flex items-center justify-between text-sm py-1">
                        <span className="truncate">
                          {software.name} v{software.version}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {software.installations.length} {t("hosts")}
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
            {t("cancel")}
          </Button>
          <Button onClick={handleCreateTask} disabled={!isValid}>
            <Save className="h-4 w-4 mr-2" />
            {t("create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
