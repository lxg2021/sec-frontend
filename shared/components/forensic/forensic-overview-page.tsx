"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import type {
  ForensicBackendStatusData,
  ForensicOverviewContext,
  ForensicOverviewViewModel,
} from "@/shared/lib/forensic/types"
import { getForensicBackendStatus, getForensicOverview } from "@/shared/lib/forensic/api"
import { ForensicArtifactCategorySummary } from "./forensic-artifact-category-summary"
import { ForensicBackendStatusPanel } from "./forensic-backend-status-panel"
import { ForensicEndpointStatusSummary } from "./forensic-endpoint-status-summary"
import { ForensicOverviewHeader } from "./forensic-overview-header"
import { ForensicRecentTaskSummary } from "./forensic-recent-task-summary"
import { ForensicServiceStatusCard } from "./forensic-service-status-card"
import { ForensicTaskStatusSummary } from "./forensic-task-status-summary"

interface Props {
  context: ForensicOverviewContext
}

const EMPTY_FORENSIC_OVERVIEW: ForensicOverviewViewModel = {
  availability: {
    level: "unavailable",
    title: "",
    summary: "",
    can_create_task: false,
    target_agent_count: 0,
    available_endpoint_count: 0,
    unbound_endpoint_count: 0,
    offline_endpoint_count: 0,
    blocked_endpoint_count: 0,
    enabled_artifact_count: 0,
    running_task_count: 0,
    failed_task_count: 0,
    blocking_reasons: [],
  },
  metrics: {
    endpoint_total: 0,
    endpoint_online: 0,
    endpoint_unbound: 0,
    artifact_enabled: 0,
    task_running: 0,
    task_failed: 0,
    evidence_total: 0,
  },
  endpoint_summary: {
    total: 0,
    online: 0,
    offline: 0,
    unknown: 0,
    unbound: 0,
    latest_seen_at: 0,
  },
  task_summary: {
    pending: 0,
    running: 0,
    success: 0,
    failed: 0,
    timeout: 0,
    canceled: 0,
  },
  artifact_summary: {
    total_enabled: 0,
    by_category: {},
    high_risk_count: 0,
  },
  evidence_summary: {
    total: 0,
    latest_created_at: 0,
  },
  recent_tasks: [],
  notices: [],
  last_refresh_at: 0,
}

const EMPTY_FORENSIC_BACKEND_STATUS: ForensicBackendStatusData = {
  velociraptor: {
    status: "unavailable",
    cpu_percent: 0,
    memory_bytes: 0,
    total_frontends: 0,
    current_connections: 0,
    last_seen_at: 0,
  },
  storage: {
    type: "velociraptor_datastore",
    container_path: "",
    filesystem: "",
    total: "",
    used: "",
    available: "",
    used_percent: 0,
  },
  endpoints: {
    registered: 0,
    connected: 0,
  },
  last_refresh_at: 0,
}

export function ForensicOverviewPage({ context }: Props) {
  const t = useTranslations("pages.investigation.collection")
  const router = useRouter()
  const [data, setData] = useState<ForensicOverviewViewModel | null>(null)
  const [backendStatus, setBackendStatus] = useState<ForensicBackendStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const overview = data ?? EMPTY_FORENSIC_OVERVIEW
  const backend = backendStatus ?? EMPTY_FORENSIC_BACKEND_STATUS

  const formatOverviewError = useCallback(
    (error: unknown, caseId?: string): { title: string; description: string } => {
      const raw = error instanceof Error ? error.message : ""
      const normalized = raw.toLowerCase()
      const currentCaseId = caseId?.trim()

      if (normalized.includes("forensic overview case not found")) {
        return {
          title: t("errors.caseNotFoundTitle"),
          description: currentCaseId
            ? t("errors.caseNotFoundDescription", { caseId: currentCaseId })
            : t("errors.caseNotFoundDescriptionNoCase"),
        }
      }

      return {
        title: t("errors.loadFailedTitle"),
        description: raw || t("errors.retryLater"),
      }
    },
    [t]
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewResult, backendResult] = await Promise.allSettled([
        getForensicOverview({ case_id: context.case_id }),
        getForensicBackendStatus(),
      ])

      if (overviewResult.status === "fulfilled") {
        setData(overviewResult.value)
      } else {
        const nextError = formatOverviewError(overviewResult.reason, context.case_id)
        setData((current) => current ?? EMPTY_FORENSIC_OVERVIEW)
        toast.error(nextError.title, {
          description: nextError.description,
        })
      }

      if (backendResult.status === "fulfilled") {
        setBackendStatus(backendResult.value)
      } else {
        setBackendStatus((current) => current ?? EMPTY_FORENSIC_BACKEND_STATUS)
        const raw = backendResult.reason instanceof Error ? backendResult.reason.message : ""
        toast.error(t("errors.backendStatusLoadFailedTitle"), {
          description: raw || t("errors.retryLater"),
        })
      }

      if (overviewResult.status === "fulfilled" || backendResult.status === "fulfilled") {
        setRefreshedAt(new Date())
      }
    } finally {
      setLoading(false)
    }
  }, [context.case_id, formatOverviewError, t])

  const handleCaseIdSubmit = useCallback(
    (caseId: string) => {
      const nextCaseID = caseId.trim()
      const currentCaseID = context.case_id?.trim() ?? ""
      if (nextCaseID === currentCaseID) {
        void refresh()
        return
      }

      const params = new URLSearchParams(window.location.search)
      if (nextCaseID) {
        params.set("case_id", nextCaseID)
      } else {
        params.delete("case_id")
      }

      const query = params.toString()
      router.push(`${window.location.pathname}${query ? `?${query}` : ""}`)
    },
    [context.case_id, refresh, router]
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <main className="bg-gray-50">
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 p-6">
        <ForensicOverviewHeader
          loading={loading}
          refreshedAt={refreshedAt}
          caseId={context.case_id}
          onCaseIdSubmit={handleCaseIdSubmit}
          onRefresh={refresh}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ForensicServiceStatusCard availability={overview.availability} />
          <ForensicEndpointStatusSummary summary={overview.endpoint_summary} />
          <ForensicTaskStatusSummary summary={overview.task_summary} />
          <ForensicArtifactCategorySummary summary={overview.artifact_summary} />
        </div>

        <ForensicBackendStatusPanel data={backend} loading={loading} />

        <div className="min-h-[300px] flex-1">
          <ForensicRecentTaskSummary tasks={overview.recent_tasks} />
        </div>
      </div>
    </main>
  )
}
