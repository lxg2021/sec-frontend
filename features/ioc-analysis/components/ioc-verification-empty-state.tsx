"use client"

import { ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

export function IocVerificationEmptyState() {
  const t = useTranslations("pages.iocAnalysis.verification")

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-sm font-semibold text-slate-900">{t("empty.title")}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        {t("empty.description")}
      </p>
    </div>
  )
}
