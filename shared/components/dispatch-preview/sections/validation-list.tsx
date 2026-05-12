"use client"

import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Lightbulb,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"

import type { DispatchPermissions, DispatchValidation } from "../types"

function ValidationItem({
  validation,
  defaultOpen = false,
}: {
  validation: DispatchValidation
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

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
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-lg border ${styles.container}`}>
        <CollapsibleTrigger className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/30">
          <span className={`mt-0.5 ${styles.icon}`}>{icon}</span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${styles.title}`}>{validation.message}</p>
          </div>
          {validation.suggestion ? (
            <span className="mt-0.5 text-muted-foreground">
              {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </span>
          ) : null}
        </CollapsibleTrigger>

        {validation.suggestion && open ? (
          <CollapsibleContent>
            <div className="ml-7 px-3 pb-3 pt-0">
              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p>{validation.suggestion}</p>
              </div>
            </div>
          </CollapsibleContent>
        ) : null}
      </div>
    </Collapsible>
  )
}

export function ValidationList({
  validations = [],
  permissions,
  showPermissionInfo = true,
}: {
  validations?: DispatchValidation[]
  permissions?: DispatchPermissions
  showPermissionInfo?: boolean
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
            <AlertTitle>无法提交</AlertTitle>
            <AlertDescription>
              {permissions.reason || "当前用户权限不足，或提交条件尚未满足。"}
            </AlertDescription>
          </Alert>
        ) : null}

        {errors.map((item, index) => (
          <ValidationItem key={`error-${index}`} validation={item} defaultOpen />
        ))}

        {warnings.map((item, index) => (
          <ValidationItem
            key={`warning-${index}`}
            validation={item}
            defaultOpen={false}
          />
        ))}

        {infos.map((item, index) => (
          <ValidationItem key={`info-${index}`} validation={item} />
        ))}
      </div>
    </section>
  )
}
