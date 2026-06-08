"use client"

export type BucketType = "fixed" | "hour" | "day"

export interface AttackBucket {
  bucket_type: BucketType
  bucket_start: string
  bucket_end: string
  trigger_source?: string
  last_request_id?: string
  snapshot_id?: string
}

export interface AttackOverview {
  bucket: AttackBucket
  scope?: string
  total_rules: number
  total_groups: number
  total_instances: number
  total_sources: number
  total_hosts: number
  total_cases: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
}

export interface TriggerCheckPayload {
  start_time: string
  end_time: string
  bucket_type: BucketType
  timezone?: string
}

export interface TriggerCheckResult {
  task_id: string
  status: string
}

export interface AttackTriggerDefaultRange {
  start_time: string
  end_time: string
  timezone: string
  reserve_seconds: number
  last_success_time: string
}

export interface AttackTaskStatus {
  task_id: string
  status: string
  error_message?: string
  snapshot_id?: string
}

export interface AttackStageHostDistributionItem {
  stage: string
  stage_key: string
  host_count: number
}

export interface AttackStageInstanceDistributionItem {
  stage: string
  stage_key: string
  instance_count: number
}

export interface AttackTopHostItem {
  agent_id: string
  hostname: string
  total_rules: number
  total_groups: number
  total_instances: number
  total_sources: number
  risk_score: number
  total_cases: number
}

export interface AttackTrendPoint extends AttackOverview {}

export interface AttackCaseTimelineSummary {
  case_id: string
  tenant_id: string
  title: string
  summary: string
  severity: string
  primary_phase: string
  phases: string[]
  start_time: string
  end_time: string
  rule_count: number
  group_count: number
  instance_count: number
  evidence_count: number
  host_count: number
  rule_ids: string[]
  tags: string[]
  agent_ids: string[]
}

export interface AttackTimelinePageInfo {
  next_page_token: string
  has_more: boolean
}

export interface AttackTimelineCasesResult {
  items: AttackCaseTimelineSummary[]
  page: AttackTimelinePageInfo
}

export interface AttackStatsTrendParams {
  bucketType: BucketType
  startTime: string
  endTime: string
  timezone?: string
}

export interface AttackSnapshotPagination {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous: boolean
  has_next: boolean
}

export interface AttackSnapshotsResult {
  items: AttackOverview[]
  pagination: AttackSnapshotPagination
}

export interface ResolveAttackStatsRangeSnapshotResult {
  snapshot_id: string
  task_id: string
  status: string
  source: string
  coverage_status: string
}
