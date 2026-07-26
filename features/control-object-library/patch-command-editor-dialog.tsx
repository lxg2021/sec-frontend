"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  CalendarClock,
  CircleAlert,
  Clock3,
  CopyPlus,
  DatabaseBackup,
  FileText,
  HardDriveDownload,
  ListChecks,
  LoaderCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import {
  createControlObjectCommand,
  getControlObjectDefinition,
  type ControlObjectDefinition,
} from "./api"
import {
  PATCH_COMMAND_SUBTYPE,
  PATCH_INSTALL_TASK_NAME,
  PATCH_ONE_CLICK_REPAIR_NAME,
  patchCommandKind,
  patchCommandParameterSignature,
  patchCommandParameters,
  patchScheduledTimeFromInputValue,
  patchScheduledTimeToInputValue,
  readPatchCommandContext,
  validatePatchCommandParameters,
  writePatchCommandContext,
  type PatchCommandContent,
  type PatchCommandParameters,
  type PatchOperatingSystem,
} from "./patch-command-editor"
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
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"

const OPERATING_SYSTEM_LABELS: Record<PatchOperatingSystem, string> = {
  "": "patchCommand.unspecified",
  windows: "Windows",
  linux: "Linux",
  macOs: "macOS",
}

function editorErrorMessage(error: unknown, translate: (key: string) => string) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    PMC_OBJECT_DETAIL_INVALID: "commandEditors.errors.detailInvalid",
    PMC_OBJECT_DETAIL_MISMATCH: "commandEditors.errors.detailMismatch",
    PMC_OBJECT_EDITABLE_CONTENT_INVALID: "commandEditors.errors.contentIncomplete",
    PMC_PATCH_COMMAND_CONTEXT_INVALID: "patchCommand.errors.contextInvalid",
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

export function PatchCommandEditorDialog({
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
  const fieldPrefix = `patch-command-editor-${rawFieldPrefix.replace(/:/g, "")}`
  const [content, setContent] = useState<PatchCommandContent | null>(null)
  const [parameters, setParameters] = useState<PatchCommandParameters | null>(null)
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
        const nextContent = readPatchCommandContext(
          detail.definition,
          detail.editableContent.context,
        )
        const nextParameters = patchCommandParameters(nextContent)
        setContent(nextContent)
        setParameters(nextParameters)
        setInitialSignature(patchCommandParameterSignature(nextParameters))
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

  const validationMessage = useMemo(() => {
    if (!content || !parameters) return ""
    const code = validatePatchCommandParameters(content.kind, parameters)
    return code ? t(`patchCommand.validation.${code}`) : ""
  }, [content, parameters, t])
  const dirty = Boolean(parameters && initialSignature
    && patchCommandParameterSignature(parameters) !== initialSignature)
  const canSubmit = Boolean(
    definition
    && content
    && parameters
    && dirty
    && !validationMessage
    && !loading
    && !submitting,
  )

  const updateParameter = <Field extends keyof PatchCommandParameters>(
    field: Field,
    value: PatchCommandParameters[Field],
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
      const context = writePatchCommandContext({
        content,
        newObjectId,
        parameters,
      })
      const created = await createControlObjectCommand({
        objectId: newObjectId,
        name: content.kind === "install_task"
          ? PATCH_INSTALL_TASK_NAME
          : PATCH_ONE_CLICK_REPAIR_NAME,
        category: content.category,
        subType: PATCH_COMMAND_SUBTYPE,
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

  const selectedKind = content?.kind ?? (definition ? patchCommandKind(definition) : null)
  const isInstallTask = selectedKind === "install_task"
  const title = isInstallTask ? t("patchCommand.installTitle") : t("patchCommand.repairTitle")

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
            "flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[860px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl",
            "[&>button]:right-4 [&>button]:top-3.5 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-slate-100 [&>button]:hover:text-slate-800 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-cyan-500",
            submitting && "[&>button]:pointer-events-none [&>button]:opacity-50",
          )}
        >
          <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 pr-14 text-left sm:px-5 sm:pr-16">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <HardDriveDownload className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                  {title}
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
                  <SectionHeading
                    id={`${fieldPrefix}-basic-heading`}
                    icon={FileText}
                    iconClassName="text-violet-600"
                    title={t("commandEditors.basicInfo")}
                  />
                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-4">
                    <ReadOnlyField label={t("commandEditors.currentCommandId")} value={definition.objectId} mono className="sm:col-span-2" />
                    <ReadOnlyField label={t("commandEditors.currentVersion")} value={definition.version} mono />
                    <ReadOnlyField label={t("commandEditors.type")} value={t("patchCommand.typeValue")} />
                    <ReadOnlyField
                      label={t("patchCommand.commandContent")}
                      value={isInstallTask ? t("patchCommand.installTask") : t("patchCommand.oneClickRepair")}
                    />
                    <ReadOnlyField
                      label={t("patchCommand.operatingSystem")}
                      value={content.osPlatform ? OPERATING_SYSTEM_LABELS[content.osPlatform] : t(OPERATING_SYSTEM_LABELS[content.osPlatform])}
                    />
                    <ReadOnlyField
                      label={t("patchCommand.targetScope")}
                      value={isInstallTask
                        ? t("patchCommand.hostCount", { count: content.targets.length })
                        : t("patchCommand.allRepairHosts")}
                    />
                    <ReadOnlyField
                      label={isInstallTask ? t("patchCommand.patchCountLabel") : t("patchCommand.patchScope")}
                      value={isInstallTask
                        ? t("patchCommand.patchCount", { count: content.uniquePatchCount })
                        : t("patchCommand.allMissingPatches")}
                    />
                  </div>
                </section>

                {isInstallTask && (
                  <section aria-labelledby={`${fieldPrefix}-targets-heading`}>
                    <SectionHeading
                      id={`${fieldPrefix}-targets-heading`}
                      icon={ListChecks}
                      iconClassName="text-blue-600"
                      title={t("patchCommand.targetsTitle")}
                      aside={t("patchCommand.targetsLocked")}
                    />
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                      {content.targets.map((target) => (
                        <div
                          key={target.agentId}
                          className="grid min-w-0 gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]"
                        >
                          <div className="min-w-0">
                            <span className="block text-[11px] text-slate-500">Agent ID</span>
                            <span className="block truncate font-mono text-xs text-slate-700" title={target.agentId}>
                              {target.agentId}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[11px] text-slate-500">{t("patchCommand.patchGuidCount", { count: target.patchGuids.length })}</span>
                            <span className="block truncate font-mono text-xs text-slate-700" title={target.patchGuids.join(t("common.listSeparator"))}>
                              {target.patchGuids.join(t("common.listSeparator"))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section aria-labelledby={`${fieldPrefix}-parameters-heading`}>
                  <SectionHeading
                    id={`${fieldPrefix}-parameters-heading`}
                    icon={Wrench}
                    iconClassName="text-cyan-600"
                    title={t("patchCommand.parameters")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {isInstallTask ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                        <Label htmlFor={`${fieldPrefix}-task-name`} className="text-xs font-medium text-slate-800">
                          {t("patchCommand.taskName")}
                        </Label>
                        <Input
                          id={`${fieldPrefix}-task-name`}
                          value={parameters.taskName}
                          maxLength={128}
                          disabled={submitting}
                          onChange={(event) => updateParameter("taskName", event.target.value)}
                          className="mt-2 h-9 rounded-lg border-slate-200 bg-white text-sm"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <Label htmlFor={`${fieldPrefix}-os`} className="text-xs font-medium text-slate-800">
                          {t("patchCommand.operatingSystem")}
                        </Label>
                        <Select
                          value={parameters.osPlatform || "unspecified"}
                          disabled={submitting}
                          onValueChange={(value) => updateParameter(
                            "osPlatform",
                            value === "unspecified" ? "" : value as PatchOperatingSystem,
                          )}
                        >
                          <SelectTrigger id={`${fieldPrefix}-os`} className="mt-2 h-9 rounded-lg border-slate-200 bg-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unspecified">{t("patchCommand.unspecified")}</SelectItem>
                            <SelectItem value="windows">Windows</SelectItem>
                            <SelectItem value="linux">Linux</SelectItem>
                            <SelectItem value="macOs">macOS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <Label htmlFor={`${fieldPrefix}-execution`} className="inline-flex items-center gap-2 text-xs font-medium text-slate-800">
                        <PlayCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        {t("patchCommand.executionMode")}
                      </Label>
                      <Select
                        value={parameters.executionMode}
                        disabled={submitting}
                        onValueChange={(value) => updateParameter(
                          "executionMode",
                          value as PatchCommandParameters["executionMode"],
                        )}
                      >
                        <SelectTrigger id={`${fieldPrefix}-execution`} className="mt-2 h-9 rounded-lg border-slate-200 bg-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">{t("patchCommand.immediate")}</SelectItem>
                          <SelectItem value="scheduled">{t("patchCommand.scheduled")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {parameters.executionMode === "scheduled" && (
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <Label htmlFor={`${fieldPrefix}-scheduled-time`} className="inline-flex items-center gap-2 text-xs font-medium text-slate-800">
                          <CalendarClock className="h-4 w-4 text-violet-600" aria-hidden="true" />
                          {t("patchCommand.scheduledTime")}
                        </Label>
                        <Input
                          id={`${fieldPrefix}-scheduled-time`}
                          type="datetime-local"
                          step={1}
                          value={patchScheduledTimeToInputValue(parameters.scheduledTime)}
                          disabled={submitting}
                          onChange={(event) => updateParameter(
                            "scheduledTime",
                            patchScheduledTimeFromInputValue(event.target.value),
                          )}
                          className="mt-2 h-9 rounded-lg border-slate-200 bg-white text-sm"
                        />
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <Label htmlFor={`${fieldPrefix}-delay`} className="inline-flex items-center gap-2 text-xs font-medium text-slate-800">
                        <Clock3 className="h-4 w-4 text-amber-600" aria-hidden="true" />
                        {t("patchCommand.randomDelay")}
                      </Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          id={`${fieldPrefix}-delay`}
                          type="number"
                          min={0}
                          max={120}
                          step={1}
                          value={Number.isFinite(parameters.randomDelayMinutes) ? parameters.randomDelayMinutes : ""}
                          disabled={submitting}
                          onChange={(event) => updateParameter(
                            "randomDelayMinutes",
                            event.target.value === "" ? Number.NaN : Number(event.target.value),
                          )}
                          className="h-9 rounded-lg border-slate-200 bg-white text-sm"
                        />
                        <span className="shrink-0 text-xs text-slate-500">{t("patchCommand.minutes")}</span>
                      </div>
                    </div>

                    <ParameterSwitch
                      id={`${fieldPrefix}-reboot`}
                      icon={RotateCcw}
                      iconClassName="text-rose-600"
                      label={t("patchCommand.rebootAfterInstall")}
                      checked={parameters.rebootAfterInstall}
                      disabled={submitting}
                      onCheckedChange={(checked) => updateParameter("rebootAfterInstall", checked)}
                    />
                    <ParameterSwitch
                      id={`${fieldPrefix}-backup`}
                      icon={DatabaseBackup}
                      iconClassName="text-cyan-600"
                      label={t("patchCommand.backupBeforeInstall")}
                      checked={parameters.backupBeforeRepair}
                      disabled={submitting}
                      onCheckedChange={(checked) => updateParameter("backupBeforeRepair", checked)}
                    />
                    <ParameterSwitch
                      id={`${fieldPrefix}-rescan`}
                      icon={RefreshCw}
                      iconClassName="text-blue-600"
                      label={t("patchCommand.rescanAfterRepair")}
                      checked={parameters.rescanAfterRepair}
                      disabled={submitting}
                      onCheckedChange={(checked) => updateParameter("rescanAfterRepair", checked)}
                    />
                  </div>
                </section>

                {(parameters.rebootAfterInstall || !parameters.backupBeforeRepair) && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800" role="alert">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <div>
                      {parameters.rebootAfterInstall && <p>{t("patchCommand.warnings.reboot")}</p>}
                      {!parameters.backupBeforeRepair && <p>{t("patchCommand.warnings.backupDisabled")}</p>}
                    </div>
                  </div>
                )}

                {validationMessage && dirty && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700" role="alert">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{validationMessage}</span>
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
                  : t("patchCommand.unchangedHint")}
            </p>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={requestClose}
                disabled={submitting}
                className="h-8 rounded-full px-4"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
                className="h-8 rounded-full bg-cyan-600 px-4 text-white hover:bg-cyan-700"
              >
                {submitting
                  ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  : <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />}
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
              {t("patchCommand.discardDescription")}
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

function SectionHeading({
  id,
  icon: Icon,
  iconClassName,
  title,
  aside,
}: {
  id: string
  icon: LucideIcon
  iconClassName: string
  title: string
  aside?: string
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} aria-hidden="true" />
      <h3 id={id} className="text-xs font-semibold text-slate-900">{title}</h3>
      {aside && <span className="ml-auto text-[11px] text-slate-400">{aside}</span>}
    </div>
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
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  icon: LucideIcon
  iconClassName: string
  label: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3">
      <Label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-800">
        <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0 data-[state=checked]:bg-cyan-600"
      />
    </div>
  )
}
