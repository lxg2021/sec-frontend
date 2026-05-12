"use client"

import { ChevronLeft, FileText } from "lucide-react"

import type { DispatchPreviewData } from "@/shared/components/dispatch-preview"
import { FooterActions } from "@/shared/components/dispatch-preview/sections/footer-actions"
import { ObjectSummary } from "@/shared/components/dispatch-preview/sections/object-summary"
import { ScheduleSummary } from "@/shared/components/dispatch-preview/sections/schedule-summary"
import { TargetSummary } from "@/shared/components/dispatch-preview/sections/target-summary"
import { ValidationList } from "@/shared/components/dispatch-preview/sections/validation-list"
import { Badge } from "@/shared/ui/badge"
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
  const statusTags = (() => {
    if (!data) return []

    const tags: string[] = []
    const hasErrors = data.validations?.some((item) => item.level === "error")
    const hasWarnings = data.validations?.some((item) => item.level === "warning")

    if (hasErrors) tags.push("存在错误")
    if (hasWarnings) tags.push("存在风险")
    if (data.permissions?.canSubmit) tags.push("可提交")

    return tags
  })()

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
          <>
            <div className="space-y-6 p-6">
              {statusTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {statusTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

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

            <div className="border-t">
              <FooterActions
                onBack={undefined}
                onConfirm={onConfirm}
                confirmText="确认下发"
                submitting={submitting}
                readonly={false}
                validations={data.validations}
                permissions={data.permissions}
                dangerConfirmRequired={dangerConfirmRequired}
              />
            </div>
          </>
        )}

        <div className="border-t px-6 pb-6 pt-4">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回：主机选择
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
