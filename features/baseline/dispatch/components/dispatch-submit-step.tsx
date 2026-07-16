"use client"

import { ChevronLeft, FileText, LoaderCircle, Rocket, Send } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("pages.baseline.dispatch")
  const hasBlockingErrors = data?.validations?.some((item) => item.level === "error") ?? false
  const canSubmit = data?.permissions?.canSubmit !== false
  const disabledReason = hasBlockingErrors
    ? t("dispatchSubmit.blockingError")
    : !canSubmit
      ? data?.permissions?.reason || t("dispatchSubmit.notReady")
      : null

  return (
    <Card className="flex h-full min-h-0 flex-col border bg-card shadow-sm">
      <CardHeader className="shrink-0 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{t("steps.dispatchSubmit.title")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t("dispatchSubmit.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {!data ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
            {t("dispatchSubmit.empty")}
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <ObjectSummary
              object={data.object}
              text={{
                sectionTitle: t("dispatchSubmit.object.sectionTitle"),
                taskName: t("dispatchSubmit.object.taskName"),
                targetBaseline: t("dispatchSubmit.object.targetBaseline"),
                objectId: t("dispatchSubmit.object.objectId"),
                version: t("dispatchSubmit.object.version"),
                type: t("dispatchSubmit.object.type"),
                source: t("dispatchSubmit.object.source"),
                typeMap: {
                  baseline: t("dispatchSubmit.object.typeMap.baseline"),
                  patch: t("dispatchSubmit.object.typeMap.patch"),
                  scan: t("dispatchSubmit.object.typeMap.scan"),
                  config: t("dispatchSubmit.object.typeMap.config"),
                },
                sourceMap: {
                  template: t("dispatchSubmit.object.sourceMap.template"),
                  custom: t("dispatchSubmit.object.sourceMap.custom"),
                },
              }}
            />

            <Separator />

            <TargetSummary
              target={data.target}
              text={{
                sectionTitle: t("dispatchSubmit.target.sectionTitle"),
                group: t("dispatchSubmit.target.group"),
                deduplicatedHosts: t("dispatchSubmit.target.deduplicatedHosts"),
                originalTargets: t("dispatchSubmit.target.originalTargets"),
                invalidHosts: t("dispatchSubmit.target.invalidHosts"),
                offlineHosts: t("dispatchSubmit.target.offlineHosts"),
                ungroupedHosts: t("dispatchSubmit.target.ungroupedHosts"),
                hostUnit: t("dispatchSubmit.target.hostUnit"),
                groupUnit: t("dispatchSubmit.target.groupUnit"),
                hostCountBadge: (count) => t("dispatchSubmit.target.hostCountBadge", { count }),
                invalidDispatch: t("dispatchSubmit.target.invalidDispatch"),
                viewMore: (count) => t("dispatchSubmit.target.viewMore", { count }),
                expandDetails: t("dispatchSubmit.target.expandDetails"),
                collapseDetails: t("dispatchSubmit.target.collapseDetails"),
              }}
            />

            {data.schedule ? (
              <>
                <Separator />
                <ScheduleSummary
                  schedule={data.schedule}
                  text={{
                    immediate: t("dispatchSubmit.schedule.immediate"),
                    scheduled: t("dispatchSubmit.schedule.scheduled"),
                    immediateTag: t("dispatchSubmit.schedule.immediateTag"),
                    scheduledTag: t("dispatchSubmit.schedule.scheduledTag"),
                  }}
                />
              </>
            ) : null}

            {(data.validations?.length || data.permissions?.canSubmit === false) ? (
              <>
                <Separator />
                <ValidationList
                  validations={data.validations}
                  permissions={data.permissions}
                  showPermissionInfo
                  text={{
                    cannotSubmit: t("dispatchSubmit.validation.cannotSubmit"),
                    noPermissionReason: t("dispatchSubmit.validation.noPermissionReason"),
                  }}
                />
              </>
            ) : null}
          </div>
        )}

        <div className="shrink-0 border-t px-6 pb-6 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button variant="outline" onClick={onBack} className="h-11 px-5">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("steps.hostSelection.title")}
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
                className="h-11 px-6 bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    {t("dispatchSubmit.actions.submitting")}
                  </>
                ) : (
                  <>
                    {(dangerConfirmRequired && canSubmit) ? (
                      <Rocket className="mr-2 size-4" />
                    ) : (
                      <Send className="mr-2 size-4" />
                    )}
                    {t("dispatchSubmit.actions.confirm")}
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
