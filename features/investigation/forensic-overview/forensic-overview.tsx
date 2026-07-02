"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useForensicOverview } from "./hooks"
import type { ForensicContext, ForensicEndpointItem } from "./types"
import { ForensicOverviewToolbar } from "./components/forensic-overview-toolbar"
import { ForensicBackendNotice } from "./components/forensic-backend-notice"
import { ForensicReadinessSummary } from "./components/forensic-readiness-summary"
import { ForensicEndpointStatusPanel } from "./components/forensic-endpoint-status-panel"
import { ForensicArtifactCapabilityPanel } from "./components/forensic-artifact-capability-panel"
import { ForensicQuickTaskPanel } from "./components/forensic-quick-task-panel"
import { ForensicRecentTasksPanel } from "./components/forensic-recent-tasks-panel"
import { ForensicRecentEvidencePanel } from "./components/forensic-recent-evidence-panel"

interface ForensicOverviewProps {
  ctx?: ForensicContext
  createdBy?: string
}

export function ForensicOverview({
  ctx = {},
  createdBy = "current-user",
}: ForensicOverviewProps) {
  const router = useRouter()
  const {
    endpoints,
    artifacts,
    tasks,
    evidence,
    metrics,
    notices,
    lastRefreshAt,
    syncing,
    refreshAll,
    syncEndpoints,
    syncTask,
    createTask,
  } = useForensicOverview(ctx)

  const [pickedEndpoint, setPickedEndpoint] = useState<
    ForensicEndpointItem | undefined
  >(undefined)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshAll()
    } finally {
      setRefreshing(false)
    }
  }, [refreshAll])

  // 任务中心 / 工件配置 属于第一阶段未开放的独立页面，这里给出说明提示
  const openTaskCenter = useCallback(() => {
    router.push("/frame/investigation/tasks")
  }, [router])

  const openArtifactConfig = useCallback(() => {
    router.push("/frame/investigation/artifacts")
  }, [router])

  const openTask = useCallback((taskId: string) => {
    router.push(`/frame/investigation/tasks?task_id=${encodeURIComponent(taskId)}`)
  }, [router])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <ForensicOverviewToolbar
        ctx={ctx}
        lastRefreshAt={lastRefreshAt}
        syncing={syncing}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onSync={syncEndpoints}
        onOpenTaskCenter={openTaskCenter}
      />

      <ForensicBackendNotice notices={notices} />

      <ForensicReadinessSummary metrics={metrics} loading={endpoints.loading} />

      <ForensicQuickTaskPanel
        ctx={ctx}
        endpoints={endpoints.data}
        artifacts={artifacts.data}
        externalSelectedEndpoint={pickedEndpoint ?? endpoints.selected}
        createdBy={createdBy}
        onCreate={createTask}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ForensicEndpointStatusPanel
          endpoints={endpoints.data}
          loading={endpoints.loading}
          onPick={setPickedEndpoint}
          selectedId={pickedEndpoint?.endpoint_id}
        />
        <ForensicArtifactCapabilityPanel
          artifacts={artifacts.data}
          loading={artifacts.loading}
          onOpenArtifactConfig={openArtifactConfig}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ForensicRecentTasksPanel
          tasks={tasks.data}
          endpoints={endpoints.data}
          loading={tasks.loading}
          onSyncTask={syncTask}
          onOpenTask={openTask}
        />
        <ForensicRecentEvidencePanel
          evidence={evidence.data}
          endpoints={endpoints.data}
          loading={evidence.loading}
          onRefresh={handleRefresh}
        />
      </div>
    </main>
  )
}

