"use client"

import { LoaderCircle, Send } from "lucide-react"
import { useTranslations } from "next-intl"

import type { DispatchPreviewData } from "@/shared/components/dispatch-preview"
import { ObjectSummary } from "@/shared/components/dispatch-preview/sections/object-summary"
import { ScheduleSummary } from "@/shared/components/dispatch-preview/sections/schedule-summary"
import { TargetSummary } from "@/shared/components/dispatch-preview/sections/target-summary"
import { ValidationList } from "@/shared/components/dispatch-preview/sections/validation-list"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Separator } from "@/shared/ui/separator"

interface BaselineDispatchConfirmDialogProps {
  data?: DispatchPreviewData
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  submitting: boolean
}

export function BaselineDispatchConfirmDialog({
  data,
  onConfirm,
  onOpenChange,
  open,
  submitting,
}: BaselineDispatchConfirmDialogProps) {
  const t = useTranslations("pages.baseline.dispatch")
  const workspace = useTranslations("pages.baseline.dispatch.workspace")
  const hasBlockingErrors = data?.validations?.some((item) => item.level === "error") ?? false
  const canSubmit = data?.permissions?.canSubmit !== false

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
      <DialogContent className="grid max-h-[88vh] w-[92vw] max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-14">
          <DialogTitle>{workspace("confirmDialogTitle")}</DialogTitle>
          <DialogDescription>{workspace("confirmDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
          {data ? (
            <>
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
            </>
          ) : null}
        </div>

        <DialogFooter className="border-t border-slate-200 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {workspace("cancel")}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!data || hasBlockingErrors || !canSubmit || submitting}
            className="bg-slate-950 text-white hover:bg-slate-800"
          >
            {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {submitting ? t("dispatchSubmit.actions.submitting") : t("dispatchSubmit.actions.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
