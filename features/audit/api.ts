"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type { AuditResult, DispatchAuditEvent, DispatchExecutionResult, DispatchExecutionStatus, DispatchType } from "@/features/audit/types"

const PAGE_SIZE = 100
const MAX_PAGES = 20
const RECENT_DAYS = 7

interface ApiResult<T> {
  data?: T
}

interface PMCOperationSnapshot {
  operation_id?: string
  source_type?: string
  source_ref_id?: string
  object_type?: number | string
  object_id?: string
  object_version?: string
  operation?: number | string
  planning_status?: string
  status?: string
  outcome?: string
  revision?: number | string
  total_count?: number | string
  materialized_count?: number | string
  pending_count?: number | string
  running_count?: number | string
  success_count?: number | string
  failed_count?: number | string
  uncertain_count?: number | string
  skipped_count?: number | string
  canceled_count?: number | string
  result_version?: number | string
  created_at_unix_ms?: number | string
  updated_at_unix_ms?: number | string
  completed_at_unix_ms?: number | string
  canceled_by?: string
  cancel_reason?: string
}

interface PMCAuditEventData {
  id?: number | string
  event_type?: string
  operation_id?: string
  actor_type?: string
  actor_id?: string
  payload_json?: string
  occurred_at_unix_ms?: number | string
}

interface PMCObjectDefinitionData {
  type?: number | string
  object_id?: string
  object_version?: string
  Content?: Record<string, unknown>
  content?: Record<string, unknown>
  policy?: Record<string, unknown>
  command?: Record<string, unknown>
  config?: Record<string, unknown>
}

interface ListOperationsData {
  operations?: PMCOperationSnapshot[]
  total?: number | string
}

interface ListAuditEventsData {
  events?: PMCAuditEventData[]
  total?: number | string
}

interface PMCExecutionResultData {
  operation_id?: string
  dispatch_id?: string
  agent_id?: string
  publish_status?: string
  execution_status?: number | string
  failure_certainty?: number | string
  reason_code?: string
  reason_message?: string
  error_code?: string
  error_message?: string
  created_at_unix_ms?: number | string
  updated_at_unix_ms?: number | string
  published_at_unix_ms?: number | string
  started_at_unix_ms?: number | string
  last_report_at_unix_ms?: number | string
  finished_at_unix_ms?: number | string
  task_visibility?: string
}

interface QueryExecutionResultsData {
  results?: PMCExecutionResultData[]
  total?: number | string
}
interface ListObjectDefinitionsData {
  definitions?: PMCObjectDefinitionData[]
  total?: number | string
}

interface ActorIdentity {
  type: string
  id: string
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function objectTypeValue(value: unknown) {
  if (typeof value === "number") return value
  const normalized = stringValue(value).toUpperCase()
  if (/^\d+$/.test(normalized)) return Number(normalized)
  if (normalized.includes("POLICY")) return 1
  if (normalized.includes("COMMAND")) return 2
  if (normalized.includes("CONFIG")) return 3
  return 0
}

function dispatchTypeValue(value: unknown): Exclude<DispatchType, "all"> | null {
  switch (objectTypeValue(value)) {
    case 1:
      return "policy"
    case 2:
      return "command"
    case 3:
      return "config"
    default:
      return null
  }
}

function extractDefinitionContent(definition: PMCObjectDefinitionData) {
  const content = definition.Content ?? definition.content ?? {}
  const objectType = objectTypeValue(definition.type)
  const key = objectType === 1 ? "policy" : objectType === 2 ? "command" : "config"
  const nested = content[key]
  if (nested && typeof nested === "object") return nested as Record<string, unknown>
  const direct = definition[key]
  return direct && typeof direct === "object" ? direct : {}
}

function definitionKeys(objectType: number, objectId: string, version: string) {
  return [`${objectType}:${objectId}:${version}`, `${objectType}:${objectId}:`]
}

function resultValue(operation: PMCOperationSnapshot): Exclude<AuditResult, "all"> {
  const status = stringValue(operation.status).toLowerCase()
  const outcome = stringValue(operation.outcome).toLowerCase()
  const total = numberValue(operation.total_count)
  const success = numberValue(operation.success_count)
  const failed = numberValue(operation.failed_count)
  const pending = numberValue(operation.pending_count) + numberValue(operation.running_count)
  const uncertain = numberValue(operation.uncertain_count)

  if (pending > 0 || ["pending", "planning", "materializing", "running"].includes(status)) return "pending"
  if (uncertain > 0 || outcome.includes("uncertain") || outcome.includes("timeout")) return "timeout"
  if (failed > 0 || ["failed", "canceled", "cancelled"].includes(status) || outcome.includes("fail")) return "failed"
  if ((total > 0 && success >= total) || ["success", "completed", "succeeded"].includes(status) || outcome.includes("success")) return "success"
  return "pending"
}

function executionStatusValue(value: unknown): DispatchExecutionStatus {
  if (typeof value === "number" || /^\d+$/.test(stringValue(value))) {
    switch (numberValue(value)) {
      case 1: return "pending"
      case 2: return "running"
      case 3: return "success"
      case 4: return "failed"
      case 5: return "skipped"
      case 6: return "canceled"
      case 7: return "accepted"
      default: return "unknown"
    }
  }

  const normalized = stringValue(value).toLowerCase()
  if (normalized.includes("accepted")) return "accepted"
  if (normalized.includes("pending")) return "pending"
  if (normalized.includes("running")) return "running"
  if (normalized.includes("success")) return "success"
  if (normalized.includes("failed")) return "failed"
  if (normalized.includes("skipped")) return "skipped"
  if (normalized.includes("canceled") || normalized.includes("cancelled")) return "canceled"
  return "unknown"
}

function failureCertaintyValue(value: unknown): DispatchExecutionResult["failureCertainty"] {
  if (typeof value === "number" || /^\d+$/.test(stringValue(value))) {
    if (numberValue(value) === 1) return "definitive"
    if (numberValue(value) === 2) return "uncertain"
    return "unknown"
  }
  const normalized = stringValue(value).toLowerCase()
  if (normalized.includes("definitive")) return "definitive"
  if (normalized.includes("uncertain")) return "uncertain"
  return "unknown"
}

function optionalIsoDate(value: unknown) {
  const unixMs = numberValue(value)
  return unixMs > 0 ? new Date(unixMs).toISOString() : undefined
}
function actorName(identity?: ActorIdentity) {
  const type = identity?.type.toLowerCase()
  if (type === "operator") return "操作员"
  if (type === "system") return "系统"
  if (type === "publisher") return "发布器"
  if (type === "reconciler") return "协调器"
  return identity?.type || "未知"
}

function parseManualActor(sourceRefId: string) {
  if (!sourceRefId.startsWith("manual:")) return ""
  return sourceRefId.split(":", 3)[1] || ""
}
async function listRecentOperations(cutoffUnixMs: number) {
  const operations: PMCOperationSnapshot[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await http.post("listPMCOperations", {
      request_id: createRequestId(),
      page,
      page_size: PAGE_SIZE,
    }) as ApiResult<ListOperationsData>
    const batch = Array.isArray(result.data?.operations) ? result.data.operations : []
    operations.push(...batch)

    const oldest = batch.at(-1)
    const reachedCutoff = oldest && numberValue(oldest.created_at_unix_ms) < cutoffUnixMs
    if (batch.length < PAGE_SIZE || reachedCutoff) break
  }

  return operations.filter((operation) => numberValue(operation.created_at_unix_ms) >= cutoffUnixMs)
}

async function listOperationActors(cutoffUnixMs: number) {
  const actors = new Map<string, ActorIdentity>()

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await http.post("listPMCAuditEvents", {
      request_id: createRequestId(),
      event_type: "pmc.operation.created",
      occurred_after_unix_ms: cutoffUnixMs,
      occurred_before_unix_ms: Date.now(),
      page,
      page_size: PAGE_SIZE,
    }) as ApiResult<ListAuditEventsData>
    const batch = Array.isArray(result.data?.events) ? result.data.events : []

    batch.forEach((event) => {
      const operationId = stringValue(event.operation_id)
      if (!operationId || actors.has(operationId)) return
      actors.set(operationId, {
        type: stringValue(event.actor_type),
        id: stringValue(event.actor_id),
      })
    })

    if (batch.length < PAGE_SIZE) break
  }

  return actors
}

async function listObjectNames() {
  const names = new Map<string, string>()

  await Promise.all([1, 2, 3].map(async (objectType) => {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await http.post("listPMCObjectDefinitions", {
        request_id: createRequestId(),
        object_type: objectType,
        page,
        page_size: PAGE_SIZE,
      }) as ApiResult<ListObjectDefinitionsData>
      const batch = Array.isArray(result.data?.definitions) ? result.data.definitions : []

      batch.forEach((definition) => {
        const definitionType = objectTypeValue(definition.type) || objectType
        const objectId = stringValue(definition.object_id)
        const version = stringValue(definition.object_version)
        const content = extractDefinitionContent(definition)
        const name = stringValue(content.name)
        if (!objectId || !name) return
        definitionKeys(definitionType, objectId, version).forEach((key) => names.set(key, name))
      })

      if (batch.length < PAGE_SIZE) break
    }
  }))

  return names
}

export async function listDispatchAuditEvents(): Promise<DispatchAuditEvent[]> {
  const cutoffUnixMs = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000
  const [operations, actors, objectNames] = await Promise.all([
    listRecentOperations(cutoffUnixMs),
    listOperationActors(cutoffUnixMs),
    listObjectNames(),
  ])

  return operations.flatMap((operation) => {
    const dispatchType = dispatchTypeValue(operation.object_type)
    const operationId = stringValue(operation.operation_id)
    const objectId = stringValue(operation.object_id)
    const objectVersion = stringValue(operation.object_version)
    const objectType = objectTypeValue(operation.object_type)
    const occurredAtUnixMs = numberValue(operation.created_at_unix_ms)
    if (!dispatchType || !operationId || !occurredAtUnixMs) return []

    const identity = actors.get(operationId) ?? {
      type: "operator",
      id: parseManualActor(stringValue(operation.source_ref_id)),
    }
    const totalCount = numberValue(operation.total_count)
    const pendingCount = numberValue(operation.pending_count) + numberValue(operation.running_count) + numberValue(operation.uncertain_count)
    const name = objectNames.get(`${objectType}:${objectId}:${objectVersion}`)
      ?? objectNames.get(`${objectType}:${objectId}:`)
      ?? objectId
    const sourceRefId = stringValue(operation.source_ref_id)
    const result = resultValue(operation)

    return [{
      id: `pmc-operation-${operationId}`,
      occurredAt: new Date(occurredAtUnixMs).toISOString(),
      dispatchType,
      eventType: "pmc.operation.created",
      objectName: name || "未命名对象",
      objectVersion: objectVersion || undefined,
      taskId: sourceRefId || operationId,
      operationId,
      actorName: actorName(identity),
      actorId: identity.id || "-",
      targetSummary: `${totalCount} 个目标`,
      agentSummary: `${totalCount} 个 Agent`,
      result,
      successCount: numberValue(operation.success_count),
      failedCount: numberValue(operation.failed_count) + numberValue(operation.canceled_count),
      pendingCount,
      totalCount,
      reason: stringValue(operation.cancel_reason) || (result === "timeout" ? "存在结果未确认的 Agent" : undefined),
      payload: {
        operation_id: operationId,
        source_type: stringValue(operation.source_type),
        source_ref_id: sourceRefId,
        object_type: objectType,
        object_id: objectId,
        object_version: objectVersion,
        operation: stringValue(operation.operation) || numberValue(operation.operation),
        planning_status: stringValue(operation.planning_status),
        status: stringValue(operation.status),
        outcome: stringValue(operation.outcome),
        revision: numberValue(operation.revision),
        materialized_count: numberValue(operation.materialized_count),
        skipped_count: numberValue(operation.skipped_count),
        canceled_count: numberValue(operation.canceled_count),
        result_version: numberValue(operation.result_version),
        actor_type: identity.type,
        actor_id: identity.id,
      },
    }]
  }).sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
}
export async function listDispatchExecutionResults(operationId: string): Promise<DispatchExecutionResult[]> {
  const normalizedOperationId = operationId.trim()
  if (!normalizedOperationId) return []

  const items: DispatchExecutionResult[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await http.post("queryPMCExecutionResults", {
      request_id: createRequestId(),
      operation_id: normalizedOperationId,
      page,
      page_size: PAGE_SIZE,
    }) as ApiResult<QueryExecutionResultsData>
    const batch = Array.isArray(result.data?.results) ? result.data.results : []

    batch.forEach((item, index) => {
      const dispatchId = stringValue(item.dispatch_id)
      const agentId = stringValue(item.agent_id)
      items.push({
        id: dispatchId || `${normalizedOperationId}:${agentId}:${page}:${index}`,
        operationId: stringValue(item.operation_id) || normalizedOperationId,
        dispatchId,
        agentId,
        publishStatus: stringValue(item.publish_status) || "-",
        executionStatus: executionStatusValue(item.execution_status),
        failureCertainty: failureCertaintyValue(item.failure_certainty),
        taskVisibility: stringValue(item.task_visibility) || "unknown",
        reasonCode: stringValue(item.reason_code) || undefined,
        reasonMessage: stringValue(item.reason_message) || undefined,
        errorCode: stringValue(item.error_code) || undefined,
        errorMessage: stringValue(item.error_message) || undefined,
        createdAt: optionalIsoDate(item.created_at_unix_ms),
        updatedAt: optionalIsoDate(item.updated_at_unix_ms),
        publishedAt: optionalIsoDate(item.published_at_unix_ms),
        startedAt: optionalIsoDate(item.started_at_unix_ms),
        lastReportAt: optionalIsoDate(item.last_report_at_unix_ms),
        finishedAt: optionalIsoDate(item.finished_at_unix_ms),
      })
    })

    if (batch.length < PAGE_SIZE) break
  }

  return items
}
