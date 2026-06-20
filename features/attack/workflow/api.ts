"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type {
  AttackWorkflowActionForensic,
  AttackWorkflowActionInvestigation,
  AttackWorkflowActionItem,
  AttackWorkflowActionRemediation,
  AttackWorkflowDetail,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowPagination,
  GetAttackWorkflowParams,
  ListAttackWorkflowsData,
  ListAttackWorkflowsParams,
  UpdateAttackWorkflowStatusParams,
} from "./types"

interface ApiResult<T> {
  data: T
  raw?: unknown
}

type BackendObject = Record<string, unknown>

interface BackendGetAttackWorkflowData {
  workflow?: BackendObject | null
  actions?: BackendObject[] | null
  events?: BackendObject[] | null
}

interface BackendUpdateAttackWorkflowStatusData {
  workflow?: BackendObject | null
}

interface BackendListAttackWorkflowsData {
  items?: BackendObject[] | null
  pagination?: BackendObject | null
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean)
    : []
}

function boolValue(value: unknown) {
  return value === true
}

function hasAnyStringValue(value: BackendObject) {
  return Object.values(value).some((item) => stringValue(item))
}

function normalizeWorkflowItem(raw: BackendObject = {}): AttackWorkflowItem {
  return {
    workflow_id: stringValue(raw.workflow_id),
    tenant_id: stringValue(raw.tenant_id),
    root_type: stringValue(raw.root_type),
    root_id: stringValue(raw.root_id),
    case_id: stringValue(raw.case_id),
    status: stringValue(raw.status),
    severity: stringValue(raw.severity),
    title: stringValue(raw.title),
    primary_agent_id: stringValue(raw.primary_agent_id),
    agent_ids: stringArray(raw.agent_ids),
    rule_ids: stringArray(raw.rule_ids),
    detected_at: stringValue(raw.detected_at),
    investigation_started_at: stringValue(raw.investigation_started_at),
    confirmed_at: stringValue(raw.confirmed_at),
    forensic_started_at: stringValue(raw.forensic_started_at),
    response_started_at: stringValue(raw.response_started_at),
    contained_at: stringValue(raw.contained_at),
    remediated_at: stringValue(raw.remediated_at),
    closed_at: stringValue(raw.closed_at),
    close_reason: stringValue(raw.close_reason),
    created_by: stringValue(raw.created_by),
    created_at: stringValue(raw.created_at),
    updated_at: stringValue(raw.updated_at),
    instance_ids: stringArray(raw.instance_ids),
    group_ids: stringArray(raw.group_ids),
  }
}

function normalizePagination(raw: BackendObject = {}): AttackWorkflowPagination {
  return {
    current_page: numberValue(raw.current_page),
    page_size: numberValue(raw.page_size),
    total_count: numberValue(raw.total_count),
    total_pages: numberValue(raw.total_pages),
    has_previous: boolValue(raw.has_previous),
    has_next: boolValue(raw.has_next),
  }
}

function normalizeInvestigation(
  raw: unknown,
): AttackWorkflowActionInvestigation | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const item = raw as BackendObject
  if (!hasAnyStringValue(item)) return null

  return {
    investigation_job_id: stringValue(item.investigation_job_id),
    investigation_trace_id: stringValue(item.investigation_trace_id),
    payload_json: stringValue(item.payload_json),
    created_at: stringValue(item.created_at),
    updated_at: stringValue(item.updated_at),
  }
}

function normalizeForensic(raw: unknown): AttackWorkflowActionForensic | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const item = raw as BackendObject
  if (!hasAnyStringValue(item)) return null

  return {
    forensic_plan_id: stringValue(item.forensic_plan_id),
    forensic_execution_id: stringValue(item.forensic_execution_id),
    forensic_task_id: stringValue(item.forensic_task_id),
    forensic_trace_id: stringValue(item.forensic_trace_id),
    artifact_uri: stringValue(item.artifact_uri),
    artifact_hash: stringValue(item.artifact_hash),
    artifact_meta_json: stringValue(item.artifact_meta_json),
    payload_json: stringValue(item.payload_json),
    created_at: stringValue(item.created_at),
    updated_at: stringValue(item.updated_at),
  }
}

function normalizeRemediation(raw: unknown): AttackWorkflowActionRemediation | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const item = raw as BackendObject
  if (!hasAnyStringValue(item)) return null

  return {
    preview_id: stringValue(item.preview_id),
    execution_id: stringValue(item.execution_id),
    execute_task_id: stringValue(item.execute_task_id),
    pmc_trace_id: stringValue(item.pmc_trace_id),
    control_ref_json: stringValue(item.control_ref_json),
    payload_json: stringValue(item.payload_json),
    created_at: stringValue(item.created_at),
    updated_at: stringValue(item.updated_at),
  }
}

function normalizeWorkflowAction(raw: BackendObject = {}): AttackWorkflowActionItem {
  return {
    workflow_action_id: stringValue(raw.workflow_action_id),
    tenant_id: stringValue(raw.tenant_id),
    workflow_id: stringValue(raw.workflow_id),
    action_batch_id: stringValue(raw.action_batch_id),
    action_phase: stringValue(raw.action_phase),
    target_type: stringValue(raw.target_type),
    target_key: stringValue(raw.target_key),
    instance_id: stringValue(raw.instance_id),
    group_id: stringValue(raw.group_id),
    case_id: stringValue(raw.case_id),
    agent_id: stringValue(raw.agent_id),
    action_type: stringValue(raw.action_type),
    action_status: stringValue(raw.action_status),
    error_code: stringValue(raw.error_code),
    error_msg: stringValue(raw.error_msg),
    requested_at: stringValue(raw.requested_at),
    executed_at: stringValue(raw.executed_at),
    created_by: stringValue(raw.created_by),
    created_at: stringValue(raw.created_at),
    updated_at: stringValue(raw.updated_at),
    investigation: normalizeInvestigation(raw.investigation),
    forensic: normalizeForensic(raw.forensic),
    remediation: normalizeRemediation(raw.remediation),
  }
}

function normalizeWorkflowEvent(raw: BackendObject = {}): AttackWorkflowEventItem {
  return {
    event_id: numberValue(raw.event_id),
    tenant_id: stringValue(raw.tenant_id),
    event_key: stringValue(raw.event_key),
    workflow_id: stringValue(raw.workflow_id),
    workflow_action_id: stringValue(raw.workflow_action_id),
    event_type: stringValue(raw.event_type),
    old_status: stringValue(raw.old_status),
    new_status: stringValue(raw.new_status),
    operator_type: stringValue(raw.operator_type),
    operator_id: stringValue(raw.operator_id),
    occurred_at: stringValue(raw.occurred_at),
    payload_json: stringValue(raw.payload_json),
    created_at: stringValue(raw.created_at),
    operator_name: stringValue(raw.operator_name),
  }
}

function isAttackWorkflowNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const value = error as {
    status?: unknown
    code?: unknown
    message?: unknown
  }
  const status = Number(value.status)
  const code = Number(value.code)
  const message = stringValue(value.message).toLowerCase()

  return status === 404 || code === 404 || message.includes("not found")
}

export async function getAttackWorkflow({
  tenantId,
  workflowId,
  rootType,
  rootId,
  includeActions = true,
  includeEvents = true,
}: GetAttackWorkflowParams): Promise<AttackWorkflowDetail | null> {
  const normalizedWorkflowId = stringValue(workflowId)
  const normalizedRootType = stringValue(rootType)
  const normalizedRootId = stringValue(rootId)

  if (!normalizedWorkflowId && (!normalizedRootType || !normalizedRootId)) {
    return null
  }

  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    include_actions: includeActions,
    include_events: includeEvents,
  }

  if (tenantId) payload.tenant_id = tenantId
  if (normalizedWorkflowId) {
    payload.workflow_id = normalizedWorkflowId
  } else {
    payload.root_type = normalizedRootType
    payload.root_id = normalizedRootId
  }

  let result: ApiResult<BackendGetAttackWorkflowData | null>
  try {
    result = (await http.post(
      "/sensor/analysis/attack-workflow/get",
      payload,
    )) as ApiResult<BackendGetAttackWorkflowData | null>
  } catch (error) {
    if (isAttackWorkflowNotFoundError(error)) return null
    throw error
  }

  if (!result.data?.workflow) return null

  return {
    workflow: normalizeWorkflowItem(result.data.workflow),
    actions: Array.isArray(result.data.actions)
      ? result.data.actions.map(normalizeWorkflowAction)
      : [],
    events: Array.isArray(result.data.events)
      ? result.data.events.map(normalizeWorkflowEvent)
      : [],
  }
}

export async function getAttackWorkflowByCaseId({
  caseId,
  tenantId,
  includeActions = true,
  includeEvents = true,
}: {
  caseId: string
  tenantId?: string
  includeActions?: boolean
  includeEvents?: boolean
}) {
  return getAttackWorkflow({
    tenantId,
    rootType: "case",
    rootId: caseId,
    includeActions,
    includeEvents,
  })
}

export async function listAttackWorkflows({
  tenantId,
  page = 1,
  pageSize = 50,
  timezone,
  startTime,
  endTime,
  statusScope,
  status,
  severity,
  caseId,
}: ListAttackWorkflowsParams = {}): Promise<ListAttackWorkflowsData> {
  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    page,
    page_size: pageSize,
  }

  const normalizedTenantId = stringValue(tenantId)
  const normalizedTimezone = stringValue(timezone)
  const normalizedStartTime = stringValue(startTime)
  const normalizedEndTime = stringValue(endTime)
  const normalizedStatusScope = stringValue(statusScope)
  const normalizedStatus = stringValue(status)
  const normalizedSeverity = stringValue(severity)
  const normalizedCaseId = stringValue(caseId)

  if (normalizedTenantId) payload.tenant_id = normalizedTenantId
  if (normalizedTimezone) payload.timezone = normalizedTimezone
  if (normalizedStartTime) payload.start_time = normalizedStartTime
  if (normalizedEndTime) payload.end_time = normalizedEndTime
  if (normalizedStatusScope) payload.status_scope = normalizedStatusScope
  if (normalizedStatus) payload.status = normalizedStatus
  if (normalizedSeverity) payload.severity = normalizedSeverity
  if (normalizedCaseId) payload.case_id = normalizedCaseId

  const result = (await http.post(
    "/sensor/analysis/attack-workflow/list",
    payload,
  )) as ApiResult<BackendListAttackWorkflowsData | null>

  return {
    items: Array.isArray(result.data?.items)
      ? result.data.items.map(normalizeWorkflowItem)
      : [],
    pagination: normalizePagination(result.data?.pagination ?? {}),
  }
}

export async function updateAttackWorkflowStatus({
  tenantId,
  workflowId,
  status,
  closeReason,
  occurredAt,
  payloadJson,
}: UpdateAttackWorkflowStatusParams): Promise<AttackWorkflowItem | null> {
  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    workflow_id: workflowId.trim(),
    status,
  }

  if (tenantId) payload.tenant_id = tenantId
  if (closeReason?.trim()) payload.close_reason = closeReason.trim()
  if (occurredAt?.trim()) payload.occurred_at = occurredAt.trim()
  if (payloadJson?.trim()) payload.payload_json = payloadJson.trim()

  const result = (await http.post(
    "/sensor/analysis/attack-workflow/status/update",
    payload,
  )) as ApiResult<BackendUpdateAttackWorkflowStatusData | null>

  return result.data?.workflow ? normalizeWorkflowItem(result.data.workflow) : null
}
