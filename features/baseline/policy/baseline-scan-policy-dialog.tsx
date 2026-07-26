"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Layers3,
  ListChecks,
  Loader2,
  RotateCcw,
  Server,
  X,
} from "lucide-react"

import {
  createBaselineScanPolicy,
  type CreatedBaselineScanPolicy,
} from "@/features/baseline/dispatch/api"
import {
  BASELINE_SCAN_POLICY_BASE_VERSION,
  countModifiedBaselineScanPolicyFields,
  createBaselineScanPolicySignature,
  createDefaultBaselineScanPolicyForm,
  validateBaselineScanPolicyForm,
  type BaselineScanPolicyFormValue,
  type BaselineScanPolicyValidationField,
  type BaselineScanPolicyValidationIssue,
} from "@/features/baseline/policy/baseline-scan-policy-model"
import {
  ScanScheduleForm,
  sanitizeScanSchedule,
  type ScanSchedule,
  type ScanScheduleFormText,
} from "@/shared/components/scan-schedule"
import { useToast } from "@/shared/hooks/use-toast"
import { cn } from "@/shared/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { ScrollArea } from "@/shared/ui/scroll-area"

export interface BaselineScanPolicyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPolicyCreated?: (policy: CreatedBaselineScanPolicy) => void
}

const SCHEDULE_FIELDS = new Set<BaselineScanPolicyValidationField>([
  "mode",
  "interval_hours",
  "specific_time",
  "random_delay_minutes",
  "retry_limit",
  "retry_interval_minutes",
])

const SCHEDULE_FIELD_IDS: Partial<Record<BaselineScanPolicyValidationField, string>> = {
  mode: "mode",
  interval_hours: "interval_hours",
  specific_time: "specific_time",
  random_delay_minutes: "random_delay",
  retry_limit: "baseline-policy-scan-plan",
  retry_interval_minutes: "retry_interval",
}

const SCAN_SCHEDULE_TEXT: ScanScheduleFormText = {
  modeLabel: "调度模式",
  modePlaceholder: "选择调度模式",
  modeInterval: "固定间隔",
  intervalLabel: "执行间隔",
  intervalValue: (hours) => `${hours} 小时`,
  fixedTimeLabel: "固定执行时间",
  randomDelayLabel: "随机延迟",
  randomDelayValue: (minutes) => `${minutes} 分钟`,
  retryCountLabel: "失败重试",
  retryIntervalLabel: "重试间隔",
  retryNone: "不重试",
  retryTimes: (count) => `${count} 次`,
  minutesUnit: "分钟",
  startupTitle: "Agent 启动时执行",
  startupDescription: "Agent 启动后补跑一次基线扫描",
  startupInlineLabel: "启动时扫描",
}

function requestErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message
  return "创建失败，请检查扫描计划后重试"
}

export function BaselineScanPolicyDialog({
  open,
  onOpenChange,
  onPolicyCreated,
}: BaselineScanPolicyDialogProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<BaselineScanPolicyFormValue>(() =>
    createDefaultBaselineScanPolicyForm(),
  )
  const [initialSignature, setInitialSignature] = useState(() =>
    createBaselineScanPolicySignature(createDefaultBaselineScanPolicyForm()),
  )
  const [validationIssue, setValidationIssue] =
    useState<BaselineScanPolicyValidationIssue | null>(null)
  const [requestError, setRequestError] = useState("")
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    const defaults = createDefaultBaselineScanPolicyForm()
    setForm(defaults)
    setInitialSignature(createBaselineScanPolicySignature(defaults))
    setValidationIssue(null)
    setRequestError("")
    setConfirmCloseOpen(false)
    setSubmitting(false)
  }, [open])

  const hasUnsavedChanges = createBaselineScanPolicySignature(form) !== initialSignature
  const modifiedFieldCount = useMemo(
    () => countModifiedBaselineScanPolicyFields(form),
    [form],
  )
  const scheduleValidationIssue =
    validationIssue && SCHEDULE_FIELDS.has(validationIssue.field) ? validationIssue : null

  const updateField = <Field extends "name" | "version">(
    field: Field,
    value: BaselineScanPolicyFormValue[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (validationIssue?.field === field) setValidationIssue(null)
    setRequestError("")
  }

  const updateSchedule = useCallback((scanSchedule: ScanSchedule) => {
    setForm((current) => ({
      ...current,
      scanSchedule: sanitizeScanSchedule(scanSchedule),
    }))
    setValidationIssue((current) =>
      current && SCHEDULE_FIELDS.has(current.field) ? null : current,
    )
    setRequestError("")
  }, [])

  const restoreDefaults = () => {
    setForm(createDefaultBaselineScanPolicyForm())
    setValidationIssue(null)
    setRequestError("")
  }

  const requestClose = () => {
    if (submitting) return
    if (hasUnsavedChanges) {
      setConfirmCloseOpen(true)
      return
    }
    onOpenChange(false)
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) onOpenChange(true)
    else requestClose()
  }

  const focusValidationField = (field: BaselineScanPolicyValidationField) => {
    const id =
      field === "name" || field === "version"
        ? `baseline-policy-${field}`
        : SCHEDULE_FIELD_IDS[field]
    if (!id) return

    window.requestAnimationFrame(() => {
      document.getElementById(id)?.focus()
    })
  }

  const createPolicy = async () => {
    if (submitting) return

    const issue = validateBaselineScanPolicyForm(form)
    if (issue) {
      setValidationIssue(issue)
      setRequestError("")
      focusValidationField(issue.field)
      return
    }

    const scanSchedule = sanitizeScanSchedule(form.scanSchedule)
    setValidationIssue(null)
    setRequestError("")
    setSubmitting(true)

    try {
      const created = await createBaselineScanPolicy({
        name: form.name.trim(),
        version: form.version.trim(),
        scanSchedule,
      })
      toast({
        variant: "success",
        duration: 4500,
        title: "基线扫描策略已创建",
        description: "该策略适用于所有基线模板，当前尚未选择主机或下发。",
      })
      onPolicyCreated?.(created)
      onOpenChange(false)
    } catch (error) {
      const message = requestErrorMessage(error)
      setRequestError(message)
      toast({
        variant: "destructive",
        duration: 4500,
        title: "基线扫描策略创建失败",
        description: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          overlayClassName="bg-slate-950/55 backdrop-blur-[1px]"
          className={cn(
            "h-[min(94dvh,820px)] w-[calc(100vw-1rem)] max-w-[980px] gap-0 overflow-hidden p-0 sm:rounded-2xl xl:h-[min(94dvh,560px)]",
            "[&>button]:hidden",
          )}
        >
          <div className="flex h-full min-h-0 flex-col bg-white">
            <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <ListChecks className="h-4 w-4 shrink-0" />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                    创建基线扫描策略
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="border-cyan-200 bg-cyan-50 px-2 py-0 text-[11px] text-cyan-700"
                  >
                    基于内置策略
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:text-slate-900"
                  onClick={requestClose}
                  disabled={submitting}
                  aria-label="关闭基线扫描策略配置"
                  title="关闭"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="sr-only">
                编辑一套适用于所有基线模板的通用扫描计划，并创建可供后续下发的新策略版本。
              </DialogDescription>
            </DialogHeader>

            <section
              aria-label="基线扫描策略基本信息"
              className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-7"
            >
              <div className="grid grid-cols-2 gap-4 md:grid-cols-[minmax(220px,1.35fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(220px,1fr)]">
                <FormField
                  className="col-span-2 md:col-span-1"
                  label="策略名称"
                  htmlFor="baseline-policy-name"
                  required
                  error={validationIssue?.field === "name" ? validationIssue.message : undefined}
                >
                  <Input
                    id="baseline-policy-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    aria-invalid={validationIssue?.field === "name"}
                    aria-describedby={
                      validationIssue?.field === "name" ? "baseline-policy-name-error" : undefined
                    }
                    maxLength={128}
                    className="h-10 bg-white"
                    placeholder="输入策略名称"
                  />
                </FormField>
                <ReadOnlyField label="来源">
                  <Server className="h-4 w-4 text-cyan-600" />
                  系统内置
                </ReadOnlyField>
                <ReadOnlyField label="基础版本">
                  <span className="font-mono">{BASELINE_SCAN_POLICY_BASE_VERSION}</span>
                </ReadOnlyField>
                <FormField
                  className="col-span-2 md:col-span-1"
                  label="新版本"
                  htmlFor="baseline-policy-version"
                  required
                  error={validationIssue?.field === "version" ? validationIssue.message : undefined}
                >
                  <div className="relative">
                    <Input
                      id="baseline-policy-version"
                      value={form.version}
                      onChange={(event) => updateField("version", event.target.value)}
                      aria-invalid={validationIssue?.field === "version"}
                      aria-describedby={
                        validationIssue?.field === "version"
                          ? "baseline-policy-version-error"
                          : undefined
                      }
                      maxLength={64}
                      className="h-10 bg-white pr-10 font-mono"
                      placeholder="例如 1.1.0"
                    />
                    {validationIssue?.field !== "version" &&
                      /^\d+\.\d+\.\d+$/.test(form.version.trim()) && (
                        <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                      )}
                  </div>
                </FormField>
              </div>
            </section>

            <ScrollArea className="min-h-0 flex-1 bg-white">
              <div className="mx-auto min-h-full w-full max-w-[900px] px-4 py-5 sm:px-6">
                {requestError && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                  >
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">创建失败，请修正后重试</p>
                      <p className="mt-0.5 break-words text-xs text-rose-700">{requestError}</p>
                    </div>
                  </div>
                )}

                <section aria-labelledby="baseline-policy-schedule-title">
                  <div className="mb-4 flex min-h-9 flex-wrap items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-cyan-700" />
                    <h3
                      id="baseline-policy-schedule-title"
                      className="text-sm font-semibold text-slate-900"
                    >
                      通用扫描计划
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-violet-200 bg-violet-50 font-normal text-violet-700"
                    >
                      <Layers3 className="mr-1 h-3 w-3" />
                      所有基线共用
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto h-9 rounded-full border-slate-200 bg-white px-4 text-slate-700"
                      onClick={restoreDefaults}
                      disabled={submitting}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      恢复内置默认值
                    </Button>
                  </div>

                  {scheduleValidationIssue && (
                    <div
                      className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
                      role="alert"
                    >
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {scheduleValidationIssue.message}
                    </div>
                  )}

                  <div id="baseline-policy-scan-plan">
                    <ScanScheduleForm
                      value={form.scanSchedule}
                      onChange={updateSchedule}
                      title={null}
                      description={null}
                      text={SCAN_SCHEDULE_TEXT}
                      disabled={submitting}
                      className="max-w-none border-0 bg-transparent shadow-none [&>div]:!p-0"
                    />
                  </div>
                </section>
              </div>
            </ScrollArea>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
                  {hasUnsavedChanges ? (
                    <>
                      <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>{modifiedFieldCount} 项配置已修改，尚未创建</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>当前为后台内置默认值</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full px-5"
                    onClick={requestClose}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    className="h-10 min-w-40 rounded-full bg-cyan-700 px-5 hover:bg-cyan-800"
                    onClick={createPolicy}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        正在创建
                      </>
                    ) : (
                      <>
                        <ListChecks className="h-4 w-4" />
                        校验并创建策略
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </footer>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>放弃未创建的修改？</AlertDialogTitle>
            <AlertDialogDescription>
              当前基线扫描策略存在未创建的修改。关闭后，这些修改将不会保留。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full px-5">继续编辑</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-rose-600 px-5 text-white hover:bg-rose-700"
              onClick={() => {
                setConfirmCloseOpen(false)
                onOpenChange(false)
              }}
            >
              放弃修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function FormField({
  label,
  htmlFor,
  required,
  error,
  className,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}) {
  const errorId = error ? `${htmlFor}-error` : undefined

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="block text-xs font-medium leading-4 text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
      {error && (
        <p id={errorId} className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium leading-4 text-slate-600">{label}</span>
      <div className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
        {children}
      </div>
    </div>
  )
}
