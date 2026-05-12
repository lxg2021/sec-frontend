"use client"

import { ArrowLeft, AlertTriangle, LoaderCircle, Send } from "lucide-react"

import { Button } from "@/shared/ui/button"

import type { DispatchPermissions, DispatchValidation } from "../types"

export function FooterActions({
  onBack,
  onConfirm,
  confirmText = "确认下发",
  submitting = false,
  readonly = false,
  validations = [],
  permissions,
  dangerConfirmRequired = false,
}: {
  onBack?: () => void
  onConfirm: () => void
  confirmText?: string
  submitting?: boolean
  readonly?: boolean
  validations?: DispatchValidation[]
  permissions?: DispatchPermissions
  dangerConfirmRequired?: boolean
}) {
  const hasBlockingErrors = validations.some((item) => item.level === "error")
  const hasWarnings = validations.some((item) => item.level === "warning")
  const canSubmit = permissions?.canSubmit !== false
  const needsWarningStyle =
    (hasWarnings || dangerConfirmRequired) && !hasBlockingErrors && canSubmit

  const disabledReason = hasBlockingErrors
    ? "存在阻断错误，无法提交"
    : !canSubmit
      ? permissions?.reason || "权限不足"
      : null

  return (
    <div className="flex items-center justify-between gap-4 border-t bg-background p-4">
      <div>
        {onBack && !readonly ? (
          <Button variant="outline" onClick={onBack} disabled={submitting}>
            <ArrowLeft className="size-4" />
            返回修改
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {disabledReason ? (
          <span className="max-w-48 text-right text-xs text-muted-foreground">
            {disabledReason}
          </span>
        ) : null}

        {!readonly ? (
          <Button
            onClick={onConfirm}
            disabled={hasBlockingErrors || !canSubmit || submitting}
            className={needsWarningStyle ? "bg-amber-600 hover:bg-amber-700" : undefined}
          >
            {submitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                {needsWarningStyle ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
                {confirmText}
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
