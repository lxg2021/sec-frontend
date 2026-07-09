"use client"

export interface RemediationOrchestrationContext {
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  tenant_id?: string
  source_type?: string
  scope_type?: string
  scope_id?: string
  node_key?: string
  entity_type?: string
  display_name?: string
  return_to?: string
}

export interface RemediationActionContext {
  context_type?: string | number
  agent_id?: string
  source_task_id?: string
  source_action_code?: string
  target_key?: string
  backup_id?: string
  policy_id?: string
}

export interface RemediationPreviewTargetAgent {
  agent_id: string
  action_context?: RemediationActionContext
}

export interface RemediationTargetSnapshot {
  host_id?: string
  hostname?: string
  process?: Record<string, unknown>
  file?: Record<string, unknown>
  scheduled_task?: Record<string, unknown>
  service?: Record<string, unknown>
  account?: Record<string, unknown>
  registry?: Record<string, unknown>
  wmi_class?: Record<string, unknown>
  wmi_subscription?: Record<string, unknown>
  bits_job?: Record<string, unknown>
  network?: Record<string, unknown>
}

export interface RemediationActionInput {
  file_quarantine?: Record<string, unknown>
  process_terminate?: Record<string, unknown>
  process_block?: Record<string, unknown>
  net_block?: Record<string, unknown>
  scheduled_task?: Record<string, unknown>
  service?: Record<string, unknown>
  account?: Record<string, unknown>
  registry?: Record<string, unknown>
  wmi_class?: Record<string, unknown>
  wmi_subscription?: Record<string, unknown>
  bits_job?: Record<string, unknown>
  file_ea?: Record<string, unknown>
  ntfs_ads?: Record<string, unknown>
}

export interface RemediationPreviewTargetInput {
  node_key: string
  entity_type?: string
  action_code: string
  agents: RemediationPreviewTargetAgent[]
  target_display?: string
  snapshot: RemediationTargetSnapshot
  input?: RemediationActionInput
}

export interface ResolveRemediationNodeAgentsRequest {
  request_id: string
  tenant_id?: string
  scope_type: string
  scope_id: string
  node_key: string
  entity_type?: string
}

export interface ResolveRemediationNodeAgentsResponse {
  request_id: string
  tenant_id: string
  scope_type: string
  scope_id: string
  node_key: string
  entity_type: string
  status: "resolved" | "ambiguous" | "unresolvable" | string
  agent_ids: string[]
  resolve_source: string
  message: string
}

export interface RemediationNodeActionQueryNode {
  node_key: string
  entity_type?: string
  agent_ids?: string[]
}

export interface QueryRemediationNodeActionsRequest {
  request_id: string
  tenant_id?: string
  source_type?: string
  scope_type?: string
  scope_id?: string
  node: RemediationNodeActionQueryNode
}

export interface RemediationActionOption {
  action_code: string
  display_name: string
  action_type: string
  requires_agent: boolean
  requires_history: boolean
  required_snapshot_kind: string | number
  contexts: RemediationActionContext[]
}

export interface RemediationNodeAction {
  node_key: string
  entity_type: string
  status: "ready" | "blocked" | string
  blocked_reason: string
  agent_ids: string[]
  actions: RemediationActionOption[]
}

export interface RemediationNodeActionsResult {
  tenant_id: string
  source_type: string
  scope_type: string
  scope_id: string
  node: RemediationNodeAction
}

export interface CreateRemediationPreviewRequest {
  request_id: string
  tenant_id?: string
  expire_seconds?: number
  workflow_id?: string
  source_type?: string
  scope_type?: string
  scope_id?: string
  targets: RemediationPreviewTargetInput[]
  workflow_action_id?: string
  case_id?: string
}

export interface QueryRemediationPreviewRequest {
  request_id: string
  tenant_id?: string
  preview_id: string
}

export interface ConfirmRemediationPreviewRequest {
  request_id: string
  tenant_id?: string
  preview_id: string
}

export interface CancelRemediationPreviewRequest {
  request_id: string
  tenant_id?: string
  preview_id: string
  cancel_reason?: string
}

export interface GetRemediationExecutionResultRequest {
  request_id: string
  tenant_id?: string
  execution_id: string
}

export interface GetRemediationPreviewDetailRequest {
  request_id: string
  tenant_id?: string
  preview_id: string
}

export interface ListRemediationPreviewsRequest {
  request_id: string
  tenant_id?: string
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  start_time?: string
  end_time?: string
  timezone?: string
  page?: number
  page_size?: number
}

export interface QueryRemediationWorkflowStatsRequest {
  request_id: string
  start_time?: string
  end_time?: string
  timezone?: string
  tenant_id?: string
  workflow_action_id?: string
  workflow_id?: string
  case_id?: string
}

export interface RemediationPreviewStats {
  total_count: number
  created_count: number
  confirmed_count: number
  canceled_count: number
  expired_count: number
}

export interface RemediationExecutionStats {
  total_count: number
  created_count: number
  dispatched_count: number
  running_count: number
  success_count: number
  failed_count: number
  skipped_count: number
}

export interface RemediationPreviewTargetSummary {
  total_count: number
  will_apply_count: number
  skipped_count: number
}

export interface RemediationExecutionTargetSummary {
  total_count: number
  created_count: number
  dispatched_count: number
  running_count: number
  success_count: number
  failed_count: number
  skipped_count: number
}

export interface RemediationWorkflowStatsGroup {
  preview_stats: RemediationPreviewStats
  execution_stats: RemediationExecutionStats
}

export interface RemediationWorkflowStats {
  tenant_id: string
  start_time: string
  end_time: string
  timezone: string
  summary: RemediationWorkflowStatsGroup
}

export interface RemediationPageInfo {
  page: number
  page_size: number
  total: number
  has_next: boolean
}

export interface RemediationPreviewListItem {
  tenant_id: string
  preview_id: string
  execution_id: string
  workflow_id: string
  workflow_action_id: string
  case_id: string
  source_request_id: string
  preview_status: string
  execute_status: string
  source_type: string
  scope_type: string
  scope_id: string
  target_type: string | number
  action_type: string
  plan_status: string | number
  created_at: string
  confirmed_at: string
  expires_at: string
  preview_target_summary: RemediationPreviewTargetSummary
  target_summary: RemediationExecutionTargetSummary
}

export interface RemediationPreviewList {
  tenant_id: string
  start_time: string
  end_time: string
  timezone: string
  preview_summary: RemediationPreviewStats
  target_summary: RemediationExecutionTargetSummary
  items: RemediationPreviewListItem[]
  page: RemediationPageInfo
}

export interface RemediationPreviewSnapshot {
  tenant_id: string
  preview_id: string
  source_request_id: string
  preview_status: string
  workflow_id: string
  source_type: string
  scope_type: string
  scope_id: string
  target_type: string | number
  action_type: string
  plan_status: string | number
  created_by: string
  created_at: string
  expires_at: string
  plan?: Record<string, unknown>
  canceled_by: string
  cancel_reason: string
  canceled_at: string
  workflow_action_id: string
  case_id: string
}

export interface RemediationPreviewTargetSnapshot {
  target_index: number
  agent_id: string
  node_keys: string[]
  rule_id: string
  target_key: string
  target_identifier: string
  target_display: string
  dedupe_status: string | number
  dedupe_reason: string
  will_apply: boolean
  existing_task_id: string
  validation_status: string | number
  validation_reason: string
  backup_id: string
}

export interface RemediationExecutionTarget {
  target_index: number
  agent_id: string
  node_keys: string[]
  rule_id: string
  target_key: string
  target_type: string | number
  action_type: string
  execute_status: string
  skip_reason: string
  execute_task_id: string
  pmc_trace_id: string
  pmc_object_type: string
  pmc_object_id: string
  pmc_object_version: string
  error_code: number
  error_msg: string
  created_at: string
  updated_at: string
  started_at: string
  finished_at: string
  workflow_action_id: string
  case_id: string
}

export interface RemediationExecutionSnapshot {
  tenant_id: string
  preview_id: string
  execution_id: string
  preview_status: string
  workflow_id: string
  execute_status: string
  total_count: number
  dispatched_count: number
  running_count: number
  success_count: number
  failed_count: number
  skipped_count: number
  targets: RemediationExecutionTarget[]
  workflow_action_id: string
  case_id: string
}

export interface RemediationPreviewDetail {
  tenant_id: string
  preview_id: string
  execution_id: string
  preview: RemediationPreviewSnapshot | null
  preview_targets: RemediationPreviewTargetSnapshot[]
  execution: RemediationExecutionSnapshot | null
  preview_target_summary: RemediationPreviewTargetSummary
  target_summary: RemediationExecutionTargetSummary
  stats: RemediationWorkflowStatsGroup
}

export interface RemediationCandidateNode {
  node_key: string
  entity_type: string
  display_name: string
  description: string
  resolve_status: string
  agent_ids: string[]
  snapshot: RemediationTargetSnapshot
}
