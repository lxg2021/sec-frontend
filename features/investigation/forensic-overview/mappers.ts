// 视图模型转换与展示格式化工具

import type {
  ArtifactCategory,
  EvidenceType,
  ForensicArtifactDefinitionItem,
  ForensicEndpointItem,
  ForensicEvidenceItem,
  ForensicTaskItem,
  ArtifactParamField,
  EndpointStatus,
  RiskLevel,
  TaskStatus,
} from "./types"

// ---- 时间格式化 ----

export function formatUnixTime(ts?: number): string {
  if (!ts) return "-"
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatRelative(ts?: number): string {
  if (!ts) return "从未"
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return `${diff} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

export function formatBytes(size?: number): string {
  if (size === undefined || size === null) return "-"
  if (size < 1024) return `${size} B`
  const units = ["KB", "MB", "GB", "TB"]
  let v = size / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

// ---- 中文标签 ----

export const endpointStatusLabel: Record<EndpointStatus, string> = {
  online: "在线",
  offline: "离线",
  unknown: "未知",
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  pending: "等待中",
  running: "运行中",
  success: "成功",
  failed: "失败",
  canceled: "已取消",
  timeout: "超时",
}

export const riskLevelLabel: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
}

export const categoryLabel: Record<string, string> = {
  file: "文件",
  registry: "注册表",
  eventlog: "事件日志",
  forensic: "取证痕迹",
  ntfs: "NTFS",
  application: "应用痕迹",
  other: "其他",
}

export function getCategoryLabel(category?: string): string {
  if (!category) return "其他"
  return categoryLabel[category] ?? category
}

export const evidenceTypeLabelMap: Record<EvidenceType, string> = {
  file: "文件",
  file_metadata: "文件元数据",
  registry_json: "注册表",
  eventlog_json: "事件日志",
  json: "JSON",
}

export function evidenceTypeLabel(type: EvidenceType): string {
  return evidenceTypeLabelMap[type] ?? type
}

// 证据主标识：优先文件名，其次源路径尾段
export function evidencePrimaryLabel(ev: ForensicEvidenceItem): string {
  if (ev.file_name) return ev.file_name
  if (ev.source_path) {
    const parts = ev.source_path.split(/[\\/]/)
    return parts[parts.length - 1] || ev.source_path
  }
  return ev.artifact_key
}

// 证据来源终端展示
export function evidenceEndpointLabel(
  ev: ForensicEvidenceItem,
  endpoints: ForensicEndpointItem[],
): string {
  const ep = endpoints.find(
    (e) =>
      (ev.endpoint_id && e.endpoint_id === ev.endpoint_id) ||
      (ev.agent_id && e.agent_id === ev.agent_id) ||
      (ev.velociraptor_client_id &&
        e.velociraptor_client_id === ev.velociraptor_client_id),
  )
  if (ep) return endpointPrimaryLabel(ep)
  return ev.agent_id || ev.endpoint_id || "-"
}

// ---- 终端主标识 ----

export function endpointPrimaryLabel(ep: ForensicEndpointItem): string {
  return ep.hostname || ep.fqdn || ep.agent_id || ep.velociraptor_client_id
}

export function isBound(ep: ForensicEndpointItem): boolean {
  return Boolean(ep.agent_id)
}

// 目标身份优先级：agent_id > endpoint_id > velociraptor_client_id
export function resolveTarget(ep: ForensicEndpointItem): {
  agent_id?: string
  endpoint_id?: string
  velociraptor_client_id?: string
} {
  if (ep.agent_id) return { agent_id: ep.agent_id }
  if (ep.endpoint_id) return { endpoint_id: ep.endpoint_id }
  return { velociraptor_client_id: ep.velociraptor_client_id }
}

// ---- 参数 schema 解析 ----

export function parseParamSchema(
  artifact: ForensicArtifactDefinitionItem,
): ArtifactParamField[] {
  if (!artifact.input_schema_json) return []
  try {
    const parsed = JSON.parse(artifact.input_schema_json)
    if (Array.isArray(parsed?.fields)) return parsed.fields as ArtifactParamField[]
    const required = Array.isArray(parsed?.required)
      ? new Set<string>(parsed.required)
      : new Set<string>()
    const properties =
      parsed && typeof parsed.properties === "object" && parsed.properties
        ? (parsed.properties as Record<string, Record<string, unknown>>)
        : {}
    return Object.entries(properties).map(([key, schema]) => {
      const type = normalizeSchemaFieldType(schema)
      return {
        key,
        label: stringValue(schema.title) || key,
        type,
        required: required.has(key),
        description: stringValue(schema.description),
        default: schema.default,
        maxItems: numberValue(schema.maxItems),
        maxLength: numberValue(schema.maxLength) ?? itemNumberValue(schema, "maxLength"),
        min: numberValue(schema.minimum),
        max: numberValue(schema.maximum),
        placeholder: stringValue(schema.examples),
        enum: Array.isArray(schema.enum) ? schema.enum.map(String) : undefined,
      }
    })
  } catch {
    return []
  }
}

export function parseDefaultParams(
  artifact: ForensicArtifactDefinitionItem,
): Record<string, unknown> {
  if (!artifact.default_params_json) return {}
  try {
    const parsed = JSON.parse(artifact.default_params_json)
    return typeof parsed === "object" && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeSchemaFieldType(schema: Record<string, unknown>): ArtifactParamField["type"] {
  if (schema.type === "array") return "string_array"
  if (schema.type === "boolean") return "boolean"
  if (schema.type === "number" || schema.type === "integer") return "number"
  return "string"
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (Array.isArray(value) && value.length > 0) return String(value[0])
  return undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return undefined
}

function itemNumberValue(schema: Record<string, unknown>, key: string): number | undefined {
  const items = schema.items
  if (!items || typeof items !== "object" || Array.isArray(items)) return undefined
  return numberValue((items as Record<string, unknown>)[key])
}

// ---- 任务目标展示（补齐 hostname） ----

export function taskTargetLabel(
  task: ForensicTaskItem,
  endpoints: ForensicEndpointItem[],
): string {
  const ep = endpoints.find(
    (e) =>
      (task.endpoint_id && e.endpoint_id === task.endpoint_id) ||
      (task.agent_id && e.agent_id === task.agent_id) ||
      (task.velociraptor_client_id &&
        e.velociraptor_client_id === task.velociraptor_client_id),
  )
  if (ep) return endpointPrimaryLabel(ep)
  return task.agent_id || task.endpoint_id || task.velociraptor_client_id || "-"
}

