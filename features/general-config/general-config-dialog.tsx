"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  CheckCircle2,
  CircleAlert,
  FileCog,
  Info,
  Loader2,
  RotateCcw,
  Server,
  SlidersHorizontal,
  TerminalSquare,
  X,
} from "lucide-react"

import {
  compareGeneralConfigVersions,
  GENERAL_CONFIG_DEFAULTS,
  GENERAL_CONFIG_INTERNAL_NAME,
  GENERAL_CONFIG_MODULE,
  getGeneralConfig,
  suggestNextGeneralConfigVersion,
  updateGeneralConfig,
  type GeneralConfigDefinition,
} from "@/features/general-config/api"
import {
  GENERAL_CONFIG_LOG_LEVEL_OPTIONS,
  isGeneralConfigLogLevel,
} from "@/features/general-config/log-levels"
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

interface GeneralConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (definition: GeneralConfigDefinition) => void
}

interface GeneralConfigDraft {
  version: string
  heartInterval: string
  logLevel: string
}

type ValidationField = keyof GeneralConfigDraft

interface ValidationIssue {
  field: ValidationField
  message: string
}

const EMPTY_DRAFT: GeneralConfigDraft = {
  version: "",
  heartInterval: "",
  logLevel: "",
}

function draftSignature(draft: GeneralConfigDraft) {
  return JSON.stringify({
    version: draft.version.trim(),
    heartInterval: draft.heartInterval.trim(),
    logLevel: draft.logLevel.trim(),
  })
}

function parseInteger(value: string, minimum: number) {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isSafeInteger(parsed) || parsed < minimum) return null
  return parsed
}

function parseLogLevel(value: string) {
  const parsed = parseInteger(value, 0)
  return parsed !== null && isGeneralConfigLogLevel(parsed) ? parsed : null
}

function validateDraft(
  draft: GeneralConfigDraft,
  baseVersion: string,
  translate: (key: string, values?: Record<string, string>) => string,
): ValidationIssue | null {
  const comparison = compareGeneralConfigVersions(draft.version, baseVersion)
  if (comparison === null) {
    return { field: "version", message: translate("generalConfig.validation.versionFormat") }
  }
  if (comparison <= 0) {
    return { field: "version", message: translate("generalConfig.validation.versionNotGreater", { version: baseVersion }) }
  }
  if (parseInteger(draft.heartInterval, 1) === null) {
    return { field: "heartInterval", message: translate("generalConfig.validation.heartInterval") }
  }
  if (parseLogLevel(draft.logLevel) === null) {
    return { field: "logLevel", message: translate("generalConfig.validation.logLevel") }
  }
  return null
}

function errorMessage(error: unknown, fallback: string, translate: (key: string) => string) {
  if (error instanceof Error && error.message.trim()) {
    if (error.message === "GENERAL_CONFIG_VERSION_SUGGESTION_INVALID") {
      return translate("generalConfig.errors.versionSuggestion")
    }
    return error.message
  }
  return fallback
}

export function GeneralConfigDialog({
  open,
  onOpenChange,
  onUpdated,
}: GeneralConfigDialogProps) {
  const t = useTranslations("pages.controlCenter")
  const { toast } = useToast()
  const requestSequence = useRef(0)
  const [definition, setDefinition] = useState<GeneralConfigDefinition | null>(null)
  const [draft, setDraft] = useState<GeneralConfigDraft>(EMPTY_DRAFT)
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
      const current = await getGeneralConfig()
      if (sequence !== requestSequence.current) return

      const nextVersion = suggestNextGeneralConfigVersion(current.baseVersion)
      if (!nextVersion) throw new Error("GENERAL_CONFIG_VERSION_SUGGESTION_INVALID")
      const nextDraft = {
        version: nextVersion,
        heartInterval: String(current.heartInterval),
        logLevel: String(current.logLevel),
      }
      setDefinition(current)
      setDraft(nextDraft)
      setInitialSignature(draftSignature(nextDraft))
    } catch (error) {
      if (sequence !== requestSequence.current) return
      setLoadError(errorMessage(error, t("generalConfig.errors.loadFailed"), (key) => t(key)))
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
    const suggestedVersion = suggestNextGeneralConfigVersion(definition.baseVersion)
    return [
      draft.version.trim() !== suggestedVersion,
      draft.heartInterval.trim() !== String(definition.heartInterval),
      draft.logLevel.trim() !== String(definition.logLevel),
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
      heartInterval: String(GENERAL_CONFIG_DEFAULTS.heartInterval),
      logLevel: String(GENERAL_CONFIG_DEFAULTS.logLevel),
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
      setRequestError(t("generalConfig.errors.notAllowed"))
      return
    }

    const issue = validateDraft(draft, definition.baseVersion, (key, values) => t(key, values))
    if (issue) {
      setValidationIssue(issue)
      setRequestError("")
      window.requestAnimationFrame(() => {
        document.getElementById(`general-config-${issue.field}`)?.focus()
      })
      return
    }

    setValidationIssue(null)
    setRequestError("")
    setSubmitting(true)
    try {
      const updated = await updateGeneralConfig({
        version: draft.version.trim(),
        heartInterval: parseInteger(draft.heartInterval, 1)!,
        logLevel: parseLogLevel(draft.logLevel)!,
      })
      toast({
        variant: "success",
        duration: 4500,
        title: t("generalConfig.toast.created"),
        description: t("generalConfig.toast.createdDescription", { version: updated.baseVersion }),
      })
      onUpdated?.(updated)
      onOpenChange(false)
    } catch (error) {
      const message = errorMessage(error, t("generalConfig.errors.createFailed"), (key) => t(key))
      setRequestError(message)
      toast({
        variant: "destructive",
        duration: 4500,
        title: t("generalConfig.toast.failed"),
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
            "max-h-[92dvh] w-[calc(100vw-1rem)] max-w-[760px] gap-0 overflow-hidden p-0 sm:h-[420px] sm:rounded-2xl",
            "[&>button]:hidden",
          )}
        >
          <div className="flex max-h-[92dvh] min-h-0 flex-col bg-white sm:h-full">
            <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <SlidersHorizontal className="h-4 w-4 shrink-0" />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                    {t("generalConfig.title")}
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
                  aria-label={t("generalConfig.closeAriaLabel")}
                  title={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="sr-only">
                {t("generalConfig.description")}
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
                    <p className="mt-3 text-sm font-semibold text-rose-900">{t("generalConfig.loadFailedTitle")}</p>
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
                      {t("generalConfig.reload")}
                    </Button>
                  </div>
                )}

                {!loading && definition && (
                  <TooltipProvider delayDuration={250}>
                    <section aria-labelledby="general-config-basic-title">
                      <div className="mb-3 flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-cyan-700" />
                        <h3 id="general-config-basic-title" className="text-sm font-semibold text-slate-900">
                          {t("genericEditor.basicInfo")}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                        <ReadOnlyField label={t("generalConfig.configName")}>
                          <span className="truncate">{t("builtinObjects.generalConfig")}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                aria-label={t("generalConfig.internalInfoAriaLabel")}
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent className="z-[80] max-w-xs text-xs leading-5">
                                {t("generalConfig.internalName", { name: GENERAL_CONFIG_INTERNAL_NAME })}<br />{t("generalConfig.module", { module: GENERAL_CONFIG_MODULE })}
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
                          htmlFor="general-config-version"
                          error={validationIssue?.field === "version" ? validationIssue.message : undefined}
                        >
                          <div className="relative">
                            <Input
                              id="general-config-version"
                              value={draft.version}
                              onChange={(event) => updateField("version", event.target.value)}
                              maxLength={64}
                              className="h-10 bg-white pr-9 font-mono"
                              placeholder={t("sensorConfig.versionPlaceholder")}
                              disabled={submitting}
                              aria-invalid={validationIssue?.field === "version"}
                            />
                            {compareGeneralConfigVersions(draft.version, definition.baseVersion) === 1 && (
                              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                            )}
                          </div>
                        </FormField>
                      </div>
                    </section>

                    <section aria-labelledby="general-config-parameters-title">
                      <div className="mb-3 flex items-center gap-2">
                        <TerminalSquare className="h-4 w-4 text-cyan-700" />
                        <h3 id="general-config-parameters-title" className="text-sm font-semibold text-slate-900">
                          {t("generalConfig.runtimeParameters")}
                        </h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          label={t("generalConfig.heartInterval")}
                          htmlFor="general-config-heartInterval"
                          error={
                            validationIssue?.field === "heartInterval"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <div className="relative">
                            <Input
                              id="general-config-heartInterval"
                              value={draft.heartInterval}
                              onChange={(event) => updateField("heartInterval", event.target.value)}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="h-10 bg-white pr-12 tabular-nums"
                              disabled={submitting}
                              aria-invalid={validationIssue?.field === "heartInterval"}
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                              {t("generalConfig.seconds")}
                            </span>
                          </div>
                        </FormField>

                        <FormField
                          label={t("generalConfig.logLevel")}
                          htmlFor="general-config-logLevel"
                          error={
                            validationIssue?.field === "logLevel"
                              ? validationIssue.message
                              : undefined
                          }
                        >
                          <Select
                            value={draft.logLevel}
                            onValueChange={(value) => updateField("logLevel", value)}
                            disabled={submitting}
                          >
                            <SelectTrigger
                              id="general-config-logLevel"
                              className="h-10 bg-white"
                              disabled={submitting}
                              aria-invalid={validationIssue?.field === "logLevel"}
                            >
                              <SelectValue placeholder={t("generalConfig.logLevelPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              side="top"
                              align="end"
                              sideOffset={4}
                              avoidCollisions={false}
                              className="z-[80]"
                            >
                              {GENERAL_CONFIG_LOG_LEVEL_OPTIONS.map((option) => (
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
                        {t("generalConfig.notAllowedDescription")}
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
                      <span>{t("generalConfig.loading")}</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>{t("generalConfig.modifiedCount", { count: modifiedFieldCount })}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{definition ? t("sensorConfig.noUnsaved") : t("generalConfig.waiting")}</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-cyan-200 bg-cyan-50 px-4 text-cyan-800 hover:bg-cyan-100 hover:text-cyan-900"
                    onClick={restoreBuiltInDefaults}
                    disabled={!definition || loading || submitting}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("generalConfig.restoreDefaults")}
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
                    className="h-10 rounded-full bg-cyan-700 px-5 hover:bg-cyan-800"
                    onClick={() => void saveNewVersion()}
                    disabled={!definition || loading || submitting || !definition.canUpdate}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("generalConfig.creating")}
                      </>
                    ) : (
                      <>
                        <FileCog className="h-4 w-4" />
                        {t("sensorConfig.validateAndCreate")}
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
            <AlertDialogTitle>{t("generalConfig.discard.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("generalConfig.discard.description")}
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

function LoadingState() {
  const t = useTranslations("pages.controlCenter")
  return (
    <div className="space-y-4" aria-label={t("generalConfig.loadingAriaLabel")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-14 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded-md bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="space-y-2">
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
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={htmlFor} className="block text-xs font-medium leading-4 text-slate-600">
        {label} <span className="text-rose-500">*</span>
      </Label>
      {children}
      {error && (
        <p className="text-xs leading-5 text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
