"use client"

import { Loader2, Play, Trash2, XCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import type { RemediationOrder } from "@/features/attack/remediation-order"

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

export function RemediationOrderLifecycleDialogs({
  cancelOpen,
  cancelReason,
  confirmOpen,
  confirmOrder,
  deleteOpen,
  onCancel,
  onCancelOpenChange,
  onCancelReasonChange,
  onConfirm,
  onConfirmOpenChange,
  onDelete,
  onDeleteOpenChange,
  working,
}: {
  cancelOpen: boolean
  cancelReason: string
  confirmOpen: boolean
  confirmOrder: RemediationOrder
  deleteOpen: boolean
  onCancel: () => void
  onCancelOpenChange: (open: boolean) => void
  onCancelReasonChange: (reason: string) => void
  onConfirm: () => void
  onConfirmOpenChange: (open: boolean) => void
  onDelete: () => void
  onDeleteOpenChange: (open: boolean) => void
  working: string
}) {
  const t = useTranslations("pages.collection.orchestration")
  return (
    <>
      <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working === "delete"}>{t("dialogs.keepDraft")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={working === "delete"}
              onClick={(event) => {
                event.preventDefault()
                onDelete()
              }}
            >
              {working === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {t("dialogs.deleteDraft")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.confirmDescription", {
                ready: confirmOrder.summary.ready,
                satisfied: confirmOrder.summary.satisfied,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working === "confirm"}>{t("dialogs.notNow")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-600 text-white hover:bg-teal-700"
              disabled={working === "confirm"}
              onClick={(event) => {
                event.preventDefault()
                onConfirm()
              }}
            >
              {working === "confirm" ? <Loader2 className="animate-spin" /> : <Play />}
              {t("dialogs.confirmExecute")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={onCancelOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.cancelDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("dialogs.cancelReason")}
            <textarea
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.target.value)}
              maxLength={512}
              rows={3}
              className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working === "cancel"}>{t("dialogs.return")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={working === "cancel" || !cancelReason.trim()}
              onClick={(event) => {
                event.preventDefault()
                onCancel()
              }}
            >
              {working === "cancel" ? <Loader2 className="animate-spin" /> : <XCircle />}
              {t("dialogs.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
