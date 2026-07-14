"use client"

import { Loader2, Play, Trash2, XCircle } from "lucide-react"

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
              该操作只允许删除尚未 Prepare 的 Draft。删除后将从处置列表、目标查询和汇总中隐藏，但后台仍保留审计记录。
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
            <AlertDialogTitle>确认下发处置计划？</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm 后计划将进入 Worker 和 Agent 执行队列，不能再普通编辑或删除。Agent 当前离线不会阻止下发。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working === "confirm"}>暂不下发</AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-600 text-white hover:bg-teal-700"
              disabled={working === "confirm"}
              onClick={(event) => {
                event.preventDefault()
                onConfirm()
              }}
            >
              {working === "confirm" ? <Loader2 className="animate-spin" /> : <Play />}
              确认下发
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={onCancelOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>取消 Prepared 处置单？</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel 仅适用于已经 Prepare、尚未 Confirm 的处置单。取消后该处置单不能继续下发。
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
