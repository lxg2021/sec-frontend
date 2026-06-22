"use client"

import { FileSearch, Loader2, Radar, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export function IocVerificationSourcePanel({
  caseId,
  workflowId,
  tenantId,
  taskStatus,
  caseTaskId,
  extractedCount,
  previewMessage,
  extracting,
  verifying,
  onCaseIdChange,
  onLoadPreview,
}: {
  caseId: string
  workflowId: string
  tenantId: string
  taskStatus: string
  caseTaskId: string
  extractedCount: number
  previewMessage: string
  extracting: boolean
  verifying: boolean
  onCaseIdChange: (value: string) => void
  onLoadPreview: () => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <FileSearch className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">
            {t("casePanel.title")}
          </h2>
          <p className="text-xs leading-5 text-slate-500">
            {t("casePanel.description")}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block text-xs font-medium text-slate-500">
          {t("fields.caseId")}
          <Input
            value={caseId}
            onChange={(event) => onCaseIdChange(event.target.value)}
            placeholder={t("casePanel.casePlaceholder")}
            disabled={extracting || verifying}
            className="mt-2 h-10 rounded-2xl border-slate-200 bg-slate-50 font-mono text-sm shadow-none focus-visible:ring-blue-200"
          />
        </label>

        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-3 border-y border-slate-100 py-4 text-sm">
          <span className="text-slate-400">{t("detail.workflow")}</span>
          <span className="truncate font-mono text-slate-700">
            {workflowId || "-"}
          </span>
          <span className="text-slate-400">{t("fields.tenant")}</span>
          <span className="truncate font-mono text-slate-700">
            {tenantId}
          </span>
          <span className="text-slate-400">{t("fields.taskStatus")}</span>
          <span className="text-slate-700">{taskStatus || "-"}</span>
          <span className="text-slate-400">{t("detail.extracted")}</span>
          <span className="text-slate-700">
            {t("detail.extractedCount", { count: extractedCount })}
          </span>
        </div>

        {previewMessage ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
            {previewMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-10 rounded-2xl bg-blue-600 px-4 text-white hover:bg-blue-700"
            disabled={extracting || verifying || !caseId.trim()}
            onClick={onLoadPreview}
          >
            {extracting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Radar className="size-4" />
            )}
            {extracting ? t("actions.loadingPreview") : t("actions.loadPreview")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-2xl border-slate-200"
            disabled={extracting || verifying || !caseId.trim()}
            onClick={onLoadPreview}
          >
            <RefreshCw className="size-4" />
            {t("actions.refreshPreview")}
          </Button>
        </div>
        {caseTaskId ? (
          <div className="truncate font-mono text-xs text-slate-400">
            {t("fields.verifyTask")}: {caseTaskId}
          </div>
        ) : null}
      </div>
    </section>
  )
}
