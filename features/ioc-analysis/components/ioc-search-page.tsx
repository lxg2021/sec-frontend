"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { batchDescribeEventSourcesByKeys } from "@/features/attack/dashboard/api"
import type { EventSourceDescriptionKey } from "@/features/attack/dashboard/types"
import { fetchGraphDrill, fetchGraphLocateResult, type GraphLocateResultResponseDto } from "@/features/attack/dgraph/api"
import { buildAttackGraphModel } from "@/features/attack/dgraph/model/core/attack-graph-adapter"
import type { AttackGraphLayoutOptions, GraphCaseResponseDto } from "@/features/attack/dgraph/model/core/attack-graph-data"
import { buildGraphDrillTimeRange, mergeGraphCaseDrillResult } from "@/features/attack/dgraph/model/core/attack-graph-drill-utils"
import type { AttackGraphLayoutStrategyOption } from "@/features/attack/dgraph/components/attack-graph-layout-strategy-toggle"
import type { AttackGraphMenuAction, AttackGraphNodeDrillState } from "@/features/attack/dgraph/model/menu/attack-graph-menu-types"
import { getIocHitDetail } from "@/features/ioc-analysis/api"
import {
  IocLocalEventsPanel,
  type IocLocalEventDescriptionMap,
  type IocLocalLocatePanelResult,
} from "@/features/ioc-analysis/components/ioc-local-events-panel"
import {
  localEventDescriptionKeyFromValues,
  localEventKey,
  localEventUniqueId,
  type IocLocalEventSource,
} from "@/features/ioc-analysis/components/ioc-search-event-utils"
import { IocSearchHeader } from "@/features/ioc-analysis/components/ioc-search-header"
import { IocSearchResultSummary } from "@/features/ioc-analysis/components/ioc-search-result-summary"
import { IocPanelEmptyState } from "@/features/ioc-analysis/components/ioc-panel-empty-state"
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
const DEFAULT_LOOKBACK_DAYS = 30
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
type LocalTimeRangeMode = "30d" | "90d" | "custom"

type LocalTimeRangeState = {
  customEnd: string
  customStart: string
  mode: LocalTimeRangeMode
}

type LocalLocateTimeRange = {
  endTime: string
  label: string
  mode: LocalTimeRangeMode
  startTime: string
  timezone: string
}

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

function formatDateTimeInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function errorMessageFromUnknown(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error.trim()) return error.trim()
  if (typeof Event !== "undefined" && error instanceof Event) {
    return error.type ? `${fallback} (${error.type})` : fallback
  }
  return fallback
}

function defaultTimeRange(days = DEFAULT_LOOKBACK_DAYS) {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    startTime: formatLocalDateTime(start),
    endTime: formatLocalDateTime(end),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || DRILL_TIMEZONE,
  }
}

function defaultLocalTimeRangeState(): LocalTimeRangeState {
  const end = new Date()
  const start = new Date(end.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
  return {
    customEnd: formatDateTimeInput(end),
    customStart: formatDateTimeInput(start),
    mode: "30d",
  }
}

function normalizeDateTimeInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const normalized = trimmed.replace("T", " ")
  return normalized.length === 16 ? `${normalized}:00` : normalized
}

function buildLocalLocateTimeRange(state: LocalTimeRangeState): LocalLocateTimeRange | null {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || DRILL_TIMEZONE

  if (state.mode === "custom") {
    const startTime = normalizeDateTimeInput(state.customStart)
    const endTime = normalizeDateTimeInput(state.customEnd)
    const startDate = new Date(state.customStart)
    const endDate = new Date(state.customEnd)

    if (!startTime || !endTime || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null
    }
    if (startDate.getTime() > endDate.getTime()) {
      return null
    }

    return {
      endTime,
      label: `${startTime} - ${endTime}`,
      mode: "custom",
      startTime,
      timezone,
    }
  }

  const days = state.mode === "90d" ? 90 : 30
  const range = defaultTimeRange(days)
  return {
    ...range,
    label: `${days}d`,
    mode: state.mode,
    timezone,
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
  timeRange,
  type,
  value,
}: {
  pageToken?: string
  tenantId: string
  timeRange: LocalLocateTimeRange
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
      rangeLabel: timeRange.label,
      pageToken,
      nextPageToken: "",
      hasNext: false,
    }
  }

  const result = (await http.post("/sensor/analysis/characteristicposition/page", {
    request_id: createRequestId(),
    tenant_id: tenantId.trim() || DEFAULT_TENANT_ID,
    type: input.positionType,
    source: input.source,
    start_time: timeRange.startTime,
    end_time: timeRange.endTime,
    timezone: timeRange.timezone,
    page_size: 10,
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
    rangeLabel: timeRange.label,
    pageToken,
    nextPageToken: pagination.next_page_token || "",
    hasNext: Boolean(pagination.has_next),
  }
}

function semanticDescriptionLanguage(locale: string) {
  return locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"
}

async function describeLocalEventPage({
  items,
  language,
  tenantId,
}: {
  items: IocLocalEventSource[]
  language: string
  tenantId: string
}): Promise<IocLocalEventDescriptionMap> {
  const keys: EventSourceDescriptionKey[] = []
  const requestMapKeys: string[] = []
  const seen = new Set<string>()

  for (const event of items) {
    const eventType = Number(event.event_type || 0)
    const uniqueId = localEventUniqueId(event)
    const mapKey = localEventDescriptionKeyFromValues(eventType, event.event_name, uniqueId)
    if (!eventType || !uniqueId || !mapKey || seen.has(mapKey)) continue

    seen.add(mapKey)
    requestMapKeys.push(mapKey)
    keys.push({
      event_type: eventType,
      event_name: event.event_name || "",
      source_unique_id: uniqueId,
    })
  }

  if (!keys.length) return {}

  const result = await batchDescribeEventSourcesByKeys({
    keys,
    tenantId,
    language,
    includeEventSource: false,
    includeAllFields: false,
  })

  const descriptions: IocLocalEventDescriptionMap = {}
  result.items.forEach((item, index) => {
    const responseMapKey = localEventDescriptionKeyFromValues(
      item.key.event_type,
      item.key.event_name,
      item.key.source_unique_id,
    )
    const requestMapKey = requestMapKeys[index]
    if (responseMapKey) descriptions[responseMapKey] = item
    if (requestMapKey) descriptions[requestMapKey] = item
  })

  return descriptions
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
    <section className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <IocPanelEmptyState
        title={t("title")}
        description={t("description")}
      />
    </section>
  )
}

export function IocSearchPage() {
  const t = useTranslations("pages.iocAnalysis.search")
  const locale = useLocale()
  const [queryType, setQueryType] = useState<IocVerificationType>("auto")
  const [queryValue, setQueryValue] = useState("")
  const [status, setStatus] = useState<SearchStatus>("idle")
  const [error, setError] = useState("")
  const [item, setItem] = useState<IocVerificationItem | null>(null)
  const [localTimeRange, setLocalTimeRange] = useState<LocalTimeRangeState>(() => defaultLocalTimeRangeState())
  const [localResult, setLocalResult] = useState<LocalLocateResult>({
    status: "idle",
    message: "",
    source: "",
    positionType: null,
    items: [],
    rangeLabel: `${DEFAULT_LOOKBACK_DAYS}d`,
    pageToken: "",
    nextPageToken: "",
    hasNext: false,
  })
  const [localPageIndex, setLocalPageIndex] = useState(0)
  const [localPageTokens, setLocalPageTokens] = useState<string[]>([""])
  const [localEventDescriptions, setLocalEventDescriptions] = useState<IocLocalEventDescriptionMap>({})
  const [activeTab, setActiveTab] = useState("detail")
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
  const appliedLocalTimeRangeRef = useRef<LocalLocateTimeRange | null>(null)
  const localLocateRequestRef = useRef(0)

  const tenantId = DEFAULT_TENANT_ID
  const resolvedType = useMemo(() => resolveSearchType(queryType, queryValue), [queryType, queryValue])
  const canSearch = Boolean(queryValue.trim())
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

  const currentLocalTimeRange = useMemo(
    () => buildLocalLocateTimeRange(localTimeRange) ?? buildLocalLocateTimeRange(defaultLocalTimeRangeState()),
    [localTimeRange],
  )
  const localTimeRangeLabel = localTimeRange.mode === "custom"
    ? currentLocalTimeRange?.label ?? `${DEFAULT_LOOKBACK_DAYS}d`
    : t(`local.range.${localTimeRange.mode}`)

  const runLocalLocate = useCallback(async (type: IocVerificationType, value: string, pageToken = "", useAppliedRange = false) => {
    const requestId = localLocateRequestRef.current + 1
    localLocateRequestRef.current = requestId
    const isLatestRequest = () => localLocateRequestRef.current === requestId
    const timeRange = pageToken || useAppliedRange
      ? appliedLocalTimeRangeRef.current
      : buildLocalLocateTimeRange(localTimeRange)

    if (!timeRange) {
      setLocalEventDescriptions({})
      setLocalResult((current) => ({
        ...current,
        status: "error",
        message: t("local.invalidTimeRange"),
        source: value,
        items: pageToken ? current.items : [],
        pageToken,
      }))
      toast({
        title: t("local.invalidTimeRangeTitle"),
        description: t("local.invalidTimeRange"),
        variant: "warning",
      })
      return false
    }

    if (!pageToken) {
      appliedLocalTimeRangeRef.current = timeRange
    }

    const rangeText = timeRange.mode === "custom" ? timeRange.label : t(`local.range.${timeRange.mode}`)

    if (!pageToken) {
      setLocalEventDescriptions({})
    }
    setLocalResult((current) => ({
      ...current,
      status: "loading",
      message: t("local.loading"),
      items: pageToken ? current.items : [],
      rangeLabel: rangeText,
      pageToken,
    }))

    try {
      const next = await locateLocalData({ tenantId, timeRange, type, value, pageToken })
      if (!isLatestRequest()) return false

      const nextResult = {
        ...next,
        rangeLabel: rangeText,
        message:
          next.status === "unsupported"
            ? t("local.unsupportedMessage")
            : next.items.length
              ? t("local.foundMessage", { count: next.items.length, range: rangeText })
              : t("local.empty", { range: rangeText }),
        items: next.items,
      }

      setLocalResult(nextResult)
      setLocalEventDescriptions({})

      if (next.items.length) {
        void describeLocalEventPage({
          items: next.items,
          language: semanticDescriptionLanguage(locale),
          tenantId,
        }).then((descriptions) => {
          if (isLatestRequest()) {
            setLocalEventDescriptions(descriptions)
          }
        }).catch(() => {
          if (isLatestRequest()) {
            setLocalEventDescriptions({})
          }
        })
      }

      return true
    } catch (localError) {
      if (!isLatestRequest()) return false
      setLocalEventDescriptions({})
      setLocalResult({
        status: "error",
        message: localError instanceof Error && localError.message ? localError.message : t("feedback.localLocateFailed"),
        source: value,
        positionType: null,
        items: [],
        rangeLabel: rangeText,
        pageToken,
        nextPageToken: "",
        hasNext: false,
      })
      return false
    }
  }, [localTimeRange, locale, tenantId, t])

  async function handleSearch() {
    try {
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
      setActiveTab("detail")
      setLocalPageIndex(0)
      setLocalPageTokens([""])
      resetGraphState()

      void runLocalLocate(type, normalizedValue)

      const detail = await getIocHitDetail({
        tenantId,
        type,
        value: normalizedValue,
      })
      const nextItem = buildManualItem(type, normalizedValue, detail)
      setItem(nextItem)
      setStatus("success")
    } catch (searchError) {
      const message = errorMessageFromUnknown(searchError, t("feedback.searchFailedDescription"))
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
    void navigator.clipboard.writeText(value).then(() => {
      toast({
        title: t("feedback.copiedTitle"),
        description: value,
        variant: "success",
      })
    }).catch((copyError) => {
      toast({
        title: t("feedback.searchFailedTitle"),
        description: errorMessageFromUnknown(copyError, t("feedback.searchFailedDescription")),
        variant: "destructive",
      })
    })
  }

  const handleRefreshLocal = useCallback(() => {
    if (!item) return
    setLocalPageIndex(0)
    setLocalPageTokens([""])
    void runLocalLocate(item.type, item.value)
  }, [item, runLocalLocate])

  const handleLocalTimeRangeModeChange = useCallback((mode: LocalTimeRangeMode) => {
    setLocalTimeRange((current) => ({
      ...current,
      mode,
    }))
  }, [])

  const handleLocalCustomStartChange = useCallback((value: string) => {
    setLocalTimeRange((current) => ({
      ...current,
      customStart: value,
      mode: "custom",
    }))
  }, [])

  const handleLocalCustomEndChange = useCallback((value: string) => {
    setLocalTimeRange((current) => ({
      ...current,
      customEnd: value,
      mode: "custom",
    }))
  }, [])

  const handleNextLocalPage = useCallback(() => {
    if (!item || !localResult.nextPageToken) return
    const nextToken = localResult.nextPageToken
    const nextIndex = localPageIndex + 1

    void runLocalLocate(item.type, item.value, nextToken).then((ok) => {
      if (!ok) return
      setLocalPageIndex(nextIndex)
      setLocalPageTokens((current) => {
        const next = current.slice(0, nextIndex)
        next[nextIndex] = nextToken
        return next
      })
    })
  }, [item, localPageIndex, localResult.nextPageToken, runLocalLocate])

  const handlePreviousLocalPage = useCallback(() => {
    if (!item || localPageIndex <= 0) return
    const previousIndex = localPageIndex - 1
    const previousToken = localPageTokens[previousIndex] ?? ""

    void runLocalLocate(item.type, item.value, previousToken, true).then((ok) => {
      if (!ok) return
      setLocalPageIndex(previousIndex)
    })
  }, [item, localPageIndex, localPageTokens, runLocalLocate])

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
      const message = errorMessageFromUnknown(graphLocateError, t("feedback.graphFailedDescription"))
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
        description: errorMessageFromUnknown(drillError, t("feedback.drillFailedDescription")),
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
                  customEnd={localTimeRange.customEnd}
                  customStart={localTimeRange.customStart}
                  descriptions={localEventDescriptions}
                  currentValue={currentValue}
                  graphLoadingEventKey={graphLoadingEventKey}
                  onCustomEndChange={handleLocalCustomEndChange}
                  onCustomStartChange={handleLocalCustomStartChange}
                  onNextPage={item ? handleNextLocalPage : undefined}
                  onLocateGraph={handleLocateGraph}
                  onPreviousPage={item ? handlePreviousLocalPage : undefined}
                  onRefresh={item ? handleRefreshLocal : undefined}
                  onTimeRangeModeChange={handleLocalTimeRangeModeChange}
                  pageIndex={localPageIndex}
                  result={localResult}
                  selectedEventKey={selectedEventKey}
                  timeRangeLabel={localTimeRangeLabel}
                  timeRangeMode={localTimeRange.mode}
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

