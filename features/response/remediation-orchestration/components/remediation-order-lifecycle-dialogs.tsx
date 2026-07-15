"use client"

import { Loader2, Play, Trash2, XCircle } from "lucide-react"

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
  return (
    <>
      <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除处置草稿？</AlertDialogTitle>
            <AlertDialogDescription>
              删除尚未提交的处置草稿。删除后将从处置列表、目标查询和汇总中隐藏，但后台仍保留审计记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working === "delete"}>保留草稿</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={working === "delete"}
              onClick={(event) => {
                event.preventDefault()
                onDelete()
              }}
            >
              {working === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />}
              删除草稿
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认执行处置？</AlertDialogTitle>
            <AlertDialogDescription>
              本次将下发 {confirmOrder.summary.ready} 个处置目标；
              {confirmOrder.summary.satisfied} 个已满足目标将自动跳过。确认后不能再编辑或删除，Agent 当前离线不会阻止下发。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working === "confirm"}>暂不执行</AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-600 text-white hover:bg-teal-700"
              disabled={working === "confirm"}
              onClick={(event) => {
                event.preventDefault()
                onConfirm()
              }}
            >
              {working === "confirm" ? <Loader2 className="animate-spin" /> : <Play />}
              确认执行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={onCancelOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>放弃本次提交？</AlertDialogTitle>
            <AlertDialogDescription>
              当前处置已经完成提交前检查，但尚未执行。放弃后该处置单不能继续下发。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            取消原因
            <textarea
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.target.value)}
              maxLength={512}
              rows={3}
              className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working === "cancel"}>返回</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={working === "cancel" || !cancelReason.trim()}
              onClick={(event) => {
                event.preventDefault()
                onCancel()
              }}
            >
              {working === "cancel" ? <Loader2 className="animate-spin" /> : <XCircle />}
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
