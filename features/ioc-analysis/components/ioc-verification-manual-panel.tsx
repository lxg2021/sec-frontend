"use client"

import type { FormEvent } from "react"
import { Loader2, Plus, RefreshCw, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import type { IocVerificationType } from "@/features/ioc-analysis/types"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"

export function IocVerificationManualPanel({
  manualType,
  manualInput,
  typeOptions,
  verifying,
  hasItems,
  onManualTypeChange,
  onManualInputChange,
  onSubmit,
  onVerifyAll,
}: {
  manualType: IocVerificationType
  manualInput: string
  typeOptions: IocVerificationType[]
  verifying: boolean
  hasItems: boolean
  onManualTypeChange: (value: IocVerificationType) => void
  onManualInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onVerifyAll: () => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Plus className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">
            {t("manual.title")}
          </h2>
          <p className="text-xs leading-5 text-slate-500">
            {t("manual.description")}
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-3">
          <label className="block text-xs font-medium text-slate-500">
            {t("fields.type")}
            <select
              value={manualType}
              onChange={(event) =>
                onManualTypeChange(event.target.value as IocVerificationType)
              }
              disabled={verifying}
              className="mt-2 h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-300 focus:bg-white"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-500">
            {t("fields.value")}
            <Textarea
              value={manualInput}
              onChange={(event) => onManualInputChange(event.target.value)}
              placeholder={t("manual.placeholder")}
              disabled={verifying}
              className="mt-2 min-h-[174px] resize-none rounded-2xl border-slate-200 bg-slate-50 font-mono text-sm shadow-none focus-visible:ring-blue-200"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            className="h-10 rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-800"
            disabled={verifying || !manualInput.trim()}
          >
            <Search className="size-4" />
            {t("actions.addVerify")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-2xl border-slate-200 px-4"
            disabled={verifying || !hasItems}
            onClick={onVerifyAll}
          >
            {verifying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("actions.verifyAll")}
          </Button>
        </div>
      </form>
    </section>
  )
}
