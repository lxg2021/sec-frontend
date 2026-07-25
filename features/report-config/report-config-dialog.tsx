"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle2,
  CircleAlert,
  FileCog,
  Info,
  Loader2,
  RadioTower,
  RotateCcw,
  Send,
  Server,
  X,
} from "lucide-react"

import {
  compareReportConfigVersions,
  getReportConfig,
  REPORT_COMPRESS_OPTIONS,
  REPORT_CONFIG_DEFAULTS,
  REPORT_CONFIG_INTERNAL_NAME,
  suggestNextReportConfigVersion,
  updateReportConfig,
  type ReportCompressType,
  type ReportConfigDefinition,
} from "@/features/report-config/api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

interface ReportConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (definition: ReportConfigDefinition) => void
}

interface ReportConfigDraft {
  version: string
  intervalTime: string
  reportThread: string
  reportUnit: string
  tryCount: string
  compressType: string
}

type ValidationField = keyof ReportConfigDraft

interface ValidationIssue {
  field: ValidationField
  message: string
}

const EMPTY_DRAFT: ReportConfigDraft = {
  version: "",
  intervalTime: "",
  reportThread: "",
  reportUnit: "",
  tryCount: "",
  compressType: "",
}

function draftSignature(draft: ReportConfigDraft) {
  return JSON.stringify({
    version: draft.version.trim(),
    intervalTime: draft.intervalTime.trim(),
    reportThread: draft.reportThread.trim(),
    reportUnit: draft.reportUnit.trim(),
    tryCount: draft.tryCount.trim(),
    compressType: draft.compressType.trim(),
  })
}

function parsePositiveInteger(value: string) {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseCompressType(value: string): ReportCompressType | null {
  const parsed = parsePositiveInteger(value)
  return parsed === 2 || parsed === 3 ? parsed : null
}

function validateDraft(
  draft: ReportConfigDraft,
  baseVersion: string,
): ValidationIssue | null {
  const comparison = compareReportConfigVersions(draft.version, baseVersion)
  if (comparison === null) {
    return { field: "version", message: "新版本必须使用 x.y.z 格式，例如 1.1.0" }
  }
  if (comparison <= 0) {
    return { field: "version", message: `新版本必须高于当前版本 ${baseVersion}` }
  }
  if (parsePositiveInteger(draft.intervalTime) === null) {
    return { field: "intervalTime", message: "上报间隔必须是大于 0 的整数毫秒" }
  }
  if (parsePositiveInteger(draft.reportThread) === null) {
    return { field: "reportThread", message: "上报线程数必须是大于 0 的整数" }
  }
  if (parsePositiveInteger(draft.reportUnit) === null) {
    return { field: "reportUnit", message: "单批上报数量必须是大于 0 的整数" }
  }
  if (parsePositiveInteger(draft.tryCount) === null) {
    return { field: "tryCount", message: "失败重试次数必须是大于 0 的整数" }
  }
  if (parseCompressType(draft.compressType) === null) {
    return { field: "compressType", message: "请选择 Agent 当前支持的压缩方式" }
  }
  return null
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export function ReportConfigDialog({
  open,
  onOpenChange,
  onUpdated,
}: ReportConfigDialogProps) {
  const { toast } = useToast()
  const requestSequence = useRef(0)
  const [definition, setDefinition] = useState<ReportConfigDefinition | null>(null)
  const [draft, setDraft] = useState<ReportConfigDraft>(EMPTY_DRAFT)
  const [initialSignature, setInitialSignature] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [requestError, setRequestError] = useState("")
  const [validationIssue, setValidationIssue] = useState<ValidationIssue | null>(null)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)

  const loadCurrentConfig = useCallback(async () => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setDefinition(null)
    setDraft(EMPTY_DRAFT)
    setInitialSignature("")
    setLoadError("")
    setRequestError("")
    setValidationIssue(null)

    try {
      const current = await getReportConfig()
      if (sequence !== requestSequence.current) return

      const nextVersion = suggestNextReportConfigVersion(current.baseVersion)
      if (!nextVersion) throw new Error("当前配置版本无法生成有效的新版本建议")
      const nextDraft = {
        version: nextVersion,
        intervalTime: String(current.intervalTime),
        reportThread: String(current.reportThread),
        reportUnit: String(current.reportUnit),
        tryCount: String(current.tryCount),
        compressType: String(current.compressType),
      }
      setDefinition(current)
      setDraft(nextDraft)
      setInitialSignature(draftSignature(nextDraft))
    } catch (error) {
      if (sequence !== requestSequence.current) return
      setLoadError(errorMessage(error, "加载上报配置失败，请稍后重试"))
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setConfirmCloseOpen(false)
      setSubmitting(false)
      void loadCurrentConfig()
      return
    }
    requestSequence.current += 1
  }, [loadCurrentConfig, open])

  const hasUnsavedChanges =
    Boolean(definition && initialSignature) && draftSignature(draft) !== initialSignature

  const modifiedFieldCount = useMemo(() => {
    if (!definition) return 0
    const suggestedVersion = suggestNextReportConfigVersion(definition.baseVersion)
    return [
      draft.version.trim() !== suggestedVersion,
      draft.intervalTime.trim() !== String(definition.intervalTime),
      draft.reportThread.trim() !== String(definition.reportThread),
      draft.reportUnit.trim() !== String(definition.reportUnit),
      draft.tryCount.trim() !== String(definition.tryCount),
      draft.compressType.trim() !== String(definition.compressType),
    ].filter(Boolean).length
  }, [definition, draft])

  const updateField = (field: ValidationField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    if (validationIssue?.field === field) setValidationIssue(null)
    setRequestError("")
  }

  const restoreBuiltInDefaults = () => {
    setDraft((current) => ({
      ...current,
      intervalTime: String(REPORT_CONFIG_DEFAULTS.intervalTime),
      reportThread: String(REPORT_CONFIG_DEFAULTS.reportThread),
      reportUnit: String(REPORT_CONFIG_DEFAULTS.reportUnit),
      tryCount: String(REPORT_CONFIG_DEFAULTS.tryCount),
      compressType: String(REPORT_CONFIG_DEFAULTS.compressType),
    }))
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

  const saveNewVersion = async () => {
    if (!definition || submitting) return
    if (!definition.canUpdate) {
      setRequestError("服务端未授权更新此上报配置")
      return
    }

    const issue = validateDraft(draft, definition.baseVersion)
    if (issue) {
      setValidationIssue(issue)
      setRequestError("")
      window.requestAnimationFrame(() => {
        document.getElementById(`report-config-${issue.field}`)?.focus()
      })
      return
    }

    setValidationIssue(null)
    setRequestError("")
    setSubmitting(true)
    try {
      const updated = await updateReportConfig({
        version: draft.version.trim(),
        intervalTime: parsePositiveInteger(draft.intervalTime)!,
        reportThread: parsePositiveInteger(draft.reportThread)!,
        reportUnit: parsePositiveInteger(draft.reportUnit)!,
        tryCount: parsePositiveInteger(draft.tryCount)!,
        compressType: parseCompressType(draft.compressType)!,
      })
      toast({
        variant: "success",
        duration: 4500,
        title: "上报配置新版本已创建",
        description: `已创建 ${updated.baseVersion}，尚未选择主机或下发。`,
      })
      onUpdated?.(updated)
      onOpenChange(false)
    } catch (error) {
      const message = errorMessage(error, "创建上报配置新版本失败，请稍后重试")
      setRequestError(message)
      toast({
        variant: "destructive",
        duration: 4500,
        title: "上报配置更新失败",
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
            "max-h-[92dvh] w-[calc(100vw-1rem)] max-w-[880px] gap-0 overflow-hidden p-0 sm:rounded-2xl",
            "[&>button]:hidden",
          )}
        >
          <div className="flex max-h-[92dvh] min-h-0 flex-col bg-white">
            <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <RadioTower className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <DialogTitle className="text-lg leading-6 text-slate-950 sm:text-xl">
                    编辑数据上报配置
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="border-cyan-200 bg-cyan-50 px-2 py-0 text-[11px] text-cyan-700"
                  >
                    系统内置
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:text-slate-900"
                  onClick={requestClose}
                  disabled={submitting}
                  aria-label="关闭数据上报配置"
                  title="关闭"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <DialogDescription className="sr-only">
                加载并编辑 Agent 数据上报配置，校验后创建一个可供后续下发的新版本。
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
              <div className="space-y-4 px-4 py-4 sm:px-6">
                {loading && <LoadingState />}

                {!loading && loadError && (
                  <div
                    role="alert"
                    className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-5 py-6 text-center"
                  >
                    <CircleAlert className="h-7 w-7 text-rose-600" />
                    <p className="mt-3 text-sm font-semibold text-rose-900">上报配置加载失败</p>
                    <p className="mt-1 max-w-lg break-words text-xs leading-5 text-rose-700">
                      {loadError}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 h-9 rounded-full border-rose-200 bg-white px-4 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                      onClick={() => void loadCurrentConfig()}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      重新加载
                    </Button>
                  </div>
                )}

                {!loading && definition && (
                  <TooltipProvider delayDuration={250}>
                    <section aria-labelledby="report-config-basic-title">
                      <div className="mb-3 flex items-center gap-2">
                        <RadioTower className="h-4 w-4 text-cyan-700" />
                        <h3
                          id="report-config-basic-title"
                          className="text-sm font-semibold text-slate-900"
                        >
                          基本信息
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                        <ReadOnlyField label="配置名称">
                          <span className="truncate">数据上报配置</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                aria-label="查看内部配置名称"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent className="z-[80] max-w-xs text-xs leading-5">
                                内部名称：{REPORT_CONFIG_INTERNAL_NAME}
                              </TooltipContent>
                            </TooltipPortal>
                          </Tooltip>
                        </ReadOnlyField>
                        <ReadOnlyField label="来源">
                          <Server className="h-4 w-4 text-cyan-600" />
                          系统内置
                        </ReadOnlyField>
                        <ReadOnlyField label="基础版本">
                          <span className="truncate font-mono">{definition.baseVersion}</span>
                        </ReadOnlyField>
                        <FormField
                          label="新版本"
                          htmlFor="report-config-version"
                          error={
                            validationIssue?.field === "version"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <div className="relative">
                            <Input
                              id="report-config-version"
                              value={draft.version}
                              onChange={(event) => updateField("version", event.target.value)}
                              maxLength={64}
                              className="h-10 bg-white pr-9 font-mono"
                              placeholder="例如 1.1.0"
                              disabled={submitting}
                              aria-invalid={validationIssue?.field === "version"}
                            />
                            {compareReportConfigVersions(
                              draft.version,
                              definition.baseVersion,
                            ) === 1 && (
                              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                            )}
                          </div>
                        </FormField>
                      </div>
                    </section>

                    <section aria-labelledby="report-config-parameters-title">
                      <div className="mb-3 flex items-center gap-2">
                        <Send className="h-4 w-4 text-cyan-700" />
                        <h3
                          id="report-config-parameters-title"
                          className="text-sm font-semibold text-slate-900"
                        >
                          上报参数
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
                        <FormField
                          className="md:col-span-2"
                          label="上报间隔"
                          htmlFor="report-config-intervalTime"
                          error={
                            validationIssue?.field === "intervalTime"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <NumberInput
                            id="report-config-intervalTime"
                            value={draft.intervalTime}
                            onChange={(value) => updateField("intervalTime", value)}
                            unit="毫秒"
                            disabled={submitting}
                            invalid={validationIssue?.field === "intervalTime"}
                          />
                        </FormField>

                        <FormField
                          className="md:col-span-2"
                          label="上报线程数"
                          labelAccessory={
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                  aria-label="查看上报线程数生效说明"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipPortal>
                                <TooltipContent className="z-[80] max-w-xs text-xs leading-5">
                                  修改后将在 Agent 上报模块下次启动时生效；当前运行中的线程池不会立即重建。
                                </TooltipContent>
                              </TooltipPortal>
                            </Tooltip>
                          }
                          htmlFor="report-config-reportThread"
                          error={
                            validationIssue?.field === "reportThread"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <NumberInput
                            id="report-config-reportThread"
                            value={draft.reportThread}
                            onChange={(value) => updateField("reportThread", value)}
                            disabled={submitting}
                            invalid={validationIssue?.field === "reportThread"}
                          />
                        </FormField>

                        <FormField
                          className="md:col-span-2"
                          label="单批上报数量"
                          htmlFor="report-config-reportUnit"
                          error={
                            validationIssue?.field === "reportUnit"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <NumberInput
                            id="report-config-reportUnit"
                            value={draft.reportUnit}
                            onChange={(value) => updateField("reportUnit", value)}
                            disabled={submitting}
                            invalid={validationIssue?.field === "reportUnit"}
                          />
                        </FormField>

                        <FormField
                          className="md:col-span-3"
                          label="失败重试次数"
                          htmlFor="report-config-tryCount"
                          error={
                            validationIssue?.field === "tryCount"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <NumberInput
                            id="report-config-tryCount"
                            value={draft.tryCount}
                            onChange={(value) => updateField("tryCount", value)}
                            disabled={submitting}
                            invalid={validationIssue?.field === "tryCount"}
                          />
                        </FormField>

                        <FormField
                          className="md:col-span-3"
                          label="压缩方式"
                          htmlFor="report-config-compressType"
                          error={
                            validationIssue?.field === "compressType"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <Select
                            value={draft.compressType}
                            onValueChange={(value) => updateField("compressType", value)}
                            disabled={submitting}
                          >
                            <SelectTrigger
                              id="report-config-compressType"
                              className="h-10 bg-white"
                              disabled={submitting}
                              aria-invalid={validationIssue?.field === "compressType"}
                            >
                              <SelectValue placeholder="选择压缩方式" />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              align="end"
                              sideOffset={4}
                              className="z-[80]"
                            >
                              {REPORT_COMPRESS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </section>

                    {!definition.canUpdate && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800"
                      >
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        服务端当前未授予此内置对象的更新能力，无法创建新版本。
                      </div>
                    )}

                    {requestError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800"
                      >
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="break-words">{requestError}</span>
                      </div>
                    )}
                  </TooltipProvider>
                )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-600" />
                      <span>正在读取当前配置</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>{modifiedFieldCount} 项内容已修改，尚未创建</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{definition ? "当前无未保存修改" : "等待加载配置"}</span>
                    </>
                  )}
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-2 h-10 rounded-full border-cyan-200 bg-cyan-50 px-4 text-cyan-800 hover:bg-cyan-100 hover:text-cyan-900 sm:col-span-1"
                    onClick={restoreBuiltInDefaults}
                    disabled={!definition || loading || submitting}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    恢复为系统内置值
                  </Button>
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
                    className="h-10 min-w-0 rounded-full bg-cyan-700 px-3 hover:bg-cyan-800 sm:px-5"
                    onClick={() => void saveNewVersion()}
                    disabled={!definition || loading || submitting || !definition.canUpdate}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        正在创建
                      </>
                    ) : (
                      <>
                        <FileCog className="h-4 w-4" />
                        <span className="sm:hidden">创建新版本</span>
                        <span className="hidden sm:inline">校验并创建新版本</span>
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
              当前上报配置存在未创建的修改。关闭后，这些修改将不会保留。
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

function NumberInput({
  id,
  value,
  onChange,
  unit,
  disabled,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  unit?: string
  disabled: boolean
  invalid: boolean
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn("h-10 bg-white tabular-nums", unit && "pr-14")}
        disabled={disabled}
        aria-invalid={invalid}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {unit}
        </span>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-label="正在加载上报配置">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-14 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded-md bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className={cn("space-y-2", index < 3 ? "md:col-span-2" : "md:col-span-3")}
          >
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded-md bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <span className="block text-xs font-medium leading-4 text-slate-600">{label}</span>
      <div className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
        {children}
      </div>
    </div>
  )
}

function FormField({
  label,
  labelAccessory,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  labelAccessory?: React.ReactNode
  htmlFor: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <div className="flex h-4 items-center gap-1">
        <Label htmlFor={htmlFor} className="block text-xs font-medium leading-4 text-slate-600">
          {label} <span className="text-rose-500">*</span>
        </Label>
        {labelAccessory}
      </div>
      {children}
      {error && (
        <p className="text-xs leading-5 text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
