"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
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
import { getAllBaselines } from "@/features/baseline/custom/api"
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

function requestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export function BaselineScanPolicyDialog({
  open,
  onOpenChange,
  onPolicyCreated,
}: BaselineScanPolicyDialogProps) {
  const t = useTranslations("pages.controlCenter")
  const { toast } = useToast()
  const createLocalizedDefaults = useCallback(
    () => createDefaultBaselineScanPolicyForm(t("baselineScanPolicy.defaultName")),
    [t],
  )
  const [form, setForm] = useState<BaselineScanPolicyFormValue>(() =>
    createLocalizedDefaults(),
  )
  const [initialSignature, setInitialSignature] = useState(() =>
    createBaselineScanPolicySignature(createLocalizedDefaults()),
  )
  const [validationIssue, setValidationIssue] =
    useState<BaselineScanPolicyValidationIssue | null>(null)
  const [requestError, setRequestError] = useState("")
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [builtInBaselineUUID, setBuiltInBaselineUUID] = useState("")
  const [baselineLoading, setBaselineLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const defaults = createLocalizedDefaults()
    setForm(defaults)
    setInitialSignature(createBaselineScanPolicySignature(defaults))
    setValidationIssue(null)
    setRequestError("")
    setConfirmCloseOpen(false)
    setSubmitting(false)
  }, [createLocalizedDefaults, open])

  useEffect(() => {
    if (!open) return

    let active = true
    setBuiltInBaselineUUID("")
    setBaselineLoading(true)
    void getAllBaselines()
      .then((baselines) => {
        if (!active) return
        const builtInBaseline = baselines.find(
          (baseline) => baseline.baseline_type === "template" && baseline.uuid,
        )
        if (!builtInBaseline) {
          setRequestError(t("baselineScanPolicy.errors.createFailed"))
          return
        }
        setBuiltInBaselineUUID(builtInBaseline.uuid)
      })
      .catch((error) => {
        if (!active) return
        setRequestError(
          requestErrorMessage(error, t("baselineScanPolicy.errors.createFailed")),
        )
      })
      .finally(() => {
        if (active) setBaselineLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, t])

  const hasUnsavedChanges = createBaselineScanPolicySignature(form) !== initialSignature
  const modifiedFieldCount = useMemo(
    () => countModifiedBaselineScanPolicyFields(form, t("baselineScanPolicy.defaultName")),
    [form, t],
  )
  const scheduleValidationIssue =
    validationIssue && SCHEDULE_FIELDS.has(validationIssue.field) ? validationIssue : null
  const fieldError = (field: BaselineScanPolicyValidationField) =>
    validationIssue?.field === field
      ? t(`baselineScanPolicy.validation.${validationIssue.code}`)
      : undefined
  const scanScheduleText = useMemo<ScanScheduleFormText>(
    () => ({
      modeLabel: t("genericEditor.schedule.modeLabel"),
      modePlaceholder: t("genericEditor.schedule.modePlaceholder"),
      modeInterval: t("genericEditor.schedule.modeInterval"),
      intervalLabel: t("baselineScanPolicy.schedule.intervalLabel"),
      intervalValue: (hours) => t("genericEditor.schedule.hours", { count: hours }),
      fixedTimeLabel: t("genericEditor.schedule.fixedTimeLabel"),
      randomDelayLabel: t("genericEditor.schedule.randomDelayLabel"),
      randomDelayValue: (minutes) => t("genericEditor.schedule.minutes", { count: minutes }),
      retryCountLabel: t("baselineScanPolicy.schedule.retryCountLabel"),
      retryIntervalLabel: t("genericEditor.schedule.retryIntervalLabel"),
      retryNone: t("genericEditor.schedule.retryNone"),
      retryTimes: (count) => t("genericEditor.schedule.retryTimes", { count }),
      minutesUnit: t("genericEditor.schedule.minutesUnit"),
      startupTitle: t("baselineScanPolicy.schedule.startupTitle"),
      startupDescription: t("baselineScanPolicy.schedule.startupDescription"),
      startupInlineLabel: t("genericEditor.schedule.startupInlineLabel"),
    }),
    [t],
  )

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
    setForm(createLocalizedDefaults())
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
    if (submitting || baselineLoading) return
    if (!builtInBaselineUUID) {
      setRequestError(t("baselineScanPolicy.errors.createFailed"))
      return
    }

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
        baselineUUID: builtInBaselineUUID,
        name: form.name.trim(),
        version: form.version.trim(),
        scanSchedule,
      })
      toast({
        variant: "success",
        duration: 4500,
        title: t("baselineScanPolicy.toast.created"),
        description: t("baselineScanPolicy.toast.createdDescription"),
      })
      onPolicyCreated?.(created)
      onOpenChange(false)
    } catch (error) {
      const message = requestErrorMessage(error, t("baselineScanPolicy.errors.createFailed"))
      setRequestError(message)
      toast({
        variant: "destructive",
        duration: 4500,
        title: t("baselineScanPolicy.toast.failed"),
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
                    {t("baselineScanPolicy.title")}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="border-cyan-200 bg-cyan-50 px-2 py-0 text-[11px] text-cyan-700"
                  >
                    {t("baselineScanPolicy.basedOnBuiltIn")}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:text-slate-900"
                  onClick={requestClose}
                  disabled={submitting}
                  aria-label={t("baselineScanPolicy.closeAriaLabel")}
                  title={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="sr-only">
                {t("baselineScanPolicy.description")}
              </DialogDescription>
            </DialogHeader>

            <section
              aria-label={t("baselineScanPolicy.basicInfoAriaLabel")}
              className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-7"
            >
              <div className="grid grid-cols-2 gap-4 md:grid-cols-[minmax(220px,1.35fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(220px,1fr)]">
                <FormField
                  className="col-span-2 md:col-span-1"
                  label={t("baselineScanPolicy.policyName")}
                  htmlFor="baseline-policy-name"
                  required
                  error={fieldError("name")}
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
                    placeholder={t("baselineScanPolicy.policyNamePlaceholder")}
                  />
                </FormField>
                <ReadOnlyField label={t("table.source")}>
                  <Server className="h-4 w-4 text-cyan-600" />
                  {t("sources.builtin")}
                </ReadOnlyField>
                <ReadOnlyField label={t("sensorConfig.baseVersion")}>
                  <span className="font-mono">{BASELINE_SCAN_POLICY_BASE_VERSION}</span>
                </ReadOnlyField>
                <FormField
                  className="col-span-2 md:col-span-1"
                  label={t("genericEditor.newVersion")}
                  htmlFor="baseline-policy-version"
                  required
                  error={fieldError("version")}
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
                      placeholder={t("sensorConfig.versionPlaceholder")}
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
                      <p className="font-medium">{t("baselineScanPolicy.requestFailedTitle")}</p>
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
                      {t("baselineScanPolicy.schedule.title")}
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-violet-200 bg-violet-50 font-normal text-violet-700"
                    >
                      <Layers3 className="mr-1 h-3 w-3" />
                      {t("baselineScanPolicy.schedule.sharedByAll")}
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
                      {t("baselineScanPolicy.restoreDefaults")}
                    </Button>
                  </div>

                  {scheduleValidationIssue && (
                    <div
                      className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
                      role="alert"
                    >
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {t(`baselineScanPolicy.validation.${scheduleValidationIssue.code}`)}
                    </div>
                  )}

                  <div id="baseline-policy-scan-plan">
                    <ScanScheduleForm
                      value={form.scanSchedule}
                      onChange={updateSchedule}
                      title={null}
                      description={null}
                      text={scanScheduleText}
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
                      <span>{t("baselineScanPolicy.modifiedCount", { count: modifiedFieldCount })}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{t("baselineScanPolicy.builtInDefaults")}</span>
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
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    className="h-10 min-w-40 rounded-full bg-cyan-700 px-5 hover:bg-cyan-800"
                    onClick={createPolicy}
                    disabled={submitting || baselineLoading || !builtInBaselineUUID}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("baselineScanPolicy.creating")}
                      </>
                    ) : (
                      <>
                        <ListChecks className="h-4 w-4" />
                        {t("baselineScanPolicy.validateAndCreate")}
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
            <AlertDialogTitle>{t("baselineScanPolicy.discard.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("baselineScanPolicy.discard.description")}
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
