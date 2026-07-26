"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CircleAlert, LoaderCircle, Trash2, Unplug } from "lucide-react"

import {
  deleteControlObjectDefinition,
  type ControlObjectDefinition,
} from "@/features/control-object-library/api"
import { controlObjectDisplayNameKey } from "@/features/control-object-library/table-presentation"
import { useToast } from "@/shared/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

function deleteErrorMessage(error: unknown, translate: (key: string) => string) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    PMC_OBJECT_NOT_ACTIVE: "deleteDialog.errors.notActive",
    PMC_DELETE_NOT_ALLOWED: "deleteDialog.errors.notAllowed",
    PMC_STATE_VERSION_INVALID: "deleteDialog.errors.stateVersionInvalid",
    PMC_DELETE_RESPONSE_INVALID: "deleteDialog.errors.responseInvalid",
    PMC_DELETE_RESPONSE_MISMATCH: "deleteDialog.errors.responseMismatch",
  }
  return messages[message]
    ? translate(messages[message])
    : message || translate("deleteDialog.errors.failed")
}

export function ControlObjectDeleteDialog({
  definition,
  onOpenChange,
  onDeleted,
}: {
  definition: ControlObjectDefinition | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const t = useTranslations("pages.controlCenter")
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const removesEffects = definition?.capabilities.deleteMode === "remove_effects"
  const canSubmit = Boolean(definition && definition.stateVersion > 0)
  const displayNameKey = definition ? controlObjectDisplayNameKey(definition) : null
  const displayName = definition
    ? (displayNameKey ? t(displayNameKey) : definition.displayName)
    : ""

  const handleDelete = async () => {
    if (!definition || submitting || !canSubmit) return
    setSubmitting(true)

    try {
      const result = await deleteControlObjectDefinition(definition)
      toast({
        title: removesEffects ? t("deleteDialog.toast.flowCreated") : t("deleteDialog.toast.deleted"),
        description: result.operationId
          ? t("deleteDialog.toast.removeEffects", { operationId: result.operationId })
          : t("deleteDialog.toast.removed", { name: displayName }),
        variant: "success",
      })
      onOpenChange(false)
      onDeleted()
    } catch (error) {
      toast({
        title: t("deleteDialog.toast.failed"),
        description: deleteErrorMessage(error, (key) => t(key)),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={Boolean(definition)}
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open)
      }}
    >
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-[2px]"
        closeLabel={t("common.close")}
        className="w-[calc(100vw-1.5rem)] max-w-md gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl [&>button]:right-4 [&>button]:top-3.5 [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:p-2 [&>button]:opacity-100"
      >
        <DialogHeader className="border-b border-slate-200 bg-slate-50/80 px-5 py-3 pr-16 text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              {removesEffects ? (
                <Unplug className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                {removesEffects ? t("deleteDialog.removeEffectsTitle") : t("deleteDialog.title")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {displayName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          <p className="text-sm leading-6 text-slate-700">
            {removesEffects
              ? t("deleteDialog.removeEffectsDescription")
              : t("deleteDialog.description")}
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {t("deleteDialog.warning")}
              </span>
            </div>
          </div>
          {!canSubmit && definition && (
            <p className="text-xs leading-5 text-rose-600" role="alert">
              {t("deleteDialog.stateVersionMissing")}
            </p>
          )}
        </div>

        <DialogFooter className="flex-row justify-end space-x-0 gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-full px-4"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={submitting || !canSubmit}
            onClick={() => void handleDelete()}
            className="h-9 rounded-full bg-rose-600 px-4 text-white hover:bg-rose-700"
          >
            {submitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            {submitting ? t("deleteDialog.submitting") : t("deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
