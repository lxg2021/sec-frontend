"use client"

export type Granularity = "hour" | "day" | "month"

export type CoverageStatus = "covered" | "partial" | "unknown"

export interface AttackEventTimelinePoint {
  bucket_start: string
  bucket_end: string
  total_sources: number
  total_instances: number
  total_groups: number
  total_rules: number
  total_hosts: number
  total_cases: number
}

export interface GetAttackEventTimelineDistributionData {
  start_time: string
  end_time: string
  timezone: string
  granularity: Granularity
  coverage_status: CoverageStatus
  items: AttackEventTimelinePoint[]
  total_sources: number
  total_instances: number
  total_groups: number
  total_rules: number
  total_hosts: number
  total_cases: number
}

export interface GetAttackEventTimelineDistributionRequest {
  request_id: string
  start_time?: string
  end_time?: string
  granularity: Granularity
  timezone?: string
  tenant_id?: string
}

export interface GetAttackEventTimelineDistributionResponse {
  code: number
  msg: string
  request_id: string
  data: GetAttackEventTimelineDistributionData
}

export type MetricKey =
  | "total_sources"
  | "total_instances"
  | "total_groups"
  | "total_rules"
  | "total_hosts"
  | "total_cases"
