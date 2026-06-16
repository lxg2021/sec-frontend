"use client"

import { BrainCircuit, ShieldAlert, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

const metrics = [
  { label: "Alerts", value: "128", delta: "+14%" },
  { label: "Correlated", value: "36", delta: "+8%" },
  { label: "High risk", value: "9", delta: "-3%" },
]

export default function ThreatAnalysisPage() {
  const t = useTranslations("pages.aiops.threatAnalysis")

  return (
    <div className="min-h-full bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <BrainCircuit className="h-4 w-4 text-sky-500" />
            AI analysis
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-3xl font-semibold text-slate-900 dark:text-white">{metric.value}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">{metric.delta}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI output placeholder
          </div>
          <div className="mt-4 h-64 rounded-lg border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60" />
        </div>
      </div>
    </div>
  )
}
