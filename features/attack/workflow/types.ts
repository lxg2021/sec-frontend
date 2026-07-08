"use client"

export type AttackWorkflowRootType = "instance" | "group" | "case"

export type AttackWorkflowStatus =
  | "detected"
  | "investigating"
  | "confirmed"
  | "forensics"
  | "responding"
  | "contained"
  | "remediated"
  | "closed"

export type AttackWorkflowDisplayStage =
  | "discovery"
  | "investigation"
  | "forensics"
  | "response"
  | "closed"

export type AttackWorkflowActionPhase =
  | "investigation"
  | "forensics"
  | "remediation"

export type AttackWorkflowActionStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped"

export type AttackWorkflowOperatorType = "system" | "user" | "control"

export type AttackWorkflowStatusScope = "open" | "all" | "closed"

export interface AttackWorkflowItem {
  workflow_id: string
  tenant_id: string
  root_type: string
  root_id: string
  case_id: string
  status: AttackWorkflowStatus | string
  severity: string
  title: string
  primary_agent_id: string
  agent_ids: string[]
  rule_ids: string[]
  detected_at: string
  investigation_started_at: string
  confirmed_at: string
  forensic_started_at: string
  response_started_at: string
  contained_at: string
  remediated_at: string
  closed_at: string
  close_reason: string
  created_by: string
  created_at: string
  updated_at: string
  instance_ids: string[]
  group_ids: string[]
}

export interface AttackWorkflowActionInvestigation {
  investigation_job_id: string
  investigation_trace_id: string
  payload_json: string
  created_at: string
  updated_at: string
}

export interface AttackWorkflowActionRemediation {
  preview_id: string
  execution_id: string
  execute_task_id: string
  pmc_trace_id: string
  control_ref_json: string
  payload_json: string
  created_at: string
  updated_at: string
}

export interface AttackWorkflowActionItem {
  workflow_action_id: string
  tenant_id: string
  workflow_id: string
  action_batch_id: string
  action_phase: AttackWorkflowActionPhase | string
  target_type: string
  target_key: string
  instance_id: string
  group_id: string
  case_id: string
  agent_id: string
  action_type: string
  action_status: AttackWorkflowActionStatus | string
  error_code: string
  error_msg: string
  requested_at: string
  executed_at: string
  created_by: string
  created_at: string
  updated_at: string
  investigation: AttackWorkflowActionInvestigation | null
  remediation: AttackWorkflowActionRemediation | null
}

export interface AttackWorkflowEventItem {
  event_id: number
  tenant_id: string
  event_key: string
  workflow_id: string
  workflow_action_id: string
  event_type: string
  old_status: string
  new_status: string
  operator_type: AttackWorkflowOperatorType | string
  operator_id: string
  occurred_at: string
  payload_json: string
  created_at: string
  operator_name: string
}

export interface AttackWorkflowDetail {
  workflow: AttackWorkflowItem
  actions: AttackWorkflowActionItem[]
  events: AttackWorkflowEventItem[]
}

export interface AttackWorkflowPagination {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous: boolean
  has_next: boolean
}

export interface GetAttackWorkflowParams {
  tenantId?: string
  workflowId?: string
  rootType?: AttackWorkflowRootType
  rootId?: string
  includeActions?: boolean
  includeEvents?: boolean
}

export interface ListAttackWorkflowsParams {
  tenantId?: string
  page?: number
  pageSize?: number
  timezone?: string
  startTime?: string
  endTime?: string
  statusScope?: AttackWorkflowStatusScope
  status?: AttackWorkflowStatus | string
  severity?: string
  caseId?: string
}

export interface ListAttackWorkflowsData {
  items: AttackWorkflowItem[]
  pagination: AttackWorkflowPagination
}

export interface UpdateAttackWorkflowStatusParams {
  tenantId?: string
  workflowId: string
  status: AttackWorkflowStatus
  closeReason?: string
  occurredAt?: string
  payloadJson?: string
}
