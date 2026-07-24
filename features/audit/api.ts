"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type {
  AuditResult,
  ChangeAuditAction,
  ChangeAuditEvent,
  DispatchAuditEvent,
  DispatchExecutionResult,
  DispatchExecutionStatus,
  DispatchTimeRange,
  DispatchType,
  UserActionType,
  UserActivityAudit,
} from "@/features/audit/types"

const PAGE_SIZE = 100
const MAX_PAGES = 20
const USER_AUDIT_PAGE_SIZE = 200
const TIME_RANGE_DAYS: Record<Exclude<DispatchTimeRange, "custom">, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

interface ApiResult<T> {
  data?: T
}

interface UserPermissionAuditEventData {
  id?: number | string
  event_key?: string
  request_id?: string
  event_type?: string
  actor_type?: string
  actor_id?: string
  actor_username?: string
  source_ip?: string
  target_user_id?: string
  target_username?: string
  old_role?: string
  new_role?: string
  old_status?: string
  new_status?: string
  payload_json?: string
  occurred_at_unix_ms?: number | string
  created_at_unix_ms?: number | string
}

interface ListUserPermissionAuditEventsData {
  events?: UserPermissionAuditEventData[]
  total?: number | string
}

export interface UserAuditQuery {
  occurredAfterUnixMs?: number
  occurredBeforeUnixMs?: number
}

export interface UserAuditListResult {
  items: UserActivityAudit[]
  total: number
  truncated: boolean
}

export interface DispatchAuditQuery {
  occurredAfterUnixMs?: number
  occurredBeforeUnixMs?: number
}

export interface ChangeAuditQuery {
  occurredAfterUnixMs?: number
  occurredBeforeUnixMs?: number
}

export interface ChangeAuditListResult {
  items: ChangeAuditEvent[]
  total: number
  truncated: boolean
}

const CHANGE_EVENT_TYPES = [
  "pmc.catalog.object.created",
  "pmc.catalog.command.ensured",
  "pmc.catalog.object.version_updated",
  "pmc.catalog.delete.accepted",
  "pmc.catalog.delete.retry.accepted",
  "pmc.catalog.delete.aborted",
  "pmc.catalog.object.deleted",
] as const

function changeAuditActionValue(eventType: string, outcome: string): ChangeAuditAction | undefined {
  switch (eventType) {
    case "pmc.catalog.object.created":
      return "created"
    case "pmc.catalog.command.ensured":
      if (outcome === "created") return "created"
      if (outcome === "reused") return "reused"
      return "legacyCommand"
    case "pmc.catalog.object.version_updated":
      return "updated"
    case "pmc.catalog.delete.accepted":
    case "pmc.catalog.delete.retry.accepted":
      return "deleteAccepted"
    case "pmc.catalog.object.deleted":
      return "deleteCompleted"
    case "pmc.catalog.delete.aborted":
      return "deleteAborted"
    default:
      return undefined
  }
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
  event_key?: string
  event_type?: string
  operation_id?: string
  dispatch_id?: string
  object_type?: number | string
  object_id?: string
  agent_id?: string
  result_version?: number | string
  actor_type?: string
  actor_id?: string
  payload_json?: string
  occurred_at_unix_ms?: number | string
  created_at_unix_ms?: number | string
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

function userActionType(eventType: unknown): UserActionType {
  switch (stringValue(eventType).toLowerCase()) {
    case "user.created":
      return "ADD_USER"
    case "user.profile.updated":
      return "UPDATE_USER"
    case "user.password.updated":
      return "PASSWORD_CHANGE"
    case "user.status.updated":
      return "STATUS_CHANGE"
    case "user.role.updated":
      return "ROLE_CHANGE"
    case "user.soft_deleted":
    case "user.hard_deleted":
      return "DELETE_USER"
    default:
      return "OTHER"
  }
}

function parseAuditPayload(value: unknown): Record<string, unknown> {
  const payload = stringValue(value)
  if (!payload) return {}

  try {
    const parsed = JSON.parse(payload)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return { payload: parsed }
  } catch {
    return { payload }
  }
}

function compactAuditDetails(details: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== "" && value !== undefined),
  )
}

function userActivityAudit(event: UserPermissionAuditEventData): UserActivityAudit | null {
  const occurredAtUnixMs = numberValue(event.occurred_at_unix_ms)
    || numberValue(event.created_at_unix_ms)
  if (occurredAtUnixMs <= 0) return null

  const actorType = stringValue(event.actor_type)
  const actorId = stringValue(event.actor_id)
  const actorUsername = stringValue(event.actor_username)
  const sourceIp = stringValue(event.source_ip)
  const targetUserId = stringValue(event.target_user_id)
  const eventType = stringValue(event.event_type)
  const eventKey = stringValue(event.event_key)
  const requestId = stringValue(event.request_id)
  const numericId = stringValue(String(event.id ?? ""))
  const timestamp = new Date(occurredAtUnixMs).toISOString()

  return {
    eventId: eventKey || (numericId ? `user-audit-${numericId}` : requestId || `${eventType}:${targetUserId}:${occurredAtUnixMs}`),
    userId: actorId || "-",
    username: actorUsername || (actorType === "system" ? actorId || "system" : "-"),
    sourceIp: sourceIp || undefined,
    timestamp,
    actionType: userActionType(eventType),
    // These rows are committed with successful user mutations; failed mutations do not produce permission-audit rows.
    result: "SUCCESS",
    targetId: targetUserId || undefined,
    targetName: stringValue(event.target_username) || undefined,
    targetType: "USER",
    details: compactAuditDetails({
      ...parseAuditPayload(event.payload_json),
      eventType,
      requestId,
      actorType,
      actorUsername,
      targetUsername: stringValue(event.target_username),
      oldRole: stringValue(event.old_role),
      newRole: stringValue(event.new_role),
      oldStatus: stringValue(event.old_status),
      newStatus: stringValue(event.new_status),
    }),
  }
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

function displaySourceReference(sourceRefId: string) {
  const separatorIndex = sourceRefId.indexOf(":")
  return separatorIndex > 0 ? sourceRefId.slice(0, separatorIndex) : sourceRefId
}
function parseManualActor(sourceRefId: string) {
  if (!sourceRefId.startsWith("manual:")) return ""
  return sourceRefId.split(":", 3)[1] || ""
}
async function listRecentOperations(cutoffUnixMs: number, occurredBeforeUnixMs: number) {
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

  return operations.filter((operation) => {
    const occurredAtUnixMs = numberValue(operation.created_at_unix_ms)
    return occurredAtUnixMs >= cutoffUnixMs && occurredAtUnixMs <= occurredBeforeUnixMs
  })
}

async function listOperationActors(cutoffUnixMs: number, nowUnixMs: number) {
  const actors = new Map<string, ActorIdentity>()

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await http.post("listPMCAuditEvents", {
      request_id: createRequestId(),
      event_type: "pmc.operation.created",
      occurred_after_unix_ms: cutoffUnixMs,
      occurred_before_unix_ms: nowUnixMs,
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

export async function listUserActivityAudits(query: UserAuditQuery = {}): Promise<UserAuditListResult> {
  const occurredAfterUnixMs = Math.max(0, Math.trunc(query.occurredAfterUnixMs ?? 0))
  const occurredBeforeUnixMs = Math.max(0, Math.trunc(query.occurredBeforeUnixMs ?? 0))
  if (occurredAfterUnixMs > 0 && occurredBeforeUnixMs > 0 && occurredAfterUnixMs > occurredBeforeUnixMs) {
    throw new Error("用户审计的结束时间不能早于开始时间")
  }

  const events: UserPermissionAuditEventData[] = []
  let total = 0

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await http.post("listUserPermissionAuditEvents", {
      request_id: createRequestId(),
      ...(occurredAfterUnixMs > 0 ? { occurred_after_unix_ms: occurredAfterUnixMs } : {}),
      ...(occurredBeforeUnixMs > 0 ? { occurred_before_unix_ms: occurredBeforeUnixMs } : {}),
      page,
      page_size: USER_AUDIT_PAGE_SIZE,
    }) as ApiResult<ListUserPermissionAuditEventsData>
    const batch = Array.isArray(result.data?.events) ? result.data.events : []
    events.push(...batch)
    total = numberValue(result.data?.total, events.length)

    if (batch.length === 0 || events.length >= total) break
  }

  const items = events
    .map(userActivityAudit)
    .filter((event): event is UserActivityAudit => event !== null)
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))

  return {
    items,
    total,
    truncated: events.length < total,
  }
}

export async function listDispatchAuditEvents(
  timeRange: DispatchTimeRange = "7d",
  query: DispatchAuditQuery = {},
): Promise<DispatchAuditEvent[]> {
  const nowUnixMs = Date.now()
  const customAfterUnixMs = Math.max(0, Math.trunc(query.occurredAfterUnixMs ?? 0))
  const customBeforeUnixMs = Math.max(0, Math.trunc(query.occurredBeforeUnixMs ?? 0))
  if (customAfterUnixMs > 0 && customBeforeUnixMs > 0 && customAfterUnixMs > customBeforeUnixMs) {
    throw new Error("下发审计的结束时间不能早于开始时间")
  }

  const cutoffUnixMs = timeRange === "custom"
    ? customAfterUnixMs
    : nowUnixMs - TIME_RANGE_DAYS[timeRange] * 24 * 60 * 60 * 1000
  const occurredBeforeUnixMs = timeRange === "custom" && customBeforeUnixMs > 0
    ? customBeforeUnixMs
    : nowUnixMs
  const [operations, actors, objectNames] = await Promise.all([
    listRecentOperations(cutoffUnixMs, occurredBeforeUnixMs),
    listOperationActors(cutoffUnixMs, occurredBeforeUnixMs),
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
      taskId: displaySourceReference(sourceRefId) || operationId,
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

export async function listChangeAuditEvents(query: ChangeAuditQuery = {}): Promise<ChangeAuditListResult> {
  const occurredAfterUnixMs = Math.max(0, Math.trunc(query.occurredAfterUnixMs ?? 0))
  const occurredBeforeUnixMs = Math.max(0, Math.trunc(query.occurredBeforeUnixMs ?? 0))
  if (occurredAfterUnixMs > 0 && occurredBeforeUnixMs > 0 && occurredAfterUnixMs > occurredBeforeUnixMs) {
    throw new Error("变更审计的结束时间不能早于开始时间")
  }

  const eventTypes = CHANGE_EVENT_TYPES
  const pages = await Promise.all(eventTypes.map(async (eventType) => {
    const events: PMCAuditEventData[] = []
    let completed = false

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await http.post("listPMCAuditEvents", {
        request_id: createRequestId(),
        event_type: eventType,
        ...(occurredAfterUnixMs > 0 ? { occurred_after_unix_ms: occurredAfterUnixMs } : {}),
        ...(occurredBeforeUnixMs > 0 ? { occurred_before_unix_ms: occurredBeforeUnixMs } : {}),
        page,
        page_size: PAGE_SIZE,
      }) as ApiResult<ListAuditEventsData>
      const batch = Array.isArray(result.data?.events) ? result.data.events : []
      events.push(...batch)
      const backendTotal = numberValue(result.data?.total, events.length)

      if (batch.length === 0 || batch.length < PAGE_SIZE || events.length >= backendTotal) {
        completed = true
        break
      }
    }

    return { events, truncated: !completed }
  }))
  const events = pages.flatMap((page) => page.events)
  const truncated = pages.some((page) => page.truncated)

  const changeEvents = events
    .map((event): ChangeAuditEvent | null => {
      const eventType = stringValue(event.event_type)
      const objectType = dispatchTypeValue(event.object_type)
      const objectId = stringValue(event.object_id)
      const occurredAtUnixMs = numberValue(event.occurred_at_unix_ms) || numberValue(event.created_at_unix_ms)
      if (!objectType || !objectId || occurredAtUnixMs <= 0) return null

      const payload = parseAuditPayload(event.payload_json)
      const outcome = stringValue(payload.outcome)
      const action = changeAuditActionValue(eventType, outcome)
      if (!action) return null
      const previousVersion = stringValue(payload.previous_version)
      const newVersion = stringValue(payload.new_version)
        || stringValue(payload.version)
        || stringValue(payload.object_version)
        || stringValue(event.result_version)
      const version = newVersion || previousVersion
      const actorType = stringValue(event.actor_type) || "system"
      const actorId = stringValue(event.actor_id) || "-"
      const eventId = stringValue(event.event_key) || stringValue(event.id == null ? "" : String(event.id))

      return {
        id: eventId || ("pmc-change:" + eventType + ":" + objectType + ":" + objectId + ":" + occurredAtUnixMs),
        occurredAt: new Date(occurredAtUnixMs).toISOString(),
        eventType,
        action,
        objectType,
        objectId,
        objectName: stringValue(payload.object_name) || objectId,
        objectVersion: version || undefined,
        previousVersion: previousVersion || undefined,
        newVersion: newVersion || undefined,
        actorType,
        actorId,
        requestedBy: stringValue(payload.requested_by) || undefined,
        outcome: outcome || undefined,
        reason: stringValue(payload.reason) || undefined,
        operationId: stringValue(event.operation_id) || undefined,
        requestId: stringValue(payload.request_id) || undefined,
        payload,
      }
    })
    .filter((event): event is ChangeAuditEvent => event !== null)

  if (changeEvents.length === 0) {
    return { items: [], total: 0, truncated }
  }

  const objectNames = await listObjectNames()
  changeEvents.forEach((event) => {
    const objectTypeCode = objectTypeValue(event.objectType)
    event.objectName = objectNames.get(objectTypeCode + ":" + event.objectId + ":" + (event.objectVersion ?? ""))
      ?? objectNames.get(objectTypeCode + ":" + event.objectId + ":")
      ?? event.objectName
  })

  changeEvents.sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
  return {
    items: changeEvents,
    total: changeEvents.length,
    truncated,
  }
}

export async function listDispatchExecutionResults(operationId: string, page = 1, pageSize = 10) {
  const normalizedOperationId = operationId.trim()
  const normalizedPage = Math.max(1, Math.trunc(page))
  const normalizedPageSize = Math.min(100, Math.max(1, Math.trunc(pageSize)))
  if (!normalizedOperationId) {
    return { items: [] as DispatchExecutionResult[], total: 0, page: normalizedPage, pageSize: normalizedPageSize }
  }

  const result = await http.post("queryPMCExecutionResults", {
    request_id: createRequestId(),
    operation_id: normalizedOperationId,
    page: normalizedPage,
    page_size: normalizedPageSize,
  }) as ApiResult<QueryExecutionResultsData>
  const batch = Array.isArray(result.data?.results) ? result.data.results : []
  const items = batch.map((item, index): DispatchExecutionResult => {
    const dispatchId = stringValue(item.dispatch_id)
    const agentId = stringValue(item.agent_id)
    return {
      id: dispatchId || `${normalizedOperationId}:${agentId}:${normalizedPage}:${index}`,
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
    }
  })

  return {
    items,
    total: numberValue(result.data?.total, items.length),
    page: normalizedPage,
    pageSize: normalizedPageSize,
  }
}
