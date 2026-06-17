"use client"

import { useEffect, useState } from "react"
import { BrainCircuit } from "lucide-react"
import { useTranslations } from "next-intl"

export type AnalysisPhase = "creating" | "analyzing" | "localizing"

function AiProgressOrb() {
  return (
    <div className="relative mx-auto mb-6 h-[104px] w-[104px] text-cyan-600">
      <span className="absolute inset-0 animate-[ai-core-breathe_2.8s_ease-in-out_infinite] rounded-full bg-cyan-300/10 blur-2xl" />
      <span className="absolute inset-1 rounded-full bg-[linear-gradient(145deg,#ffffff,#f1f5f9)] shadow-[0_18px_50px_rgba(15,23,42,0.10),0_0_30px_rgba(14,165,233,0.10)] ring-1 ring-slate-200/80" />
      <span className="absolute inset-2 animate-[ai-core-spin_3s_linear_infinite] rounded-full border-[3px] border-transparent border-r-cyan-500 border-t-slate-300" />
      <span className="absolute inset-[13px] animate-[ai-core-reverse_7s_linear_infinite] rounded-full border border-dashed border-slate-300/80" />
      <span className="absolute inset-[22px] rounded-full bg-[radial-gradient(circle_at_35%_25%,#ffffff,rgba(248,250,252,0.96)_48%,rgba(226,232,240,0.78))] shadow-inner shadow-slate-200" />
      <span className="absolute inset-[24px] animate-[ai-core-glow_2.4s_ease-in-out_infinite] rounded-full bg-[conic-gradient(from_135deg,rgba(6,182,212,0.16),rgba(100,116,139,0.12),rgba(14,165,233,0.14),rgba(6,182,212,0.16))]" />
      <div className="absolute inset-[31px] flex items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#eff6ff_44%,#dbeafe_100%)] text-cyan-600 ring-1 ring-cyan-200/80 shadow-[0_9px_22px_rgba(15,23,42,0.13),0_0_16px_rgba(6,182,212,0.18),inset_0_1px_8px_rgba(255,255,255,0.74)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.70),transparent_38%)]" />
        <BrainCircuit className="relative h-7 w-7 stroke-[2.05]" />
      </div>
    </div>
  )
}

export function AnalysisProgressState({
  caseId,
  phase,
}: {
  caseId: string
  phase: AnalysisPhase
}) {
  const t = useTranslations("pages.aiops.threatAnalysis.search")
  const steps: Array<{ key: AnalysisPhase; label: string }> = [
    { key: "creating", label: t("phaseCreating") },
    { key: "analyzing", label: t("phaseAnalyzing") },
    { key: "localizing", label: t("phaseLocalizing") },
  ]
  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === phase))
  const progressTargetByPhase: Record<AnalysisPhase, number> = {
    creating: 22,
    analyzing: 74,
    localizing: 94,
  }
  const progressTarget = progressTargetByPhase[phase]
  const [progressValue, setProgressValue] = useState(8)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgressValue((current) => {
        if (current >= progressTarget) {
          return current
        }

        const step = current < 36 ? 1.15 : current < 72 ? 0.72 : 0.34
        return Math.min(progressTarget, current + step)
      })
    }, 420)

    return () => window.clearInterval(timer)
  }, [progressTarget])

  return (
    <section className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
      <div className="w-full max-w-2xl" role="status" aria-live="polite">
        <AiProgressOrb />
        <div className="text-base font-semibold text-slate-950">{t("progressTitle")}</div>
        <p className="mx-auto mt-1 max-w-xl break-all text-sm leading-6 text-slate-500">
          {t("progressDescription", { caseId: caseId || "-" })}
        </p>

        <div className="mx-auto mt-7 w-full max-w-2xl">
          <div
            className="relative h-3.5 overflow-hidden rounded-full bg-slate-200 shadow-inner shadow-slate-300/60 ring-1 ring-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressValue)}
          >
            <span
              className="absolute left-0 top-0 h-full overflow-hidden rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#0ea5e9_52%,#22d3ee_100%)] shadow-[0_0_18px_rgba(14,165,233,0.22)] transition-[width] duration-700 ease-out"
              style={{ width: `${progressValue}%` }}
            >
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent_58%)]" />
              <span className="absolute inset-0 animate-[ai-stage-scan_1.65s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.78),transparent)]" />
            </span>
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-3 text-center">
            {steps.map((step, index) => {
              const isActive = index === activeIndex
              const isDone = index < activeIndex

              return (
                <div
                  key={step.key}
                  className={[
                    "min-w-0 text-[13px] font-medium transition-colors duration-300",
                    isActive
                      ? "text-cyan-700"
                      : isDone
                        ? "text-slate-700"
                        : "text-slate-400",
                  ].join(" ")}
                >
                  <span className="block truncate">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
