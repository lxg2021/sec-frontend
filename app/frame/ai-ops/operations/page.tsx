"use client"

import { Bot, BarChart3, Workflow } from "lucide-react"
import { useTranslations } from "next-intl"

const steps = [
  "Ingest events",
  "Summarize findings",
  "Dispatch tasks",
]

export default function OperationsManagementPage() {
  const t = useTranslations("pages.aiops.operations")

  return (
    <div className="min-h-full bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Workflow className="h-4 w-4 text-violet-500" />
            Workflow
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Operations queue
            </div>
            <div className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{step}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">AI assistant panel</div>
            <div className="mt-4 h-64 rounded-lg border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60" />
          </div>
        </div>
      </div>
    </div>
  )
}
