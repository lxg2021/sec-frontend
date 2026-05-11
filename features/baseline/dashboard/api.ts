import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

export interface BaselineOption {
  baseline_uuid: string
  display_name: string
  original_filename: string
  standard: string
  product: string
  os_version: string
  baseline_version: string
  profile: string
  item_count: number
  low_count: number
  medium_count: number
  high_count: number
  baseline_type: string
  latest_check_time: string
  host_count: number
}

export interface BaselineDailyStatsData {
  stat_date: string
  baseline_uuid: string
  tenant_id: string
  item_stats: {
    total_items: number
    low_items: number
    medium_items: number
    high_items: number
    passed_total_items: number
    failed_items: number
    error_items: number
    passed_low_items: number
    passed_medium_items: number
    passed_high_items: number
  }
  pass_rate_stats: {
    total_pass_rate: number
    low_pass_rate: number
    medium_pass_rate: number
    high_pass_rate: number
  }
  host_stats: {
    host_count: number
    compliant_host_count: number
    non_compliant_host_count: number
    avg_host_compliance_rate: number
    min_host_compliance_rate: number
    max_host_compliance_rate: number
  }
  check_count_stats: {
    total_checks: number
    total_passed_checks: number
    total_failed_checks: number
    total_error_checks: number
  }
}

export interface TrendDataPoint {
  date: string
  pass_rate: number
  avg_host_compliance_rate: number
}

export interface CategoryStatsData {
  categories: CategoryGroup[]
}

export interface CategoryGroup {
  tenant_id: string
  baseline_uuid: string
  category: string
  category_zh: string
  item_count: number
  items: BaselineItemSimple[]
}

export interface BaselineItemSimple {
  item_id: string
  name: string
  name_zh: string
  severity: string
  passed_rate: number
}

export interface BaselineItemResultStatistics {
  total_hosts: number
  passed_hosts: number
  failed_hosts: number
  error_hosts: number
  pass_rate: number
}

export interface BaselineHostPagination {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous: boolean
  has_next: boolean
}

export interface BaselineHostListItem {
  id: string
  user: string
  email: string
  phone: string
  department: string
  os: string
  lastOnline: string
  checkResult: string
  status: "passed" | "failed" | "error"
  testResult: string
  errorReason: string
  hostname: string
  ip: string
  hostStatus: string
}

export interface BaselineItemHostResults {
  hosts: BaselineHostListItem[]
  pagination: BaselineHostPagination
}

export interface BaselineTemplateItem {
  template_uuid: string
  id: string
  category: string
  name: string
  method: string
  method_argument: string
  registry_path: string
  registry_item: string
  registry_path_intune: string
  registry_path_dcp: string
  registry_item_intune: string
  class_name: string
  namespace: string
  property: string
  default_value: string
  default_value_intune: string
  recommended_value: string
  recommended_value_intune: string
  operator: string
  operator_intune: string
  severity: string
  filter: string
  description: string
  description_en?: string
  references: string
  name_zh: string
  category_zh: string
}

interface BackendHostOwner {
  username?: string
  email?: string
  phone?: string
}

interface BackendLogicGroup {
  name?: string
  full_path?: string
  department_name?: string | null
}

interface BackendHostDetail {
  agent_id?: string
  hostname?: string
  ip?: string[]
  os_type?: string
  os_name?: string
  os_version?: string
  status?: string
  heartbeat_time?: number | string
  group?: BackendLogicGroup | null
  owners?: BackendHostOwner[]
}

interface BackendBaselineCheckResult {
  result?: string
  test_result?: string
  error_reason?: string
}

interface BackendBaselineItemHostResult {
  host_detail?: BackendHostDetail | null
  check_result?: BackendBaselineCheckResult | null
}

interface BackendBaselineItemHostResultsData {
  host_results?: BackendBaselineItemHostResult[]
  pagination?: Partial<BaselineHostPagination>
}

interface ApiResult<T> {
  data: T
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringValue(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function toDisplayDateTime(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "-"

  const numericValue = Number(value)
  const timestamp = Number.isFinite(numericValue)
    ? numericValue < 1_000_000_000_000
      ? numericValue * 1000
      : numericValue
    : Date.parse(String(value))

  if (!Number.isFinite(timestamp)) return "-"

  const date = new Date(timestamp)
  const pad = (part: number) => String(part).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`
}

function normalizeCheckStatus(value: unknown): BaselineHostListItem["status"] {
  const status = typeof value === "string" ? value.toLowerCase() : ""

  if (status === "passed" || status === "failed" || status === "error") return status

  return "error"
}

function normalizePagination(
  pagination: Partial<BaselineHostPagination> | undefined,
  limit: number,
  offset: number,
  hostCount: number,
): BaselineHostPagination {
  const pageSize = Number(pagination?.page_size ?? limit) || limit
  const currentPage = Number(pagination?.current_page ?? Math.floor(offset / pageSize) + 1) || 1
  const totalCount = Number(pagination?.total_count ?? hostCount) || 0
  const totalPages = Number(pagination?.total_pages ?? Math.ceil(totalCount / pageSize)) || 0

  return {
    current_page: currentPage,
    page_size: pageSize,
    total_count: totalCount,
    total_pages: totalPages,
    has_previous: Boolean(pagination?.has_previous ?? currentPage > 1),
    has_next: Boolean(pagination?.has_next ?? currentPage < totalPages),
  }
}

function adaptBaselineHostResult(item: BackendBaselineItemHostResult): BaselineHostListItem {
  const host = item.host_detail || {}
  const check = item.check_result || {}
  const owners = Array.isArray(host.owners) ? host.owners : []
  const ownerNames = owners.map((owner) => stringValue(owner.username, "")).filter(Boolean)
  const ownerEmails = owners.map((owner) => stringValue(owner.email, "")).filter(Boolean)
  const ownerPhones = owners.map((owner) => stringValue(owner.phone, "")).filter(Boolean)
  const groupPath = stringValue(host.group?.full_path, "")
  const groupParts = groupPath.split("/").filter(Boolean)
  const os = [host.os_name, host.os_version].map((part) => stringValue(part, "")).filter(Boolean).join(" ")

  const status = normalizeCheckStatus(check.result)

  return {
    id: stringValue(host.agent_id, ""),
    user: ownerNames.length ? ownerNames.join(", ") : "-",
    email: ownerEmails.length ? ownerEmails.join(", ") : "-",
    phone: ownerPhones.length ? ownerPhones.join(", ") : "-",
    department: stringValue(host.group?.department_name, "") || stringValue(host.group?.name, "") || groupParts.at(-1) || "-",
    os: os || stringValue(host.os_type),
    lastOnline: toDisplayDateTime(host.heartbeat_time),
    checkResult: status,
    status,
    testResult: stringValue(check.test_result),
    errorReason: stringValue(check.error_reason, ""),
    hostname: stringValue(host.hostname),
    ip: Array.isArray(host.ip) && host.ip.length ? host.ip.join(", ") : "-",
    hostStatus: stringValue(host.status),
  }
}

function normalizeBaselineItemStatistics(value: unknown): BaselineItemResultStatistics | null {
  const data = asRecord(value)
  if (!Object.keys(data).length) return null

  return {
    total_hosts: numberValue(data.total_hosts ?? data.totalHosts),
    passed_hosts: numberValue(data.passed_hosts ?? data.passedHosts),
    failed_hosts: numberValue(data.failed_hosts ?? data.failedHosts),
    error_hosts: numberValue(data.error_hosts ?? data.errorHosts),
    pass_rate: numberValue(data.pass_rate ?? data.passRate),
  }
}

export async function fetchBaselineOptions(): Promise<BaselineOption[]> {
  const result = (await http.post("getBaselineOptions", {
    request_id: createRequestId(),
  })) as ApiResult<unknown>

  return normalizeArray<BaselineOption>(result.data)
}

export async function fetchBaselineDailyStats(baselineUUID: string, statDate: string): Promise<BaselineDailyStatsData | null> {
  const result = (await http.post("getBaselineDailyStats", {
    request_id: createRequestId(),
    baseline_uuid: baselineUUID,
    stat_date: statDate,
    timezone: "Asia/Shanghai",
  })) as ApiResult<BaselineDailyStatsData | null>

  return result.data ?? null
}

export async function fetchBaselineTrend(
  baselineUUID: string,
  startDate: string,
  endDate: string,
): Promise<TrendDataPoint[]> {
  const result = (await http.post("getBaselineTrend", {
    request_id: createRequestId(),
    baseline_uuid: baselineUUID,
    start_date: startDate,
    end_date: endDate,
    timezone: "Asia/Shanghai",
  })) as ApiResult<{ trends?: TrendDataPoint[] } | null>

  return normalizeArray<TrendDataPoint>(result.data?.trends)
}

export async function fetchBaselineCategoryStats(baselineUUID: string): Promise<CategoryGroup[]> {
  const result = (await http.post("getBaselineCategoryStats", {
    request_id: createRequestId(),
    baseline_uuid: baselineUUID,
  })) as ApiResult<CategoryStatsData | null>

  return normalizeArray<CategoryGroup>(result.data?.categories)
}

export async function fetchBaselineItemStatistics(
  baselineUUID: string,
  itemID: string,
): Promise<BaselineItemResultStatistics | null> {
  const result = (await http.post("getBaselineItemStatistics", {
    request_id: createRequestId(),
    baseline_uuid: baselineUUID,
    item_id: itemID,
  })) as ApiResult<unknown>

  return normalizeBaselineItemStatistics(result.data)
}

export async function fetchBaselineItemHostResults(
  baselineUUID: string,
  itemID: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<BaselineItemHostResults> {
  const result = (await http.post("getBaselineItemHostResults", {
    request_id: createRequestId(),
    baseline_uuid: baselineUUID,
    item_id: itemID,
    limit,
    offset,
  })) as ApiResult<BackendBaselineItemHostResultsData | null>

  const data = result.data || {}
  const hosts = normalizeArray<BackendBaselineItemHostResult>(data.host_results).map(adaptBaselineHostResult)

  return {
    hosts,
    pagination: normalizePagination(data.pagination, limit, offset, hosts.length),
  }
}

export async function fetchBaselineDetail(baselineUUID: string, itemID: string): Promise<BaselineTemplateItem | null> {
  const result = (await http.post("getBaselineDetail", {
    request_id: createRequestId(),
    baseline_uuid: baselineUUID,
    item_id: itemID,
  })) as ApiResult<BaselineTemplateItem | null>

  return result.data ?? null
}
