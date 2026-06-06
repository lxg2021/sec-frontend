"use client"

import { useEffect, useMemo, useState } from "react"
import AttckHeader from "@/features/attack/dashboard/components/header"
import { AttackDashboardHeader } from "@/features/attack/dashboard/components/attack-dashboard-header"
import StageDetails from "@/features/attack/dashboard/components/stage-details"
import OverviewCarousel from "@/features/attack/dashboard/components/overview-carousel"
import StageHostDistributionChart from "@/features/attack/dashboard/components/stage-host-distribution-chart"
import AttackTop10 from "@/features/attack/dashboard/components/attack-top10"
import { fetchAttackDashboardData, getTaskStatus } from "@/features/attack/dashboard/api"
import type { AttackOverview } from "@/features/attack/dashboard/types"
import type { AttckData } from "@/features/attack/utils/attck-utils"
import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { slugify } from "@/features/attack/utils/stage-color"
import { useTranslations } from "next-intl"
import { useToast } from "@/shared/hooks/use-toast"

function stageIdentity(stage: { stageKey?: string; stage: string }) {
  return stage.stageKey || slugify(stage.stage)
}

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

  const stages = data?.stages || []
  const firstStageSlug = stages.length > 0 ? stageIdentity(stages[0]) : null
  const [selectedStageSlug, setSelectedStageSlug] = useState<string | null>(null)

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

  useEffect(() => {
    if (!selectedStageSlug && firstStageSlug) {
      setSelectedStageSlug(firstStageSlug)
    }
  }, [firstStageSlug, selectedStageSlug])

  const selectedStage = useMemo(() => {
    if (!selectedStageSlug) return null
    return stages.find((stage) => stageIdentity(stage) === selectedStageSlug) || null
  }, [selectedStageSlug, stages])

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

  function onSelectStage(stage: (typeof stages)[number]) {
    const slug = stageIdentity(stage)
    setSelectedStageSlug(slug)
    const el = document.getElementById("stage-details")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
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
            stages={stages}
            selectedStageSlug={selectedStageSlug}
            onSelectStage={onSelectStage}
          />

          <AttackTop10 top10={data.top10 || []} />
        </div>

        <div className="grid grid-cols-12 gap-6 border-0 shadow-lg">
          <div className="col-span-12">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <BarChart3 className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-gray-900">{t("stageStats")}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {t("stageStatsDescription")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <OverviewCarousel
                    stages={stages}
                    selectedStageSlug={selectedStageSlug}
                    onSelectStage={onSelectStage}
                  />
                </div>

                <div className="mt-6" id="stage-details">
                  <StageDetails stage={selectedStage} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
