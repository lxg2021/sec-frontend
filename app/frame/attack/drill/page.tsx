// page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/shared/ui/card";
import { useTranslations } from "next-intl"
import { AttackCaseStoryTimelineRender } from "@/features/attack/detail/components/attack-case-story-timeline-render"
import {
  AttackGraphLayoutEvaluationCard,
  AttackGraphFlowV2,
  fetchGraphCase,
} from "@/features/attack/dgraph"
import type { GraphCaseResponseDto } from "@/features/attack/dgraph"


const DRILL_TIMEZONE = "Asia/Shanghai"

export default function App() {
  const t = useTranslations("pages.attack.drill")

  const [timelineCaseId, setTimelineCaseId] = useState("");
  const [timelineSnapshotId, setTimelineSnapshotId] = useState("");
  const [graphResponse, setGraphResponse] = useState<GraphCaseResponseDto | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setTimelineCaseId(
      params.get("caseId")?.trim() ||
      params.get("case_id")?.trim() ||
      "",
    )
    setTimelineSnapshotId(
      params.get("snapshotId")?.trim() ||
      params.get("snapshot_id")?.trim() ||
      "",
    )
  }, [])

  const graphNodeCount = useMemo(
    () => graphResponse?.nodes?.length ?? 0,
    [graphResponse],
  )
  const graphEdgeCount = useMemo(
    () => graphResponse?.edges?.length ?? 0,
    [graphResponse],
  )

  useEffect(() => {
    const caseId = timelineCaseId.trim()
    if (!caseId) {
      setGraphResponse(null)
      setGraphError("")
      setGraphLoading(false)
      return
    }

    let cancelled = false
    setGraphLoading(true)
    setGraphError("")

    fetchGraphCase({
      caseId,
      includeScopeDrill: true,
    })
      .then((response) => {
        if (cancelled) return
        setGraphResponse(response)
      })
      .catch((error) => {
        if (cancelled) return
        setGraphResponse(null)
        setGraphError(
          error instanceof Error
            ? error.message
            : "Failed to load GraphCase data.",
        )
      })
      .finally(() => {
        if (cancelled) return
        setGraphLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [timelineCaseId])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <AttackCaseStoryTimelineRender
          caseId={timelineCaseId}
          snapshotId={timelineSnapshotId}
          timezone={DRILL_TIMEZONE}
          noCaseDescription="No CaseID was provided for this investigation view."
          noCaseHint="Select a case in Attack Details and click Trace Attack to open this timeline."
        />

        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {/* 这里可以换成 Graph 图标 */}
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Graph 可视化 */}
        <Card className="!bg-transparent border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center space-x-2">
                <div className="p-2 flex items-center justify-center rounded-lg bg-blue-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-semibold">
                  {t("graph")}
                </CardTitle>
                {graphResponse ? (
                  <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                    {graphNodeCount} nodes / {graphEdgeCount} edges
                  </span>
                ) : null}
              </div>
            </div>
          </CardHeader>

          {/* 分割线 */}
          <div className="border-t border-gray-100" />

          <CardContent className="p-0">
            <div className="w-full h-[760px]">
              {!timelineCaseId.trim() ? (
                <GraphStateMessage
                  title="No CaseID"
                  description="Select a case in Attack Details and click Trace Attack to load the GraphCase view."
                />
              ) : graphLoading ? (
                <GraphStateMessage
                  title="Loading GraphCase"
                  description={`Fetching graph data for case ${timelineCaseId}.`}
                />
              ) : graphError ? (
                <GraphStateMessage
                  title="GraphCase Load Failed"
                  description={graphError}
                />
              ) : graphResponse && graphNodeCount > 0 ? (
                <AttackGraphFlowV2
                  response={graphResponse}
                  className="h-full"
                />
              ) : (
                <GraphStateMessage
                  title="No Graph Data"
                  description={`GraphCase returned no nodes for case ${timelineCaseId}.`}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <AttackGraphLayoutEvaluationCard />
      </div>
    </div >
  )
}

function GraphStateMessage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
          <Shield className="h-5 w-5 text-slate-500" />
        </div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}
