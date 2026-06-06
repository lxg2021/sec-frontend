"use client"

import { useEffect, useState } from "react"
import AttckHeader from "@/features/attack/dashboard/components/header"
import { AttackDashboardHeader } from "@/features/attack/dashboard/components/attack-dashboard-header"
import StageHostDistributionChart from "@/features/attack/dashboard/components/stage-host-distribution-chart"
import AttackStatsTrendChart from "@/features/attack/dashboard/components/attack-stats-trend-chart"
import AttackTop10 from "@/features/attack/dashboard/components/attack-top10"
import TopRiskHosts from "@/features/attack/dashboard/components/top-risk-hosts"
import { fetchAttackDashboardData, getTaskStatus } from "@/features/attack/dashboard/api"
import type { AttackOverview } from "@/features/attack/dashboard/types"
import type { AttckData } from "@/features/attack/utils/attck-utils"
import { useTranslations } from "next-intl"
import { useToast } from "@/shared/hooks/use-toast"

const EMPTY_DATA: AttckData = {
  starttime: "",
  endtime: "",
  range: "fixed",
  "affected-hosts": 0,
  "attck-counts": 0,
  "stage-counts": 0,
  severity: [
    { severity: "高", "affected-hosts": 0 },
    { severity: "中", "affected-hosts": 0 },
    { severity: "低", "affected-hosts": 0 },
  ],
  top10: [],
  stages: [],
}

const TASK_POLL_INTERVAL_MS = 3000
const TASK_TIMEOUT_MS = 20 * 60 * 1000

type AsyncTaskState =
  | { status: "idle"; message?: string }
  | { status: "pending" | "running"; taskId: string; startedAt: number; message: string }
  | { status: "success" | "failed" | "timeout"; taskId?: string; message: string }

export default function AttckDashboardPage() {
  const t = useTranslations("pages.attack.dashboard")
  const { toast } = useToast()
  const [data, setData] = useState<AttckData | null>(null)
  const [overview, setOverview] = useState<AttackOverview | null>(null)
  const [checking, setChecking] = useState(false)
  const [taskState, setTaskState] = useState<AsyncTaskState>({ status: "idle" })

  useEffect(() => {
    void loadDashboard()
  }, [])

  useEffect(() => {
    if (taskState.status !== "pending" && taskState.status !== "running") return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const { taskId, startedAt } = taskState

    const poll = async () => {
      if (cancelled) return
      if (Date.now() - startedAt >= TASK_TIMEOUT_MS) {
        setTaskState({
          status: "timeout",
          taskId,
          message: t("task.timeoutMessage"),
        })
        toast({
          title: t("task.timeoutTitle"),
          description: t("task.timeoutDescription"),
        })
        return
      }

      try {
        const status = await getTaskStatus(taskId)
        if (cancelled) return

        if (status.status === "success") {
          setTaskState({ status: "success", taskId, message: t("task.successMessage") })
          await loadDashboard()
          if (!cancelled) {
            toast({
              title: t("task.successTitle"),
              description: t("task.successDescription"),
            })
          }
          return
        }

        if (status.status === "failed") {
          setTaskState({
            status: "failed",
            taskId,
            message: status.error_message || t("task.failedMessage"),
          })
          toast({
            title: t("task.failedTitle"),
            description: status.error_message || t("task.failedMessage"),
            variant: "destructive",
          })
          return
        }

        setTaskState((current) => {
          if (current.status !== "pending" && current.status !== "running") return current
          if (current.taskId !== taskId) return current
          return {
            ...current,
            status: status.status === "pending" ? "pending" : "running",
            message: status.status === "pending" ? t("task.pendingMessage") : t("task.runningMessage"),
          }
        })
      } catch (error) {
        console.error("poll attack stats task failed", error)
      }

      if (!cancelled) {
        timer = setTimeout(poll, TASK_POLL_INTERVAL_MS)
      }
    }

    timer = setTimeout(poll, TASK_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [taskState, toast, t])

  async function loadDashboard() {
    try {
      const result = await fetchAttackDashboardData()
      setOverview(result.overview)
      setData(result.data)
    } catch (error) {
      console.error("load attack dashboard failed", error)
      setOverview({
        bucket: {
          bucket_type: "fixed",
          bucket_start: "",
          bucket_end: "",
        },
        scope: "",
        total_rules: 0,
        total_groups: 0,
        total_instances: 0,
        total_sources: 0,
        total_hosts: 0,
        total_cases: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
      })
      setData(EMPTY_DATA)
    }
  }

  async function handleRefresh() {
    setChecking(true)
    await loadDashboard()
    setChecking(false)
  }

  function handleCheckSubmitted(taskId: string) {
    setTaskState({
      status: "pending",
      taskId,
      startedAt: Date.now(),
      message: t("task.submittedMessage"),
    })
    toast({
      title: t("task.submittedTitle"),
      description: t("task.submittedDescription"),
    })
  }
  const taskChecking = taskState.status === "pending" || taskState.status === "running"

  if (!data || !overview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-sm text-gray-500 shadow-sm">
            {t("loading")}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <AttackDashboardHeader
          overview={overview}
          checking={checking || taskChecking}
          onRefresh={() => void handleRefresh()}
          onCheckSubmitted={handleCheckSubmitted}
        />

        <AttckHeader data={data} overview={overview} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StageHostDistributionChart
            snapshotId={overview.bucket.snapshot_id}
          />
          <AttackStatsTrendChart />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AttackTop10 top10={data.top10 || []} />
          <TopRiskHosts snapshotId={overview.bucket.snapshot_id} />
        </div>
      </div>
    </div>
  )
}
