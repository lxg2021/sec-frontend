"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
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
  translate: (key: string, values?: Record<string, string>) => string,
): ValidationIssue | null {
  const comparison = compareReportConfigVersions(draft.version, baseVersion)
  if (comparison === null) {
    return { field: "version", message: translate("reportConfig.validation.versionFormat") }
  }
  if (comparison <= 0) {
    return {
      field: "version",
      message: translate("reportConfig.validation.versionNotGreater", { version: baseVersion }),
    }
  }
  if (parsePositiveInteger(draft.intervalTime) === null) {
    return { field: "intervalTime", message: translate("reportConfig.validation.intervalTime") }
  }
  if (parsePositiveInteger(draft.reportThread) === null) {
    return { field: "reportThread", message: translate("reportConfig.validation.reportThread") }
  }
  if (parsePositiveInteger(draft.reportUnit) === null) {
    return { field: "reportUnit", message: translate("reportConfig.validation.reportUnit") }
  }
  if (parsePositiveInteger(draft.tryCount) === null) {
    return { field: "tryCount", message: translate("reportConfig.validation.tryCount") }
  }
  if (parseCompressType(draft.compressType) === null) {
    return { field: "compressType", message: translate("reportConfig.validation.compressType") }
  }
  return null
}

function errorMessage(error: unknown, fallback: string, translate: (key: string) => string) {
  if (error instanceof Error && error.message.trim()) {
    if (error.message === "REPORT_CONFIG_VERSION_SUGGESTION_INVALID") {
      return translate("reportConfig.errors.versionSuggestion")
    }
  }
  return fallback
}

export function ReportConfigDialog({
  open,
  onOpenChange,
  onUpdated,
}: ReportConfigDialogProps) {
  const t = useTranslations("pages.controlCenter")
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
      if (!nextVersion) throw new Error("REPORT_CONFIG_VERSION_SUGGESTION_INVALID")
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
      setLoadError(errorMessage(error, t("reportConfig.errors.loadFailed"), (key) => t(key)))
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [t])

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
      setRequestError(t("reportConfig.errors.notAllowed"))
      return
    }

    const issue = validateDraft(draft, definition.baseVersion, (key, values) => t(key, values))
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
        title: t("reportConfig.toast.created"),
        description: t("reportConfig.toast.createdDescription", { version: updated.baseVersion }),
      })
      onUpdated?.(updated)
      onOpenChange(false)
    } catch (error) {
      const message = errorMessage(error, t("reportConfig.errors.createFailed"), (key) => t(key))
      setRequestError(message)
      toast({
        variant: "destructive",
        duration: 4500,
        title: t("reportConfig.toast.failed"),
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
                  <RadioTower className="h-4 w-4 shrink-0" />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                    {t("reportConfig.title")}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="border-cyan-200 bg-cyan-50 px-2 py-0 text-[11px] text-cyan-700"
                  >
                    {t("sources.builtin")}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:text-slate-900"
                  onClick={requestClose}
                  disabled={submitting}
                  aria-label={t("reportConfig.closeAriaLabel")}
                  title={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="sr-only">
                {t("reportConfig.description")}
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
                    <p className="mt-3 text-sm font-semibold text-rose-900">{t("reportConfig.loadFailedTitle")}</p>
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
                      {t("reportConfig.reload")}
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
                          {t("genericEditor.basicInfo")}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                        <ReadOnlyField label={t("reportConfig.configName")}>
                          <span className="truncate">{t("builtinObjects.reportConfig")}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                aria-label={t("reportConfig.internalInfoAriaLabel")}
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent className="z-[80] max-w-xs text-xs leading-5">
                                {t("reportConfig.internalName", { name: REPORT_CONFIG_INTERNAL_NAME })}
                              </TooltipContent>
                            </TooltipPortal>
                          </Tooltip>
                        </ReadOnlyField>
                        <ReadOnlyField label={t("table.source")}>
                          <Server className="h-4 w-4 text-cyan-600" />
                          {t("sources.builtin")}
                        </ReadOnlyField>
                        <ReadOnlyField label={t("sensorConfig.baseVersion")}>
                          <span className="truncate font-mono">{definition.baseVersion}</span>
                        </ReadOnlyField>
                        <FormField
                          label={t("genericEditor.newVersion")}
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
                              placeholder={t("sensorConfig.versionPlaceholder")}
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
                          {t("reportConfig.parameters")}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
                        <FormField
                          className="md:col-span-2"
                          label={t("reportConfig.intervalTime")}
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
                            unit={t("reportConfig.milliseconds")}
                            disabled={submitting}
                            invalid={validationIssue?.field === "intervalTime"}
                          />
                        </FormField>

                        <FormField
                          className="md:col-span-2"
                          label={t("reportConfig.reportThread")}
                          labelAccessory={
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                  aria-label={t("reportConfig.threadInfoAriaLabel")}
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipPortal>
                                <TooltipContent className="z-[80] max-w-xs text-xs leading-5">
                                  {t("reportConfig.threadInfo")}
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
                          label={t("reportConfig.reportUnit")}
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
                          label={t("reportConfig.tryCount")}
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
                          label={t("reportConfig.compressType")}
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
                              <SelectValue placeholder={t("reportConfig.compressPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              align="end"
                              sideOffset={4}
                              className="z-[80]"
                            >
                              {REPORT_COMPRESS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {t(option.labelKey)}
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
                        {t("reportConfig.notAllowedDescription")}
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
                      <span>{t("reportConfig.loading")}</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>{t("reportConfig.modifiedCount", { count: modifiedFieldCount })}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{definition ? t("sensorConfig.noUnsaved") : t("reportConfig.waiting")}</span>
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
                    {t("reportConfig.restoreDefaults")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full px-5"
                    onClick={requestClose}
                    disabled={submitting}
                  >
                    {t("common.cancel")}
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
                        {t("reportConfig.creating")}
                      </>
                    ) : (
                      <>
                        <FileCog className="h-4 w-4" />
                        <span className="sm:hidden">{t("reportConfig.createVersionShort")}</span>
                        <span className="hidden sm:inline">{t("reportConfig.createVersion")}</span>
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
            <AlertDialogTitle>{t("reportConfig.discard.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reportConfig.discard.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full px-5">{t("genericEditor.discard.continue")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-rose-600 px-5 text-white hover:bg-rose-700"
              onClick={() => {
                setConfirmCloseOpen(false)
                onOpenChange(false)
              }}
            >
              {t("genericEditor.discard.confirm")}
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
  const t = useTranslations("pages.controlCenter")
  return (
    <div className="space-y-4" aria-label={t("reportConfig.loadingAriaLabel")}>
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
