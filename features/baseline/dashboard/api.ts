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
