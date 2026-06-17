"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { Loader2, Search, Shield } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import AttackReport from "@/features/ai-ops/threat-analysis/components/attack-report"
import {
  AnalysisProgressState,
  type AnalysisPhase,
} from "@/features/ai-ops/threat-analysis/components/analysis-progress-state"
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

function CaseIdSearchToolbar() {
  const t = useTranslations("pages.aiops.threatAnalysis.search")
  const searchParams = useSearchParams()
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
    const queryCaseId =
      searchParams.get("caseId")?.trim() ||
      searchParams.get("case_id")?.trim() ||
      ""

    if (!queryCaseId) {
      return
    }

    setCaseId(queryCaseId)
  }, [searchParams])

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
