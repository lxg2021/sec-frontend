"use client"

import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import type { DispatchPermissions, DispatchValidation } from "../types"

function ValidationItem({
  validation,
}: {
  validation: DispatchValidation
}) {
  const styles = {
    error: {
      container: "border-destructive/50 bg-destructive/5",
      icon: "text-destructive",
      title: "text-destructive",
    },
    warning: {
      container: "border-amber-500/50 bg-amber-500/5",
      icon: "text-amber-600",
      title: "text-amber-700",
    },
    info: {
      container: "border-blue-500/50 bg-blue-500/5",
      icon: "text-blue-600",
      title: "text-blue-700",
    },
  }[validation.level]

  const icon =
    validation.level === "error" ? (
      <AlertCircle className="size-4" />
    ) : validation.level === "warning" ? (
      <AlertTriangle className="size-4" />
    ) : (
      <Info className="size-4" />
    )

  return (
    <div className={`rounded-lg border ${styles.container}`}>
      <div className="flex items-start gap-3 rounded-lg p-3 text-left">
        <span className={`mt-0.5 ${styles.icon}`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${styles.title}`}>{validation.message}</p>
        </div>
      </div>

      {validation.suggestion ? (
        <div className="ml-7 px-3 pb-3 pt-0">
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p>{validation.suggestion}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ValidationList({
  validations = [],
  permissions,
  showPermissionInfo = true,
  text = {
    cannotSubmit: "无法提交",
    noPermissionReason: "当前用户权限不足，或提交条件尚未满足。",
  },
}: {
  validations?: DispatchValidation[]
  permissions?: DispatchPermissions
  showPermissionInfo?: boolean
  text?: {
    cannotSubmit: string
    noPermissionReason: string
  }
}) {
  const errors = validations.filter((item) => item.level === "error")
  const warnings = validations.filter((item) => item.level === "warning")
  const infos = validations.filter((item) => item.level === "info")

  const hasAnyValidation = errors.length > 0 || warnings.length > 0 || infos.length > 0

  if (!hasAnyValidation && (!showPermissionInfo || permissions?.canSubmit !== false)) {
    return null
  }

  return (
    <section>
      <div className="space-y-3">
        {showPermissionInfo && permissions?.canSubmit === false ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{text.cannotSubmit}</AlertTitle>
            <AlertDescription>
              {permissions.reason || text.noPermissionReason}
            </AlertDescription>
          </Alert>
        ) : null}

        {errors.map((item, index) => (
          <ValidationItem key={`error-${index}`} validation={item} />
        ))}

        {warnings.map((item, index) => (
          <ValidationItem key={`warning-${index}`} validation={item} />
        ))}

        {infos.map((item, index) => (
          <ValidationItem key={`info-${index}`} validation={item} />
        ))}
      </div>
    </section>
  )
}
