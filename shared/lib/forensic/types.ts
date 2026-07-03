export type ForensicAvailabilityLevel = "available" | "partial" | "unavailable"

export interface ForensicOverviewBlockingReason {
  type: string
  level: ForensicNoticeLevel
  text: string
  action_label?: string
  action_href?: string
}

export interface ForensicOverviewAvailability {
  level: ForensicAvailabilityLevel
  title: string
  summary: string
  can_create_task: boolean
  target_agent_count: number
  available_endpoint_count: number
  unbound_endpoint_count: number
  offline_endpoint_count: number
  blocked_endpoint_count: number
  enabled_artifact_count: number
  running_task_count: number
  failed_task_count: number
  blocking_reasons: ForensicOverviewBlockingReason[]
}

export interface ForensicOverviewMetrics {
  endpoint_total: number
  endpoint_online: number
  endpoint_unbound: number
  artifact_enabled: number
  task_running: number
  task_failed: number
  evidence_total: number
}

export interface ForensicEndpointSummary {
  total: number
  online: number
  offline: number
  unknown: number
  unbound: number
  latest_seen_at?: number
}

export interface ForensicTaskSummary {
  pending: number
  running: number
  success: number
  failed: number
  timeout: number
  canceled: number
}

export interface ForensicArtifactSummary {
  total_enabled: number
  by_category: Record<string, number>
  high_risk_count: number
}

export interface ForensicEvidenceSummary {
  total: number
  latest_created_at?: number
}

export type ForensicTaskStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "canceled"
  | "timeout"

export interface ForensicTaskTargetHost {
  agent_id?: string
  endpoint_id?: string
  velociraptor_client_id?: string
  hostname?: string
  ip?: string[]
  macs?: string[]
  host_status?: string
  forensic_status?: string
  heartbeat_time?: number
  last_seen_at?: number
}

export interface ForensicRecentTaskView {
  task_id: string
  status: ForensicTaskStatus
  artifact_key: string
  artifact_name: string
  target_label: string
  target_host?: ForensicTaskTargetHost | null
  created_at?: number
  last_sync_at?: number
  error_msg?: string
}

export interface ForensicTaskItem {
  task_id: string
  tenant_id?: string
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  endpoint_id?: string
  agent_id?: string
  velociraptor_client_id?: string
  artifact_key: string
  artifact_name?: string
  task_type?: string
  params_json?: string
  velociraptor_artifact?: string
  velociraptor_args_json?: string
  status: ForensicTaskStatus
  remote_flow_id?: string
  primary_artifact_id?: string
  error_code?: string
  error_msg?: string
  created_by?: string
  flow_status_json?: string
  flow_result_json?: string
  created_at?: number
  started_at?: number
  finished_at?: number
  updated_at?: number
  last_sync_at?: number
}

export interface ForensicPagination {
  page: number
  page_size: number
  total_count: number
}

export interface ListForensicTasksRequest {
  page?: number
  page_size?: number
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  endpoint_id?: string
  velociraptor_client_id?: string
  artifact_key?: string
  status?: ForensicTaskStatus
}

export interface ListForensicTasksData {
  items: ForensicTaskItem[]
  pagination: ForensicPagination
}

export type ForensicNoticeLevel = "info" | "warning" | "error"

export interface ForensicOverviewNotice {
  id: string
  level: ForensicNoticeLevel
  title: string
  description?: string
  action_label?: string
  action_href?: string
}

export interface ForensicOverviewViewModel {
  availability: ForensicOverviewAvailability
  metrics: ForensicOverviewMetrics
  endpoint_summary: ForensicEndpointSummary
  task_summary: ForensicTaskSummary
  artifact_summary: ForensicArtifactSummary
  evidence_summary: ForensicEvidenceSummary
  recent_tasks: ForensicRecentTaskView[]
  notices: ForensicOverviewNotice[]
  last_refresh_at: number
}

export type ForensicBackendHealthStatus = "healthy" | "degraded" | "unavailable"

export interface ForensicBackendStatusData {
  velociraptor: {
    status: ForensicBackendHealthStatus
    cpu_percent: number
    memory_bytes: number
    total_frontends: number
    current_connections: number
    last_seen_at: number
  }
  storage: {
    type: string
    container_path: string
    filesystem: string
    total: string
    used: string
    available: string
    used_percent: number
  }
  endpoints: {
    registered: number
    connected: number
  }
  last_refresh_at: number
}

export interface ForensicOverviewContext {
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  agent_id?: string
  endpoint_id?: string
}

export interface ForensicArtifactDefinitionItem {
  artifact_key: string
  name: string
  description?: string
  category: string
  platform: string
  enabled: boolean
  risk_level: string
  sort_order?: number
  input_schema_json?: string
  default_params_json?: string
  version?: string
  display_json?: string
  parameter_docs_json?: string
  output_docs_json?: string
  examples_json?: string
  upstream_json?: string
}

export interface ListForensicArtifactsRequest {
  category?: string
  platform?: string
  enabled?: boolean
}

export interface ListForensicArtifactsData {
  items: ForensicArtifactDefinitionItem[]
}
