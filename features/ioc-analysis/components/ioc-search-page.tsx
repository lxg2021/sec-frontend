"use client"

import { useCallback, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import dynamic from "next/dynamic"
import { AlertTriangle, Database, FileSearch, Loader2, Network, Search, Shield } from "lucide-react"
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
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
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

function EmptySearchState() {
  const t = useTranslations("pages.iocAnalysis.search.emptyState")

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Search className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-950">{t("title")}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <EmptyMetric icon={Shield} label={t("intelPanelTitle")} />
            <EmptyMetric icon={Database} label={t("localPanelTitle")} />
            <EmptyMetric icon={Network} label={t("graphPanelTitle")} />
            <EmptyMetric icon={FileSearch} label={t("detailPanelTitle")} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950">{t("pendingTitle")}</div>
              <div className="mt-1 text-xs text-slate-500">{t("pendingDescription")}</div>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-500">
              {t("pendingBadge")}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-3 w-2/3" />
            <SkeletonLine className="h-3 w-full" />
            <SkeletonLine className="h-3 w-5/6" />
            <SkeletonLine className="h-3 w-1/2" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <EmptyPanel icon={Database} title={t("localPanelTitle")}>
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <SkeletonLine className="h-3 w-1/2" />
                <SkeletonLine className="mt-3 h-3 w-full" />
                <SkeletonLine className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </div>
        </EmptyPanel>

        <EmptyPanel icon={Network} title={t("graphPanelTitle")}>
          <div className="relative h-[360px] overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50">
            <div className="absolute left-[18%] top-[28%] h-12 w-12 rounded-full border border-blue-200 bg-white shadow-sm" />
            <div className="absolute left-[47%] top-[42%] h-14 w-14 rounded-full border border-emerald-200 bg-white shadow-sm" />
            <div className="absolute right-[18%] top-[24%] h-10 w-10 rounded-full border border-amber-200 bg-white shadow-sm" />
            <div className="absolute bottom-[22%] left-[34%] h-10 w-10 rounded-full border border-slate-200 bg-white shadow-sm" />
            <div className="absolute left-[25%] top-[40%] h-px w-[28%] rotate-12 bg-slate-200" />
            <div className="absolute right-[24%] top-[37%] h-px w-[22%] -rotate-12 bg-slate-200" />
            <div className="absolute bottom-[34%] left-[40%] h-px w-[22%] -rotate-45 bg-slate-200" />
            <div className="absolute inset-x-8 bottom-8 rounded-lg border border-slate-200 bg-white/80 p-3">
              <SkeletonLine className="h-3 w-1/3" />
              <SkeletonLine className="mt-2 h-3 w-2/3" />
            </div>
          </div>
        </EmptyPanel>

        <EmptyPanel icon={FileSearch} title={t("detailPanelTitle")}>
          <div className="space-y-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item}>
                <SkeletonLine className="h-3 w-1/3" />
                <SkeletonLine className="mt-2 h-3 w-full" />
                <SkeletonLine className="mt-2 h-3 w-4/5" />
              </div>
            ))}
          </div>
        </EmptyPanel>
      </div>
    </section>
  )
}

function EmptyMetric({
  icon: Icon,
  label,
}: {
  icon: typeof Shield
  label: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-50 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <SkeletonLine className="mt-3 h-4 w-2/3" />
    </div>
  )
}

function EmptyPanel({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode
  icon: typeof Shield
  title: string
}) {
  return (
    <section className="min-h-[460px] rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950">
        <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`rounded-full bg-slate-100 ${className ?? ""}`} />
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
  const currentValue = item?.value || queryValue.trim()

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
    <main className="bg-gray-50 text-slate-950">
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 p-6">
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

        {status === "idle" ? <EmptySearchState /> : null}

        {status === "error" ? (
          <section className="mx-auto max-w-5xl rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">{t("feedback.searchFailedTitle")}</h2>
                <p className="mt-1 text-sm leading-6">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        {item ? (
          <section className="space-y-5">
            <IocSearchResultSummary
              graphScopeId={graphScope?.scopeId}
              item={item}
              localEventCount={localResult.items.length}
              onCopy={copyValue}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
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

              <TabsContent value="overview" className="m-0 p-4">
                <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
                  <IocLocalEventsPanel
                    className="h-[620px]"
                    currentValue={currentValue}
                    defaultLookbackDays={DEFAULT_LOOKBACK_DAYS}
                    graphLoadingEventKey={graphLoadingEventKey}
                    onLoadMore={handleLoadMoreLocal}
                    onLocateGraph={handleLocateGraph}
                    onRefresh={handleRefreshLocal}
                    result={localResult}
                    selectedEventKey={selectedEventKey}
                  />

                  <IocPositioningGraphPanel
                    className="h-[620px] min-w-0"
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
                    onMenuAction={handleGraphMenuAction}
                    onResetPositions={() => setGraphPositionResetKey((key) => key + 1)}
                    positionResetKey={graphPositionResetKey}
                    response={graphResponse}
                    selectedEvent={selectedEvent}
                    status={graphStatus}
                  />

                  <IocVerificationDetailPanel
                    className="h-[620px] rounded-lg"
                    item={item}
                    loading={status === "loading"}
                    onCopy={copyValue}
                  />
                </div>
              </TabsContent>

              <TabsContent value="detail" className="m-0 p-4">
                <IocVerificationDetailPanel
                  className="min-h-[640px] rounded-lg"
                  item={item}
                  loading={status === "loading"}
                  onCopy={copyValue}
                />
              </TabsContent>

              <TabsContent value="local" className="m-0 p-4">
                <IocLocalEventsPanel
                  className="min-h-[640px]"
                  currentValue={currentValue}
                  defaultLookbackDays={DEFAULT_LOOKBACK_DAYS}
                  graphLoadingEventKey={graphLoadingEventKey}
                  onLoadMore={handleLoadMoreLocal}
                  onLocateGraph={handleLocateGraph}
                  onRefresh={handleRefreshLocal}
                  result={localResult}
                  selectedEventKey={selectedEventKey}
                />
              </TabsContent>

              <TabsContent value="graph" className="m-0 p-4">
                <IocPositioningGraphPanel
                  className="h-[720px]"
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
                  onMenuAction={handleGraphMenuAction}
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
