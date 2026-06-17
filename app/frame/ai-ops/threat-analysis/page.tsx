"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { BrainCircuit, Loader2, Search, Shield } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import AttackReport from "@/features/ai-ops/threat-analysis/components/attack-report"
import {
  createAttackAIReportTask,
  getAttackAIReportTask,
} from "@/features/ai-ops/threat-analysis/api"
import type { AttackAIReportTask } from "@/features/ai-ops/threat-analysis/report-types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

const REPORT_TIMEZONE = "Asia/Shanghai"
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90

type AnalysisPhase = "creating" | "analyzing" | "localizing"

function normalizeTaskStatus(status?: string) {
  return status?.trim().toLowerCase() || "unknown"
}

function isActiveTaskStatus(status: string) {
  return status === "pending" || status === "running"
}

function hasLocalizedReport(task: AttackAIReportTask) {
  return Boolean(task.localized_report || task.localized_report_json)
}

function reportLocaleFromAppLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"
}

function shouldWaitForLocalizedReport(reportLocale: string) {
  return reportLocale !== "en-US"
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return ""
}

function NoCaseState() {
  const t = useTranslations("pages.aiops.threatAnalysis.search")

  return (
    <section className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
          <Shield className="h-5 w-5 text-slate-500" />
        </div>
        <div className="text-sm font-semibold text-slate-900">{t("emptyTitle")}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{t("emptyDescription")}</p>
      </div>
    </section>
  )
}

function AnalysisProgressState({
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

  return (
    <section className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
      <div className="w-full max-w-2xl" role="status" aria-live="polite">
        <div className="relative mx-auto mb-6 h-[104px] w-[104px] text-blue-600">
          <span className="absolute inset-0 animate-[ai-core-breathe_2.8s_ease-in-out_infinite] rounded-full bg-blue-500/15 blur-2xl" />
          <span className="absolute inset-1 rounded-full bg-white shadow-[0_20px_58px_rgba(37,99,235,0.18)] ring-1 ring-blue-100" />
          <span className="absolute inset-2 animate-[ai-core-spin_2.6s_linear_infinite] rounded-full border-[3px] border-transparent border-r-cyan-400 border-t-blue-600" />
          <span className="absolute inset-[13px] animate-[ai-core-reverse_7s_linear_infinite] rounded-full border border-dashed border-indigo-300/80" />
          <span className="absolute inset-[22px] rounded-full bg-[radial-gradient(circle_at_35%_25%,#ffffff,rgba(239,246,255,0.96)_48%,rgba(219,234,254,0.82))] shadow-inner shadow-blue-100" />
          <span className="absolute inset-[24px] animate-[ai-core-glow_2.4s_ease-in-out_infinite] rounded-full bg-[conic-gradient(from_135deg,rgba(37,99,235,0.2),rgba(14,165,233,0.14),rgba(99,102,241,0.2),rgba(37,99,235,0.2))]" />
          <span className="absolute left-1/2 top-[7px] h-3.5 w-1 -translate-x-1/2 animate-[ai-node-pulse_1.8s_ease-in-out_infinite] rounded-full bg-blue-500 shadow-[0_0_14px_rgba(37,99,235,0.46)]" />
          <span className="absolute right-[7px] top-1/2 h-1 w-3.5 -translate-y-1/2 animate-[ai-node-pulse_1.8s_ease-in-out_infinite] rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(14,165,233,0.42)] [animation-delay:0.45s]" />
          <span className="absolute bottom-[7px] left-1/2 h-3.5 w-1 -translate-x-1/2 animate-[ai-node-pulse_1.8s_ease-in-out_infinite] rounded-full bg-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.42)] [animation-delay:0.9s]" />
          <span className="absolute left-[7px] top-1/2 h-1 w-3.5 -translate-y-1/2 animate-[ai-node-pulse_1.8s_ease-in-out_infinite] rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.38)] [animation-delay:1.35s]" />
          <div className="absolute inset-[31px] flex items-center justify-center rounded-full bg-white/95 text-blue-600 ring-1 ring-blue-100 shadow-[inset_0_1px_12px_rgba(37,99,235,0.14)]">
            <BrainCircuit className="h-7 w-7 stroke-[1.8]" />
          </div>
        </div>
        <div className="text-base font-semibold text-slate-950">{t("progressTitle")}</div>
        <p className="mx-auto mt-1 max-w-xl break-all text-sm leading-6 text-slate-500">
          {t("progressDescription", { caseId: caseId || "-" })}
        </p>

        <div className="mx-auto mt-7 w-full max-w-2xl">
          <div className="relative h-3.5 overflow-hidden rounded-full bg-slate-200 shadow-inner shadow-slate-300/60 ring-1 ring-slate-200" aria-hidden="true">
            <span className="absolute inset-0 animate-[ai-energy-flow_2.6s_linear_infinite] bg-[linear-gradient(90deg,#2563eb_0%,#38bdf8_30%,#4f46e5_62%,#2563eb_100%)] bg-[length:220%_100%] shadow-[0_0_24px_rgba(37,99,235,0.28)]" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent_55%)]" />
            <span className="absolute inset-0 animate-[ai-stage-scan_1.65s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]" />
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
                      ? "text-blue-700"
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

function CaseIdSearchToolbar() {
  const t = useTranslations("pages.aiops.threatAnalysis.search")
  const appLocale = useLocale()
  const reportLocale = useMemo(() => reportLocaleFromAppLocale(appLocale), [appLocale])
  const waitForLocalizedReport = shouldWaitForLocalizedReport(reportLocale)
  const [caseId, setCaseId] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>("creating")
  const [reportTask, setReportTask] = useState<AttackAIReportTask | null>(null)
  const runIdRef = useRef(0)
  const pollTimerRef = useRef<number | null>(null)

  const clearPollTimer = useCallback(() => {
    if (!pollTimerRef.current) {
      return
    }

    window.clearTimeout(pollTimerRef.current)
    pollTimerRef.current = null
  }, [])

  const completeTask = useCallback((task: AttackAIReportTask) => {
    const status = normalizeTaskStatus(task.status)

    if (status === "succeeded") {
      const localizedStatus = normalizeTaskStatus(task.localized_status)

      if (waitForLocalizedReport && !hasLocalizedReport(task) && isActiveTaskStatus(localizedStatus)) {
        setAnalysisPhase("localizing")
        setReportTask(task)
        return false
      }

      clearPollTimer()
      setReportTask(task)
      setLoading(false)
      if (waitForLocalizedReport && !hasLocalizedReport(task) && localizedStatus === "invalid") {
        toast.warning(task.localized_error_message || t("translationInvalid"))
      } else if (waitForLocalizedReport && !hasLocalizedReport(task) && localizedStatus === "failed") {
        toast.warning(task.localized_error_message || t("translationFailed"))
      } else if (waitForLocalizedReport && !hasLocalizedReport(task)) {
        toast.warning(t("translationPending"))
      } else {
        toast.success(t("succeeded"))
      }
      return true
    }

    if (status === "invalid") {
      clearPollTimer()
      setLoading(false)
      toast.error(task.error_message || t("invalid"))
      return true
    }

    if (status === "failed") {
      clearPollTimer()
      setLoading(false)
      toast.error(task.error_message || t("failed"))
      return true
    }

    if (!isActiveTaskStatus(status)) {
      clearPollTimer()
      setLoading(false)
      toast.error(t("unknownStatus", { status: task.status || "unknown" }))
      return true
    }

    return false
  }, [clearPollTimer, t, waitForLocalizedReport])

  const startPolling = useCallback((taskId: string, runId: number) => {
    let attempts = 0

    const poll = async () => {
      if (runIdRef.current !== runId) {
        return
      }

      attempts += 1

      try {
        const task = await getAttackAIReportTask({ taskId, locale: reportLocale })

        if (runIdRef.current !== runId) {
          return
        }

        if (completeTask(task)) {
          return
        }

        if (attempts >= MAX_POLL_ATTEMPTS) {
          clearPollTimer()
          setLoading(false)
          toast.error(t("timeout"))
          return
        }

        pollTimerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS)
      } catch (error) {
        if (runIdRef.current !== runId) {
          return
        }

        clearPollTimer()
        setLoading(false)
        toast.error(getErrorMessage(error) || t("failed"))
      }
    }

    clearPollTimer()
    pollTimerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS)
  }, [clearPollTimer, completeTask, reportLocale, t])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelector("main.overflow-auto")?.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [])

  useEffect(() => {
    return () => {
      runIdRef.current += 1
      clearPollTimer()
    }
  }, [clearPollTimer])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedCaseId = caseId.trim()

    if (!normalizedCaseId) {
      toast.error(t("caseIdRequired"))
      return
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId
    clearPollTimer()
    setLoading(true)
    setAnalysisPhase("creating")
    setReportTask(null)

    try {
      const task = await createAttackAIReportTask({
        caseId: normalizedCaseId,
        timezone: REPORT_TIMEZONE,
        locale: reportLocale,
      })

      if (runIdRef.current !== runId) {
        return
      }

      setAnalysisPhase("analyzing")

      if (completeTask(task)) {
        return
      }

      if (!task.task_id) {
        setLoading(false)
        toast.error(t("missingTaskId"))
        return
      }

      toast.info(t("started"))
      startPolling(task.task_id, runId)
    } catch (error) {
      if (runIdRef.current !== runId) {
        return
      }

      clearPollTimer()
      setLoading(false)
      toast.error(getErrorMessage(error) || t("failed"))
    }
  }

  return (
    <>
      <section className="w-full rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
        <form
          className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={handleSubmit}
        >
          <div className="flex h-11 min-w-0 w-full flex-1 items-center rounded-full border border-slate-200 bg-slate-50/80 pl-3 pr-1 shadow-inner shadow-slate-100/70">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <Input
              value={caseId}
              onChange={(event) => setCaseId(event.target.value)}
              placeholder={t("caseIdPlaceholder")}
              aria-label="CaseID"
              spellCheck={false}
              disabled={loading}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 font-mono text-sm font-semibold text-slate-900 shadow-none placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-wait disabled:opacity-80"
            />
            <Button
              type="submit"
              className="h-9 shrink-0 rounded-full bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-85"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {loading ? t("analyzing") : t("submit")}
            </Button>
          </div>
        </form>
      </section>
      {loading ? (
        <AnalysisProgressState caseId={caseId.trim()} phase={analysisPhase} />
      ) : reportTask ? (
        <AttackReport task={reportTask} />
      ) : (
        <NoCaseState />
      )}
    </>
  )
}

export default function ThreatAnalysisPage() {
  return (
    <main className="flex min-h-[calc(100vh-3rem)] bg-gray-50">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <CaseIdSearchToolbar />
      </div>
    </main>
  )
}
