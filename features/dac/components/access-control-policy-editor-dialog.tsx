"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CircleAlert,
  FileText,
  ListChecks,
  LoaderCircle,
  Network,
  PlaySquare,
  RotateCcw,
  Save,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  buildEditableAccessControlDraft,
  buildUpdatedAccessControlPolicyContext,
  getAccessControlContentFingerprint,
  getAccessPolicyTypeBySubType,
  validateAccessControlDraft,
} from "../api"
import { getAccessControlCopy } from "../access-control-copy"
import type {
  AccessControlPolicyDraft,
  AccessPolicyType,
  ExistingAccessControlPolicy,
} from "../access-control-types"
import {
  PolicyConfigurationPanel,
  PolicyDefinitionBar,
} from "./access-control-wizard"
import {
  compareControlObjectVersions,
  getControlObjectDefinition,
  suggestNextControlObjectVersion,
  updateControlObjectDefinition,
  type ControlObjectDefinition,
  type ControlObjectDetail,
} from "@/features/control-object-library/api"
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

const POLICY_ICONS: Record<AccessPolicyType, typeof FileText> = {
  file: FileText,
  registry: ListChecks,
  process: PlaySquare,
  network: Network,
}

function editorErrorMessage(error: unknown, translate: (key: string) => string) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    ACCESS_POLICY_CONTEXT_INVALID: "accessPolicyEditor.errors.contextInvalid",
    ACCESS_POLICY_CONTEXT_IDENTITY_MISMATCH: "accessPolicyEditor.errors.identityMismatch",
    ACCESS_POLICY_CONTEXT_TYPE_MISMATCH: "accessPolicyEditor.errors.typeMismatch",
    ACCESS_POLICY_CONTEXT_UNSUPPORTED: "accessPolicyEditor.errors.contextUnsupported",
    ACCESS_POLICY_TYPE_CHANGE_FORBIDDEN: "accessPolicyEditor.errors.typeChangeForbidden",
    PMC_OBJECT_EDITABLE_CONTENT_INVALID: "accessPolicyEditor.errors.editableContentInvalid",
    PMC_OBJECT_DETAIL_INVALID: "accessPolicyEditor.errors.detailInvalid",
    PMC_OBJECT_DETAIL_MISMATCH: "accessPolicyEditor.errors.detailMismatch",
    PMC_UPDATE_NOT_ALLOWED: "accessPolicyEditor.errors.notAllowed",
    PMC_OBJECT_NOT_ACTIVE: "accessPolicyEditor.errors.notActive",
    PMC_UPDATE_VERSION_INVALID: "accessPolicyEditor.errors.versionInvalid",
    PMC_UPDATE_RESPONSE_INVALID: "accessPolicyEditor.errors.responseInvalid",
    PMC_UPDATE_RESPONSE_MISMATCH: "accessPolicyEditor.errors.responseMismatch",
  }
  return messages[message]
    ? translate(messages[message])
    : message || translate("accessPolicyEditor.errors.loadFailed")
}

function existingPolicyFromDetail(detail: ControlObjectDetail): ExistingAccessControlPolicy {
  const policyType = getAccessPolicyTypeBySubType(detail.definition.subType)
  if (
    detail.definition.objectType !== "policy"
    || !policyType
    || detail.editableContent.subType !== detail.definition.subType
    || detail.editableContent.version !== detail.definition.version
  ) {
    throw new Error("ACCESS_POLICY_CONTEXT_TYPE_MISMATCH")
  }

  return {
    objectId: detail.definition.objectId,
    objectType: 1,
    name: detail.editableContent.name,
    version: detail.editableContent.version,
    policyType,
    subType: detail.definition.subType,
    context: detail.editableContent.context,
    objectState: detail.definition.state,
  }
}

function validationMessage(
  draft: AccessControlPolicyDraft,
  currentVersion: string,
  hasContentChanges: boolean,
  translate: (key: string, values?: Record<string, string>) => string,
) {
  const versionComparison = compareControlObjectVersions(draft.version, currentVersion)
  if (versionComparison === null) return translate("accessPolicyEditor.validation.versionFormat")
  if (versionComparison <= 0) return translate("accessPolicyEditor.validation.versionNotGreater", { version: currentVersion })

  const errors = validateAccessControlDraft(draft)
  if (errors.some((error) => error.startsWith("POLICY_"))) {
    return translate("accessPolicyEditor.validation.policyFields")
  }
  if (draft.type === "network" && errors.length > 0) {
    return translate("accessPolicyEditor.validation.networkFields")
  }
  if (errors.length > 0) {
    return translate("accessPolicyEditor.validation.ruleFields")
  }
  if (!hasContentChanges) return translate("accessPolicyEditor.validation.unchanged")
  return ""
}

export function AccessControlPolicyEditorDialog({
  definition,
  onOpenChange,
  onUpdated,
}: {
  definition: ControlObjectDefinition | null
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}) {
  const locale = useLocale()
  const t = useTranslations("pages.controlCenter")
  const copy = useMemo(() => getAccessControlCopy(locale), [locale])
  const { toast } = useToast()
  const forceCloseRef = useRef(false)
  const [detail, setDetail] = useState<ControlObjectDetail | null>(null)
  const [policy, setPolicy] = useState<ExistingAccessControlPolicy | null>(null)
  const [draft, setDraft] = useState<AccessControlPolicyDraft | null>(null)
  const [initialContentFingerprint, setInitialContentFingerprint] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [formError, setFormError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)

  useEffect(() => {
    if (!definition) {
      setDetail(null)
      setPolicy(null)
      setDraft(null)
      setInitialContentFingerprint("")
      setLoadError("")
      setFormError("")
      setConfirmCloseOpen(false)
      return
    }

    let active = true
    setLoading(true)
    setLoadError("")
    setFormError("")
    setDetail(null)
    setPolicy(null)
    setDraft(null)
    setInitialContentFingerprint("")

    void getControlObjectDefinition(definition)
      .then((result) => {
        if (!active) return
        const existingPolicy = existingPolicyFromDetail(result)
        const currentDraft = buildEditableAccessControlDraft(existingPolicy)
        const nextVersion = suggestNextControlObjectVersion(existingPolicy.version)
        if (!nextVersion) throw new Error("PMC_UPDATE_VERSION_INVALID")

        setDetail(result)
        setPolicy(existingPolicy)
        setDraft({ ...currentDraft, version: nextVersion })
        setInitialContentFingerprint(getAccessControlContentFingerprint(currentDraft))
      })
      .catch((error) => {
        if (active) setLoadError(editorErrorMessage(error, (key) => t(key)))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [definition, reloadToken, t])

  const currentContentFingerprint = useMemo(() => {
    if (!draft) return ""
    try {
      return getAccessControlContentFingerprint(draft)
    } catch {
      return ""
    }
  }, [draft])
  const hasContentChanges = Boolean(
    draft
    && initialContentFingerprint
    && currentContentFingerprint !== initialContentFingerprint,
  )
  const errorMessage = draft && detail
    ? validationMessage(draft, detail.definition.version, hasContentChanges, (key, values) => t(key, values))
    : ""
  const dirty = Boolean(draft && (
    hasContentChanges
    || draft.version !== suggestNextControlObjectVersion(detail?.definition.version ?? "")
  ))
  const PolicyIcon = draft ? POLICY_ICONS[draft.type] : FileText
  const typeTitle = draft ? copy.policyTypes[draft.type][0] : t("accessPolicyEditor.policy")

  const updateDraft = useCallback((patch: Partial<AccessControlPolicyDraft>) => {
    setDraft((current) => current ? { ...current, ...patch } : current)
    setFormError("")
  }, [])

  const closeDialog = useCallback(() => {
    forceCloseRef.current = true
    onOpenChange(false)
  }, [onOpenChange])

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      onOpenChange(true)
      return
    }
    if (forceCloseRef.current) {
      forceCloseRef.current = false
      onOpenChange(false)
      return
    }
    if (dirty) {
      setConfirmCloseOpen(true)
      return
    }
    onOpenChange(false)
  }, [dirty, onOpenChange])

  const handleSave = useCallback(async () => {
    if (!definition || !detail || !policy || !draft) return
    const issue = validationMessage(
      draft,
      detail.definition.version,
      hasContentChanges,
      (key, values) => t(key, values),
    )
    if (issue) {
      setFormError(issue)
      return
    }

    setSaving(true)
    setFormError("")
    try {
      const context = buildUpdatedAccessControlPolicyContext(policy, draft)
      await updateControlObjectDefinition(definition, {
        name: draft.name,
        version: draft.version,
        context,
      })
      toast({
        variant: "success",
        title: t("accessPolicyEditor.toast.updated"),
        description: t("accessPolicyEditor.toast.updatedDescription", { version: draft.version }),
      })
      onUpdated?.()
      closeDialog()
    } catch (error) {
      setFormError(editorErrorMessage(error, (key) => t(key)))
    } finally {
      setSaving(false)
    }
  }, [closeDialog, definition, detail, draft, hasContentChanges, onUpdated, policy, t, toast])

  return (
    <>
      <Dialog open={Boolean(definition)} onOpenChange={handleOpenChange}>
        <DialogContent
          overlayClassName="bg-slate-950/45 backdrop-blur-[1px]"
          closeLabel={t("common.close")}
          className="flex h-[min(90vh,920px)] w-[min(96vw,1180px)] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl [&>button]:right-4 [&>button]:top-3 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-slate-100"
          onEscapeKeyDown={(event) => {
            if (dirty) {
              event.preventDefault()
              setConfirmCloseOpen(true)
            }
          }}
          onPointerDownOutside={(event) => {
            if (dirty) event.preventDefault()
          }}
        >
          <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-slate-50/80 px-5 py-3 pr-16 text-left">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-600">
                <PolicyIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                  {t("accessPolicyEditor.title", { type: typeTitle })}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {definition
                    ? t("accessPolicyEditor.description", { id: definition.objectId, version: definition.version })
                    : t("accessPolicyEditor.loadingDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col bg-slate-100 p-3 sm:p-4">
            {loading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-cyan-600" aria-hidden="true" />
                {t("accessPolicyEditor.loading")}
              </div>
            ) : loadError ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center">
                <CircleAlert className="h-8 w-8 text-rose-500" aria-hidden="true" />
                <p className="mt-3 max-w-xl text-sm font-medium text-slate-900">{t("accessPolicyEditor.loadFailedTitle")}</p>
                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">{loadError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadToken((value) => value + 1)}
                  className="mt-4 h-9 rounded-full px-4"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  {t("accessPolicyEditor.reload")}
                </Button>
              </div>
            ) : draft ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <PolicyDefinitionBar
                  copy={copy}
                  draft={draft}
                  readOnly={false}
                  typeLocked
                  idPrefix="access-policy-editor"
                  onChange={updateDraft}
                  onTypeChange={() => undefined}
                />
                <PolicyConfigurationPanel
                  copy={copy}
                  draft={draft}
                  readOnly={false}
                  onChange={updateDraft}
                />
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="min-w-0 text-left" role={formError ? "alert" : undefined}>
              {formError ? (
                <p className="flex items-center gap-1.5 text-xs text-rose-600">
                  <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate" title={formError}>{formError}</span>
                </p>
              ) : (
                <p className="truncate text-xs text-slate-500">{t("accessPolicyEditor.saveHint")}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={saving}
                className="h-9 rounded-full px-4"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={loading || saving || Boolean(loadError) || !draft || Boolean(errorMessage)}
                className="h-9 rounded-full bg-cyan-600 px-5 text-white hover:bg-cyan-700"
              >
                {saving ? (
                  <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
                )}
                {saving ? t("common.saving") : t("genericEditor.saveVersion")}
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
              {t("accessPolicyEditor.discardDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-full px-4">{t("genericEditor.discard.continue")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={closeDialog}
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
