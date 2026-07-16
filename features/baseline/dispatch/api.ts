"use client"

import {
  mergeScanScheduleDefaults,
  sanitizeScanSchedule,
  type ScanSchedule,
} from "@/shared/components/scan-schedule"
import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

interface ApiResult<T> {
  data: T
}

const PMC_OBJECT_TYPE_POLICY = 1
const PMC_OPERATION_APPLY = 1

interface CreateBaselineScanPolicyResponseData {
  object_id?: string
  name?: string
  version?: string | null
}

interface ListBaselineScanPoliciesResponseData {
  pagination?: {
    current_page?: number
    page_size?: number
    total_count?: number
    total_pages?: number
    has_previous?: boolean
    has_next?: boolean
  } | null
  items?: Array<{
    object_id?: string
    name?: string
    version?: string
    baseline_uuid?: string
    scan_schedule?: Partial<ScanSchedule> | null
    created_at?: string
    updated_at?: string
  }> | null
}

interface OperatePMCObjectResponseData {
  operation?: {
    operation_id?: string
    planning_status?: string
    status?: string
    outcome?: string
    total_count?: number
    materialized_count?: number
    pending_count?: number
    running_count?: number
    success_count?: number
    failed_count?: number
    uncertain_count?: number
    skipped_count?: number
    canceled_count?: number
  } | null
}

export interface CreateBaselineScanPolicyPayload {
  name: string
  version: string
  baselineUUID: string
  baselineFileName: string
  scanSchedule: ScanSchedule
}

export interface CreatedBaselineScanPolicy {
  id: string
  name: string
  version: string
}

export interface ApplyBaselineScanPolicyPayload {
  policyId: string
  version: string
  agentIds: string[]
}

export interface BaselineScanPolicyOperation {
  operationId: string
  planningStatus: string
  status: string
  outcome: string
  totalCount: number
  materializedCount: number
  pendingCount: number
  runningCount: number
  successCount: number
  failedCount: number
  uncertainCount: number
  skippedCount: number
  canceledCount: number
}

export interface ListBaselineScanPoliciesPayload {
  baselineUUID: string
  limit?: number
  offset?: number
}

export interface BaselineScanPolicyPagination {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface ReusableBaselineScanPolicy {
  id: string
  name: string
  version: string
  baselineUuid: string
  scanSchedule: ScanSchedule
  createdAt: string
  updatedAt: string
}

export interface BaselineScanPolicyListResult {
  pagination: BaselineScanPolicyPagination
  items: ReusableBaselineScanPolicy[]
}

function normalizeScanSchedule(scanSchedule: ScanSchedule): ScanSchedule {
  const normalized = sanitizeScanSchedule(scanSchedule)

  return {
    ...normalized,
    specific_time: normalized.specific_time?.trim() || undefined,
  }
}

export function getBaselineScanScheduleKey(scanSchedule: ScanSchedule) {
  const normalized = normalizeScanSchedule(scanSchedule)

  return JSON.stringify({
    mode: normalized.mode,
    interval_hours: normalized.interval_hours,
    specific_time: normalized.specific_time ?? "",
    random_delay_minutes: normalized.random_delay_minutes,
    retry_limit: normalized.retry_limit,
    retry_interval_minutes: normalized.retry_interval_minutes,
    scan_on_startup: normalized.scan_on_startup,
  })
}

export function isSameBaselineScanSchedule(left: ScanSchedule, right: ScanSchedule) {
  return getBaselineScanScheduleKey(left) === getBaselineScanScheduleKey(right)
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeReturnedScanSchedule(value?: Partial<ScanSchedule> | null): ScanSchedule {
  return mergeScanScheduleDefaults({
    mode: value?.mode === "interval" ? "interval" : "interval",
    interval_hours: numberValue(value?.interval_hours, 24),
    specific_time: stringValue(value?.specific_time) || undefined,
    random_delay_minutes: numberValue(value?.random_delay_minutes, 0),
    retry_limit: numberValue(value?.retry_limit, 0),
    retry_interval_minutes: numberValue(value?.retry_interval_minutes, 5),
    scan_on_startup: Boolean(value?.scan_on_startup),
  })
}

function normalizeAgentIds(agentIds: string[]) {
  return Array.from(
    new Set(
      agentIds
        .map((agentId) => agentId.trim())
        .filter(Boolean),
    ),
  )
}

function getReusablePolicyKey(policy: Pick<ReusableBaselineScanPolicy, "id" | "version">) {
  return `${policy.id}::${policy.version}`
}

export async function createBaselineScanPolicy({
  name,
  version,
  baselineUUID,
  baselineFileName,
  scanSchedule,
}: CreateBaselineScanPolicyPayload): Promise<CreatedBaselineScanPolicy> {
  const result = (await http.post("baselineScanPolicy", {
    request_id: createRequestId(),
    name,
    version,
    baseline_info: {
      uuid: baselineUUID,
      name: baselineFileName,
    },
    scan_schedule: normalizeScanSchedule(scanSchedule),
  })) as ApiResult<CreateBaselineScanPolicyResponseData | null>

  if (!result.data?.object_id) {
    throw new Error("missing baseline scan policy id in response")
  }

  return {
    id: result.data.object_id,
    name: result.data.name?.trim() || name,
    version: result.data.version?.trim() || version,
  }
}

export async function listBaselineScanPolicies({
  baselineUUID,
  limit = 100,
  offset = 0,
}: ListBaselineScanPoliciesPayload): Promise<BaselineScanPolicyListResult> {
  const trimmedBaselineUUID = baselineUUID.trim()
  const result = (await http.post("listBaselineScanPolicies", {
    request_id: createRequestId(),
    baseline_uuid: trimmedBaselineUUID,
    limit,
    offset,
  })) as ApiResult<ListBaselineScanPoliciesResponseData | null>

  const items = Array.isArray(result.data?.items) ? result.data.items : []
  const pagination = result.data?.pagination

  const normalizedItems = items
    .map((item) => {
      const id = stringValue(item?.object_id)
      const version = stringValue(item?.version)

      if (!id || !version) {
        return null
      }

      return {
        id,
        name: stringValue(item?.name) || id,
        version,
        baselineUuid: stringValue(item?.baseline_uuid) || trimmedBaselineUUID,
        scanSchedule: normalizeReturnedScanSchedule(item?.scan_schedule),
        createdAt: stringValue(item?.created_at),
        updatedAt: stringValue(item?.updated_at),
      } satisfies ReusableBaselineScanPolicy
    })
    .filter((item): item is ReusableBaselineScanPolicy => Boolean(item))

  const deduplicatedItems = Array.from(
    new Map(normalizedItems.map((item) => [getReusablePolicyKey(item), item])).values(),
  )

  return {
    pagination: {
      currentPage: numberValue(pagination?.current_page, 1),
      pageSize: numberValue(pagination?.page_size, limit),
      totalCount: numberValue(pagination?.total_count, items.length),
      totalPages: numberValue(pagination?.total_pages, items.length > 0 ? 1 : 0),
      hasPrevious: Boolean(pagination?.has_previous),
      hasNext: Boolean(pagination?.has_next),
    },
    items: deduplicatedItems,
  }
}

export async function applyBaselineScanPolicy({
  policyId,
  version,
  agentIds,
}: ApplyBaselineScanPolicyPayload): Promise<BaselineScanPolicyOperation> {
  const normalizedAgentIds = normalizeAgentIds(agentIds)

  if (!policyId.trim()) {
    throw new Error("baseline scan policy id is required")
  }

  if (!version.trim()) {
    throw new Error("baseline scan policy version is required")
  }

  if (normalizedAgentIds.length === 0) {
    throw new Error("at least one target agent is required")
  }

  const result = (await http.post("operatePMCObject", {
    request_id: createRequestId(),
    object_type: PMC_OBJECT_TYPE_POLICY,
    object_id: policyId.trim(),
    object_version: version.trim(),
    operation: PMC_OPERATION_APPLY,
    agent_ids: normalizedAgentIds,
  })) as ApiResult<OperatePMCObjectResponseData | null>

  const operation = result.data?.operation
  const operationId = stringValue(operation?.operation_id)
  if (!operationId) {
    throw new Error("missing PMC operation id in response")
  }

  return {
    operationId,
    planningStatus: stringValue(operation?.planning_status),
    status: stringValue(operation?.status),
    outcome: stringValue(operation?.outcome),
    totalCount: numberValue(operation?.total_count),
    materializedCount: numberValue(operation?.materialized_count),
    pendingCount: numberValue(operation?.pending_count),
    runningCount: numberValue(operation?.running_count),
    successCount: numberValue(operation?.success_count),
    failedCount: numberValue(operation?.failed_count),
    uncertainCount: numberValue(operation?.uncertain_count),
    skippedCount: numberValue(operation?.skipped_count),
    canceledCount: numberValue(operation?.canceled_count),
  }
}
