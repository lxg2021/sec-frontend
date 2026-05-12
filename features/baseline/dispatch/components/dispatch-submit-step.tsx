"use client"

import { AlertTriangle, ChevronLeft, FileText, LoaderCircle, Send } from "lucide-react"

import type { DispatchPreviewData } from "@/shared/components/dispatch-preview"
import { ObjectSummary } from "@/shared/components/dispatch-preview/sections/object-summary"
import { ScheduleSummary } from "@/shared/components/dispatch-preview/sections/schedule-summary"
import { TargetSummary } from "@/shared/components/dispatch-preview/sections/target-summary"
import { ValidationList } from "@/shared/components/dispatch-preview/sections/validation-list"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"

interface DispatchSubmitStepProps {
  data?: DispatchPreviewData
  dangerConfirmRequired?: boolean
  onBack: () => void
  onConfirm: () => void
  submitting?: boolean
}

export function DispatchSubmitStep({
  data,
  dangerConfirmRequired = false,
  onBack,
  onConfirm,
  submitting = false,
}: DispatchSubmitStepProps) {
  const hasBlockingErrors = data?.validations?.some((item) => item.level === "error") ?? false
  const hasWarnings = data?.validations?.some((item) => item.level === "warning") ?? false
  const canSubmit = data?.permissions?.canSubmit !== false
  const warningStyle = (hasWarnings || dangerConfirmRequired) && !hasBlockingErrors && canSubmit
  const disabledReason = hasBlockingErrors
    ? "存在阻断错误，无法提交。"
    : !canSubmit
      ? data?.permissions?.reason || "当前不满足提交条件。"
      : null

  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">任务下发</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              请在当前页面确认下发对象、目标范围与执行计划。
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        {!data ? (
          <div className="flex min-h-[320px] items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
            暂无可预览内容，请先完成前置步骤。
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <ObjectSummary object={data.object} />

            <Separator />

            <TargetSummary target={data.target} />

            {data.schedule ? (
              <>
                <Separator />
                <ScheduleSummary schedule={data.schedule} />
              </>
            ) : null}

            {(data.validations?.length || data.permissions?.canSubmit === false) ? (
              <>
                <Separator />
                <ValidationList
                  validations={data.validations}
                  permissions={data.permissions}
                  showPermissionInfo
                />
              </>
            ) : null}
          </div>
        )}

        <div className="border-t px-6 pb-6 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button variant="outline" onClick={onBack} className="h-11 px-5">
              <ChevronLeft className="mr-2 h-4 w-4" />
              返回：主机选择
            </Button>

            <div className="flex items-center gap-3">
              {disabledReason ? (
                <span className="max-w-48 text-right text-xs text-muted-foreground">
                  {disabledReason}
                </span>
              ) : null}

              <Button
                onClick={onConfirm}
                disabled={!data || hasBlockingErrors || !canSubmit || submitting}
                className={warningStyle ? "h-11 px-6 bg-amber-600 hover:bg-amber-700" : "h-11 px-6"}
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    {warningStyle ? (
                      <AlertTriangle className="mr-2 size-4" />
                    ) : (
                      <Send className="mr-2 size-4" />
                    )}
                    确认下发
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
