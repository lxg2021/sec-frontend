"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import { Button } from "@/shared/ui/button"
import type { ForensicOverviewContext, ForensicOverviewViewModel } from "@/shared/lib/forensic/types"
import { getForensicOverview } from "@/shared/lib/forensic/api"
import { ForensicArtifactCategorySummary } from "./forensic-artifact-category-summary"
import { ForensicEndpointStatusSummary } from "./forensic-endpoint-status-summary"
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
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
  const router = useRouter()
  const [data, setData] = useState<ForensicOverviewViewModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setError(null)
      const next = await getForensicOverview({ case_id: context.case_id })
      setData(next)
      setRefreshedAt(new Date())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [context.case_id])

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
    setData(null)
    setRefreshedAt(null)
  }, [context.case_id])

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

        {error && (
          <OverviewError message={error} loading={loading} onRetry={refresh} />
        )}

        {!data ? (
          loading ? <OverviewSkeleton /> : null
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <ForensicServiceStatusCard availability={data.availability} />
              <ForensicEndpointStatusSummary summary={data.endpoint_summary} />
              <ForensicTaskStatusSummary summary={data.task_summary} />
              <ForensicArtifactCategorySummary summary={data.artifact_summary} />
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="min-h-[300px] lg:col-span-2">
                <ForensicRecentTaskSummary tasks={data.recent_tasks} />
              </div>
              <div className="flex min-h-[300px] flex-col gap-4">
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
