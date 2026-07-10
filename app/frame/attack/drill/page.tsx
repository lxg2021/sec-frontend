// page.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Loader2,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { AttackCaseStoryTimelineRender } from "@/features/attack/detail/components/attack-case-story-timeline-render"
import {
  buildAttackDetailHref,
  buildAttackWorkflowHref,
} from "@/features/attack/detail/utils/attack-case-format"
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
import {
  InvestigationAssistantPanel,
  type InvestigationAssistantLanguage,
  type InvestigationNextAction,
} from "@/features/investigation-assistant"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

const DRILL_TIMEZONE = "Asia/Shanghai"

function getRouteParam(value: string | null) {
  return value?.trim() || ""
}

function getRoutePageParam(value: string | null) {
  const normalized = getRouteParam(value)
  if (!normalized) return undefined
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function CaseIdSearchToolbar({
  loading,
  onSearch,
  onValueChange,
  value,
}: {
  loading: boolean
  onSearch: (event: FormEvent<HTMLFormElement>) => void
  onValueChange: (value: string) => void
  value: string
}) {
  const t = useTranslations("pages.attack.drill")

  return (
    <section className="w-full rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
      <form
        className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={onSearch}
      >
        <div className="flex h-11 min-w-0 w-full flex-1 items-center rounded-full border border-slate-200 bg-slate-50/80 pl-3 pr-1 shadow-inner shadow-slate-100/70">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Input
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={t("caseIdPlaceholder")}
            aria-label="CaseID"
            spellCheck={false}
            className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 font-mono text-sm font-semibold text-slate-900 shadow-none placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            className="h-9 shrink-0 rounded-full bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-85"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {t("search")}
          </Button>
        </div>
      </form>
    </section>
  )
}

export default function App() {
  const t = useTranslations("pages.attack.drill")
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const investigationLanguage: InvestigationAssistantLanguage = locale === "zh-CN" ? "zh-CN" : "en"

  const routeParams = useMemo(() => ({
    caseId: getRouteParam(searchParams.get("caseId")) || getRouteParam(searchParams.get("case_id")),
    queuePage:
      getRoutePageParam(searchParams.get("queuePage")) ||
      getRoutePageParam(searchParams.get("queue_page")),
    snapshotId: getRouteParam(searchParams.get("snapshotId")) || getRouteParam(searchParams.get("snapshot_id")),
    returnTo: getRouteParam(searchParams.get("returnTo")) || getRouteParam(searchParams.get("return_to")),
    workflowId: getRouteParam(searchParams.get("workflowId")) || getRouteParam(searchParams.get("workflow_id")),
  }), [searchParams])

  const [timelineCaseId, setTimelineCaseId] = useState(routeParams.caseId);
  const [caseIdInput, setCaseIdInput] = useState(routeParams.caseId);
  const [timelineSnapshotId, setTimelineSnapshotId] = useState(routeParams.snapshotId);
  const [returnTo, setReturnTo] = useState(routeParams.returnTo);
  const [returnWorkflowId, setReturnWorkflowId] = useState(routeParams.workflowId);
  const [returnQueuePage, setReturnQueuePage] = useState(routeParams.queuePage);
  const [refreshKey, setRefreshKey] = useState(0);
  const [graphResponse, setGraphResponse] = useState<GraphCaseResponseDto | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState("");
  const [graphLayoutStrategy, setGraphLayoutStrategy] =
    useState<AttackGraphLayoutStrategyOption>("auto");
  const [graphPositionResetKey, setGraphPositionResetKey] = useState(0);
  const [graphNodeDrillStateByKey, setGraphNodeDrillStateByKey] = useState(
    () => new Map<string, AttackGraphNodeDrillState>(),
  );
  const [investigationGraphContextVersion, setInvestigationGraphContextVersion] = useState(0);
  const graphResponseRef = useRef<GraphCaseResponseDto | null>(null);

  useEffect(() => {
    setTimelineCaseId(routeParams.caseId)
    setCaseIdInput(routeParams.caseId)
    setTimelineSnapshotId(routeParams.snapshotId)
    setReturnTo(routeParams.returnTo)
    setReturnWorkflowId(routeParams.workflowId)
    setReturnQueuePage(routeParams.queuePage)
    setInvestigationGraphContextVersion(0)
  }, [routeParams])

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

  const applyCaseId = useCallback(
    (nextCaseId: string) => {
      const normalizedCaseId = nextCaseId.trim()
      const params = new URLSearchParams(window.location.search)

      if (normalizedCaseId) {
        params.set("caseId", normalizedCaseId)
      } else {
        params.delete("caseId")
        params.delete("case_id")
      }

      if (timelineSnapshotId.trim()) {
        params.set("snapshotId", timelineSnapshotId.trim())
      }

      const query = params.toString()
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      )
      setTimelineCaseId(normalizedCaseId)
      setCaseIdInput(normalizedCaseId)
      setInvestigationGraphContextVersion(0)
      setGraphPositionResetKey((key) => key + 1)
      setRefreshKey((key) => key + 1)
    },
    [timelineSnapshotId],
  )

  const handleCaseSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      applyCaseId(caseIdInput)
    },
    [applyCaseId, caseIdInput],
  )

  const backHref = useMemo(() => {
    const normalizedCaseId = timelineCaseId.trim()
    if (returnTo === "workflow") {
      return buildAttackWorkflowHref(
        normalizedCaseId,
        timelineSnapshotId,
        returnWorkflowId,
        {
          queuePage: returnQueuePage,
        },
      )
    }

    return normalizedCaseId
      ? buildAttackDetailHref(normalizedCaseId, timelineSnapshotId)
      : "/frame/attack/detail"
  }, [returnQueuePage, returnTo, returnWorkflowId, timelineCaseId, timelineSnapshotId])

  const handleBackToAttackDetail = useCallback(() => {
    router.push(backHref)
  }, [backHref, router])

  const handleGraphMenuAction = useCallback(
    async (action: AttackGraphMenuAction) => {
      if (action.kind === "remediation-orchestration") {
        const currentGraph = graphResponseRef.current ?? graphResponse
        if (!currentGraph) {
          toast.error("Graph data is not loaded.")
          return
        }

        const caseId = (currentGraph.case_id || timelineCaseId).trim()
        if (!caseId) {
          toast.error("Cannot open remediation orchestration without a CaseID.")
          return
        }

        const params = new URLSearchParams()
        params.set("case_id", caseId)
        params.set("source_type", "drill_graph")
        params.set("scope_type", "case")
        params.set("scope_id", caseId)
        params.set("node_key", action.node.key)
        params.set("entity_type", action.node.entityType)
        params.set("display_name", action.node.displayName || action.node.key)
        params.set("returnTo", "drill")
        if (currentGraph.tenant_id) {
          params.set("tenant_id", currentGraph.tenant_id)
        }
        if (routeParams.workflowId) {
          params.set("workflow_id", routeParams.workflowId)
        }

        router.push(`/frame/response/orchestration?${params.toString()}`)
        return
      }

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
        setInvestigationGraphContextVersion((version) => version + 1)
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
    [graphNodeDrillStateByKey, graphResponse, routeParams.workflowId, router, timelineCaseId],
  )

  const handleInvestigationActionClick = useCallback(
    async (action: InvestigationNextAction) => {
      const currentGraph = graphResponseRef.current ?? graphResponse
      if (!currentGraph) {
        toast.warning("当前 CASE 图谱还没有加载完成。")
        return
      }

      const graphModel = buildAttackGraphModel(currentGraph)
      const targetKeys = (action.target_node_ids ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
      const targetNodes = targetKeys
        .map((targetKey) => graphModel.nodes.find((node) => node.key === targetKey || node.id === targetKey))
        .filter((node): node is NonNullable<typeof node> => Boolean(node))
        .filter((node, index, nodes) => nodes.findIndex((item) => item.key === node.key) === index)

      if (!targetNodes.length) {
        toast.info("这条建议没有绑定到当前图上的可钻探节点。", {
          description: action.label,
        })
        return
      }

      for (const targetNode of targetNodes) {
        await handleGraphMenuAction({
          kind: "node-drilldown",
          graph: graphModel,
          node: targetNode,
        } as AttackGraphMenuAction)
      }
    },
    [graphResponse, handleGraphMenuAction],
  )

  useEffect(() => {
    const caseId = timelineCaseId.trim()
    if (!caseId) {
      graphResponseRef.current = null
      setGraphResponse(null)
      setGraphNodeDrillStateByKey(new Map())
      setGraphError("")
      setGraphLoading(false)
      setInvestigationGraphContextVersion(0)
      return
    }

    let cancelled = false
    setGraphLoading(true)
    setGraphError("")
    setGraphNodeDrillStateByKey(new Map())
    setInvestigationGraphContextVersion(0)

    fetchGraphCase({
      caseId,
      includeScopeDrill: true,
    })
      .then((response) => {
        if (cancelled) return
        graphResponseRef.current = response
        setGraphResponse(response)
        setInvestigationGraphContextVersion(0)

        if (!response) {
          toast.warning(t("statusEmpty"), {
            description: t("statusEmptyDescription"),
          })
          return
        }

        const graph = buildAttackGraphModel(response)

        if (graph.nodes.length > 0) {
          toast.success(t("statusLoaded"), {
            description: t("statusLoadedDescription", {
              nodeCount: graph.nodes.length,
              edgeCount: graph.edges.length,
            }),
          })
          return
        }

        toast.warning(t("statusEmpty"), {
          description: t("statusEmptyDescription"),
        })
      })
      .catch((error) => {
        if (cancelled) return
        graphResponseRef.current = null
        setGraphResponse(null)
        setInvestigationGraphContextVersion(0)
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load GraphCase data."
        setGraphError(
          message,
        )
        toast.error(t("statusError"), {
          description: message,
        })
      })
      .finally(() => {
        if (cancelled) return
        setGraphLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey, timelineCaseId])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <CaseIdSearchToolbar
          loading={graphLoading}
          onSearch={handleCaseSearch}
          onValueChange={setCaseIdInput}
          value={caseIdInput}
        />

        <AttackCaseStoryTimelineRender
          key={`${timelineCaseId}:${timelineSnapshotId}:${refreshKey}`}
          backHref={backHref}
          backLabel={returnTo === "workflow" ? "Back" : t("backToAttackDetail")}
          caseId={timelineCaseId}
          snapshotId={timelineSnapshotId}
          timezone={DRILL_TIMEZONE}
          noCaseDescription="No CaseID was provided for this investigation view."
          noCaseHint="Select a case in Attack Details and click Trace Attack to open this timeline."
        />

        <InvestigationAssistantPanel
          caseId={timelineCaseId}
          graphContextVersion={investigationGraphContextVersion}
          language={investigationLanguage}
          onActionClick={handleInvestigationActionClick}
        />

        <AttackGraphCaseCard
          backLabel={returnTo === "workflow" ? "Back" : t("backToAttackDetail")}
          caseId={timelineCaseId}
          edgeCount={graphVisibleStats.edgeCount}
          error={graphError}
          layoutOptions={graphLayoutOptions}
          layoutStrategy={graphLayoutStrategy}
          loading={graphLoading}
          nodeDrillStateByKey={graphNodeDrillStateByKey}
          nodeCount={graphVisibleStats.nodeCount}
          onBack={handleBackToAttackDetail}
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
