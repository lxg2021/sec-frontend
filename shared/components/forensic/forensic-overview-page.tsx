"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import { Button } from "@/shared/ui/button"
import type { ForensicOverviewContext, ForensicOverviewViewModel } from "@/shared/lib/forensic/types"
import { getForensicOverview, syncForensicEndpoints } from "@/shared/lib/forensic/api"
import { ForensicArtifactCategorySummary } from "./forensic-artifact-category-summary"
import { ForensicEndpointStatusSummary } from "./forensic-endpoint-status-summary"
import { ForensicMetricCards } from "./forensic-metric-cards"
import { ForensicOverviewHeader } from "./forensic-overview-header"
import { ForensicQuickLinks } from "./forensic-quick-links"
import { ForensicRecentTaskSummary } from "./forensic-recent-task-summary"
import { ForensicRiskNoticePanel } from "./forensic-risk-notice-panel"
import { ForensicServiceStatusCard } from "./forensic-service-status-card"
import { ForensicTaskStatusSummary } from "./forensic-task-status-summary"

interface Props {
  context: ForensicOverviewContext
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}

function OverviewError({
  message,
  loading,
  onRetry,
}: {
  message: string
  loading: boolean
  onRetry: () => void
}) {
  return (
    <Card className="border-red-200 bg-red-50/70">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-red-800">取证概览加载失败</p>
          <p className="mt-1 text-xs leading-relaxed text-red-700">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
          重试
        </Button>
      </CardContent>
    </Card>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请稍后重试。"
}

export function ForensicOverviewPage({ context }: Props) {
  const [data, setData] = useState<ForensicOverviewViewModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setError(null)
      const next = await getForensicOverview({ case_id: context.case_id })
      setData(next)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [context.case_id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      setError(null)
      await syncForensicEndpoints()
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSyncing(false)
    }
  }, [refresh])

  return (
    <main className="w-full max-w-none px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        <ForensicOverviewHeader
          context={context}
          loading={loading}
          syncing={syncing}
          onRefresh={refresh}
          onSync={handleSync}
        />

        {error && (
          <OverviewError message={error} loading={loading || syncing} onRetry={refresh} />
        )}

        {!data ? (
          loading ? <OverviewSkeleton /> : null
        ) : (
          <>
            <ForensicServiceStatusCard availability={data.availability} lastRefreshAt={data.last_refresh_at} />
            <ForensicMetricCards metrics={data.metrics} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ForensicEndpointStatusSummary summary={data.endpoint_summary} />
              <ForensicTaskStatusSummary summary={data.task_summary} />
              <ForensicArtifactCategorySummary summary={data.artifact_summary} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ForensicRecentTaskSummary tasks={data.recent_tasks} />
              </div>
              <div className="flex flex-col gap-4">
                <ForensicRiskNoticePanel notices={data.notices} />
                <ForensicQuickLinks />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
