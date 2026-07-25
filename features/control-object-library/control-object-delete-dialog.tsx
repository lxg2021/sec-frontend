"use client"

import { useState } from "react"
import { CircleAlert, LoaderCircle, Trash2, Unplug } from "lucide-react"

import {
  deleteControlObjectDefinition,
  type ControlObjectDefinition,
} from "@/features/control-object-library/api"
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

function deleteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    PMC_OBJECT_NOT_ACTIVE: "对象当前不是 active 状态，不能发起删除。",
    PMC_DELETE_NOT_ALLOWED: "后台能力合同禁止删除此对象。",
    PMC_STATE_VERSION_INVALID: "列表没有返回有效的 state_version，请刷新后重试。",
    PMC_DELETE_RESPONSE_INVALID: "后台已响应，但没有返回删除后的对象状态。",
    PMC_DELETE_RESPONSE_MISMATCH: "后台返回的对象与当前删除对象不一致，已停止处理。",
  }
  return messages[message] || message || "删除请求失败，请稍后重试。"
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
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const removesEffects = definition?.capabilities.deleteMode === "remove_effects"
  const canSubmit = Boolean(definition && definition.stateVersion > 0)

  const handleDelete = async () => {
    if (!definition || submitting || !canSubmit) return
    setSubmitting(true)

    try {
      const result = await deleteControlObjectDefinition(definition)
      toast({
        title: removesEffects ? "删除流程已创建" : "对象已删除",
        description: result.operationId
          ? `后台将先移除主机效果，Operation ID：${result.operationId}`
          : `“${definition.displayName}”已从管理中心移除。`,
        variant: "success",
      })
      onOpenChange(false)
      onDeleted()
    } catch (error) {
      toast({
        title: "删除对象失败",
        description: deleteErrorMessage(error),
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
        className="w-[calc(100vw-1.5rem)] max-w-md gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl [&>button]:right-4 [&>button]:top-3.5 [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:p-2 [&>button]:opacity-100"
      >
        <DialogHeader className="border-b border-slate-200 bg-slate-50/80 px-5 py-3 pr-16 text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              {removesEffects ? (
                <Unplug className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold text-slate-950">
                {removesEffects ? "移除主机效果并删除" : "删除对象"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-xs text-slate-500">
                {definition?.displayName || ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          <p className="text-sm leading-6 text-slate-700">
            {removesEffects
              ? "后台会先查找仍有当前效果的主机，创建 REMOVE 操作；全部移除完成后，再结束 Catalog 删除流程。"
              : "该对象将从活动 Catalog 中移除。命令的历史执行记录不会因此回滚。"}
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                这是 Catalog 生命周期操作，不等同于对单台主机执行“移除”。提交后请通过执行记录跟踪结果。
              </span>
            </div>
          </div>
          {!canSubmit && definition && (
            <p className="text-xs leading-5 text-rose-600" role="alert">
              当前列表数据缺少有效的 state_version，请关闭对话框、刷新列表后再试。
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
            取消
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
            {submitting ? "正在提交…" : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
