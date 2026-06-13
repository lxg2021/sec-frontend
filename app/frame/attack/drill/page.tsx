// page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Shield } from "lucide-react"
import { toast } from "sonner"
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
  fetchGraphDrill,
  fetchGraphCase,
  getGraphCaseEdgeSemanticKey,
} from "@/features/attack/dgraph"
import type {
  AttackGraphLayoutOptions,
  AttackGraphMenuAction,
  AttackGraphLayoutStrategyOption,
  GraphCaseEdgeDto,
  GraphCaseNodeDto,
  GraphCaseResponseDto,
} from "@/features/attack/dgraph"


const DRILL_TIMEZONE = "Asia/Shanghai"
const GRAPH_DRILL_TIME_PADDING_MINUTES = 30

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
  const graphResponseRef = useRef<GraphCaseResponseDto | null>(null);

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

  const handleGraphMenuAction = useCallback(
    async (action: AttackGraphMenuAction) => {
      if (action.kind !== "node-drilldown") {
        return
      }

      const currentGraph = graphResponseRef.current ?? graphResponse
      if (!currentGraph) {
        toast.error("Graph data is not loaded.")
        return
      }

      const caseId = (currentGraph.case_id || timelineCaseId).trim()
      if (!caseId) {
        toast.error("Cannot drill down without a CaseID.")
        return
      }

      const drillRange = buildGraphDrillTimeRange(
        currentGraph.start_time,
        currentGraph.end_time,
      )
      if (!drillRange) {
        toast.error("Cannot drill down because the case time range is missing.")
        return
      }

      const toastId = toast.loading("Loading drilldown data...")
      try {
        const drillResponse = await fetchGraphDrill({
          scopeType: "case",
          scopeId: caseId,
          nodeKey: action.node.key,
          nodeType: action.node.entityType,
          startTime: drillRange.startTime,
          endTime: drillRange.endTime,
          timezone: DRILL_TIMEZONE,
          tenantId: currentGraph.tenant_id,
          forceRefresh: false,
        })

        const incomingNodes = drillResponse?.nodes ?? []
        const incomingEdges = drillResponse?.edges ?? []
        const mergeResult = mergeGraphCaseDrillResult(
          graphResponseRef.current ?? currentGraph,
          {
            nodes: incomingNodes,
            edges: incomingEdges,
          },
        )

        if (
          mergeResult.addedNodeCount === 0 &&
          mergeResult.addedEdgeCount === 0
        ) {
          toast.info("暂无可扩展钻探的数据", { id: toastId })
          return
        }

        graphResponseRef.current = mergeResult.response
        setGraphResponse(mergeResult.response)
        toast.success("Drilldown data added to graph.", {
          id: toastId,
          description: `${mergeResult.addedNodeCount} nodes / ${mergeResult.addedEdgeCount} edges`,
        })
      } catch (error) {
        toast.error("Failed to load drilldown data.", {
          id: toastId,
          description:
            error instanceof Error ? error.message : "Unknown request error.",
        })
      }
    },
    [graphResponse, timelineCaseId],
  )

  useEffect(() => {
    const caseId = timelineCaseId.trim()
    if (!caseId) {
      graphResponseRef.current = null
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
        graphResponseRef.current = response
        setGraphResponse(response)
      })
      .catch((error) => {
        if (cancelled) return
        graphResponseRef.current = null
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
                  onMenuAction={handleGraphMenuAction}
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

function buildGraphDrillTimeRange(
  startTime: string | undefined,
  endTime: string | undefined,
) {
  const startDate = parseGraphTime(startTime)
  const endDate = parseGraphTime(endTime)
  if (!startDate || !endDate) {
    return null
  }

  return {
    startTime: formatGraphTime(
      new Date(startDate.getTime() - GRAPH_DRILL_TIME_PADDING_MINUTES * 60_000),
    ),
    endTime: formatGraphTime(
      new Date(endDate.getTime() + GRAPH_DRILL_TIME_PADDING_MINUTES * 60_000),
    ),
  }
}

function parseGraphTime(value: string | undefined) {
  const text = value?.trim()
  if (!text) {
    return null
  }

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/,
  )
  if (!match) {
    const fallback = new Date(text)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  )
}

function formatGraphTime(value: Date) {
  const pad = (input: number) => String(input).padStart(2, "0")

  return [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
  ].join("-") + " " + [
    pad(value.getUTCHours()),
    pad(value.getUTCMinutes()),
    pad(value.getUTCSeconds()),
  ].join(":")
}

function mergeGraphCaseDrillResult(
  current: GraphCaseResponseDto,
  incoming: {
    nodes: GraphCaseNodeDto[]
    edges: GraphCaseEdgeDto[]
  },
) {
  const currentNodes = current.nodes ?? []
  const currentEdges = current.edges ?? []
  const nextNodes = [...currentNodes]
  const nextEdges = [...currentEdges]
  const nodeKeys = new Set(
    currentNodes.map((node) => node.key?.trim()).filter(Boolean),
  )
  const edgeKeys = new Set(currentEdges.map(getGraphCaseEdgeSemanticKey))
  let addedNodeCount = 0
  let addedEdgeCount = 0

  for (const node of incoming.nodes) {
    const key = node.key?.trim()
    if (!key || nodeKeys.has(key)) {
      continue
    }
    nodeKeys.add(key)
    nextNodes.push(node)
    addedNodeCount += 1
  }

  for (const edge of incoming.edges) {
    const key = getGraphCaseEdgeSemanticKey(edge)
    if (!key || edgeKeys.has(key)) {
      continue
    }
    edgeKeys.add(key)
    nextEdges.push(edge)
    addedEdgeCount += 1
  }

  return {
    addedEdgeCount,
    addedNodeCount,
    response: {
      ...current,
      nodes: nextNodes,
      edges: nextEdges,
      diagnostics: {
        ...current.diagnostics,
        node_count: nextNodes.length,
        edge_count: nextEdges.length,
      },
    } satisfies GraphCaseResponseDto,
  }
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
