// page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { AttackCaseStoryTimelineRender } from "@/features/attack/detail/components/attack-case-story-timeline-render"
import {
  AttackGraphCaseCard,
  buildAttackGraphModel,
  buildGraphDrillTimeRange,
  fetchGraphDrill,
  fetchGraphCase,
  mergeGraphCaseDrillResult,
} from "@/features/attack/dgraph"
import type {
  AttackGraphLayoutOptions,
  AttackGraphMenuAction,
  AttackGraphNodeDrillState,
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
  const [graphNodeDrillStateByKey, setGraphNodeDrillStateByKey] = useState(
    () => new Map<string, AttackGraphNodeDrillState>(),
  );
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

  const graphVisibleStats = useMemo(() => {
    if (!graphResponse) {
      return { edgeCount: 0, nodeCount: 0 }
    }

    const graph = buildAttackGraphModel(graphResponse)
    return {
      edgeCount: graph.edges.length,
      nodeCount: graph.nodes.length,
    }
  }, [graphResponse])
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

      const nodeKey = action.node.key
      const currentNodeDrillState =
        graphNodeDrillStateByKey.get(nodeKey) ?? "idle"
      if (currentNodeDrillState !== "idle") {
        return
      }

      setGraphNodeDrillStateByKey((current) => {
        const next = new Map(current)
        next.set(nodeKey, "loading")
        return next
      })

      const toastId = toast.loading("Loading drilldown data...")
      try {
        const drillResponse = await fetchGraphDrill({
          scopeType: "case",
          scopeId: caseId,
          nodeKey,
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
        const hasRawGraphChange =
          mergeResult.addedNodeCount > 0 || mergeResult.addedEdgeCount > 0
        const hasVisibleGraphChange =
          mergeResult.visibleAddedNodeCount > 0 ||
          mergeResult.visibleAddedEdgeCount > 0

        if (hasRawGraphChange) {
          graphResponseRef.current = mergeResult.response
          setGraphResponse(mergeResult.response)
        }

        if (!hasVisibleGraphChange) {
          setGraphNodeDrillStateByKey((current) => {
            const next = new Map(current)
            next.set(nodeKey, "empty")
            return next
          })
          toast.warning("暂无可钻探的数据", {
            id: toastId,
            description: "当前节点未发现新的关联节点或关系。",
          })
          return
        }

        if (!hasRawGraphChange) {
          graphResponseRef.current = mergeResult.response
          setGraphResponse(mergeResult.response)
        }
        setGraphNodeDrillStateByKey((current) => {
          const next = new Map(current)
          next.set(nodeKey, "done")
          return next
        })
        toast.success("Drilldown data added to graph.", {
          id: toastId,
          description: `${mergeResult.visibleAddedNodeCount} nodes / ${mergeResult.visibleAddedEdgeCount} edges`,
        })
      } catch (error) {
        setGraphNodeDrillStateByKey((current) => {
          const next = new Map(current)
          next.delete(nodeKey)
          return next
        })
        toast.error("Failed to load drilldown data.", {
          id: toastId,
          description:
            error instanceof Error ? error.message : "Unknown request error.",
        })
      }
    },
    [graphNodeDrillStateByKey, graphResponse, timelineCaseId],
  )

  useEffect(() => {
    const caseId = timelineCaseId.trim()
    if (!caseId) {
      graphResponseRef.current = null
      setGraphResponse(null)
      setGraphNodeDrillStateByKey(new Map())
      setGraphError("")
      setGraphLoading(false)
      return
    }

    let cancelled = false
    setGraphLoading(true)
    setGraphError("")
    setGraphNodeDrillStateByKey(new Map())

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

        <AttackGraphCaseCard
          caseId={timelineCaseId}
          edgeCount={graphVisibleStats.edgeCount}
          error={graphError}
          layoutOptions={graphLayoutOptions}
          layoutStrategy={graphLayoutStrategy}
          loading={graphLoading}
          nodeDrillStateByKey={graphNodeDrillStateByKey}
          nodeCount={graphVisibleStats.nodeCount}
          onLayoutStrategyChange={setGraphLayoutStrategy}
          onMenuAction={handleGraphMenuAction}
          onResetPositions={() => setGraphPositionResetKey((key) => key + 1)}
          positionResetKey={graphPositionResetKey}
          response={graphResponse}
          subtitle={t("subtitle")}
          title={t("graph")}
        />

      </div>
    </div >
  )
}
