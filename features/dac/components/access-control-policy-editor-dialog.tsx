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
import { useLocale } from "next-intl"

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

function editorErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    ACCESS_POLICY_CONTEXT_INVALID: "策略内容不是有效的 JSON，无法安全编辑。",
    ACCESS_POLICY_CONTEXT_IDENTITY_MISMATCH: "策略内容中的 ID、类型、名称或版本与对象记录不一致，已阻止编辑。",
    ACCESS_POLICY_CONTEXT_TYPE_MISMATCH: "策略内容中的访问对象类型与当前策略类型不一致，已阻止编辑。",
    ACCESS_POLICY_CONTEXT_UNSUPPORTED: "策略内容不符合当前文件、注册表、进程或网络策略合同，无法完整回填。",
    ACCESS_POLICY_TYPE_CHANGE_FORBIDDEN: "编辑现有策略时不能改变策略类型。",
    PMC_OBJECT_EDITABLE_CONTENT_INVALID: "后台返回的策略内容不完整，无法安全编辑。",
    PMC_OBJECT_DETAIL_INVALID: "后台没有返回策略详情。",
    PMC_OBJECT_DETAIL_MISMATCH: "后台返回的策略详情与当前对象不一致。",
    PMC_UPDATE_NOT_ALLOWED: "后台能力合同不允许更新这个策略。",
    PMC_OBJECT_NOT_ACTIVE: "只有 active 状态的策略可以更新。",
    PMC_UPDATE_VERSION_INVALID: "新版本必须使用 MAJOR.MINOR.PATCH 格式，且不能低于当前版本。",
    PMC_UPDATE_RESPONSE_INVALID: "后台没有返回更新后的策略。",
    PMC_UPDATE_RESPONSE_MISMATCH: "后台返回的更新结果与当前策略不一致，请刷新后检查。",
  }
  return messages[message] || message || "访问控制策略加载失败，请稍后重试。"
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
) {
  const versionComparison = compareControlObjectVersions(draft.version, currentVersion)
  if (versionComparison === null) return "版本必须使用 MAJOR.MINOR.PATCH 格式，例如 1.1.0。"
  if (versionComparison <= 0) return `新版本必须高于当前版本 ${currentVersion}。`

  const errors = validateAccessControlDraft(draft)
  if (errors.some((error) => error.startsWith("POLICY_"))) {
    return "请完整填写策略名称、版本和 0–255 的优先级。"
  }
  if (draft.type === "network" && errors.length > 0) {
    return "请检查网络方向、协议、端口、地址、程序路径和 MD5。"
  }
  if (errors.length > 0) {
    return "请完整填写主体、访问对象和至少一条有效规则。"
  }
  if (!hasContentChanges) return "策略名称或策略内容没有变化，无需创建新版本。"
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
        if (active) setLoadError(editorErrorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [definition, reloadToken])

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
    ? validationMessage(draft, detail.definition.version, hasContentChanges)
    : ""
  const dirty = Boolean(draft && (
    hasContentChanges
    || draft.version !== suggestNextControlObjectVersion(detail?.definition.version ?? "")
  ))
  const PolicyIcon = draft ? POLICY_ICONS[draft.type] : FileText
  const typeTitle = draft ? copy.policyTypes[draft.type][0] : "访问控制策略"

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
    const issue = validationMessage(draft, detail.definition.version, hasContentChanges)
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
        title: "访问控制策略已更新",
        description: `已创建版本 ${draft.version}，尚未自动下发。`,
      })
      onUpdated?.()
      closeDialog()
    } catch (error) {
      setFormError(editorErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }, [closeDialog, definition, detail, draft, hasContentChanges, onUpdated, policy, toast])

  return (
    <>
      <Dialog open={Boolean(definition)} onOpenChange={handleOpenChange}>
        <DialogContent
          overlayClassName="bg-slate-950/45 backdrop-blur-[1px]"
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
                  编辑{typeTitle}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {definition ? `${definition.objectId} · 当前版本 ${definition.version}` : "加载策略内容"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col bg-slate-100 p-3 sm:p-4">
            {loading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-cyan-600" aria-hidden="true" />
                正在加载完整策略内容…
              </div>
            ) : loadError ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center">
                <CircleAlert className="h-8 w-8 text-rose-500" aria-hidden="true" />
                <p className="mt-3 max-w-xl text-sm font-medium text-slate-900">策略内容无法安全回填</p>
                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">{loadError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadToken((value) => value + 1)}
                  className="mt-4 h-9 rounded-full px-4"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  重新加载
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
                <p className="truncate text-xs text-slate-500">保存后创建同一 Object ID 的新版本，不会自动下发。</p>
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
                取消
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
                {saving ? "保存中…" : "保存新版本"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-slate-200 p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-slate-950">放弃未保存的修改？</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-slate-600">
              当前访问控制策略的修改尚未保存，关闭后将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-full px-4">继续编辑</AlertDialogCancel>
            <AlertDialogAction
              onClick={closeDialog}
              className="h-9 rounded-full bg-rose-600 px-4 text-white hover:bg-rose-700"
            >
              放弃修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
