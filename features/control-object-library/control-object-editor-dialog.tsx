"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  CalendarClock,
  CircleAlert,
  FilePenLine,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react"

import {
  getControlObjectDefinition,
  updateControlObjectDefinition,
  type ControlObjectDefinition,
  type ControlObjectDetail,
} from "./api"
import {
  isBaselineScanPolicyDefinition,
  readBaselineScanPolicySchedule,
  writeBaselineScanPolicyContext,
} from "./baseline-scan-policy-editor"
import {
  controlObjectEditorSignature,
  controlObjectUpdateInput,
  createControlObjectEditorForm,
  hasControlObjectDefinitionChanges,
  validateControlObjectEditorForm,
  type ControlObjectEditorField,
  type ControlObjectEditorForm,
  type ControlObjectEditorIssue,
} from "./control-object-editor-model"
import { controlObjectDisplayNameKey } from "./table-presentation"
import {
  ScanScheduleForm,
  type ScanSchedule,
  type ScanScheduleFormText,
} from "@/shared/components/scan-schedule"
import { cn } from "@/shared/lib/utils"
import { useToast } from "@/shared/hooks/use-toast"
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
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

const TYPE_LABELS = {
  policy: "objectTypes.policy",
  config: "objectTypes.config",
  command: "objectTypes.command",
} as const

function editorErrorMessage(error: unknown, translate: (key: string) => string) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    PMC_OBJECT_DETAIL_INVALID: "genericEditor.errors.detailInvalid",
    PMC_OBJECT_DETAIL_MISMATCH: "genericEditor.errors.detailMismatch",
    PMC_OBJECT_EDITABLE_CONTENT_INVALID: "genericEditor.errors.editableContentInvalid",
    PMC_BASELINE_SCAN_POLICY_CONTEXT_INVALID: "genericEditor.errors.baselineContextInvalid",
    PMC_UPDATE_TYPE_UNSUPPORTED: "genericEditor.errors.typeUnsupported",
    PMC_UPDATE_NOT_ALLOWED: "genericEditor.errors.notAllowed",
    PMC_OBJECT_NOT_ACTIVE: "genericEditor.errors.notActive",
    PMC_UPDATE_NAME_INVALID: "genericEditor.errors.nameInvalid",
    PMC_UPDATE_VERSION_INVALID: "genericEditor.errors.versionInvalid",
    PMC_UPDATE_CONTEXT_INVALID: "genericEditor.errors.contextInvalid",
    PMC_UPDATE_URL_INVALID: "genericEditor.errors.urlInvalid",
    PMC_UPDATE_MD5_INVALID: "genericEditor.errors.md5Invalid",
    PMC_UPDATE_RESPONSE_INVALID: "genericEditor.errors.responseInvalid",
    PMC_UPDATE_RESPONSE_MISMATCH: "genericEditor.errors.responseMismatch",
  }
  if (messages[message]) return translate(messages[message])
  if (message.includes("version must be greater")) return translate("genericEditor.errors.versionMustIncrease")
  if (message.includes("version already exists")) return translate("genericEditor.errors.versionExists")
  if (message.includes("subtype cannot be changed")) return translate("genericEditor.errors.subtypeLocked")
  if (message.includes("blocked by active or uncertain execution")) {
    return translate("genericEditor.errors.executionBlocked")
  }
  return message || translate("genericEditor.errors.updateFailed")
}

function editorIssueMessage(
  code: ControlObjectEditorIssue["message"],
  currentVersion: string,
  translate: (key: string, values?: Record<string, string>) => string,
) {
  return translate(`genericEditor.validation.${code}`, { version: currentVersion })
}

function focusEditorField(prefix: string, field: ControlObjectEditorField) {
  if (field === "form") return
  window.requestAnimationFrame(() => document.getElementById(`${prefix}-${field}`)?.focus())
}

export function ControlObjectEditorDialog({
  definition,
  onOpenChange,
  onUpdated,
}: {
  definition: ControlObjectDefinition | null
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}) {
  const t = useTranslations("pages.controlCenter")
  const { toast } = useToast()
  const rawFieldPrefix = useId()
  const fieldPrefix = `control-object-editor-${rawFieldPrefix.replace(/:/g, "")}`
  const [detail, setDetail] = useState<ControlObjectDetail | null>(null)
  const [form, setForm] = useState<ControlObjectEditorForm | null>(null)
  const [initialSignature, setInitialSignature] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [formError, setFormError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)

  useEffect(() => {
    if (!definition) {
      setDetail(null)
      setForm(null)
      setInitialSignature("")
      setLoading(false)
      setSubmitting(false)
      setLoadError("")
      setFormError("")
      setConfirmCloseOpen(false)
      return
    }

    let active = true
    setDetail(null)
    setForm(null)
    setInitialSignature("")
    setLoading(true)
    setLoadError("")
    setFormError("")

    void getControlObjectDefinition(definition)
      .then((result) => {
        if (!active) return
        if (result.definition.objectType === "command" || !result.definition.capabilities.canUpdate) {
          throw new Error(result.definition.objectType === "command"
            ? "PMC_UPDATE_TYPE_UNSUPPORTED"
            : "PMC_UPDATE_NOT_ALLOWED")
        }
        const nextForm = createControlObjectEditorForm(result)
        setDetail(result)
        setForm(nextForm)
        setInitialSignature(controlObjectEditorSignature(nextForm))
      })
      .catch((error: unknown) => {
        if (active) setLoadError(editorErrorMessage(error, (key) => t(key)))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [definition, reloadToken, t])

  const dirty = Boolean(form && initialSignature
    && controlObjectEditorSignature(form) !== initialSignature)
  const hasDefinitionChanges = Boolean(form && detail
    && hasControlObjectDefinitionChanges(form, detail))
  const typeLabel = definition ? t(TYPE_LABELS[definition.objectType]) : t("objectTypes.object")
  const canSubmit = Boolean(form && detail && hasDefinitionChanges && !loading && !submitting)
  const isBaselineScanPolicy = Boolean(detail && isBaselineScanPolicyDefinition(detail.definition))
  const baselineScanSchedule = useMemo(() => {
    if (!isBaselineScanPolicy || !form) return null
    try {
      return readBaselineScanPolicySchedule(form.context)
    } catch {
      return null
    }
  }, [form, isBaselineScanPolicy])
  const baselineScanScheduleText = useMemo<ScanScheduleFormText>(() => ({
    modeLabel: t("genericEditor.schedule.modeLabel"),
    modePlaceholder: t("genericEditor.schedule.modePlaceholder"),
    modeInterval: t("genericEditor.schedule.modeInterval"),
    intervalLabel: t("genericEditor.schedule.intervalLabel"),
    intervalValue: (hours) => t("genericEditor.schedule.hours", { count: hours }),
    fixedTimeLabel: t("genericEditor.schedule.fixedTimeLabel"),
    randomDelayLabel: t("genericEditor.schedule.randomDelayLabel"),
    randomDelayValue: (minutes) => t("genericEditor.schedule.minutes", { count: minutes }),
    retryCountLabel: t("genericEditor.schedule.retryCountLabel"),
    retryIntervalLabel: t("genericEditor.schedule.retryIntervalLabel"),
    retryNone: t("genericEditor.schedule.retryNone"),
    retryTimes: (count) => t("genericEditor.schedule.retryTimes", { count }),
    minutesUnit: t("genericEditor.schedule.minutesUnit"),
    startupTitle: t("genericEditor.schedule.startupTitle"),
    startupDescription: t("genericEditor.schedule.startupDescription"),
    startupInlineLabel: t("genericEditor.schedule.startupInlineLabel"),
  }), [t])

  const fieldError = useMemo(() => {
    if (!formError || !form || !detail) return null
    const issue = validateControlObjectEditorForm(form, detail)
    return issue && editorIssueMessage(issue.message, detail.definition.version, (key, values) => t(key, values)) === formError
      ? issue.field
      : null
  }, [detail, form, formError, t])

  const updateField = <Field extends keyof ControlObjectEditorForm>(
    field: Field,
    value: ControlObjectEditorForm[Field],
  ) => {
    setForm((current) => current ? { ...current, [field]: value } : current)
    setFormError("")
  }

  const updateBaselineScanSchedule = (schedule: ScanSchedule) => {
    if (!detail || !form || !isBaselineScanPolicy) return
    try {
      updateField("context", writeBaselineScanPolicyContext({
        context: form.context,
        definition: detail.definition,
        name: form.name,
        version: form.version,
        schedule,
      }))
    } catch {
      setFormError(t("genericEditor.validation.baselineScheduleUpdateInvalid"))
    }
  }

  const requestClose = () => {
    if (submitting) return
    if (dirty) {
      setConfirmCloseOpen(true)
      return
    }
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!definition || !detail || !form || submitting) return
    const issue = validateControlObjectEditorForm(form, detail)
    if (issue) {
      setFormError(editorIssueMessage(
        issue.message,
        detail.definition.version,
        (key, values) => t(key, values),
      ))
      focusEditorField(fieldPrefix, issue.field)
      return
    }

    setSubmitting(true)
    setFormError("")
    try {
      const updated = await updateControlObjectDefinition(
        detail.definition,
        controlObjectUpdateInput(form, detail.definition),
      )
      toast({
        title: t("genericEditor.toast.updated", { type: typeLabel }),
        description: t("genericEditor.toast.updatedDescription", {
          name: controlObjectDisplayNameKey(updated)
            ? t(controlObjectDisplayNameKey(updated)!)
            : updated.displayName,
          version: updated.version,
        }),
        variant: "success",
      })
      onUpdated()
      onOpenChange(false)
    } catch (error) {
      setFormError(editorErrorMessage(error, (key) => t(key)))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog
        open={Boolean(definition)}
        onOpenChange={(open) => {
          if (!open) requestClose()
        }}
      >
        <DialogContent
          overlayClassName="bg-slate-950/45 backdrop-blur-[2px]"
          closeLabel={t("common.close")}
          className={cn(
            "flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-[880px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl",
            "[&>button]:right-4 [&>button]:top-3.5 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-slate-100 [&>button]:hover:text-slate-800 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-cyan-500",
          )}
        >
          <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 pr-14 text-left sm:px-5 sm:pr-16">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <FilePenLine className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                  {isBaselineScanPolicy
                    ? t("genericEditor.baselineTitle")
                    : t("genericEditor.title", { type: typeLabel })}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("genericEditor.description", {
                    name: definition
                      ? (controlObjectDisplayNameKey(definition)
                          ? t(controlObjectDisplayNameKey(definition)!)
                          : definition.displayName)
                      : t("genericEditor.loadingDefinition"),
                  })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-slate-500" aria-busy="true">
                <LoaderCircle className="h-6 w-6 animate-spin text-cyan-600" aria-hidden="true" />
                <p className="text-sm">{t("genericEditor.loading")}</p>
              </div>
            ) : loadError ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="max-w-md text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <CircleAlert className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-900">{t("genericEditor.loadFailedTitle")}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{loadError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReloadToken((token) => token + 1)}
                    className="mt-4 h-8 rounded-full border-slate-200 px-3"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("common.retry")}
                  </Button>
                </div>
              </div>
            ) : detail && form ? (
              <div className="space-y-4">
                <section aria-labelledby={`${fieldPrefix}-basic-heading`}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-600" aria-hidden="true" />
                    <h3 id={`${fieldPrefix}-basic-heading`} className="text-xs font-semibold text-slate-900">{t("genericEditor.basicInfo")}</h3>
                    <span className="text-[11px] text-slate-400">{t("genericEditor.identityLocked")}</span>
                  </div>

                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`${fieldPrefix}-name`} className="text-xs text-slate-700">{t("genericEditor.name")}</Label>
                      <Input
                        id={`${fieldPrefix}-name`}
                        value={form.name}
                        maxLength={255}
                        aria-invalid={fieldError === "name"}
                        onChange={(event) => updateField("name", event.target.value)}
                        className="h-9 rounded-lg border-slate-200 bg-white text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${fieldPrefix}-version`} className="text-xs text-slate-700">{t("genericEditor.newVersion")}</Label>
                      <Input
                        id={`${fieldPrefix}-version`}
                        value={form.version}
                        aria-invalid={fieldError === "version"}
                        onChange={(event) => updateField("version", event.target.value)}
                        className="h-9 rounded-lg border-slate-200 bg-white font-mono text-sm"
                      />
                      <p className="text-[11px] text-slate-400">{t("genericEditor.currentVersion", { version: detail.definition.version })}</p>
                    </div>
                    <ReadOnlyField label={t("genericEditor.objectType")} value={t(TYPE_LABELS[detail.definition.objectType])} />
                    <ReadOnlyField label={t("genericEditor.subType")} value={String(detail.definition.subType)} mono />
                    <ReadOnlyField label={t("genericEditor.objectId")} value={detail.definition.objectId} mono className="sm:col-span-2" />
                  </div>
                </section>

                {detail.definition.objectType === "config" && (
                  <section className="grid gap-3 sm:grid-cols-2" aria-label={t("genericEditor.downloadInfo")}>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${fieldPrefix}-url`} className="text-xs text-slate-700">{t("genericEditor.downloadUrl")}</Label>
                      <Input
                        id={`${fieldPrefix}-url`}
                        value={form.url}
                        maxLength={512}
                        placeholder={t("genericEditor.optional")}
                        aria-invalid={fieldError === "url"}
                        onChange={(event) => updateField("url", event.target.value)}
                        className="h-9 rounded-lg border-slate-200 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${fieldPrefix}-md5`} className="text-xs text-slate-700">MD5</Label>
                      <Input
                        id={`${fieldPrefix}-md5`}
                        value={form.md5}
                        maxLength={32}
                        placeholder={t("genericEditor.md5Placeholder")}
                        aria-invalid={fieldError === "md5"}
                        onChange={(event) => updateField("md5", event.target.value)}
                        className="h-9 rounded-lg border-slate-200 font-mono text-xs"
                      />
                    </div>
                  </section>
                )}

                {isBaselineScanPolicy && baselineScanSchedule ? (
                  <section
                    id={`${fieldPrefix}-context`}
                    tabIndex={-1}
                    aria-labelledby={`${fieldPrefix}-content-heading`}
                    className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <div className="mb-2.5 flex items-start gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" aria-hidden="true" />
                      <div>
                        <h3 id={`${fieldPrefix}-content-heading`} className="text-xs font-semibold text-slate-900">
                          {t("genericEditor.baselineSchedule")}
                        </h3>
                        <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                          {t("genericEditor.baselineScheduleDescription")}
                        </p>
                      </div>
                    </div>
                    <ScanScheduleForm
                      value={baselineScanSchedule}
                      onChange={updateBaselineScanSchedule}
                      title={null}
                      description={null}
                      text={baselineScanScheduleText}
                      disabled={submitting}
                      className="max-w-none rounded-xl border-slate-200 bg-white shadow-none [&>div]:space-y-4 [&>div]:p-3 sm:[&>div]:p-4"
                    />
                  </section>
                ) : (
                  <section aria-labelledby={`${fieldPrefix}-content-heading`}>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <div>
                        <Label id={`${fieldPrefix}-content-heading`} htmlFor={`${fieldPrefix}-context`} className="text-xs text-slate-700">
                          {t("genericEditor.objectContent")}
                        </Label>
                        <p className="mt-1 text-[11px] text-slate-400">{t("genericEditor.contentHint")}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">{t("genericEditor.characterCount", { count: form.context.length })}</span>
                    </div>
                    <Textarea
                      id={`${fieldPrefix}-context`}
                      value={form.context}
                      spellCheck={false}
                      aria-invalid={fieldError === "context"}
                      onChange={(event) => updateField("context", event.target.value)}
                      className="min-h-[250px] resize-y rounded-xl border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100 focus-visible:ring-cyan-500"
                    />
                  </section>
                )}

                {formError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700" role="alert">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
            <p className="min-w-0 truncate text-xs text-slate-500" aria-live="polite">
              {submitting
                ? t("genericEditor.creatingVersion")
                : hasDefinitionChanges
                  ? t("genericEditor.changedHint")
                  : isBaselineScanPolicy
                    ? t("genericEditor.baselineUnchangedHint")
                    : t("genericEditor.unchangedHint")}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={requestClose} disabled={submitting} className="h-8 rounded-full px-4">
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
                className="h-8 rounded-full bg-cyan-600 px-4 text-white hover:bg-cyan-700"
              >
                {submitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
                {submitting ? t("common.saving") : t("genericEditor.saveVersion")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-slate-200 p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-slate-950">{t("genericEditor.discard.title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-slate-600">
              {t("genericEditor.discard.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-full px-4">{t("genericEditor.discard.continue")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-full bg-rose-600 px-4 text-white hover:bg-rose-700"
            >
              {t("genericEditor.discard.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ReadOnlyField({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <span className="block text-xs font-medium text-slate-700">{label}</span>
      <div
        className={cn(
          "flex h-9 min-w-0 items-center truncate rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600",
          mono && "font-mono text-xs",
        )}
        title={value}
      >
        {value}
      </div>
    </div>
  )
}
