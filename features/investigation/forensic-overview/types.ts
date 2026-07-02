// 取证概览页面核心数据模型
// 前端面向业务对象，后端负责转换为 Velociraptor 原生概念

export type EndpointStatus = "online" | "offline" | "unknown"

export interface ForensicEndpointItem {
  endpoint_id: string
  tenant_id?: string
  velociraptor_client_id: string
  hostname: string
  fqdn?: string
  os: string
  arch?: string
  agent_id?: string
  status: EndpointStatus
  last_seen_at?: number
  created_at?: number
  updated_at?: number
}

export type ArtifactCategory = string
export type ArtifactPlatform = "windows" | "linux" | "darwin" | "all" | string
export type RiskLevel = "low" | "medium" | "high" | string

// input_schema_json 字段定义
export type ParamFieldType = "string" | "string_array" | "boolean" | "number"

export interface ArtifactParamField {
  key: string
  label: string
  type: ParamFieldType
  required?: boolean
  description?: string
  default?: unknown
  maxItems?: number
  maxLength?: number
  min?: number
  max?: number
  placeholder?: string
  enum?: string[]
}

export interface ForensicArtifactDefinitionItem {
  artifact_key: string
  name: string
  description?: string
  category: ArtifactCategory
  platform: ArtifactPlatform
  enabled: boolean
  risk_level: RiskLevel
  sort_order?: number
  input_schema_json?: string
  default_params_json?: string
  version?: string
}

export type TaskStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "canceled"
  | "timeout"

export type TaskType =
  | "collect_file"
  | "collect_registry"
  | "collect_eventlog"
  | "collect_artifact"

export interface ForensicTaskItem {
  task_id: string
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  endpoint_id?: string
  agent_id?: string
  velociraptor_client_id?: string
  artifact_key: string
  artifact_name?: string
  task_type?: TaskType
  params_json?: string
  status: TaskStatus
  remote_flow_id?: string
  primary_artifact_id?: string
  error_code?: string
  error_msg?: string
  created_by?: string
  created_at?: number
  started_at?: number
  finished_at?: number
  updated_at?: number
  last_sync_at?: number
}

export type EvidenceType =
  | "file"
  | "file_metadata"
  | "registry_json"
  | "eventlog_json"
  | "json"

export interface ForensicEvidenceItem {
  artifact_id: string
  task_id: string
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  endpoint_id?: string
  agent_id?: string
  velociraptor_client_id?: string
  artifact_key: string
  artifact_type: EvidenceType
  source_path?: string
  file_name?: string
  storage_uri?: string
  sha256?: string
  sha1?: string
  md5?: string
  size?: number
  content_type?: string
  meta_json?: string
  created_at?: number
}

export interface Pagination {
  page: number
  page_size: number
  total_count: number
}

export interface ListResponse<T> {
  items: T[]
  pagination: Pagination
}

// 页面上下文参数（来自 URL 或攻击工作流）
export interface ForensicContext {
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  agent_id?: string
  endpoint_id?: string
}

// 创建任务请求
export interface CreateForensicTaskRequest {
  request_id: string
  tenant_id?: string
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  agent_id?: string
  endpoint_id?: string
  velociraptor_client_id?: string
  artifact_key: string
  params_json: string
  created_by?: string
}

export interface CreateForensicTaskResponse {
  task_id: string
  status: TaskStatus
  task: ForensicTaskItem
}

export interface SyncEndpointsResponse {
  synced_count: number
}

// 后端能力提示级别
export type NoticeLevel = "info" | "warning" | "error"

export interface BackendNotice {
  id: string
  level: NoticeLevel
  title: string
  description?: string
}

