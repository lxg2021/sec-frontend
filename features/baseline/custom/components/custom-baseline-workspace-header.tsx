"use client"

import { Database, Plus, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

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
      complete: selectedTemplateCount > 0,
    },
    {
      title: t("itemsPanel.title"),
      complete: selectedItemCount > 0,
    },
    {
      title: t("createForm.title"),
      complete: false,
    },
  ]

  return (
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
          <div className="hidden h-12 w-[560px] shrink-0 grid-cols-[auto_52px_auto_52px_auto] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 2xl:grid">
            {steps.map((step, index) => (
              <div key={step.title} className="contents">
                <FlowBadge number={index + 1} title={step.title} done={step.complete} />
                {index < steps.length - 1 ? <div className="mx-3 h-px bg-slate-300" /> : null}
              </div>
            ))}
          </div>

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
  )
}

function FlowBadge({ number, title, done }: { number: number; title: string; done: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", done ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-500")}>
        {number}
      </span>
      <span className={cn("truncate text-[11px] font-semibold", done ? "text-slate-900" : "text-slate-500")}>{title}</span>
    </div>
  )
}
