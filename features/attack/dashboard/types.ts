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
