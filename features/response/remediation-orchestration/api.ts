"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type {
  CancelRemediationPreviewRequest,
  ConfirmRemediationPreviewRequest,
  CreateRemediationPreviewRequest,
  GetRemediationExecutionResultRequest,
  GetRemediationPreviewDetailRequest,
  ListRemediationPreviewsRequest,
  QueryRemediationNodeActionsRequest,
  QueryRemediationPreviewRequest,
  QueryRemediationWorkflowStatsRequest,
  RemediationActionContext,
  RemediationActionOption,
  RemediationExecutionSnapshot,
  RemediationExecutionStats,
  RemediationExecutionTarget,
  RemediationExecutionTargetSummary,
  RemediationNodeAction,
  RemediationNodeActionsResult,
  RemediationPageInfo,
  RemediationPreviewList,
  RemediationPreviewListItem,
  RemediationPreviewSnapshot,
  RemediationPreviewStats,
  RemediationPreviewTargetSnapshot,
  RemediationPreviewTargetSummary,
  RemediationWorkflowDetail,
  RemediationWorkflowStats,
  RemediationWorkflowStatsGroup,
  RemediationWorkflowStatsItem,
  ResolveRemediationNodeAgentsRequest,
  ResolveRemediationNodeAgentsResponse,
} from "./types"

interface ApiResult<T> {
  data: T
}

type BackendObject = Record<string, unknown>

function objectValue(value: unknown): BackendObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as BackendObject)
    : {}
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim()
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function boolValue(value: unknown) {
  return value === true
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean)
    : []
}

function objectArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => objectValue(item))
        .filter((item) => Object.keys(item).length > 0)
    : []
}

function enumValue(value: unknown) {
  return typeof value === "number" ? value : stringValue(value)
}

function compactPayload<T extends Record<string, unknown>>(payload: T): T {
  const next: Record<string, unknown> = {}
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === "string" && value.trim() === "") return
    if (Array.isArray(value) && value.length === 0) return
    next[key] = value
  })
  return next as T
}

function withRequestId<T extends Record<string, unknown>>(payload: T) {
  return compactPayload({
    request_id: createRequestId(),
    ...payload,
  })
}

async function postData<T>(path: string, payload: Record<string, unknown>) {
  const result = (await http.post(path, compactPayload(payload))) as ApiResult<T | null>
  return result.data
}

function normalizeActionContext(raw: unknown): RemediationActionContext {
  const item = objectValue(raw)
  return {
    context_type: enumValue(item.context_type),
    agent_id: stringValue(item.agent_id),
    source_task_id: stringValue(item.source_task_id),
    source_action_code: stringValue(item.source_action_code),
    target_key: stringValue(item.target_key),
    backup_id: stringValue(item.backup_id),
    policy_id: stringValue(item.policy_id),
  }
}

function normalizeActionOption(raw: unknown): RemediationActionOption {
  const item = objectValue(raw)
  return {
    action_code: stringValue(item.action_code),
    display_name: stringValue(item.display_name),
    action_type: stringValue(item.action_type),
    requires_agent: boolValue(item.requires_agent),
    requires_history: boolValue(item.requires_history),
    required_snapshot_kind: enumValue(item.required_snapshot_kind),
    contexts: objectArray(item.contexts).map(normalizeActionContext),
  }
}

function normalizeNodeAction(raw: unknown): RemediationNodeAction {
  const item = objectValue(raw)
  return {
    node_key: stringValue(item.node_key),
    entity_type: stringValue(item.entity_type),
    status: stringValue(item.status),
    blocked_reason: stringValue(item.blocked_reason),
    agent_ids: stringArray(item.agent_ids),
    actions: objectArray(item.actions).map(normalizeActionOption),
  }
}

function normalizeNodeActionsResult(raw: unknown): RemediationNodeActionsResult {
  const item = objectValue(raw)
  return {
    tenant_id: stringValue(item.tenant_id),
    source_type: stringValue(item.source_type),
    scope_type: stringValue(item.scope_type),
    scope_id: stringValue(item.scope_id),
    node: normalizeNodeAction(item.node),
  }
}

function normalizePreviewStats(raw: unknown): RemediationPreviewStats {
  const item = objectValue(raw)
  return {
    total_count: numberValue(item.total_count),
    created_count: numberValue(item.created_count),
    confirmed_count: numberValue(item.confirmed_count),
    canceled_count: numberValue(item.canceled_count),
    expired_count: numberValue(item.expired_count),
  }
}

function normalizeExecutionStats(raw: unknown): RemediationExecutionStats {
  const item = objectValue(raw)
  return {
    total_count: numberValue(item.total_count),
    created_count: numberValue(item.created_count),
    dispatched_count: numberValue(item.dispatched_count),
    running_count: numberValue(item.running_count),
    success_count: numberValue(item.success_count),
    failed_count: numberValue(item.failed_count),
    skipped_count: numberValue(item.skipped_count),
  }
}

function normalizePreviewTargetSummary(raw: unknown): RemediationPreviewTargetSummary {
  const item = objectValue(raw)
  return {
    total_count: numberValue(item.total_count),
    will_apply_count: numberValue(item.will_apply_count),
    skipped_count: numberValue(item.skipped_count),
  }
}

function normalizeExecutionTargetSummary(raw: unknown): RemediationExecutionTargetSummary {
  const item = objectValue(raw)
  return {
    total_count: numberValue(item.total_count),
    created_count: numberValue(item.created_count),
    dispatched_count: numberValue(item.dispatched_count),
    running_count: numberValue(item.running_count),
    success_count: numberValue(item.success_count),
    failed_count: numberValue(item.failed_count),
    skipped_count: numberValue(item.skipped_count),
  }
}

function normalizeStatsGroup(raw: unknown): RemediationWorkflowStatsGroup {
  const item = objectValue(raw)
  return {
    preview_stats: normalizePreviewStats(item.preview_stats),
    execution_stats: normalizeExecutionStats(item.execution_stats),
  }
}

function normalizeStatsItem(raw: unknown): RemediationWorkflowStatsItem {
  const item = objectValue(raw)
  return {
    tenant_id: stringValue(item.tenant_id),
    preview_id: stringValue(item.preview_id),
    execution_id: stringValue(item.execution_id),
    workflow_id: stringValue(item.workflow_id),
    source_request_id: stringValue(item.source_request_id),
    preview_status: stringValue(item.preview_status),
    execute_status: stringValue(item.execute_status),
    source_type: stringValue(item.source_type),
    scope_type: stringValue(item.scope_type),
    scope_id: stringValue(item.scope_id),
    created_at: stringValue(item.created_at),
    confirmed_at: stringValue(item.confirmed_at),
    workflow_action_id: stringValue(item.workflow_action_id),
    case_id: stringValue(item.case_id),
    stats: normalizeStatsGroup(item.stats),
  }
}

function normalizePageInfo(raw: unknown): RemediationPageInfo {
  const item = objectValue(raw)
  return {
    page: numberValue(item.page) || 1,
    page_size: numberValue(item.page_size) || 20,
    total: numberValue(item.total),
    has_next: boolValue(item.has_next),
  }
}

function normalizePreviewListItem(raw: unknown): RemediationPreviewListItem {
  const item = objectValue(raw)
  return {
    tenant_id: stringValue(item.tenant_id),
    preview_id: stringValue(item.preview_id),
    execution_id: stringValue(item.execution_id),
    workflow_id: stringValue(item.workflow_id),
    workflow_action_id: stringValue(item.workflow_action_id),
    case_id: stringValue(item.case_id),
    source_request_id: stringValue(item.source_request_id),
    preview_status: stringValue(item.preview_status),
    execute_status: stringValue(item.execute_status),
    source_type: stringValue(item.source_type),
    scope_type: stringValue(item.scope_type),
    scope_id: stringValue(item.scope_id),
    target_type: enumValue(item.target_type),
    action_type: stringValue(item.action_type),
    plan_status: enumValue(item.plan_status),
    created_at: stringValue(item.created_at),
    confirmed_at: stringValue(item.confirmed_at),
    expires_at: stringValue(item.expires_at),
    preview_target_summary: normalizePreviewTargetSummary(item.preview_target_summary),
    target_summary: normalizeExecutionTargetSummary(item.target_summary),
  }
}

function normalizePreviewList(raw: unknown): RemediationPreviewList {
  const item = objectValue(raw)
  return {
    tenant_id: stringValue(item.tenant_id),
    start_time: stringValue(item.start_time),
    end_time: stringValue(item.end_time),
    timezone: stringValue(item.timezone),
    preview_summary: normalizePreviewStats(item.preview_summary),
    target_summary: normalizeExecutionTargetSummary(item.target_summary),
    items: objectArray(item.items).map(normalizePreviewListItem),
    page: normalizePageInfo(item.page),
  }
}

function normalizeWorkflowStats(raw: unknown): RemediationWorkflowStats {
  const item = objectValue(raw)
  return {
    tenant_id: stringValue(item.tenant_id),
    start_time: stringValue(item.start_time),
    end_time: stringValue(item.end_time),
    timezone: stringValue(item.timezone),
    summary: normalizeStatsGroup(item.summary),
    items: objectArray(item.items).map(normalizeStatsItem),
  }
}

function normalizePreviewTargetSnapshot(raw: unknown): RemediationPreviewTargetSnapshot {
  const item = objectValue(raw)
  return {
    target_index: numberValue(item.target_index),
    agent_id: stringValue(item.agent_id),
    node_keys: stringArray(item.node_keys),
    rule_id: stringValue(item.rule_id),
    target_key: stringValue(item.target_key),
    target_identifier: stringValue(item.target_identifier),
    target_display: stringValue(item.target_display),
    dedupe_status: enumValue(item.dedupe_status),
    dedupe_reason: stringValue(item.dedupe_reason),
    will_apply: boolValue(item.will_apply),
    existing_task_id: stringValue(item.existing_task_id),
    validation_status: enumValue(item.validation_status),
    validation_reason: stringValue(item.validation_reason),
    backup_id: stringValue(item.backup_id),
  }
}

function normalizePreviewSnapshot(raw: unknown): RemediationPreviewSnapshot | null {
  const item = objectValue(raw)
  if (Object.keys(item).length === 0) return null
  return {
    tenant_id: stringValue(item.tenant_id),
    preview_id: stringValue(item.preview_id),
    source_request_id: stringValue(item.source_request_id),
    preview_status: stringValue(item.preview_status),
    workflow_id: stringValue(item.workflow_id),
    source_type: stringValue(item.source_type),
    scope_type: stringValue(item.scope_type),
    scope_id: stringValue(item.scope_id),
    target_type: enumValue(item.target_type),
    action_type: stringValue(item.action_type),
    plan_status: enumValue(item.plan_status),
    created_by: stringValue(item.created_by),
    created_at: stringValue(item.created_at),
    expires_at: stringValue(item.expires_at),
    plan: objectValue(item.plan),
    canceled_by: stringValue(item.canceled_by),
    cancel_reason: stringValue(item.cancel_reason),
    canceled_at: stringValue(item.canceled_at),
    workflow_action_id: stringValue(item.workflow_action_id),
    case_id: stringValue(item.case_id),
  }
}

function normalizeExecutionTarget(raw: unknown): RemediationExecutionTarget {
  const item = objectValue(raw)
  return {
    target_index: numberValue(item.target_index),
    agent_id: stringValue(item.agent_id),
    node_keys: stringArray(item.node_keys),
    rule_id: stringValue(item.rule_id),
    target_key: stringValue(item.target_key),
    target_type: enumValue(item.target_type),
    action_type: stringValue(item.action_type),
    execute_status: stringValue(item.execute_status),
    skip_reason: stringValue(item.skip_reason),
    execute_task_id: stringValue(item.execute_task_id),
    pmc_trace_id: stringValue(item.pmc_trace_id),
    pmc_object_type: stringValue(item.pmc_object_type),
    pmc_object_id: stringValue(item.pmc_object_id),
    pmc_object_version: stringValue(item.pmc_object_version),
    error_code: numberValue(item.error_code),
    error_msg: stringValue(item.error_msg),
    created_at: stringValue(item.created_at),
    updated_at: stringValue(item.updated_at),
    started_at: stringValue(item.started_at),
    finished_at: stringValue(item.finished_at),
    workflow_action_id: stringValue(item.workflow_action_id),
    case_id: stringValue(item.case_id),
  }
}

function normalizeExecutionSnapshot(raw: unknown): RemediationExecutionSnapshot | null {
  const item = objectValue(raw)
  if (Object.keys(item).length === 0) return null
  return {
    tenant_id: stringValue(item.tenant_id),
    preview_id: stringValue(item.preview_id),
    execution_id: stringValue(item.execution_id),
    preview_status: stringValue(item.preview_status),
    workflow_id: stringValue(item.workflow_id),
    execute_status: stringValue(item.execute_status),
    total_count: numberValue(item.total_count),
    dispatched_count: numberValue(item.dispatched_count),
    running_count: numberValue(item.running_count),
    success_count: numberValue(item.success_count),
    failed_count: numberValue(item.failed_count),
    skipped_count: numberValue(item.skipped_count),
    targets: objectArray(item.targets).map(normalizeExecutionTarget),
    workflow_action_id: stringValue(item.workflow_action_id),
    case_id: stringValue(item.case_id),
  }
}

function normalizePreviewDetailAsWorkflowDetail(raw: unknown): RemediationWorkflowDetail {
  const item = objectValue(raw)
  const preview = normalizePreviewSnapshot(item.preview)
  const execution = normalizeExecutionSnapshot(item.execution)
  const previewStatus = preview?.preview_status ?? ""
  const previewTargetSummary = normalizePreviewTargetSummary(item.preview_target_summary)
  const targetSummary = normalizeExecutionTargetSummary(item.target_summary)
  return {
    tenant_id: stringValue(item.tenant_id),
    preview_id: stringValue(item.preview_id),
    execution_id: execution?.execution_id ?? "",
    preview,
    preview_targets: objectArray(item.preview_targets).map(normalizePreviewTargetSnapshot),
    execution,
    preview_target_summary: previewTargetSummary,
    target_summary: targetSummary,
    stats: {
      preview_stats: {
        total_count: preview ? 1 : 0,
        created_count: previewStatus === "created" ? 1 : 0,
        confirmed_count: previewStatus === "confirmed" ? 1 : 0,
        canceled_count: previewStatus === "canceled" ? 1 : 0,
        expired_count: previewStatus === "expired" ? 1 : 0,
      },
      execution_stats: normalizeExecutionStats(item.target_summary),
    },
  }
}

function normalizeResolveResponse(raw: unknown): ResolveRemediationNodeAgentsResponse {
  const item = objectValue(raw)
  return {
    request_id: stringValue(item.request_id),
    tenant_id: stringValue(item.tenant_id),
    scope_type: stringValue(item.scope_type),
    scope_id: stringValue(item.scope_id),
    node_key: stringValue(item.node_key),
    entity_type: stringValue(item.entity_type),
    status: stringValue(item.status),
    agent_ids: stringArray(item.agent_ids),
    resolve_source: stringValue(item.resolve_source),
    message: stringValue(item.message),
  }
}

export async function resolveRemediationNodeAgents(
  params: Omit<ResolveRemediationNodeAgentsRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/graph/remediation/node-agents/resolve",
    withRequestId(params),
  )
  return normalizeResolveResponse(data)
}

export async function queryRemediationNodeActions(
  params: Omit<QueryRemediationNodeActionsRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/node/actions/query",
    withRequestId(params),
  )
  return normalizeNodeActionsResult(data)
}

export async function createRemediationPreview(
  params: Omit<CreateRemediationPreviewRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/preview",
    withRequestId(params),
  )
  return normalizePreviewSnapshot(data)
}

export async function queryRemediationPreview(
  params: Omit<QueryRemediationPreviewRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/preview/query",
    withRequestId(params),
  )
  return normalizePreviewSnapshot(data)
}

export async function confirmRemediationPreview(
  params: Omit<ConfirmRemediationPreviewRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/preview/confirm",
    withRequestId(params),
  )
  return normalizeExecutionSnapshot(data)
}

export async function cancelRemediationPreview(
  params: Omit<CancelRemediationPreviewRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/preview/cancel",
    withRequestId(params),
  )
  return normalizePreviewSnapshot(data)
}

export async function getRemediationExecutionResult(
  params: Omit<GetRemediationExecutionResultRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/execution/result",
    withRequestId(params),
  )
  return normalizeExecutionSnapshot(objectValue(data).execution)
}

export async function getRemediationPreviewDetail(
  params: Omit<GetRemediationPreviewDetailRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/preview/detail",
    withRequestId(params),
  )
  return normalizePreviewDetailAsWorkflowDetail(data)
}

export async function listRemediationPreviews(
  params: Omit<ListRemediationPreviewsRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/previews/query",
    withRequestId(params),
  )
  return normalizePreviewList(data)
}

export async function queryRemediationWorkflowStats(
  params: Omit<QueryRemediationWorkflowStatsRequest, "request_id">,
) {
  const data = await postData<unknown>(
    "/sensor/workflow/remediation/stats/query",
    withRequestId(params),
  )
  return normalizeWorkflowStats(data)
}
