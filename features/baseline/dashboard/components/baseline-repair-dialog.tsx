"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { AlertTriangle, Loader2, Wrench } from "lucide-react"
import { useLocale } from "next-intl"

import type { BaselineOneClickRepairPayload, BaselineRepairSource } from "../api"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"

interface BaselineRepairDialogProps {
  baselineUuid: string
  baselineName?: string
  agentIds?: string[]
  hostCount?: number
  disabled?: boolean
  trigger?: React.ReactNode
  onConfirm: (params: BaselineOneClickRepairPayload) => Promise<void> | void
  onCancel?: () => void
}

type RepairDialogCopy = {
  title: string
  description: string
  baselineNameLabel: string
  baselineUuidLabel: string
  affectedHostsLabel: string
  allHostsLabel: string
  hostUnit: string
  sourceLabel: string
  sourceDescription: string
  sourcePlaceholder: string
  backupLabel: string
  backupDescription: string
  rescanLabel: string
  rescanDescription: string
  skipRestorePointLabel: string
  skipRestorePointDescription: string
  cancel: string
  confirm: string
  confirming: string
  warningBackup: string
  warningRestorePoint: string
}

const COPY: Record<"zh" | "en", RepairDialogCopy> = {
  zh: {
    title: "确认基线一键修复",
    description: "请确认以下修复参数，修复操作将会修改目标主机上的基线配置。",
    baselineNameLabel: "基线名称",
    baselineUuidLabel: "基线 UUID",
    affectedHostsLabel: "影响主机数",
    allHostsLabel: "全部关联主机",
    hostUnit: "台",
    sourceLabel: "修复源类型",
    sourceDescription: "选择修复配置的下发方式。",
    sourcePlaceholder: "选择修复源",
    backupLabel: "修复前备份",
    backupDescription: "在开始修复前，先对当前配置进行备份。",
    rescanLabel: "修复后重扫",
    rescanDescription: "修复完成后由 Agent 自动触发一次新的基线扫描。",
    skipRestorePointLabel: "跳过系统还原点",
    skipRestorePointDescription: "修复时跳过创建系统还原点。",
    cancel: "取消",
    confirm: "确认修复",
    confirming: "执行中...",
    warningBackup: "未启用修复前备份，后续回滚能力会变弱。",
    warningRestorePoint: "跳过系统还原点会增加系统级恢复难度。",
  },
  en: {
    title: "Confirm baseline one-click repair",
    description: "Review the repair options below. This action will modify baseline-related settings on the target hosts.",
    baselineNameLabel: "Baseline name",
    baselineUuidLabel: "Baseline UUID",
    affectedHostsLabel: "Affected hosts",
    allHostsLabel: "All associated hosts",
    hostUnit: "hosts",
    sourceLabel: "Repair source",
    sourceDescription: "Choose how the repair configuration should be applied.",
    sourcePlaceholder: "Select a repair source",
    backupLabel: "Back up before repair",
    backupDescription: "Create a backup of the current configuration before remediation starts.",
    rescanLabel: "Rescan after repair",
    rescanDescription: "Let the agent trigger a fresh baseline scan after repair completes.",
    skipRestorePointLabel: "Skip system restore point",
    skipRestorePointDescription: "Do not create a restore point before repair starts.",
    cancel: "Cancel",
    confirm: "Confirm repair",
    confirming: "Submitting...",
    warningBackup: "Backup before repair is disabled, so rollback will be harder.",
    warningRestorePoint: "Skipping the restore point increases system recovery risk.",
  },
}

export function BaselineRepairDialog({
  baselineUuid,
  baselineName,
  agentIds = [],
  hostCount,
  disabled = false,
  trigger,
  onConfirm,
  onCancel,
}: BaselineRepairDialogProps) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<BaselineRepairSource>("GPO")
  const [rescanAfterRepair, setRescanAfterRepair] = useState(true)
  const [backupBeforeRepair, setBackupBeforeRepair] = useState(true)
  const [skipRestorePoint, setSkipRestorePoint] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copy = useMemo(
    () => (locale.toLowerCase().startsWith("zh") ? COPY.zh : COPY.en),
    [locale],
  )

  const affectedHostCount = hostCount ?? agentIds.length
  const hasExplicitHostCount = typeof hostCount === "number" || agentIds.length > 0
  const affectedHostLabel = hasExplicitHostCount
    ? `${affectedHostCount} ${copy.hostUnit}`
    : copy.allHostsLabel

  const handleConfirm = async () => {
    setIsSubmitting(true)

    try {
      await onConfirm({
        baselineUUID: baselineUuid,
        source,
        rescanAfterRepair,
        backupBeforeRepair,
        skipRestorePoint,
        agentIds: agentIds.length > 0 ? agentIds : undefined,
      })
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    handleOpenChange(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return

    if (!nextOpen && open) {
      onCancel?.()
    }

    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="default" disabled={disabled}>
            <Wrench className="mr-2 size-4" />
            {copy.confirm}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="size-5 text-primary" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{copy.baselineNameLabel}</span>
                <span className="font-medium text-right">{baselineName || "-"}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{copy.baselineUuidLabel}</span>
                <code className="rounded bg-muted px-2 py-0.5 text-xs">
                  {baselineUuid.slice(0, 8)}...
                </code>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{copy.affectedHostsLabel}</span>
                <Badge variant="secondary">{affectedHostLabel}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="baseline-repair-source">{copy.sourceLabel}</Label>
              <p className="text-xs text-muted-foreground">{copy.sourceDescription}</p>
            </div>

            <Select value={source} onValueChange={(value) => setSource(value as BaselineRepairSource)}>
              <SelectTrigger id="baseline-repair-source" className="w-[140px]">
                <SelectValue placeholder={copy.sourcePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GPO">GPO</SelectItem>
                <SelectItem value="Intune">Intune</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="baseline-repair-backup">{copy.backupLabel}</Label>
                <p className="text-xs text-muted-foreground">{copy.backupDescription}</p>
              </div>
              <Switch
                id="baseline-repair-backup"
                checked={backupBeforeRepair}
                onCheckedChange={setBackupBeforeRepair}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="baseline-repair-rescan">{copy.rescanLabel}</Label>
                <p className="text-xs text-muted-foreground">{copy.rescanDescription}</p>
              </div>
              <Switch
                id="baseline-repair-rescan"
                checked={rescanAfterRepair}
                onCheckedChange={setRescanAfterRepair}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="baseline-repair-skip-restore-point">{copy.skipRestorePointLabel}</Label>
                <p className="text-xs text-muted-foreground">{copy.skipRestorePointDescription}</p>
              </div>
              <Switch
                id="baseline-repair-skip-restore-point"
                checked={skipRestorePoint}
                onCheckedChange={setSkipRestorePoint}
              />
            </div>
          </div>

          {(!backupBeforeRepair || skipRestorePoint) && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                {!backupBeforeRepair ? <p>- {copy.warningBackup}</p> : null}
                {skipRestorePoint ? <p>- {copy.warningRestorePoint}</p> : null}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {copy.cancel}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {copy.confirming}
              </>
            ) : (
              copy.confirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
