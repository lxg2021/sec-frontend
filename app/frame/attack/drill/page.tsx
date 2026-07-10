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
  ScanSearch,
  Search,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { AttackCaseStoryTimelineRender } from "@/features/attack/detail/components/attack-case-story-timeline-render"
import {
  buildAttackDetailHref,
  buildIOCVerificationHref,
  buildAttackWorkflowHref,
} from "@/features/attack/detail/utils/attack-case-format"
import {
  AttackGraphCaseCard,
  AttackGraphControlPanel,
  AttackGraphIocCandidates,
  AttackGraphRemediationTargets,
  buildAttackGraphIocSourceKey,
  buildAttackGraphModel,
  buildGraphDrillTimeRange,
  fetchGraphDrill,
  fetchGraphCase,
  getAttackGraphNodeIocCandidates,
  groupAttackGraphIocCandidates,
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
import {
  appendAttackCaseIocCandidates,
  deleteAttackCaseIocCandidates,
  listAttackCaseIocCandidates,
} from "@/features/ioc-analysis/api"
import type {
  AppendAttackCaseIOCCandidateInput,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"
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
  const [remediationTargetsByKey, setRemediationTargetsByKey] = useState(
    () => new Map<string, AttackGraphMenuAction["node"]>(),
  );
  const [iocCandidates, setIocCandidates] = useState<IocVerificationItem[]>([])
  const [iocCandidatesLoading, setIocCandidatesLoading] = useState(false)
  const [iocCandidatesError, setIocCandidatesError] = useState("")
  const [selectedIocCandidateIds, setSelectedIocCandidateIds] = useState(
    () => new Set<string>(),
  )
  const [deletingIocCandidateIds, setDeletingIocCandidateIds] = useState(
    () => new Set<string>(),
  )
  const [drillParentByNodeKey, setDrillParentByNodeKey] = useState(
    () => new Map<string, string>(),
  )
  const [investigationGraphContextVersion, setInvestigationGraphContextVersion] = useState(0);
  const graphResponseRef = useRef<GraphCaseResponseDto | null>(null);
  const iocLoadRunIdRef = useRef(0)

  useEffect(() => {
    setTimelineCaseId(routeParams.caseId)
    setCaseIdInput(routeParams.caseId)
    setTimelineSnapshotId(routeParams.snapshotId)
    setReturnTo(routeParams.returnTo)
    setReturnWorkflowId(routeParams.workflowId)
    setReturnQueuePage(routeParams.queuePage)
    setRemediationTargetsByKey(new Map())
    setIocCandidates([])
    setIocCandidatesError("")
    setSelectedIocCandidateIds(new Set())
    setDeletingIocCandidateIds(new Set())
    setDrillParentByNodeKey(new Map())
    setInvestigationGraphContextVersion(0)
  }, [routeParams])

  const remediationTargetKeys = useMemo(
    () => new Set(remediationTargetsByKey.keys()),
    [remediationTargetsByKey],
  )
  const remediationTargets = useMemo(
    () => Array.from(remediationTargetsByKey.values()),
    [remediationTargetsByKey],
  )
  const groupedIocCandidates = useMemo(
    () => groupAttackGraphIocCandidates(iocCandidates),
    [iocCandidates],
  )
  const iocCandidateSourceKeys = useMemo(
    () =>
      new Set(
        iocCandidates
          .filter((candidate) => candidate.source === "case_graph")
          .map((candidate) =>
            buildAttackGraphIocSourceKey({
              iocType: candidate.type,
              value: candidate.normalized_value || candidate.value,
              sourceRefId: candidate.source_ref_id || "",
              sourceField: candidate.source_field || "",
            }),
          ),
      ),
    [iocCandidates],
  )

  const removeRemediationTarget = useCallback((targetKey: string) => {
    setRemediationTargetsByKey((current) => {
      if (!current.has(targetKey)) return current
      const next = new Map(current)
      next.delete(targetKey)
      return next
    })
  }, [])

  const clearRemediationTargets = useCallback(() => {
    setRemediationTargetsByKey((current) =>
      current.size === 0 ? current : new Map(),
    )
  }, [])

  const loadIocCandidates = useCallback(
    async (selectAllOnLoad = false) => {
      const caseId = timelineCaseId.trim()
      if (!caseId) {
        setIocCandidates([])
        setSelectedIocCandidateIds(new Set())
        setIocCandidatesError("")
        return
      }

      const runId = iocLoadRunIdRef.current + 1
      iocLoadRunIdRef.current = runId
      setIocCandidatesLoading(true)
      setIocCandidatesError("")
      try {
        const data = await listAttackCaseIocCandidates({
          caseId,
          tenantId: graphResponseRef.current?.tenant_id || undefined,
        })
        if (iocLoadRunIdRef.current !== runId) return

        setIocCandidates(data.items)
        const activeIds = new Set(
          data.items
            .map((candidate) => candidate.candidate_id || candidate.id)
            .filter(Boolean),
        )
        setSelectedIocCandidateIds((current) => {
          if (selectAllOnLoad) return activeIds
          return new Set(
            Array.from(current).filter((candidateId) => activeIds.has(candidateId)),
          )
        })
      } catch (error) {
        if (iocLoadRunIdRef.current !== runId) return
        setIocCandidatesError(
          error instanceof Error ? error.message : "预检 IOC 请求失败。",
        )
      } finally {
        if (iocLoadRunIdRef.current === runId) {
          setIocCandidatesLoading(false)
        }
      }
    },
    [timelineCaseId],
  )

  const deleteIocCandidates = useCallback(
    async (candidateIds: string[]) => {
      const caseId = timelineCaseId.trim()
      const normalizedIds = Array.from(
        new Set(candidateIds.map((item) => item.trim()).filter(Boolean)),
      )
      if (!caseId || normalizedIds.length === 0) return

      setDeletingIocCandidateIds((current) => {
        const next = new Set(current)
        normalizedIds.forEach((candidateId) => next.add(candidateId))
        return next
      })
      try {
        const data = await deleteAttackCaseIocCandidates({
          caseId,
          candidateIds: normalizedIds,
          tenantId: graphResponseRef.current?.tenant_id || undefined,
        })
        const deletedIds = new Set(normalizedIds)
        setIocCandidates((current) =>
          current.filter(
            (candidate) => !deletedIds.has(candidate.candidate_id || candidate.id),
          ),
        )
        setSelectedIocCandidateIds((current) =>
          new Set(Array.from(current).filter((candidateId) => !deletedIds.has(candidateId))),
        )
        toast.success("已删除自添加 IOC", {
          description: `已移除 ${data.deleted_count} 个图谱来源。`,
        })
      } catch (error) {
        toast.error("删除预检 IOC 失败", {
          description: error instanceof Error ? error.message : "未知请求错误。",
        })
      } finally {
        setDeletingIocCandidateIds((current) => {
          const next = new Set(current)
          normalizedIds.forEach((candidateId) => next.delete(candidateId))
          return next
        })
      }
    },
    [timelineCaseId],
  )

  const startIocVerification = useCallback(
    (candidateIds: string[]) => {
      const caseId = timelineCaseId.trim()
      const normalizedIds = Array.from(
        new Set(candidateIds.map((item) => item.trim()).filter(Boolean)),
      )
      if (!caseId || normalizedIds.length === 0) {
        toast.warning("请选择需要检测的 IOC。")
        return
      }

      router.push(
        buildIOCVerificationHref(caseId, timelineSnapshotId, {
          candidateIds: normalizedIds,
          queuePage: returnQueuePage,
          returnToGraph: true,
          tenantId: graphResponseRef.current?.tenant_id,
          workflowId: returnWorkflowId,
        }),
      )
    },
    [returnQueuePage, returnWorkflowId, router, timelineCaseId, timelineSnapshotId],
  )

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
      if (action.kind === "add-ioc-candidates") {
        const currentGraph = graphResponseRef.current ?? graphResponse
        const caseId = (currentGraph?.case_id || timelineCaseId).trim()
        if (!currentGraph || !caseId) {
          toast.error("当前案件图谱尚未加载完成。")
          return
        }

        const nodeCandidates = getAttackGraphNodeIocCandidates(action.node)
        if (nodeCandidates.length === 0) {
          toast.warning("当前节点没有可加入的 IOC。")
          return
        }

        const nodeKey = action.node.key || action.node.id
        const drillParentRefId = drillParentByNodeKey.get(nodeKey) || ""
        const items: AppendAttackCaseIOCCandidateInput[] = nodeCandidates.map(
          (candidate) => ({
            ioc_type: candidate.iocType,
            query_type: candidate.queryType,
            value: candidate.value,
            source_ref_id: candidate.sourceRefId,
            source_field: candidate.sourceField,
            file_name: candidate.fileName || undefined,
            file_path: candidate.filePath || undefined,
            graph_origin: drillParentRefId ? "drill_graph" : "base_graph",
            source_parent_ref_id: drillParentRefId || undefined,
            source_entity_type: candidate.sourceEntityType || undefined,
            source_display_name: candidate.sourceDisplayName || undefined,
          }),
        )

        const toastId = toast.loading("正在加入预检 IOC...")
        try {
          const data = await appendAttackCaseIocCandidates({
            caseId,
            items,
            tenantId: currentGraph.tenant_id,
          })
          const returnedCandidates = data.items.map((item) => item.candidate)
          setIocCandidates((current) => {
            const next = new Map(
              current.map((candidate) => [candidate.candidate_id || candidate.id, candidate]),
            )
            returnedCandidates.forEach((candidate) => {
              next.set(candidate.candidate_id || candidate.id, candidate)
            })
            return Array.from(next.values())
          })
          setSelectedIocCandidateIds((current) => {
            const next = new Set(current)
            returnedCandidates.forEach((candidate) =>
              next.add(candidate.candidate_id || candidate.id),
            )
            return next
          })

          const changedCount = data.created_count + data.reactivated_count
          toast.success(changedCount > 0 ? "已加入预检 IOC" : "IOC 已在预检清单中", {
            id: toastId,
            description:
              changedCount > 0
                ? `新增 ${data.created_count} 个，恢复 ${data.reactivated_count} 个。`
                : `当前节点的 ${data.existing_count} 个 IOC 无需重复添加。`,
          })
        } catch (error) {
          toast.error("加入预检 IOC 失败", {
            id: toastId,
            description: error instanceof Error ? error.message : "未知请求错误。",
          })
        }
        return
      }

      if (
        action.kind === "add-remediation-target" ||
        action.kind === "remove-remediation-target"
      ) {
        const targetKey = action.node.key || action.node.id
        if (!targetKey) {
          toast.error("当前节点缺少可用标识，无法加入处置编排。")
          return
        }

        const adding = action.kind === "add-remediation-target"
        setRemediationTargetsByKey((current) => {
          const next = new Map(current)
          if (adding) {
            next.set(targetKey, action.node)
          } else {
            next.delete(targetKey)
          }
          return next
        })

        const targetName =
          action.node.displayName || action.node.key || action.node.id
        if (adding) {
          toast.success("已加入处置编排", {
            description: `${targetName} 已加入当前处置目标清单。`,
          })
        } else {
          toast.success("已从处置编排中移除", {
            description: `${targetName} 已从当前处置目标清单移除。`,
          })
        }
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
        const graphBeforeMerge = graphResponseRef.current ?? currentGraph
        const existingNodeKeys = new Set(
          (graphBeforeMerge.nodes ?? [])
            .map((node) => node.key?.trim())
            .filter((nodeKey): nodeKey is string => Boolean(nodeKey)),
        )
        const addedDrillNodeKeys = incomingNodes
          .map((node) => node.key?.trim() || "")
          .filter((incomingNodeKey) => incomingNodeKey && !existingNodeKeys.has(incomingNodeKey))
        if (addedDrillNodeKeys.length > 0) {
          setDrillParentByNodeKey((current) => {
            const next = new Map(current)
            addedDrillNodeKeys.forEach((incomingNodeKey) =>
              next.set(incomingNodeKey, nodeKey),
            )
            return next
          })
        }
        const mergeResult = mergeGraphCaseDrillResult(
          graphBeforeMerge,
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
    [
      drillParentByNodeKey,
      graphNodeDrillStateByKey,
      graphResponse,
      timelineCaseId,
    ],
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
    void loadIocCandidates(true)
    return () => {
      iocLoadRunIdRef.current += 1
    }
  }, [loadIocCandidates])

  useEffect(() => {
    const caseId = timelineCaseId.trim()
    if (!caseId) {
      graphResponseRef.current = null
      setGraphResponse(null)
      setGraphNodeDrillStateByKey(new Map())
      setDrillParentByNodeKey(new Map())
      setGraphError("")
      setGraphLoading(false)
      setInvestigationGraphContextVersion(0)
      return
    }

    let cancelled = false
    setGraphLoading(true)
    setGraphError("")
    setGraphNodeDrillStateByKey(new Map())
    setDrillParentByNodeKey(new Map())
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
          controlPanel={(
            <AttackGraphControlPanel
              defaultActivePluginId="ioc-candidates"
              plugins={[
                {
                  id: "ioc-candidates",
                  label: "IOC 预检",
                  icon: ScanSearch,
                  count: groupedIocCandidates.length,
                  tone: "blue",
                  headerDescription: "当前案件有效 IOC，按规范化值聚合展示",
                  content: (
                    <AttackGraphIocCandidates
                      candidates={iocCandidates}
                      deletingCandidateIds={deletingIocCandidateIds}
                      error={iocCandidatesError}
                      loading={iocCandidatesLoading}
                      onDelete={deleteIocCandidates}
                      onRefresh={() => loadIocCandidates(false)}
                      onSelectedCandidateIdsChange={setSelectedIocCandidateIds}
                      onStartVerification={startIocVerification}
                      selectedCandidateIds={selectedIocCandidateIds}
                    />
                  ),
                },
                {
                  id: "remediation-targets",
                  label: "处置目标",
                  icon: ShieldCheck,
                  count: remediationTargets.length,
                  tone: "emerald",
                  headerDescription: "任务清单独立于节点详情，可继续从图中追加目标",
                  content: (
                    <AttackGraphRemediationTargets
                      targets={remediationTargets}
                      onClear={clearRemediationTargets}
                      onRemove={removeRemediationTarget}
                    />
                  ),
                },
              ]}
            />
          )}
          edgeCount={graphVisibleStats.edgeCount}
          error={graphError}
          layoutOptions={graphLayoutOptions}
          layoutStrategy={graphLayoutStrategy}
          loading={graphLoading}
          iocCandidateSourceKeys={iocCandidateSourceKeys}
          nodeDrillStateByKey={graphNodeDrillStateByKey}
          nodeCount={graphVisibleStats.nodeCount}
          onBack={handleBackToAttackDetail}
          onLayoutStrategyChange={setGraphLayoutStrategy}
          onMenuAction={handleGraphMenuAction}
          onResetPositions={() => setGraphPositionResetKey((key) => key + 1)}
          positionResetKey={graphPositionResetKey}
          remediationTargetKeys={remediationTargetKeys}
          response={graphResponse}
          subtitle={t("subtitle")}
          title={t("graph")}
        />

      </div>
    </div >
  )
}
