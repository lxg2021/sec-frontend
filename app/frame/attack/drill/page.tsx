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
  buildAttackGraphIocGroupKey,
  buildAttackGraphIocIdentityKey,
  buildAttackGraphIocSourceKey,
  buildAttackGraphModel,
  buildGraphDrillTimeRange,
  compactAttackGraphIocSourceRefId,
  fetchGraphDrill,
  fetchGraphCase,
  getAttackGraphNodeIocCandidates,
  getAttackGraphIocRepresentativeCandidateId,
  groupAttackGraphIocCandidates,
  mergeGraphCaseDrillResult,
} from "@/features/attack/dgraph"
import type {
  AttackGraphIocNodeAssociation,
  AttackGraphIocCandidateSyncState,
  AttackGraphLayoutOptions,
  AttackGraphMenuAction,
  AttackGraphNodeFocusRequest,
  AttackGraphNodeDrillState,
  AttackGraphLayoutStrategyOption,
  GraphCaseResponseDto,
} from "@/features/attack/dgraph"
import {
  buildRemediationOrchestrationHref,
  RemediationOrderTitleDialog,
  remediationOrderTitleLocale,
  suggestRemediationOrderTitle,
  useRemediationOrderWorkspace,
} from "@/features/attack/remediation-order"
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
const IOC_EXTRACT_POLL_INTERVAL_MS = 2000
const IOC_EXTRACT_ACTIVE_STATUSES = new Set(["pending", "running"])
const EMPTY_ATTACK_GRAPH_NODES = Object.freeze([])

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
    <section className="w-full rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
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
  const [graphNodeFocusRequest, setGraphNodeFocusRequest] =
    useState<AttackGraphNodeFocusRequest | null>(null);
  const [graphNodeDrillStateByKey, setGraphNodeDrillStateByKey] = useState(
    () => new Map<string, AttackGraphNodeDrillState>(),
  );
  const [controlPanelActivePluginId, setControlPanelActivePluginId] =
    useState("ioc-candidates")
  const [controlPanelExpanded, setControlPanelExpanded] = useState(false)
  const [createRemediationOrderOpen, setCreateRemediationOrderOpen] =
    useState(false)
  const [suggestedRemediationOrderName, setSuggestedRemediationOrderName] =
    useState("")
  const [iocCandidates, setIocCandidates] = useState<IocVerificationItem[]>([])
  const [iocCandidatesLoading, setIocCandidatesLoading] = useState(false)
  const [iocCandidateSyncState, setIocCandidateSyncState] =
    useState<AttackGraphIocCandidateSyncState>("loading")
  const [iocExtractTaskStatus, setIocExtractTaskStatus] = useState("")
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
  const graphNodeFocusRequestIdRef = useRef(0);
  const iocLoadRunIdRef = useRef(0)

  useEffect(() => {
    setTimelineCaseId(routeParams.caseId)
    setCaseIdInput(routeParams.caseId)
    setTimelineSnapshotId(routeParams.snapshotId)
    setReturnTo(routeParams.returnTo)
    setReturnWorkflowId(routeParams.workflowId)
    setReturnQueuePage(routeParams.queuePage)
    setControlPanelActivePluginId("ioc-candidates")
    setControlPanelExpanded(false)
    setCreateRemediationOrderOpen(false)
    setSuggestedRemediationOrderName("")
    setIocCandidates([])
    setIocCandidateSyncState("loading")
    setIocExtractTaskStatus("")
    setIocCandidatesError("")
    setSelectedIocCandidateIds(new Set())
    setDeletingIocCandidateIds(new Set())
    setDrillParentByNodeKey(new Map())
    setGraphNodeFocusRequest(null)
    setInvestigationGraphContextVersion(0)
  }, [routeParams])

  const groupedIocCandidates = useMemo(
    () => groupAttackGraphIocCandidates(iocCandidates),
    [iocCandidates],
  )
  const iocNodeAssociationsByGroupKey = useMemo(() => {
    const associationsByGroupKey = new Map<
      string,
      Map<string, AttackGraphIocNodeAssociation>
    >()
    if (!graphResponse) return new Map<string, AttackGraphIocNodeAssociation[]>()

    const graph = buildAttackGraphModel(graphResponse)
    for (const node of graph.nodes) {
      const nodeAssociation: AttackGraphIocNodeAssociation = {
        id: node.id,
        displayName: node.displayName || node.id,
        entityType: node.entityType,
        graphOrigin: drillParentByNodeKey.has(node.key || node.id)
          ? "drill_graph"
          : "base_graph",
      }

      for (const candidate of getAttackGraphNodeIocCandidates(node)) {
        const groupKey = buildAttackGraphIocGroupKey(
          candidate.iocType,
          candidate.value,
        )
        const associations =
          associationsByGroupKey.get(groupKey) ??
          new Map<string, AttackGraphIocNodeAssociation>()
        associations.set(node.id, nodeAssociation)
        associationsByGroupKey.set(groupKey, associations)
      }
    }

    return new Map(
      Array.from(associationsByGroupKey, ([groupKey, associations]) => [
        groupKey,
        Array.from(associations.values()).sort((left, right) =>
          left.displayName.localeCompare(right.displayName),
        ),
      ]),
    )
  }, [drillParentByNodeKey, graphResponse])
  const iocCandidateIdentityKeys = useMemo(
    () =>
      new Set(
        iocCandidates.map((candidate) =>
          buildAttackGraphIocIdentityKey(
            candidate.type,
            candidate.normalized_value || candidate.value,
          ),
        ),
      ),
    [iocCandidates],
  )
  const iocCandidateUserIdsBySourceKey = useMemo(() => {
    const candidateIdsBySourceKey = new Map<string, string[]>()
    for (const candidate of iocCandidates) {
      if (candidate.source !== "case_graph") continue
      const candidateId = (candidate.candidate_id || candidate.id).trim()
      if (!candidateId) continue
      const sourceKey = buildAttackGraphIocSourceKey({
        iocType: candidate.type,
        value: candidate.normalized_value || candidate.value,
        sourceRefId: candidate.source_ref_id || "",
        sourceField: candidate.source_field || "",
      })
      const candidateIds = candidateIdsBySourceKey.get(sourceKey) ?? []
      candidateIds.push(candidateId)
      candidateIdsBySourceKey.set(sourceKey, candidateIds)
    }
    return candidateIdsBySourceKey
  }, [iocCandidates])
  const iocCandidateUserSourceKeys = useMemo(
    () => new Set(iocCandidateUserIdsBySourceKey.keys()),
    [iocCandidateUserIdsBySourceKey],
  )

  const locateGraphNode = useCallback((nodeId: string) => {
    graphNodeFocusRequestIdRef.current += 1
    setGraphNodeFocusRequest({
      nodeId,
      requestId: graphNodeFocusRequestIdRef.current,
    })
  }, [])

  const loadIocCandidates = useCallback(
    async (selectAllOnLoad = false) => {
      const caseId = timelineCaseId.trim()
      if (!caseId) {
        setIocCandidates([])
        setSelectedIocCandidateIds(new Set())
        setIocCandidatesError("")
        setIocCandidateSyncState("ready")
        setIocExtractTaskStatus("")
        return
      }

      const runId = iocLoadRunIdRef.current + 1
      iocLoadRunIdRef.current = runId
      setIocCandidatesLoading(true)
      setIocCandidateSyncState("loading")
      setIocCandidatesError("")
      try {
        const data = await listAttackCaseIocCandidates({
          caseId,
          tenantId: graphResponseRef.current?.tenant_id || undefined,
        })
        if (iocLoadRunIdRef.current !== runId) return

        setIocCandidates(data.items)
        const extractTaskStatus =
          data.extract_task?.status.trim().toLowerCase() || ""
        setIocExtractTaskStatus(extractTaskStatus)
        if (IOC_EXTRACT_ACTIVE_STATUSES.has(extractTaskStatus)) {
          setIocCandidateSyncState("loading")
        } else if (extractTaskStatus === "failed") {
          setIocCandidateSyncState("error")
          setIocCandidatesError(
            data.extract_task?.error_message ||
              t("controlPanel.ioc.messages.extractFailed"),
          )
        } else {
          setIocCandidateSyncState("ready")
        }
        const activeIds = new Set(
          groupAttackGraphIocCandidates(data.items)
            .map(getAttackGraphIocRepresentativeCandidateId)
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
        setIocCandidateSyncState("error")
        setIocExtractTaskStatus("")
        setIocCandidatesError(
          error instanceof Error
            ? error.message
            : t("controlPanel.ioc.messages.requestFailed"),
        )
      } finally {
        if (iocLoadRunIdRef.current === runId) {
          setIocCandidatesLoading(false)
        }
      }
    },
    [t, timelineCaseId],
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
        toast.success(t("controlPanel.ioc.messages.removed"), {
          description: t("controlPanel.ioc.messages.removedDescription", {
            count: data.deleted_count,
          }),
        })
      } catch (error) {
        toast.error(t("controlPanel.ioc.messages.removeFailed"), {
          description:
            error instanceof Error
              ? error.message
              : t("controlPanel.ioc.messages.unknownError"),
        })
      } finally {
        setDeletingIocCandidateIds((current) => {
          const next = new Set(current)
          normalizedIds.forEach((candidateId) => next.delete(candidateId))
          return next
        })
      }
    },
    [t, timelineCaseId],
  )

  const startIocVerification = useCallback(
    (candidateIds: string[]) => {
      const caseId = timelineCaseId.trim()
      const normalizedIds = Array.from(
        new Set(candidateIds.map((item) => item.trim()).filter(Boolean)),
      )
      if (!caseId || normalizedIds.length === 0) {
        toast.warning(t("controlPanel.ioc.messages.selectRequired"))
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
    [returnQueuePage, returnWorkflowId, router, t, timelineCaseId, timelineSnapshotId],
  )

  const graphModel = useMemo(
    () => (graphResponse ? buildAttackGraphModel(graphResponse) : null),
    [graphResponse],
  )
  const graphVisibleStats = useMemo(() => {
    if (!graphModel) return { edgeCount: 0, nodeCount: 0 }
    return {
      edgeCount: graphModel.edges.length,
      nodeCount: graphModel.nodes.length,
    }
  }, [graphModel])
  const remediationGraphMatchesCase = Boolean(
    graphResponse &&
      (graphResponse.case_id || "").trim() === timelineCaseId.trim(),
  )
  const remediation = useRemediationOrderWorkspace({
    caseId: timelineCaseId,
    workflowId: returnWorkflowId,
    tenantId: remediationGraphMatchesCase
      ? graphResponse?.tenant_id
      : undefined,
    nodes:
      remediationGraphMatchesCase && graphModel
        ? graphModel.nodes
        : EMPTY_ATTACK_GRAPH_NODES,
  })
  const handleOpenRemediationOrchestration = useCallback(async (title?: string) => {
    const requestedTitle = title?.trim() || ""
    if (!remediation.order && !requestedTitle) {
      setSuggestedRemediationOrderName(
        suggestRemediationOrderTitle(
          remediation.targets,
          remediationOrderTitleLocale(locale),
        ),
      )
      setCreateRemediationOrderOpen(true)
      return
    }

    try {
      let currentOrder = remediation.order
      if (!currentOrder) {
        currentOrder = await remediation.saveDraft({ title: requestedTitle })
      } else if (remediation.dirty) {
        currentOrder = await remediation.saveDraft()
      }
      setCreateRemediationOrderOpen(false)
      router.push(buildRemediationOrchestrationHref(currentOrder))
    } catch (error) {
      toast.error(t("controlPanel.remediation.messages.openFailed"), {
        description:
          error instanceof Error
            ? error.message
            : t("controlPanel.remediation.messages.unknownError"),
      })
    }
  }, [locale, remediation, router, t])
  const handleViewRemediationOrchestration = useCallback(() => {
    if (!remediation.order) return
    router.push(buildRemediationOrchestrationHref(remediation.order))
  }, [remediation.order, router])
  const handleRemediationRetry = useCallback(
    async (targetKey: string) => {
      try {
        await remediation.retryTarget(targetKey)
      } catch (error) {
        toast.error(t("controlPanel.remediation.messages.resolveFailed"), {
          description:
            error instanceof Error
              ? error.message
              : t("controlPanel.remediation.messages.unknownError"),
        })
      }
    },
    [remediation, t],
  )
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
      if (action.kind === "open-remediation-order") {
        if (!remediation.order) {
          toast.warning(t("controlPanel.remediation.messages.openFailed"), {
            description: t("controlPanel.remediation.messages.unknownError"),
          })
          return
        }
        router.push(buildRemediationOrchestrationHref(remediation.order))
        return
      }

      if (action.kind === "remove-ioc-candidates") {
        if (iocCandidateSyncState !== "ready") {
          toast.info(t("controlPanel.ioc.messages.syncPending"))
          return
        }
        const candidateIds = Array.from(
          new Set(
            getAttackGraphNodeIocCandidates(action.node)
              .filter((candidate) => candidate.precheckEligible)
              .flatMap(
                (candidate) =>
                  iocCandidateUserIdsBySourceKey.get(
                    buildAttackGraphIocSourceKey(candidate),
                  ) ?? [],
              ),
          ),
        )
        if (candidateIds.length === 0) {
          toast.info(t("controlPanel.ioc.messages.noManualToRemove"))
          return
        }
        await deleteIocCandidates(candidateIds)
        return
      }

      if (action.kind === "add-ioc-candidates") {
        const currentGraph = graphResponseRef.current ?? graphResponse
        const caseId = (currentGraph?.case_id || timelineCaseId).trim()
        if (!currentGraph || !caseId) {
          toast.error(t("controlPanel.ioc.messages.graphNotReady"))
          return
        }

        const nodeCandidates = getAttackGraphNodeIocCandidates(action.node)
        if (nodeCandidates.length === 0) {
          toast.warning(t("controlPanel.ioc.messages.noAddable"))
          return
        }
        if (iocCandidateSyncState !== "ready") {
          toast.info(t("controlPanel.ioc.messages.syncPending"))
          return
        }
        const eligibleNodeCandidates = nodeCandidates.filter(
          (candidate) => candidate.precheckEligible,
        )
        if (eligibleNodeCandidates.length === 0) {
          toast.info(
            nodeCandidates[0]?.precheckUnavailableReason ||
              t("controlPanel.ioc.messages.noPublicAddable"),
          )
          return
        }
        const missingNodeCandidates = eligibleNodeCandidates.filter(
          (candidate) =>
            !iocCandidateIdentityKeys.has(
              buildAttackGraphIocIdentityKey(
                candidate.iocType,
                candidate.value,
              ),
            ),
        )
        if (missingNodeCandidates.length === 0) {
          toast.info(t("controlPanel.ioc.messages.alreadyExists"))
          return
        }

        const nodeKey = action.node.key || action.node.id
        const rawDrillParentRefId = drillParentByNodeKey.get(nodeKey) || ""
        const drillParentRefId = rawDrillParentRefId
          ? compactAttackGraphIocSourceRefId(rawDrillParentRefId)
          : ""
        const items: AppendAttackCaseIOCCandidateInput[] =
          missingNodeCandidates.map((candidate) => ({
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
          }))

        const toastId = toast.loading(t("controlPanel.ioc.messages.adding"))
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
          toast.success(
            changedCount > 0
              ? t("controlPanel.ioc.messages.added")
              : t("controlPanel.ioc.messages.exists"),
            {
              id: toastId,
              description:
                changedCount > 0
                  ? t("controlPanel.ioc.messages.changedDescription", {
                      created: data.created_count,
                      reactivated: data.reactivated_count,
                    })
                  : t("controlPanel.ioc.messages.existingDescription", {
                      count: data.existing_count,
                    }),
            },
          )
        } catch (error) {
          toast.error(t("controlPanel.ioc.messages.addFailed"), {
            id: toastId,
            description:
              error instanceof Error
                ? error.message
                : t("controlPanel.ioc.messages.unknownError"),
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
          toast.error(t("controlPanel.remediation.messages.missingId"))
          return
        }

        if (!remediation.editable) {
          toast.warning(t("controlPanel.remediation.messages.readOnly"))
          return
        }
        const adding = action.kind === "add-remediation-target"
        const targetName =
          action.node.displayName || action.node.key || action.node.id
        if (adding) {
          setControlPanelActivePluginId("remediation-targets")
          setControlPanelExpanded(true)
          const toastId = toast.loading(
            t("controlPanel.remediation.messages.resolving"),
          )
          try {
            const resolved = await remediation.addTarget(action.node)
            if (resolved) {
              toast.success(t("controlPanel.remediation.messages.added"), {
                id: toastId,
                description: t(
                  "controlPanel.remediation.messages.addedDescription",
                  { target: targetName },
                ),
              })
            } else {
              toast.warning(
                t("controlPanel.remediation.messages.addedBlocked"),
                {
                  id: toastId,
                  description: t(
                    "controlPanel.remediation.messages.addedBlockedDescription",
                    { target: targetName },
                  ),
                },
              )
            }
          } catch (error) {
            toast.error(t("controlPanel.remediation.messages.resolveFailed"), {
              id: toastId,
              description:
                error instanceof Error
                  ? error.message
                  : t("controlPanel.remediation.messages.unknownError"),
            })
          }
        } else {
          remediation.removeTarget(targetKey)
          toast.success(t("controlPanel.remediation.messages.removed"), {
            description: t(
              "controlPanel.remediation.messages.removedDescription",
              { target: targetName },
            ),
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
      deleteIocCandidates,
      graphNodeDrillStateByKey,
      graphResponse,
      iocCandidateIdentityKeys,
      iocCandidateSyncState,
      iocCandidateUserIdsBySourceKey,
      remediation,
      router,
      t,
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
    if (
      !timelineCaseId.trim() ||
      iocCandidatesLoading ||
      !IOC_EXTRACT_ACTIVE_STATUSES.has(iocExtractTaskStatus)
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      void loadIocCandidates(false)
    }, IOC_EXTRACT_POLL_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [
    iocCandidatesLoading,
    iocExtractTaskStatus,
    loadIocCandidates,
    timelineCaseId,
  ])

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
  }, [refreshKey, t, timelineCaseId])

  return (
    <div className="min-h-dvh min-w-0 overflow-x-hidden bg-slate-50">
      <div className="min-w-0 space-y-4 py-3 pl-[4.75rem] pr-3 sm:p-4 xl:space-y-5 xl:p-6">
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
              activePluginId={controlPanelActivePluginId}
              expanded={controlPanelExpanded}
              onActivePluginChange={setControlPanelActivePluginId}
              onExpandedChange={setControlPanelExpanded}
              plugins={[
                {
                  id: "ioc-candidates",
                  label: t("controlPanel.plugins.ioc.label"),
                  icon: ScanSearch,
                  count: groupedIocCandidates.length,
                  tone: "blue",
                  headerDescription: t("controlPanel.plugins.ioc.description"),
                  content: (
                    <AttackGraphIocCandidates
                      candidates={iocCandidates}
                      deletingCandidateIds={deletingIocCandidateIds}
                      error={iocCandidatesError}
                      loading={
                        iocCandidatesLoading ||
                        iocCandidateSyncState === "loading"
                      }
                      nodeAssociationsByGroupKey={iocNodeAssociationsByGroupKey}
                      onDelete={deleteIocCandidates}
                      onLocateNode={locateGraphNode}
                      onRefresh={() => loadIocCandidates(false)}
                      onSelectedCandidateIdsChange={setSelectedIocCandidateIds}
                      onStartVerification={startIocVerification}
                      selectedCandidateIds={selectedIocCandidateIds}
                    />
                  ),
                },
                {
                  id: "remediation-targets",
                  label: t("controlPanel.plugins.remediation.label"),
                  icon: ShieldCheck,
                  count: remediation.targetCount,
                  tone: "emerald",
                  headerDescription: t(
                    "controlPanel.plugins.remediation.description",
                  ),
                  content: (
                    <AttackGraphRemediationTargets
                      targets={remediation.targets}
                      historyItems={remediation.historyItems}
                      order={remediation.order}
                      loadingDraft={remediation.loadingDraft}
                      saving={remediation.saving}
                      dirty={remediation.dirty}
                      error={remediation.error}
                      workflowMissing={remediation.workflowMissing}
                      editable={remediation.editable}
                      allTargetsComplete={remediation.allTargetsComplete}
                      onRemove={remediation.removeTarget}
                      onRetry={handleRemediationRetry}
                      onAgentChange={remediation.selectAgent}
                      onActionChange={remediation.selectActionCode}
                      onOpenOrchestration={
                        handleOpenRemediationOrchestration
                      }
                      onViewOrchestration={handleViewRemediationOrchestration}
                    />
                  ),
                },
              ]}
            />
          )}
          edgeCount={graphVisibleStats.edgeCount}
          error={graphError}
          focusNodeRequest={graphNodeFocusRequest}
          layoutOptions={graphLayoutOptions}
          layoutStrategy={graphLayoutStrategy}
          loading={graphLoading}
          iocCandidateIdentityKeys={iocCandidateIdentityKeys}
          iocCandidateUserSourceKeys={iocCandidateUserSourceKeys}
          iocCandidateSyncState={iocCandidateSyncState}
          nodeDrillStateByKey={graphNodeDrillStateByKey}
          nodeCount={graphVisibleStats.nodeCount}
          onBack={handleBackToAttackDetail}
          onLayoutStrategyChange={setGraphLayoutStrategy}
          onMenuAction={handleGraphMenuAction}
          onResetPositions={() => setGraphPositionResetKey((key) => key + 1)}
          positionResetKey={graphPositionResetKey}
          remediationHistoryNodeStates={remediation.historyNodeStates}
          remediationTargetKeys={remediation.targetKeys}
          response={graphResponse}
          subtitle={t("subtitle")}
          title={t("graph")}
        />

        <RemediationOrderTitleDialog
          defaultTitle={suggestedRemediationOrderName}
          mode="create"
          onOpenChange={setCreateRemediationOrderOpen}
          onSubmit={handleOpenRemediationOrchestration}
          open={createRemediationOrderOpen}
          submitting={remediation.saving}
        />

      </div>
    </div >
  )
}
