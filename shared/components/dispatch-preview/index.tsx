"use client"

import { AlertCircle, FileX, LoaderCircle } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Separator } from "@/shared/ui/separator"

import { FooterActions } from "./sections/footer-actions"
import { ObjectSummary } from "./sections/object-summary"
import { ScheduleSummary } from "./sections/schedule-summary"
import { TargetSummary } from "./sections/target-summary"
import { ValidationList } from "./sections/validation-list"
import type { DispatchPreviewProps } from "./types"
import { getPreviewStatus, getStatusTags, getTagVariant } from "./utils"

export type {
  DispatchGroup,
  DispatchHost,
  DispatchObject,
  DispatchPermissions,
  DispatchPreviewData,
  DispatchPreviewProps,
  DispatchPreviewStatus,
  DispatchSchedule,
  DispatchTarget,
  DispatchValidation,
} from "./types"

export function DispatchPreview({
  open,
  title = "下发预览",
  subtitle = "请在提交前确认下发对象、目标范围与执行方式。",
  data,
  submitting = false,
  loading = false,
  error,
  onClose,
  onBack,
  onConfirm,
  confirmText = "确认下发",
  readonly = false,
  showPermissionInfo = true,
  renderExtraSection,
  dangerConfirmRequired = false,
}: DispatchPreviewProps) {
  const status = getPreviewStatus(data, loading, error, submitting)
  const statusTags = getStatusTags(data)

  const renderContent = () => {
    if (status === "loading") {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <LoaderCircle className="mb-4 size-8 animate-spin" />
          <p className="text-sm">正在加载预览数据...</p>
        </div>
      )
    }

    if (status === "error") {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 size-12 text-destructive" />
          <p className="mb-2 text-sm font-medium text-destructive">加载失败</p>
          <p className="mb-4 max-w-xs text-sm text-muted-foreground">
            {error || "无法加载预览数据，请稍后重试。"}
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      )
    }

    if (status === "empty" || !data) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileX className="mb-4 size-12 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium text-foreground">暂无可预览内容</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            请先完成对象选择和目标主机选择。
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6 p-6">
        {statusTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {statusTags.map((tag) => (
              <Badge key={tag} variant={getTagVariant(tag)}>
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

        {(data.validations?.length ||
          (showPermissionInfo && data.permissions?.canSubmit === false)) ? (
          <>
            <Separator />
            <ValidationList
              validations={data.validations}
              permissions={data.permissions}
              showPermissionInfo={showPermissionInfo}
            />
          </>
        ) : null}

        {renderExtraSection ? (
          <>
            <Separator />
            {renderExtraSection()}
          </>
        ) : null}

        {status === "partial" ? (
          <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700">
            部分目标明细未完整返回，当前展示内容可能不是完整视图。
          </div>
        ) : null}
      </div>
    )
  }

  const hideFooter = status === "loading" || status === "error" || status === "empty"

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-slate-50/70 p-6 pb-4">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-sm">{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">{renderContent()}</div>

        {!hideFooter ? (
          <FooterActions
            onBack={onBack}
            onConfirm={onConfirm}
            confirmText={confirmText}
            submitting={submitting}
            readonly={readonly}
            validations={data?.validations}
            permissions={data?.permissions}
            dangerConfirmRequired={dangerConfirmRequired}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default DispatchPreview
