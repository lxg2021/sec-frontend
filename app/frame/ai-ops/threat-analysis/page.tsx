"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { Loader2, Search } from "lucide-react"
import { useTranslations } from "next-intl"
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

function normalizeTaskStatus(status?: string) {
  return status?.trim().toLowerCase() || "unknown"
}

function isActiveTaskStatus(status: string) {
  return status === "pending" || status === "running"
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return ""
}

function CaseIdSearchToolbar() {
  const t = useTranslations("pages.aiops.threatAnalysis.search")
  const [caseId, setCaseId] = useState("")
  const [loading, setLoading] = useState(false)
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
      clearPollTimer()
      setReportTask(task)
      setLoading(false)
      toast.success(t("succeeded"))
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
  }, [clearPollTimer, t])

  const startPolling = useCallback((taskId: string, runId: number) => {
    let attempts = 0

    const poll = async () => {
      if (runIdRef.current !== runId) {
        return
      }

      attempts += 1

      try {
        const task = await getAttackAIReportTask({ taskId })

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
  }, [clearPollTimer, completeTask, t])

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
    setReportTask(null)

    try {
      const task = await createAttackAIReportTask({
        caseId: normalizedCaseId,
        timezone: REPORT_TIMEZONE,
      })

      if (runIdRef.current !== runId) {
        return
      }

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
      <section className="mx-auto w-full max-w-[120rem] rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
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
      {reportTask ? <AttackReport task={reportTask} /> : null}
    </>
  )
}

export default function ThreatAnalysisPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="space-y-6 px-6 pb-6 pt-2">
        <CaseIdSearchToolbar />
      </div>
    </main>
  )
}
