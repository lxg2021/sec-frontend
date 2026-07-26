"use client"

import { useEffect, useId, useState } from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  CircleAlert,
  CopyPlus,
  DatabaseBackup,
  FileText,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react"

import {
  createControlObjectCommand,
  getControlObjectDefinition,
  type ControlObjectDefinition,
} from "./api"
import {
  BASELINE_ONE_CLICK_REPAIR_NAME,
  BASELINE_ONE_CLICK_REPAIR_SUBTYPE,
  baselineRepairCommandParameterSignature,
  baselineRepairCommandParameters,
  readBaselineRepairCommandContext,
  writeBaselineRepairCommandContext,
  type BaselineRepairCommandContent,
  type BaselineRepairCommandParameters,
  type BaselineRepairSource,
} from "./baseline-repair-command-editor"
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
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"

function editorErrorMessage(error: unknown, translate: (key: string) => string) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    PMC_OBJECT_DETAIL_INVALID: "commandEditors.errors.detailInvalid",
    PMC_OBJECT_DETAIL_MISMATCH: "commandEditors.errors.detailMismatch",
    PMC_OBJECT_EDITABLE_CONTENT_INVALID: "commandEditors.errors.contentIncomplete",
    PMC_BASELINE_REPAIR_COMMAND_CONTEXT_INVALID: "baselineRepairCommand.errors.contextInvalid",
    PMC_CREATE_OBJECT_ID_INVALID: "commandEditors.errors.objectIdInvalid",
    PMC_CREATE_NAME_INVALID: "commandEditors.errors.nameInvalid",
    PMC_CREATE_CATEGORY_INVALID: "commandEditors.errors.categoryInvalid",
    PMC_CREATE_SUBTYPE_INVALID: "commandEditors.errors.subTypeInvalid",
    PMC_CREATE_CONTEXT_INVALID: "commandEditors.errors.contextRequired",
    PMC_CREATE_RESPONSE_INVALID: "commandEditors.errors.responseInvalid",
    PMC_CREATE_RESPONSE_MISMATCH: "commandEditors.errors.responseMismatch",
    PMC_RANDOM_UUID_UNAVAILABLE: "commandEditors.errors.uuidUnavailable",
  }
  if (messages[message]) return translate(messages[message])
  if (message.includes("object version already exists") || message.includes("already exists")) {
    return translate("commandEditors.errors.idExists")
  }
  return message || translate("commandEditors.errors.createFailed")
}

function createCommandObjectId() {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("PMC_RANDOM_UUID_UNAVAILABLE")
  }
  return globalThis.crypto.randomUUID()
}

export function BaselineRepairCommandEditorDialog({
  definition,
  onOpenChange,
  onCreated,
}: {
  definition: ControlObjectDefinition | null
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const t = useTranslations("pages.controlCenter")
  const { toast } = useToast()
  const rawFieldPrefix = useId()
  const fieldPrefix = `baseline-repair-command-editor-${rawFieldPrefix.replace(/:/g, "")}`
  const [content, setContent] = useState<BaselineRepairCommandContent | null>(null)
  const [parameters, setParameters] = useState<BaselineRepairCommandParameters | null>(null)
  const [initialSignature, setInitialSignature] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)

  useEffect(() => {
    if (!definition) {
      setContent(null)
      setParameters(null)
      setInitialSignature("")
      setLoading(false)
      setSubmitting(false)
      setLoadError("")
      setSubmitError("")
      setConfirmCloseOpen(false)
      return
    }

    let active = true
    setContent(null)
    setParameters(null)
    setInitialSignature("")
    setLoading(true)
    setLoadError("")
    setSubmitError("")

    void getControlObjectDefinition(definition)
      .then((detail) => {
        if (!active) return
        const nextContent = readBaselineRepairCommandContext(
          detail.definition,
          detail.editableContent.context,
        )
        const nextParameters = baselineRepairCommandParameters(nextContent)
        setContent(nextContent)
        setParameters(nextParameters)
        setInitialSignature(baselineRepairCommandParameterSignature(nextParameters))
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

  const dirty = Boolean(parameters && initialSignature
    && baselineRepairCommandParameterSignature(parameters) !== initialSignature)
  const canSubmit = Boolean(definition && content && parameters && dirty && !loading && !submitting)

  const updateParameter = <Field extends keyof BaselineRepairCommandParameters>(
    field: Field,
    value: BaselineRepairCommandParameters[Field],
  ) => {
    setParameters((current) => current ? { ...current, [field]: value } : current)
    setSubmitError("")
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
    if (!definition || !content || !parameters || !canSubmit) return
    setSubmitting(true)
    setSubmitError("")

    try {
      const newObjectId = createCommandObjectId()
      const context = writeBaselineRepairCommandContext({
        content,
        newObjectId,
        parameters,
      })
      const created = await createControlObjectCommand({
        objectId: newObjectId,
        name: BASELINE_ONE_CLICK_REPAIR_NAME,
        category: content.category,
        subType: BASELINE_ONE_CLICK_REPAIR_SUBTYPE,
        context,
      })
      toast({
        title: t("commandEditors.toast.created"),
        description: t("commandEditors.toast.createdDescription", { id: created.objectId }),
        variant: "success",
      })
      onCreated()
      onOpenChange(false)
    } catch (error) {
      setSubmitError(editorErrorMessage(error, (key) => t(key)))
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
            "flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[780px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl",
            "[&>button]:right-4 [&>button]:top-3.5 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-slate-100 [&>button]:hover:text-slate-800 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-cyan-500",
            submitting && "[&>button]:pointer-events-none [&>button]:opacity-50",
          )}
        >
          <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 pr-14 text-left sm:px-5 sm:pr-16">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                  {t("baselineRepairCommand.title")}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t("commandEditors.description")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-slate-500" aria-busy="true">
                <LoaderCircle className="h-6 w-6 animate-spin text-cyan-600" aria-hidden="true" />
                <p className="text-sm">{t("commandEditors.loading")}</p>
              </div>
            ) : loadError ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="max-w-md text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <CircleAlert className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-900">{t("commandEditors.loadFailedTitle")}</p>
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
            ) : definition && content && parameters ? (
              <div className="space-y-4">
                <section aria-labelledby={`${fieldPrefix}-basic-heading`}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-600" aria-hidden="true" />
                    <h3 id={`${fieldPrefix}-basic-heading`} className="text-xs font-semibold text-slate-900">{t("commandEditors.basicInfo")}</h3>
                  </div>
                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-3">
                    <ReadOnlyField label={t("commandEditors.currentCommandId")} value={definition.objectId} mono className="sm:col-span-2" />
                    <ReadOnlyField label={t("commandEditors.currentVersion")} value={definition.version} mono />
                    <ReadOnlyField label={t("commandEditors.type")} value={t("objectTypes.command")} />
                    <ReadOnlyField label={t("commandEditors.subType")} value={t("baselineRepairCommand.subTypeValue")} />
                    <ReadOnlyField label={t("baselineRepairCommand.repairMode")} value={t("baselineRepairCommand.repairModeValue")} />
                    <ReadOnlyField label={t("baselineRepairCommand.baselineFileName")} value={content.baselineName} className="sm:col-span-2" icon={FileText} />
                    <ReadOnlyField label={t("baselineRepairCommand.baselineUuid")} value={content.baselineUuid} mono />
                  </div>
                </section>

                <section aria-labelledby={`${fieldPrefix}-parameters-heading`}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <Wrench className="h-4 w-4 shrink-0 text-cyan-600" aria-hidden="true" />
                    <h3 id={`${fieldPrefix}-parameters-heading`} className="text-xs font-semibold text-slate-900">{t("baselineRepairCommand.parameters")}</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <Label htmlFor={`${fieldPrefix}-source`} className="text-xs font-medium text-slate-800">{t("baselineRepairCommand.sourceType")}</Label>
                      <p className="mt-1 text-[11px] leading-4 text-slate-500">{t("baselineRepairCommand.sourceDescription")}</p>
                      <Select
                        value={parameters.source}
                        disabled={submitting}
                        onValueChange={(value) => updateParameter("source", value as BaselineRepairSource)}
                      >
                        <SelectTrigger id={`${fieldPrefix}-source`} className="mt-2 h-9 rounded-lg border-slate-200 bg-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GPO">GPO</SelectItem>
                          <SelectItem value="Intune">Intune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <ParameterSwitch
                      id={`${fieldPrefix}-backup`}
                      icon={DatabaseBackup}
                      iconClassName="text-cyan-600"
                      label={t("baselineRepairCommand.backup")}
                      description={t("baselineRepairCommand.backupDescription")}
                      checked={parameters.backupBeforeRepair}
                      disabled={submitting}
                      onCheckedChange={(checked) => updateParameter("backupBeforeRepair", checked)}
                    />
                    <ParameterSwitch
                      id={`${fieldPrefix}-rescan`}
                      icon={RefreshCw}
                      iconClassName="text-blue-600"
                      label={t("baselineRepairCommand.rescan")}
                      description={t("baselineRepairCommand.rescanDescription")}
                      checked={parameters.rescanAfterRepair}
                      disabled={submitting}
                      onCheckedChange={(checked) => updateParameter("rescanAfterRepair", checked)}
                    />
                    <ParameterSwitch
                      id={`${fieldPrefix}-restore-point`}
                      icon={RotateCcw}
                      iconClassName="text-rose-600"
                      label={t("baselineRepairCommand.skipRestorePoint")}
                      description={t("baselineRepairCommand.skipRestorePointDescription")}
                      checked={parameters.skipRestorePoint}
                      disabled={submitting}
                      onCheckedChange={(checked) => updateParameter("skipRestorePoint", checked)}
                    />
                  </div>
                </section>

                {(!parameters.backupBeforeRepair || parameters.skipRestorePoint) && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800" role="alert">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <div>
                      {!parameters.backupBeforeRepair && <p>{t("baselineRepairCommand.warnings.backupDisabled")}</p>}
                      {parameters.skipRestorePoint && <p>{t("baselineRepairCommand.warnings.restorePointSkipped")}</p>}
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700" role="alert">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="min-w-0 text-[11px] leading-5 text-slate-500" aria-live="polite">
              {submitting
                ? t("commandEditors.creating")
                : dirty
                  ? t("commandEditors.changedHint")
                  : t("baselineRepairCommand.unchangedHint")}
            </p>
            <div className="flex shrink-0 items-center justify-end gap-2">
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
                {submitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />}
                {submitting ? t("commandEditors.creatingShort") : t("commandEditors.saveAsNew")}
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
              {t("baselineRepairCommand.discardDescription")}
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
  icon: Icon,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
  icon?: typeof FileText
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <span className="block text-xs font-medium text-slate-700">{label}</span>
      <div
        className={cn(
          "flex h-9 min-w-0 items-center gap-2 truncate rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600",
          mono && "font-mono text-xs",
        )}
        title={value}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  )
}

function ParameterSwitch({
  id,
  icon: Icon,
  iconClassName,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  icon: typeof DatabaseBackup
  iconClassName: string
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex min-h-[92px] items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-800">
          <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
          {label}
        </Label>
        <p id={`${id}-description`} className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={`${id}-description`}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0 data-[state=checked]:bg-cyan-600"
      />
    </div>
  )
}
