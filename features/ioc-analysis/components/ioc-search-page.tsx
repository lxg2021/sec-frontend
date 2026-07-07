"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  Globe2,
  Hash,
  Loader2,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { IocVerificationDetailPanel } from "@/features/ioc-analysis/components/ioc-verification-detail-panel"
import {
  confidenceText,
  isAllowlisted,
  isRemoteHit,
  riskText,
  typeClass,
  verdictFromItem,
} from "@/features/ioc-analysis/components/ioc-verification-display-utils"
import { getIocHitDetail } from "@/features/ioc-analysis/api"
import type {
  AttackCaseIOCVerificationDetail,
  IocCandidate,
  IocVerificationItem,
  IocVerificationStatus,
  IocVerificationType,
} from "@/features/ioc-analysis/types"
import { toast } from "@/shared/hooks/use-toast"
import { http } from "@/shared/lib/http/client"
import { cn, createRequestId } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

const DEFAULT_TENANT_ID = "public"
const DEFAULT_LOOKBACK_DAYS = 7
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
type LocalLocateStatus = "idle" | "loading" | "success" | "unsupported" | "error"

type ApiResult<T> = {
  data: T
}

type PositionPageData = {
  items?: LocalEventSource[]
  pagination?: {
    page_size?: number
    returned_count?: number
    has_next?: boolean
    next_page_token?: string
  }
}

type LocalEventSource = {
  event_type?: number
  event_name?: string
  content?: string
}

type LocalLocateResult = {
  status: LocalLocateStatus
  message: string
  source: string
  positionType: number | null
  items: LocalEventSource[]
  pageToken: string
  nextPageToken: string
  hasNext: boolean
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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
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
  tenantId,
  type,
  value,
  pageToken = "",
}: {
  tenantId: string
  type: IocVerificationType
  value: string
  pageToken?: string
}): Promise<LocalLocateResult> {
  const input = localLocateInput(type, value)
  if (!input) {
    return {
      status: "unsupported",
      message: "当前类型暂不支持本地定位。SHA1/SHA256 仍可查看 IOC 情报结果。",
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
    message: items.length ? `最近 ${DEFAULT_LOOKBACK_DAYS} 天发现 ${items.length} 条本地事件。` : `最近 ${DEFAULT_LOOKBACK_DAYS} 天未发现本地事件。`,
    source: input.source,
    positionType: input.positionType,
    items,
    pageToken,
    nextPageToken: pagination.next_page_token || "",
    hasNext: Boolean(pagination.has_next),
  }
}

function parseEventContent(content?: string): Record<string, unknown> {
  if (!content) return {}
  try {
    const parsed = JSON.parse(content)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function stringField(object: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = object[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return ""
}

function eventSummary(event: LocalEventSource) {
  const content = parseEventContent(event.content)
  const process = stringField(content, "ProcessName", "ProcessImage", "Image", "FileName")
  const ip = stringField(content, "DestinationIp", "DestinationIP", "RemoteIP", "Ip", "QueryIP")
  const domain = stringField(content, "Domain", "QueryName", "DnsName", "Host", "Hostname")
  const target = stringField(content, "TargetFilename", "FilePath", "Path", "CommandLine")
  const agent = stringField(content, "AgentID", "AgentId", "Computer", "Hostname")
  const action = [process, ip || domain || target].filter(Boolean).join(" -> ")
  return action || agent || event.event_name || "本地事件命中"
}

function eventUniqueId(event: LocalEventSource) {
  const content = parseEventContent(event.content)
  return stringField(content, "UniqueID", "UniqueId", "unique_id")
}

function eventTime(event: LocalEventSource) {
  const content = parseEventContent(event.content)
  return stringField(content, "Time", "EventTime", "Timestamp", "UtcTime")
}

function verdictLabel(item: IocVerificationItem | null) {
  if (!item) return "未查询"
  switch (verdictFromItem(item)) {
    case "malicious":
      return "恶意命中"
    case "allow":
      return "白名单"
    case "error":
      return "查询异常"
    case "checking":
      return "查询中"
    case "ready":
      return "待查询"
    default:
      return "未知"
  }
}

function verdictToneClass(item: IocVerificationItem | null) {
  if (!item) return "border-slate-200 bg-slate-50 text-slate-600"
  switch (verdictFromItem(item)) {
    case "malicious":
      return "border-red-200 bg-red-50 text-red-700"
    case "allow":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function VerdictIcon({ item }: { item: IocVerificationItem | null }) {
  const verdict = item ? verdictFromItem(item) : "ready"
  if (verdict === "malicious") return <ShieldAlert className="size-8 text-red-600" aria-hidden="true" />
  if (verdict === "allow") return <ShieldCheck className="size-8 text-emerald-600" aria-hidden="true" />
  if (verdict === "error") return <AlertTriangle className="size-8 text-rose-600" aria-hidden="true" />
  return <FileSearch className="size-8 text-slate-500" aria-hidden="true" />
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: typeof Database
  label: string
  value: string
  tone?: "slate" | "blue" | "green" | "red" | "amber"
}) {
  const toneClass = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone]

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className={cn("flex size-7 items-center justify-center rounded-md", toneClass)}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {label}
      </div>
      <div className="mt-3 truncate text-xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function EmptySearchState() {
  return (
    <section className="mx-auto max-w-5xl rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Search className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-base font-semibold text-slate-950">输入一个 IOC 开始检索</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        支持 IP、域名、URL、MD5、SHA1、SHA256。查询会复用现有手动 IOC 验证逻辑，并在结果中补充本地数据定位。
      </p>
    </section>
  )
}

export function IocSearchPage() {
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

  const tenantId = DEFAULT_TENANT_ID
  const resolvedType = useMemo(() => resolveSearchType(queryType, queryValue), [queryType, queryValue])
  const canSearch = Boolean(queryValue.trim() && resolvedType)
  const currentValue = item?.value || queryValue.trim()

  const runLocalLocate = useCallback(async (type: IocVerificationType, value: string, pageToken = "") => {
    setLocalResult((current) => ({
      ...current,
      status: "loading",
      message: "正在定位本地事件...",
      items: pageToken ? current.items : [],
      pageToken,
    }))

    try {
      const next = await locateLocalData({ tenantId, type, value, pageToken })
      setLocalResult((current) => ({
        ...next,
        items: pageToken ? [...current.items, ...next.items] : next.items,
      }))
    } catch (localError) {
      setLocalResult({
        status: "error",
        message: localError instanceof Error && localError.message ? localError.message : "本地定位失败。",
        source: value,
        positionType: null,
        items: [],
        pageToken,
        nextPageToken: "",
        hasNext: false,
      })
    }
  }, [tenantId])

  async function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const type = resolveSearchType(queryType, queryValue)
    const value = queryValue.trim()

    if (!type || !value) {
      toast({
        title: "无法识别 IOC",
        description: "请输入有效的 IP、域名、URL、MD5、SHA1 或 SHA256。",
        variant: "warning",
      })
      return
    }

    const normalizedValue = normalizeIocValue(type, value)
    setStatus("loading")
    setError("")
    setItem(null)
    setActiveTab("overview")

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
      const message = searchError instanceof Error && searchError.message ? searchError.message : "IOC 查询失败。"
      setStatus("error")
      setError(message)
      toast({
        title: "IOC 查询失败",
        description: message,
        variant: "destructive",
      })
    }
  }

  function copyValue(value: string) {
    void navigator.clipboard.writeText(value)
    toast({
      title: "已复制",
      description: value,
      variant: "success",
    })
  }

  const localHitCount = localResult.items.length
  const remoteHit = item ? isRemoteHit(item) : false
  const allowlisted = item ? isAllowlisted(item) : false

  return (
    <main className="bg-gray-50 text-slate-950">
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 p-6">
        <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 space-y-1.5">
                <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
                  情报检索
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="min-w-0 truncate text-slate-500">
                    查询威胁情报，同步定位事件数据
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:gap-3">
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <form
                  onSubmit={handleSearch}
                  className="flex h-12 w-full min-w-[320px] max-w-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 sm:w-[420px] xl:w-[520px]"
                >
                  <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <select
                    value={queryType}
                    onChange={(event) => setQueryType(event.target.value as IocVerificationType)}
                    className="ml-3 h-8 w-[92px] shrink-0 rounded-full border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="IOC 类型"
                    disabled={status === "loading"}
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={queryValue}
                    onChange={(event) => setQueryValue(event.target.value)}
                    placeholder="输入 IP、域名、URL 或 Hash 查询"
                    className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 font-mono text-sm shadow-none focus-visible:ring-0"
                    disabled={status === "loading"}
                  />
                  <Button
                    type="submit"
                    className="h-9 shrink-0 rounded-full bg-blue-600 px-4 text-white hover:bg-blue-700"
                    disabled={status === "loading" || !canSearch}
                  >
                    {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    查询
                  </Button>
                </form>

                <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400">更新时间</div>
                    <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                      {item?.verification?.checked_at || (status === "loading" ? "查询中" : "--")}
                    </div>
                  </div>
                </div>

                <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
                  disabled={status === "loading" || !queryValue.trim()}
                  onClick={() => void handleSearch()}
                  aria-label="刷新查询"
                >
                  <RefreshCw className={cn("h-4 w-4", status === "loading" && "animate-spin")} />
                  <span className="sr-only">刷新查询</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {status === "idle" ? <EmptySearchState /> : null}

        {status === "error" ? (
          <section className="mx-auto max-w-5xl rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">查询失败</h2>
                <p className="mt-1 text-sm leading-6">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        {item ? (
          <section className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className={cn("flex size-16 shrink-0 items-center justify-center rounded-lg border", verdictToneClass(item))}>
                    <VerdictIcon item={item} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="break-all font-mono text-xl font-semibold text-slate-950">{item.value}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => copyValue(item.value)}
                        aria-label="复制 IOC"
                      >
                        <Copy className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 font-mono text-[11px] uppercase", typeClass(item.type))}>
                        {item.type}
                      </Badge>
                      <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-xs font-medium", verdictToneClass(item))}>
                        {verdictLabel(item)}
                      </Badge>
                      {allowlisted ? (
                        <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          白名单命中
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
                  <MetricCard icon={Database} label="本地情报" value={item.verification?.local_status || (item.status === "hit" ? "命中" : "未命中")} tone={item.status === "hit" ? "red" : "slate"} />
                  <MetricCard icon={Cloud} label="远程情报" value={remoteHit ? "命中" : item.verification?.remote_status || "未命中"} tone={remoteHit ? "red" : "slate"} />
                  <MetricCard icon={ShieldCheck} label="风险分" value={riskText(item)} tone={item.status === "hit" ? "red" : "green"} />
                  <MetricCard icon={CheckCircle2} label="置信度" value={confidenceText(item)} tone="blue" />
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <TabsList className="h-10 rounded-md bg-slate-100 p-1">
                  <TabsTrigger value="overview" className="rounded px-4 data-[state=active]:bg-white">
                    概览
                  </TabsTrigger>
                  <TabsTrigger value="detail" className="rounded px-4 data-[state=active]:bg-white">
                    情报详情
                  </TabsTrigger>
                  <TabsTrigger value="local" className="rounded px-4 data-[state=active]:bg-white">
                    本地定位
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="rounded px-4 data-[state=active]:bg-white">
                    原始数据
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="m-0 p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h2 className="text-base font-semibold text-slate-950">查询结论</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      当前 IOC 判定为 <span className="font-semibold text-slate-950">{verdictLabel(item)}</span>。
                      {item.status === "hit"
                        ? "建议继续查看本地定位命中事件，确认受影响主机和进程上下文。"
                        : "未命中不代表绝对安全，可结合本地定位结果继续确认是否出现过相关行为。"}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">命中来源</div>
                        <div className="mt-1 truncate text-sm font-medium text-slate-900">
                          {item.verification?.hit_source_database || item.verification?.hit_source_table || "-"}
                        </div>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">检查时间</div>
                        <div className="mt-1 truncate font-mono text-sm font-medium text-slate-900">
                          {item.verification?.checked_at || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <h2 className="text-base font-semibold text-slate-950">本地定位摘要</h2>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Network className="size-6" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-slate-950">{localHitCount}</div>
                        <div className="text-xs text-slate-500">本地事件</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {localResult.status === "loading" ? "正在定位本地事件..." : localResult.message || "尚未执行本地定位。"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="detail" className="m-0">
                <IocVerificationDetailPanel
                  className="min-h-[420px] rounded-none border-0"
                  item={item}
                  loading={status === "loading"}
                  onCopy={copyValue}
                />
              </TabsContent>

              <TabsContent value="local" className="m-0 p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">本地数据定位</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        按最近 {DEFAULT_LOOKBACK_DAYS} 天窗口查询。当前定位值：
                        <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{localResult.source || currentValue}</code>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-md border-slate-200"
                      disabled={localResult.status === "loading"}
                      onClick={() => {
                        if (!item) return
                        void runLocalLocate(item.type, item.value)
                      }}
                    >
                      {localResult.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                      重新定位
                    </Button>
                  </div>

                  {localResult.status === "loading" ? (
                    <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                      <Loader2 className="size-4 animate-spin text-blue-600" aria-hidden="true" />
                      正在定位本地数据...
                    </div>
                  ) : null}

                  {localResult.status === "unsupported" || localResult.status === "error" ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      {localResult.message}
                    </div>
                  ) : null}

                  {localResult.status === "success" && !localResult.items.length ? (
                    <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                      最近 {DEFAULT_LOOKBACK_DAYS} 天没有发现本地事件。
                    </div>
                  ) : null}

                  {localResult.items.length ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <div className="grid grid-cols-[110px_minmax(0,1fr)_190px_140px] gap-3 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                        <span>事件类型</span>
                        <span>摘要</span>
                        <span>时间</span>
                        <span>操作</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {localResult.items.map((event, index) => {
                          const uniqueId = eventUniqueId(event)
                          return (
                            <div
                              key={`${event.event_type}-${event.event_name}-${uniqueId || index}`}
                              className="grid grid-cols-[110px_minmax(0,1fr)_190px_140px] gap-3 px-4 py-3 text-sm"
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium text-slate-900">{event.event_name || "-"}</div>
                                <div className="mt-1 font-mono text-xs text-slate-400">{event.event_type || "-"}</div>
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-slate-700">{eventSummary(event)}</div>
                                <div className="mt-1 truncate font-mono text-xs text-slate-400">{uniqueId || "no unique id"}</div>
                              </div>
                              <div className="truncate font-mono text-xs text-slate-500">{eventTime(event) || "-"}</div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-fit rounded-md border-slate-200"
                                disabled={!uniqueId}
                                onClick={() => {
                                  toast({
                                    title: "图谱定位待接入",
                                    description: uniqueId
                                      ? `后续使用 event_type=${event.event_type}, event_name=${event.event_name}, unique_id=${uniqueId} 调用 GraphLocateResult。`
                                      : "当前事件缺少 UniqueID。",
                                    variant: "info",
                                  })
                                }}
                              >
                                <ExternalLink className="size-3.5" />
                                图谱定位
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {localResult.hasNext ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-md border-slate-200"
                      disabled={localResult.status === "loading"}
                      onClick={() => {
                        if (!item || !localResult.nextPageToken) return
                        void runLocalLocate(item.type, item.value, localResult.nextPageToken)
                      }}
                    >
                      加载更多
                    </Button>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="raw" className="m-0 p-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-950">
                      <Hash className="size-4 text-slate-500" aria-hidden="true" />
                      Verification
                    </div>
                    <pre className="max-h-[420px] overflow-auto p-4 text-xs leading-5 text-slate-700">
                      {JSON.stringify(item.verification || {}, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-950">
                      <Clock3 className="size-4 text-slate-500" aria-hidden="true" />
                      Detail View
                    </div>
                    <pre className="max-h-[420px] overflow-auto p-4 text-xs leading-5 text-slate-700">
                      {JSON.stringify(item.verification_detail?.detail_view || item.verification_detail || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        ) : null}
      </div>
    </main>
  )
}
