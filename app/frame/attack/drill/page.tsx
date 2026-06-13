// page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RotateCcw, Shield } from "lucide-react"
import {
  Card,
  CardHeader,
  CardContent,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button"
import { useTranslations } from "next-intl"
import { AttackCaseStoryTimelineRender } from "@/features/attack/detail/components/attack-case-story-timeline-render"
import {
  AttackGraphFlow,
  AttackGraphFlowHeader,
  AttackGraphLayoutStrategyToggle,
  fetchGraphCase,
} from "@/features/attack/dgraph"
import type {
  AttackGraphLayoutOptions,
  AttackGraphLayoutStrategyOption,
  GraphCaseResponseDto,
} from "@/features/attack/dgraph"


const DRILL_TIMEZONE = "Asia/Shanghai"

export default function App() {
  const t = useTranslations("pages.attack.drill")

  const [timelineCaseId, setTimelineCaseId] = useState("");
  const [timelineSnapshotId, setTimelineSnapshotId] = useState("");
  const [graphResponse, setGraphResponse] = useState<GraphCaseResponseDto | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState("");
  const [graphLayoutStrategy, setGraphLayoutStrategy] =
    useState<AttackGraphLayoutStrategyOption>("auto");
  const [graphPositionResetKey, setGraphPositionResetKey] = useState(0);

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
  const graphLayoutOptions = useMemo<AttackGraphLayoutOptions | undefined>(
    () =>
      graphLayoutStrategy === "auto"
        ? undefined
        : { strategy: graphLayoutStrategy },
    [graphLayoutStrategy],
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

        {/* Graph 可视化 */}
        <Card className="!bg-transparent border border-gray-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <AttackGraphFlowHeader
              title={t("graph")}
              subtitle={t("subtitle")}
              nodeCount={graphResponse ? graphNodeCount : undefined}
              edgeCount={graphResponse ? graphEdgeCount : undefined}
              action={
                graphResponse && graphNodeCount > 0 ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 bg-white px-3 text-xs font-medium text-slate-600"
                      onClick={() => setGraphPositionResetKey((key) => key + 1)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Positions
                    </Button>
                    <AttackGraphLayoutStrategyToggle
                      value={graphLayoutStrategy}
                      onChange={setGraphLayoutStrategy}
                    />
                  </div>
                ) : null
              }
            />
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
                <AttackGraphFlow
                  response={graphResponse}
                  className="h-full"
                  layoutOptions={graphLayoutOptions}
                  positionResetKey={graphPositionResetKey}
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
