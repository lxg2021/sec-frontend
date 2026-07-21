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

export type AttackTrendPoint = AttackOverview

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
  attack_techniques: string[]
}

export interface AttackIocEvidence {
  attack_mark: string
  marker: string
  rule_id: string
  candidate_type: string
  candidate_field: string
  candidate_value: string
  certificate: string
  decision: string
  hit_source: string
  ioc_storage: string
  ioc_entry_id: string
  ioc_type: string
  ioc_value_subtype: string
  ioc_normalized_value: string
  ioc_display_value: string
  ioc_indicator_key: string
  risk_score: number
  confidence: number
  summary_json: string
}

export interface AttackTimelineEvidenceItem {
  evidence_id: string
  occurred_at: string
  primary_phase: string
  phases: string[]
  rule_id: string
  rule_title: string
  instance_id: string
  group_id: string
  agent_id: string
  source_unique_id: string
  event_type: number
  event_name: string
  detection_name: string
  find_string: string
  matched_attack_marks: string[]
  attack_techniques: string[]
  ioc_evidences: AttackIocEvidence[]
}

export interface EventSourceDescriptionKey {
  event_type: number
  event_name: string
  source_unique_id: string
}

export interface EventSourceDescriptionSlot {
  slot_id: string
  role: string
  entity_type: string
  label: string
  display_value: string
  raw_value: string
  raw_value_json: string
  value_type: string
  source_fields: string[]
  order: number
  primary: boolean
  sensitive: boolean
  redacted: boolean
  children: EventSourceDescriptionSlot[]
}

export interface EventSourceDescription {
  schema_version: string
  source_table: string
  event_kind: string
  category: string
  action: string
  title: string
  pattern: string
  summary: string
  short_summary: string
  slots: EventSourceDescriptionSlot[]
}

export interface BatchDescribeEventSourceItem {
  key: EventSourceDescriptionKey
  found: boolean
  description: EventSourceDescription | null
  miss_reason: string
  describe_status: string
}

export interface BatchDescribeEventSourcesResult {
  items: BatchDescribeEventSourceItem[]
  story_summary: string
  story_short_summary: string
}

export interface AttackGroupTimelineSummary {
  group_id: string
  rule_id: string
  tenant_id: string
  agent_id: string
  primary_phase: string
  phases: string[]
  start_time: string
  end_time: string
  instance_count: number
  evidence_count: number
}

export interface AttackGroupTimelineInstance {
  instance_id: string
  group_id: string
  rule_id: string
  tenant_id: string
  agent_id: string
  primary_phase: string
  phases: string[]
  start_time: string
  end_time: string
  evidence_count: number
  items: AttackTimelineEvidenceItem[]
}

export interface AttackCaseTimelineGroup {
  group: AttackGroupTimelineSummary
  instances: AttackGroupTimelineInstance[]
}

export interface AttackCaseTimelineResult {
  case: AttackCaseTimelineSummary
  groups: AttackCaseTimelineGroup[]
}

export interface AttackTimelinePageInfo {
  next_page_token: string
  has_more: boolean
  previous_page_token: string
  has_previous: boolean
  current_page: number
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
