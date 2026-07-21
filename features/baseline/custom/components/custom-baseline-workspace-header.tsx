"use client"

import { Check, Database, ListChecks, Plus, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/shared/ui/button"

interface CustomBaselineWorkspaceHeaderProps {
  selectedTemplateCount: number
  selectedItemCount: number
  existingBaselineCount: number
  canCreate: boolean
  onOpenExisting: () => void
  onCreate: () => void
}

export function CustomBaselineWorkspaceHeader({
  selectedTemplateCount,
  selectedItemCount,
  existingBaselineCount,
  canCreate,
  onOpenExisting,
  onCreate,
}: CustomBaselineWorkspaceHeaderProps) {
  const t = useTranslations("pages.baseline.custom")

  const steps = [
    {
      title: t("templateSelector.title"),
      description: t("templateSelector.subtitle"),
      complete: selectedTemplateCount > 0,
      active: selectedTemplateCount === 0,
    },
    {
      title: t("itemsPanel.title"),
      description: t("itemsPanel.selectedSubtitle"),
      complete: selectedItemCount > 0,
      active: selectedTemplateCount > 0 && selectedItemCount === 0,
    },
    {
      title: t("createForm.title"),
      description: t("createForm.description"),
      complete: false,
      active: selectedItemCount > 0,
    },
  ]

  return (
    <div className="shrink-0 space-y-3">
      <header className="w-full shrink-0 rounded-[28px] border border-slate-200/80 bg-white px-5 py-[13px] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-center gap-4 xl:w-[430px] xl:flex-none 2xl:w-[500px]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <h1 className="truncate text-lg font-semibold leading-tight text-slate-950">{t("title")}</h1>
              <p className="truncate text-sm text-slate-500">{t("subtitle")}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">

            <span className="hidden h-6 w-px shrink-0 bg-slate-200 2xl:block" aria-hidden="true" />
            <Button
              type="button"
              variant="ghost"
              onClick={onOpenExisting}
              className="h-10 shrink-0 gap-2 rounded-full px-3 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <Database className="h-4 w-4" />
              <span className="font-medium">{t("existingList.title")}</span>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] tabular-nums text-cyan-700">
                {existingBaselineCount}
              </span>
            </Button>
            <span className="h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />
            <Button
              type="button"
              onClick={onCreate}
              disabled={!canCreate}
              className="h-10 min-w-36 shrink-0 gap-2 rounded-full bg-teal-600 px-5 text-white shadow-sm hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              <span>{t("createBaseline")}</span>
            </Button>
          </div>
        </div>
      </header>

      <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          {steps.map((step, index) => {
            const Icon = index === 0 ? ShieldCheck : index === 1 ? ListChecks : Plus
            const emphasized = step.complete || step.active

            return (
              <div key={step.title} className="contents">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      emphasized ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {step.complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className={emphasized ? "truncate text-xs font-semibold text-slate-950" : "truncate text-xs font-semibold text-slate-500"}>
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={[
                      "hidden h-px w-24 lg:block 2xl:w-40",
                      step.complete ? "bg-teal-300" : "bg-[repeating-linear-gradient(90deg,#cbd5e1_0,#cbd5e1_5px,transparent_5px,transparent_10px)]",
                    ].join(" ")}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
