"use client"

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react"
import dynamic from "next/dynamic"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { fetchGraphDrill, fetchGraphLocateResult, type GraphLocateResultResponseDto } from "@/features/attack/dgraph/api"
import { buildAttackGraphModel } from "@/features/attack/dgraph/model/core/attack-graph-adapter"
import type { AttackGraphLayoutOptions, GraphCaseResponseDto } from "@/features/attack/dgraph/model/core/attack-graph-data"
import { buildGraphDrillTimeRange, mergeGraphCaseDrillResult } from "@/features/attack/dgraph/model/core/attack-graph-drill-utils"
import type { AttackGraphLayoutStrategyOption } from "@/features/attack/dgraph/components/attack-graph-layout-strategy-toggle"
import type { AttackGraphMenuAction, AttackGraphNodeDrillState } from "@/features/attack/dgraph/model/menu/attack-graph-menu-types"
import { getIocHitDetail } from "@/features/ioc-analysis/api"
import { IocLocalEventsPanel, type IocLocalLocatePanelResult } from "@/features/ioc-analysis/components/ioc-local-events-panel"
import {
  localEventKey,
  localEventUniqueId,
  type IocLocalEventSource,
} from "@/features/ioc-analysis/components/ioc-search-event-utils"
import { IocSearchHeader } from "@/features/ioc-analysis/components/ioc-search-header"
import { IocSearchResultSummary } from "@/features/ioc-analysis/components/ioc-search-result-summary"
import { IocVerificationDetailPanel } from "@/features/ioc-analysis/components/ioc-verification-detail-panel"
import type {
  AttackCaseIOCVerificationDetail,
  IocCandidate,
  IocVerificationItem,
  IocVerificationStatus,
  IocVerificationType,
} from "@/features/ioc-analysis/types"
import { toast } from "@/shared/hooks/use-toast"
import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

const IocPositioningGraphPanel = dynamic(
  () => import("@/features/ioc-analysis/components/ioc-positioning-graph-panel").then((mod) => mod.IocPositioningGraphPanel),
  {
    ssr: false,
    loading: () => <IocGraphPanelLoading />,
  },
)

function IocGraphPanelLoading() {
  const t = useTranslations("pages.iocAnalysis.search.graph")

  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
      {t("componentLoading")}
    </div>
  )
}

const DEFAULT_TENANT_ID = "public"
const DEFAULT_LOOKBACK_DAYS = 7
const DRILL_TIMEZONE = "Asia/Shanghai"
const TYPE_OPTIONS: IocVerificationType[] = [
  "auto",
  "md5",
  "sha1",
  "sha256",
  "url",
  "ip",
  "domain",
  "hostname",
]

type SearchStatus = "idle" | "loading" | "success" | "error"
type GraphLocateStatus = "idle" | "loading" | "success" | "error"

type ApiResult<T> = {
  data: T
}

type PositionPageData = {
  items?: IocLocalEventSource[]
  pagination?: {
    page_size?: number
    returned_count?: number
    has_next?: boolean
    next_page_token?: string
  }
}

type LocalLocateResult = IocLocalLocatePanelResult

type GraphScopeState = {
  alreadyInGraph: boolean
  focusNodeKeys: string[]
  scopeId: string
  scopeType: string
  diagnostics?: GraphLocateResultResponseDto["diagnostics"]
}

function isValidIPv4(value: string) {
  const parts = value.split(".")
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false
      const numeric = Number(part)
      return numeric >= 0 && numeric <= 255
    })
  )
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function detectIocType(value: string): IocVerificationType | null {
  const normalized = value.trim()
  if (!normalized) return null
  if (isValidUrl(normalized)) return "url"
  if (/^[a-f0-9]{32}$/i.test(normalized)) return "md5"
  if (/^[a-f0-9]{40}$/i.test(normalized)) return "sha1"
  if (/^[a-f0-9]{64}$/i.test(normalized)) return "sha256"
  if (isValidIPv4(normalized)) return "ip"
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized) && !normalized.includes("/") && !normalized.includes("..")) {
    return "domain"
  }
  return null
}

function resolveSearchType(type: IocVerificationType, value: string): IocVerificationType | null {
  if (type === "auto" || type === "hash") return detectIocType(value)
  if (type === "hostname") return "domain"
  return type
}

function normalizeIocValue(type: IocVerificationType, value: string) {
  const normalized = value.trim()
  if (type === "md5" || type === "sha1" || type === "sha256" || type === "hash") {
    return normalized.toLowerCase()
  }
  if (type === "domain" || type === "hostname") return normalized.toLowerCase()
  return normalized
}

function statusFromVerificationDetail(detail: AttackCaseIOCVerificationDetail): IocVerificationStatus {
  const verification = detail.item

  if (verification) {
    if (
      verification.hit_status_key === "remote_error_suppressed" ||
      verification.remote_status === "remote_error_suppressed"
    ) {
      return "suppressed"
    }
    if (
      verification.hit_status_key === "local_whitelist_hit" ||
      verification.hit_kind === "whitelist" ||
      verification.final_status === "allowlisted" ||
      verification.final_verdict === "allow" ||
      verification.hit_verdict === "allow"
    ) {
      return "allowlisted"
    }
    if (
      verification.hit_status_key === "error" ||
      verification.hit_verdict === "error" ||
      verification.final_status === "local_error" ||
      verification.final_status === "remote_error" ||
      verification.final_verdict === "error"
    ) {
      return "error"
    }
    if (
      verification.hit_status_key === "local_ioc_hit" ||
      verification.hit_status_key === "remote_ioc_hit" ||
      (verification.hit === true && verification.hit_kind === "ioc") ||
      verification.hit_verdict === "malicious" ||
      verification.final_status === "local_hit" ||
      verification.final_status === "remote_hit" ||
      verification.final_verdict === "malicious"
    ) {
      return "hit"
    }
    if (
      verification.hit_status_key === "no_hit" ||
      verification.final_status === "local_miss" ||
      verification.final_status === "remote_miss" ||
      verification.final_verdict === "unknown"
    ) {
      return "miss"
    }
  }

  const sourceDetail = detail.final_hit_detail ?? detail.hit_source_detail
  if (sourceDetail?.whitelist) return "allowlisted"
  if (sourceDetail?.ioc_entry || sourceDetail?.blacklist_indicator || detail.detail_view?.primary) return "hit"
  return "miss"
}

function buildManualItem(type: IocVerificationType, value: string, detail: AttackCaseIOCVerificationDetail): IocVerificationItem {
  const normalizedValue = normalizeIocValue(type, value)
  const candidate: IocCandidate = {
    id: `manual:${type}:${normalizedValue.toLowerCase()}`,
    type,
    value: normalizedValue,
    source: "manual",
    evidence_refs: [],
    origin: "manual",
    verification: detail.item,
    verification_detail: detail,
  }

  return {
    ...candidate,
    status: statusFromVerificationDetail(detail),
    result: null,
    error: detail.item?.error_message ?? "",
  }
}

function buildTransientItem({
  errorMessage = "",
  status,
  type,
  value,
}: {
  errorMessage?: string
  status: "checking" | "error"
  type: IocVerificationType
  value: string
}): IocVerificationItem {
  const checkedAt = formatLocalDateTime(new Date())
  const verification = {
    verification_id: `manual:${type}:${value}`,
    candidate_id: `manual:${type}:${value}`,
    tenant_id: DEFAULT_TENANT_ID,
    case_id: "",
    local_decision: "",
    whitelist_status: "",
    local_status: status === "checking" ? "checking" : "error",
    local_hit_source: "",
    remote_status: status === "checking" ? "checking" : "error",
    final_status: status === "checking" ? "checking" : "error",
    final_verdict: status === "checking" ? "unknown" : "error",
    risk_score: 0,
    confidence: 0,
    checked_at: checkedAt,
    error_message: errorMessage,
    created_at: checkedAt,
    updated_at: checkedAt,
    hit: false,
    hit_scope: "",
    hit_kind: "",
    hit_category: "",
    hit_status_key: status === "checking" ? "checking" : "error",
    hit_verdict: status === "checking" ? "unknown" : "error",
    hit_source_database: "",
    hit_source_table: "",
    hit_source_record_id: "",
    local_eval_raw_json: "",
  }

  return {
    id: `manual:${type}:${value}`,
    type,
    value,
    source: "manual",
    evidence_refs: [],
    origin: "manual",
    verification,
    verification_detail: null,
    status,
    result: null,
    error: errorMessage,
  }
}

function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function defaultTimeRange() {
  const end = new Date()
  const start = new Date(end.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
  return {
    startTime: formatLocalDateTime(start),
    endTime: formatLocalDateTime(end),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || DRILL_TIMEZONE,
  }
}

function localLocateInput(type: IocVerificationType, value: string): { positionType: number; source: string } | null {
  if (type === "ip") return { positionType: 3, source: value.trim() }
  if (type === "domain" || type === "hostname") return { positionType: 2, source: value.trim().replace(/\.$/, "").toLowerCase() }
  if (type === "url") {
    try {
      const parsed = new URL(value.trim())
      return parsed.hostname ? { positionType: 2, source: parsed.hostname.toLowerCase() } : null
    } catch {
      return null
    }
  }
  if (type === "md5") return { positionType: 1, source: value.trim().toLowerCase() }
  return null
}

async function locateLocalData({
  pageToken = "",
  tenantId,
  type,
  value,
}: {
  pageToken?: string
  tenantId: string
  type: IocVerificationType
  value: string
}): Promise<LocalLocateResult> {
  const input = localLocateInput(type, value)
  if (!input) {
    return {
      status: "unsupported",
      message: "",
      source: value,
      positionType: null,
      items: [],
      pageToken,
      nextPageToken: "",
      hasNext: false,
    }
  }

  const { startTime, endTime, timezone } = defaultTimeRange()
  const result = (await http.post("/sensor/analysis/characteristicposition/page", {
    request_id: createRequestId(),
    tenant_id: tenantId.trim() || DEFAULT_TENANT_ID,
    type: input.positionType,
    source: input.source,
    start_time: startTime,
    end_time: endTime,
    timezone,
    page_size: 20,
    page_token: pageToken,
    dns_match_mode: 0,
  })) as ApiResult<PositionPageData>

  const data = result.data || {}
  const pagination = data.pagination || {}
  const items = Array.isArray(data.items) ? data.items : []

  return {
    status: "success",
    message: "",
    source: input.source,
    positionType: input.positionType,
    items,
    pageToken,
    nextPageToken: pagination.next_page_token || "",
    hasNext: Boolean(pagination.has_next),
  }
}

function graphLocateToGraphResponse({
  response,
  tenantId,
  timeRange,
}: {
  response: GraphLocateResultResponseDto
  tenantId: string
  timeRange: ReturnType<typeof defaultTimeRange>
}): GraphCaseResponseDto {
  const nodes = response.nodes ?? []
  const edges = response.edges ?? []

  return {
    request_id: response.request_id,
    tenant_id: tenantId,
    case_id: response.scope_id || "positioning",
    start_time: timeRange.startTime,
    end_time: timeRange.endTime,
    nodes,
    edges,
    diagnostics: {
      node_count: response.diagnostics?.returned_node_count ?? nodes.length,
      edge_count: response.diagnostics?.returned_edge_count ?? edges.length,
    },
  }
}

function IocSearchEmptyState() {
  const t = useTranslations("pages.iocAnalysis.search.emptyState")

  return (
    <section className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <div className="mx-auto max-w-xl">
        <h2 className="text-base font-semibold text-slate-950">{t("title")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t("description")}</p>
      </div>
    </section>
  )
}

export function IocSearchPage() {
  const t = useTranslations("pages.iocAnalysis.search")
  const [queryType, setQueryType] = useState<IocVerificationType>("auto")
  const [queryValue, setQueryValue] = useState("")
  const [status, setStatus] = useState<SearchStatus>("idle")
  const [error, setError] = useState("")
  const [item, setItem] = useState<IocVerificationItem | null>(null)
  const [localResult, setLocalResult] = useState<LocalLocateResult>({
    status: "idle",
    message: "",
    source: "",
    positionType: null,
    items: [],
    pageToken: "",
    nextPageToken: "",
    hasNext: false,
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedEvent, setSelectedEvent] = useState<IocLocalEventSource | null>(null)
  const [selectedEventKey, setSelectedEventKey] = useState("")
  const [graphLoadingEventKey, setGraphLoadingEventKey] = useState("")
  const [graphStatus, setGraphStatus] = useState<GraphLocateStatus>("idle")
  const [graphError, setGraphError] = useState("")
  const [graphScope, setGraphScope] = useState<GraphScopeState | null>(null)
  const [graphResponse, setGraphResponse] = useState<GraphCaseResponseDto | null>(null)
  const [graphLayoutStrategy, setGraphLayoutStrategy] = useState<AttackGraphLayoutStrategyOption>("auto")
  const [graphPositionResetKey, setGraphPositionResetKey] = useState(0)
  const [graphNodeDrillStateByKey, setGraphNodeDrillStateByKey] = useState(
    () => new Map<string, AttackGraphNodeDrillState>(),
  )
  const graphResponseRef = useRef<GraphCaseResponseDto | null>(null)

  const tenantId = DEFAULT_TENANT_ID
  const resolvedType = useMemo(() => resolveSearchType(queryType, queryValue), [queryType, queryValue])
  const canSearch = Boolean(queryValue.trim() && resolvedType)
  const queryDisplayItem = useMemo(() => {
    const value = queryValue.trim()
    const type = resolvedType
    if (!value || !type || (status !== "loading" && status !== "error")) return null

    return buildTransientItem({
      errorMessage: status === "error" ? error : "",
      status: status === "loading" ? "checking" : "error",
      type,
      value: normalizeIocValue(type, value),
    })
  }, [error, queryValue, resolvedType, status])
  const displayItemForPage = item ?? queryDisplayItem
  const currentValue = displayItemForPage?.value || queryValue.trim()

  const graphVisibleStats = useMemo(() => {
    if (!graphResponse) return { edgeCount: 0, nodeCount: 0 }
    const graph = buildAttackGraphModel(graphResponse)
    return {
      edgeCount: graph.edges.length,
      nodeCount: graph.nodes.length,
    }
  }, [graphResponse])

  const graphLayoutOptions = useMemo<AttackGraphLayoutOptions | undefined>(
    () => graphLayoutStrategy === "auto" ? undefined : { strategy: graphLayoutStrategy },
    [graphLayoutStrategy],
  )

  const resetGraphState = useCallback(() => {
    graphResponseRef.current = null
    setSelectedEvent(null)
    setSelectedEventKey("")
    setGraphLoadingEventKey("")
    setGraphStatus("idle")
    setGraphError("")
    setGraphScope(null)
    setGraphResponse(null)
    setGraphNodeDrillStateByKey(new Map())
    setGraphPositionResetKey((key) => key + 1)
  }, [])

  const runLocalLocate = useCallback(async (type: IocVerificationType, value: string, pageToken = "") => {
    setLocalResult((current) => ({
      ...current,
      status: "loading",
      message: t("local.loading"),
      items: pageToken ? current.items : [],
      pageToken,
    }))

    try {
      const next = await locateLocalData({ tenantId, type, value, pageToken })
      setLocalResult((current) => ({
        ...next,
        message:
          next.status === "unsupported"
            ? t("local.unsupportedMessage")
            : next.items.length
              ? t("local.foundMessage", { days: DEFAULT_LOOKBACK_DAYS, count: next.items.length })
              : t("local.empty", { days: DEFAULT_LOOKBACK_DAYS }),
        items: pageToken ? [...current.items, ...next.items] : next.items,
      }))
    } catch (localError) {
      setLocalResult({
        status: "error",
        message: localError instanceof Error && localError.message ? localError.message : t("feedback.localLocateFailed"),
        source: value,
        positionType: null,
        items: [],
        pageToken,
        nextPageToken: "",
        hasNext: false,
      })
    }
  }, [tenantId, t])

  async function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const type = resolveSearchType(queryType, queryValue)
    const value = queryValue.trim()

    if (!type || !value) {
      toast({
        title: t("feedback.invalidTitle"),
        description: t("feedback.invalidDescription"),
        variant: "warning",
      })
      return
    }

    const normalizedValue = normalizeIocValue(type, value)
    setStatus("loading")
    setError("")
    setItem(null)
    setActiveTab("overview")
    resetGraphState()

    void runLocalLocate(type, normalizedValue)

    try {
      const detail = await getIocHitDetail({
        tenantId,
        type,
        value: normalizedValue,
      })
      const nextItem = buildManualItem(type, normalizedValue, detail)
      setItem(nextItem)
      setStatus("success")
    } catch (searchError) {
      const message = searchError instanceof Error && searchError.message ? searchError.message : t("feedback.searchFailedDescription")
      setStatus("error")
      setError(message)
      toast({
        title: t("feedback.searchFailedTitle"),
        description: message,
        variant: "destructive",
      })
    }
  }

  function copyValue(value: string) {
    void navigator.clipboard.writeText(value)
    toast({
      title: t("feedback.copiedTitle"),
      description: value,
      variant: "success",
    })
  }

  const handleRefreshLocal = useCallback(() => {
    if (!item) return
    void runLocalLocate(item.type, item.value)
  }, [item, runLocalLocate])

  const handleLoadMoreLocal = useCallback(() => {
    if (!item || !localResult.nextPageToken) return
    void runLocalLocate(item.type, item.value, localResult.nextPageToken)
  }, [item, localResult.nextPageToken, runLocalLocate])

  const handleLocateGraph = useCallback(async (event: IocLocalEventSource, index: number) => {
    const uniqueId = localEventUniqueId(event)
    const eventType = Number(event.event_type || 0)
    const eventKey = localEventKey(event, index)

    if (!uniqueId || !eventType) {
      toast({
        title: t("feedback.graphInvalidTitle"),
        description: t("feedback.graphInvalidDescription"),
        variant: "warning",
      })
      return
    }

    const timeRange = defaultTimeRange()
    setSelectedEvent(event)
    setSelectedEventKey(eventKey)
    setGraphLoadingEventKey(eventKey)
    setGraphStatus("loading")
    setGraphError("")
    setGraphNodeDrillStateByKey(new Map())

    try {
      const response = await fetchGraphLocateResult({
        tenantId,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        timezone: timeRange.timezone,
        sourceKey: {
          eventType,
          eventName: event.event_name || "",
          uniqueId,
        },
      })

      if (!response) {
        throw new Error("GraphLocateResult returned empty response.")
      }

      const graph = graphLocateToGraphResponse({ response, tenantId, timeRange })
      graphResponseRef.current = graph
      setGraphResponse(graph)
      setGraphScope({
        alreadyInGraph: Boolean(response.already_in_graph),
        diagnostics: response.diagnostics,
        focusNodeKeys: response.focus_node_keys ?? [],
        scopeId: response.scope_id || "",
        scopeType: response.scope_type || "positioning",
      })
      setGraphStatus("success")
      setGraphPositionResetKey((key) => key + 1)
      if (activeTab === "local") {
        setActiveTab("graph")
      }

      const nodeCount = response.nodes?.length ?? 0
      const edgeCount = response.edges?.length ?? 0
      if (nodeCount || edgeCount) {
        toast({
          title: t("feedback.graphGeneratedTitle"),
          description: `${nodeCount} nodes / ${edgeCount} edges`,
          variant: "success",
        })
      } else {
        toast({
          title: t("feedback.graphEmptyTitle"),
          description: t("feedback.graphEmptyDescription"),
          variant: "warning",
        })
      }
    } catch (graphLocateError) {
      const message = graphLocateError instanceof Error && graphLocateError.message
        ? graphLocateError.message
        : t("feedback.graphFailedDescription")
      setGraphStatus("error")
      setGraphError(message)
      toast({
        title: t("feedback.graphFailedTitle"),
        description: message,
        variant: "destructive",
      })
    } finally {
      setGraphLoadingEventKey("")
    }
  }, [activeTab, tenantId, t])

  const handleGraphMenuAction = useCallback(async (action: AttackGraphMenuAction) => {
    if (action.kind !== "node-drilldown") return

    const currentGraph = graphResponseRef.current ?? graphResponse
    const currentScope = graphScope
    if (!currentGraph || !currentScope?.scopeId) {
      toast({
        title: t("feedback.drillInvalidTitle"),
        description: t("feedback.drillInvalidDescription"),
        variant: "warning",
      })
      return
    }

    const drillRange =
      buildGraphDrillTimeRange(currentGraph.start_time, currentGraph.end_time) ??
      defaultTimeRange()
    const nodeKey = action.node.key
    const currentNodeDrillState = graphNodeDrillStateByKey.get(nodeKey) ?? "idle"
    if (currentNodeDrillState !== "idle") return

    setGraphNodeDrillStateByKey((current) => {
      const next = new Map(current)
      next.set(nodeKey, "loading")
      return next
    })

    try {
      const drillResponse = await fetchGraphDrill({
        scopeType: "positioning",
        scopeId: currentScope.scopeId,
        nodeKey,
        nodeType: action.node.entityType,
        startTime: drillRange.startTime,
        endTime: drillRange.endTime,
        timezone: DRILL_TIMEZONE,
        tenantId: currentGraph.tenant_id,
        forceRefresh: false,
      })

      const mergeResult = mergeGraphCaseDrillResult(currentGraph, {
        nodes: drillResponse?.nodes ?? [],
        edges: drillResponse?.edges ?? [],
      })
      graphResponseRef.current = mergeResult.response
      setGraphResponse(mergeResult.response)

      setGraphNodeDrillStateByKey((current) => {
        const next = new Map(current)
        next.set(
          nodeKey,
          mergeResult.visibleAddedNodeCount > 0 || mergeResult.visibleAddedEdgeCount > 0
            ? "done"
            : "empty",
        )
        return next
      })

      if (mergeResult.visibleAddedNodeCount > 0 || mergeResult.visibleAddedEdgeCount > 0) {
        toast({
          title: t("feedback.drillAddedTitle"),
          description: `${mergeResult.visibleAddedNodeCount} nodes / ${mergeResult.visibleAddedEdgeCount} edges`,
          variant: "success",
        })
      } else {
        toast({
          title: t("feedback.drillEmptyTitle"),
          description: t("feedback.drillEmptyDescription"),
          variant: "warning",
        })
      }
    } catch (drillError) {
      setGraphNodeDrillStateByKey((current) => {
        const next = new Map(current)
        next.delete(nodeKey)
        return next
      })
      toast({
        title: t("feedback.drillFailedTitle"),
        description: drillError instanceof Error && drillError.message ? drillError.message : t("feedback.drillFailedDescription"),
        variant: "destructive",
      })
    }
  }, [graphNodeDrillStateByKey, graphResponse, graphScope, t])

  return (
    <main className="h-full overflow-hidden bg-gray-50 text-slate-950">
      <div className="flex h-full min-h-0 flex-col gap-4 p-6">
        <IocSearchHeader
          queryType={queryType}
          queryValue={queryValue}
          typeOptions={TYPE_OPTIONS}
          status={status}
          canSearch={canSearch}
          onQueryTypeChange={setQueryType}
          onQueryValueChange={setQueryValue}
          onSearch={handleSearch}
        />

        {displayItemForPage ? (
          <IocSearchResultSummary
            graphScopeId={graphScope?.scopeId}
            item={displayItemForPage}
            localEventCount={localResult.items.length}
            onCopy={copyValue}
          />
        ) : (
          <IocSearchEmptyState />
        )}

        {status === "error" ? (
          <section className="mx-auto max-w-5xl shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">{t("feedback.searchFailedTitle")}</h2>
                <p className="mt-1 text-sm leading-6">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        {displayItemForPage ? (
          <section className="min-h-0 flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="shrink-0 border-b border-slate-100 px-4 py-3">
                <TabsList className="h-10 rounded-md bg-slate-100 p-1">
                  <TabsTrigger value="overview" className="rounded px-4 data-[state=active]:bg-white">
                    {t("tabs.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="detail" className="rounded px-4 data-[state=active]:bg-white">
                    {t("tabs.detail")}
                  </TabsTrigger>
                  <TabsTrigger value="local" className="rounded px-4 data-[state=active]:bg-white">
                    {t("tabs.local")}
                  </TabsTrigger>
                  <TabsTrigger value="graph" className="rounded px-4 data-[state=active]:bg-white">
                    {t("tabs.graph")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="m-0 min-h-0 flex-1 p-4 data-[state=inactive]:hidden">
                <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
                  <IocLocalEventsPanel
                    className="h-full"
                    currentValue={currentValue}
                    defaultLookbackDays={DEFAULT_LOOKBACK_DAYS}
                    graphLoadingEventKey={graphLoadingEventKey}
                    onLoadMore={item ? handleLoadMoreLocal : undefined}
                    onLocateGraph={handleLocateGraph}
                    onRefresh={item ? handleRefreshLocal : undefined}
                    result={localResult}
                    selectedEventKey={selectedEventKey}
                  />

                  <IocPositioningGraphPanel
                    className="h-full min-w-0"
                    edgeCount={graphVisibleStats.edgeCount}
                    error={graphError}
                    graphScopeId={graphScope?.scopeId}
                    graphScopeType={graphScope?.scopeType}
                    layoutOptions={graphLayoutOptions}
                    layoutStrategy={graphLayoutStrategy}
                    loadingEvent={selectedEvent}
                    nodeCount={graphVisibleStats.nodeCount}
                    nodeDrillStateByKey={graphNodeDrillStateByKey}
                    onLayoutStrategyChange={setGraphLayoutStrategy}
                    onMenuAction={item ? handleGraphMenuAction : undefined}
                    onResetPositions={() => setGraphPositionResetKey((key) => key + 1)}
                    positionResetKey={graphPositionResetKey}
                    response={graphResponse}
                    selectedEvent={selectedEvent}
                    status={graphStatus}
                  />

                  <IocVerificationDetailPanel
                    className="h-full rounded-lg"
                    detailLayout="single"
                    item={displayItemForPage}
                    loading={status === "loading"}
                    onCopy={copyValue}
                  />
                </div>
              </TabsContent>

              <TabsContent value="detail" className="m-0 min-h-0 flex-1 p-4 data-[state=inactive]:hidden">
                <IocVerificationDetailPanel
                  className="h-full rounded-lg"
                  item={displayItemForPage}
                  loading={status === "loading"}
                  onCopy={copyValue}
                />
              </TabsContent>

              <TabsContent value="local" className="m-0 min-h-0 flex-1 p-4 data-[state=inactive]:hidden">
                <IocLocalEventsPanel
                  className="h-full"
                  currentValue={currentValue}
                  defaultLookbackDays={DEFAULT_LOOKBACK_DAYS}
                  graphLoadingEventKey={graphLoadingEventKey}
                  onLoadMore={item ? handleLoadMoreLocal : undefined}
                  onLocateGraph={handleLocateGraph}
                  onRefresh={item ? handleRefreshLocal : undefined}
                  result={localResult}
                  selectedEventKey={selectedEventKey}
                />
              </TabsContent>

              <TabsContent value="graph" className="m-0 min-h-0 flex-1 p-4 data-[state=inactive]:hidden">
                <IocPositioningGraphPanel
                  className="h-full"
                  edgeCount={graphVisibleStats.edgeCount}
                  error={graphError}
                  graphScopeId={graphScope?.scopeId}
                  graphScopeType={graphScope?.scopeType}
                  layoutOptions={graphLayoutOptions}
                  layoutStrategy={graphLayoutStrategy}
                  loadingEvent={selectedEvent}
                  nodeCount={graphVisibleStats.nodeCount}
                  nodeDrillStateByKey={graphNodeDrillStateByKey}
                  onLayoutStrategyChange={setGraphLayoutStrategy}
                  onMenuAction={item ? handleGraphMenuAction : undefined}
                  onResetPositions={() => setGraphPositionResetKey((key) => key + 1)}
                  positionResetKey={graphPositionResetKey}
                  response={graphResponse}
                  selectedEvent={selectedEvent}
                  status={graphStatus}
                />
              </TabsContent>
            </Tabs>
          </section>
        ) : null}
      </div>
    </main>
  )
}

