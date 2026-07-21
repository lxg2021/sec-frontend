"use client"

import { Check, Database, ListChecks, Plus, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/shared/ui/button"

interface CustomBaselineWorkspaceHeaderProps {
  templateCount: number
  selectedTemplateCount: number
  selectedItemCount: number
  highRiskCount: number
  existingBaselineCount: number
  canCreate: boolean
  onOpenExisting: () => void
  onCreate: () => void
}

export function CustomBaselineWorkspaceHeader({
  templateCount,
  selectedTemplateCount,
  selectedItemCount,
  highRiskCount,
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
      <section className="overflow-hidden rounded-[24px] border border-teal-100/80 bg-[linear-gradient(110deg,#ffffff_0%,#ffffff_58%,#ecfdf8_100%)] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 px-5 py-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950">{t("title")}</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{t("subtitle")}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="inline-flex h-7 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t("templateSelector.title")} {templateCount}
                </span>
                <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {t("summary.totalSelected")} {selectedItemCount}
                </span>
                <span className="inline-flex h-7 items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 text-orange-700">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  {t("summary.high")} {highRiskCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row 2xl:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={onOpenExisting}
              className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 shadow-none hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              <Database className="h-4 w-4" />
              <span>{t("existingList.title")}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] tabular-nums text-slate-600">
                {existingBaselineCount}
              </span>
            </Button>
            <Button
              type="button"
              onClick={onCreate}
              disabled={!canCreate}
              className="h-11 gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-cyan-600 px-5 text-white shadow-sm shadow-teal-900/10 hover:from-teal-800 hover:to-cyan-700"
            >
              <Plus className="h-4 w-4" />
              <span>{t("createBaseline")}</span>
            </Button>
          </div>
        </div>
      </section>

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
