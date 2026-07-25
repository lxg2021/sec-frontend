import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

export type ControlObjectType = "policy" | "command" | "config"
export type ControlObjectSource = "builtin" | "manual" | "remediation" | "mitigation" | "unknown"
export type ControlObjectOperation = "apply" | "stop" | "remove" | "execute"
export type ControlObjectDeleteMode = "forbidden" | "metadata_only" | "remove_effects" | "unknown"

export interface ControlObjectCapabilities {
  profile: string
  contractVersion: number
  allowedOperations: ControlObjectOperation[]
  canUpdate: boolean
  deleteMode: ControlObjectDeleteMode
}

export interface ControlObjectDefinition {
  objectId: string
  objectType: ControlObjectType
  objectTypeValue: 1 | 2 | 3
  internalName: string
  displayName: string
  subType: number
  version: string
  source: ControlObjectSource
  state: string
  stateVersion: number
  capabilities: ControlObjectCapabilities
}

export interface ControlObjectDetail {
  definition: ControlObjectDefinition
  rawDefinition: Record<string, unknown>
  displayJson: string
}

export interface ControlObjectOperationResult {
  operationId: string
  planningStatus: string
  status: string
  outcome: string
  totalCount: number
  pendingCount: number
  runningCount: number
  successCount: number
  failedCount: number
  skippedCount: number
  canceledCount: number
}

export interface ControlObjectAgentState {
  agentId: string
  objectVersion: string
  currentEffect: {
    objectVersion: string
    currentState: string
    applyState: string
  } | null
  hasActiveChange: boolean
}

export interface ControlObjectDeleteResult {
  objectId: string
  state: string
  stateVersion: number
  operationId: string
}

interface ApiResult<T> {
  data: T
}

interface RawListResponseData {
  definitions?: unknown
  total?: unknown
  page?: unknown
  page_size?: unknown
  pageSize?: unknown
}

interface RawAgentListResponseData {
  agents?: unknown
  total?: unknown
  page?: unknown
  page_size?: unknown
  pageSize?: unknown
}

const PAGE_SIZE = 100
const MAX_PAGES = 100

const OPERATION_TYPE_VALUE: Record<ControlObjectOperation, 1 | 2 | 3 | 4> = {
  apply: 1,
  stop: 2,
  remove: 3,
  execute: 4,
}

export const BUILTIN_CONTROL_OBJECT_IDS = {
  baselineScanPolicy: "6f2c9d3a-8e47-4f6b-b9f2-1e3c4a7d8b21",
  patchScanPolicy: "7f3a9c42-1d6f-4b8e-9e21-8c6b0a5d4f93",
  generalConfig: "9a182447-b61d-48f6-b99c-264c128aeebb",
  reportConfig: "32cbdb22-52e0-43f7-a663-ce6335c28850",
  sensorConfig: "d4f1a2c7-9b8e-4f3c-ae6b-57d2f1e4c9a0",
  patchImmediateScan: "3f6c2a9e-9b1f-4a7d-8e3c-6c8d1b2f4e91",
  baselineImmediateScan: "4a7c3b8d-2f1e-5b9c-8d7e-9c3d5a6f4b20",
} as const

const BUILTIN_DISPLAY_NAMES = new Map<string, string>([
  [BUILTIN_CONTROL_OBJECT_IDS.baselineScanPolicy, "基线扫描策略"],
  [BUILTIN_CONTROL_OBJECT_IDS.patchScanPolicy, "漏洞扫描策略"],
  [BUILTIN_CONTROL_OBJECT_IDS.generalConfig, "通用配置"],
  [BUILTIN_CONTROL_OBJECT_IDS.reportConfig, "上报配置"],
  [BUILTIN_CONTROL_OBJECT_IDS.sensorConfig, "传感器配置"],
  [BUILTIN_CONTROL_OBJECT_IDS.patchImmediateScan, "漏洞立即扫描"],
  [BUILTIN_CONTROL_OBJECT_IDS.baselineImmediateScan, "基线立即扫描"],
])

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function fieldValue(record: Record<string, unknown> | null, ...keys: string[]) {
  if (!record) return undefined
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key]
  }
  return undefined
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return ""
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function booleanValue(value: unknown) {
  if (value === true || value === 1 || value === "1") return true
  return typeof value === "string" && value.trim().toLowerCase() === "true"
}

function normalizeObjectType(value: unknown): 1 | 2 | 3 | null {
  const numeric = numberValue(value, Number.NaN)
  if (numeric === 1 || numeric === 2 || numeric === 3) return numeric

  const normalized = stringValue(value).toUpperCase()
  if (normalized.includes("POLICY")) return 1
  if (normalized.includes("COMMAND")) return 2
  if (normalized.includes("CONFIG")) return 3
  return null
}

function objectTypeName(value: 1 | 2 | 3): ControlObjectType {
  if (value === 1) return "policy"
  if (value === 2) return "command"
  return "config"
}

function normalizeOperation(value: unknown): ControlObjectOperation | null {
  const numeric = numberValue(value, Number.NaN)
  if (numeric === 1) return "apply"
  if (numeric === 2) return "stop"
  if (numeric === 3) return "remove"
  if (numeric === 4) return "execute"

  const normalized = stringValue(value).toUpperCase()
  if (normalized.includes("EXECUTE")) return "execute"
  if (normalized.includes("REMOVE")) return "remove"
  if (normalized.includes("STOP")) return "stop"
  if (normalized.includes("APPLY")) return "apply"
  return null
}

function normalizeDeleteMode(value: unknown): ControlObjectDeleteMode {
  const numeric = numberValue(value, Number.NaN)
  if (numeric === 1) return "forbidden"
  if (numeric === 2) return "metadata_only"
  if (numeric === 3) return "remove_effects"

  const normalized = stringValue(value).toUpperCase()
  if (normalized.includes("REMOVE_EFFECTS")) return "remove_effects"
  if (normalized.includes("METADATA_ONLY")) return "metadata_only"
  if (normalized.includes("FORBIDDEN")) return "forbidden"
  return "unknown"
}

function normalizeCreationSource(value: unknown): ControlObjectSource {
  const numeric = numberValue(value, Number.NaN)
  if (numeric === 1) return "builtin"
  if (numeric === 2) return "manual"
  if (numeric === 3) return "remediation"
  if (numeric === 4) return "mitigation"

  const normalized = stringValue(value).toUpperCase()
  if (normalized === "BUILTIN" || normalized === "PMC_CREATION_SOURCE_BUILTIN") return "builtin"
  if (normalized === "MANUAL" || normalized === "PMC_CREATION_SOURCE_MANUAL") return "manual"
  if (normalized === "REMEDIATION" || normalized === "PMC_CREATION_SOURCE_REMEDIATION") return "remediation"
  if (normalized === "MITIGATION" || normalized === "PMC_CREATION_SOURCE_MITIGATION") return "mitigation"
  return "unknown"
}

function extractContent(definition: Record<string, unknown>, objectType: ControlObjectType) {
  const direct = recordValue(fieldValue(
    definition,
    objectType,
    objectType[0].toUpperCase() + objectType.slice(1),
  ))
  if (direct) return direct

  const wrapper = recordValue(fieldValue(definition, "content", "Content"))
  return recordValue(fieldValue(
    wrapper,
    objectType,
    objectType[0].toUpperCase() + objectType.slice(1),
  ))
}

function normalizeCapabilities(value: unknown): ControlObjectCapabilities {
  const capabilities = recordValue(value)
  const rawOperations = fieldValue(
    capabilities,
    "allowed_agent_operations",
    "allowedAgentOperations",
    "AllowedAgentOperations",
  )
  const allowedOperations = Array.isArray(rawOperations)
    ? Array.from(new Set(rawOperations.map(normalizeOperation).filter((operation): operation is ControlObjectOperation => Boolean(operation))))
    : []

  return {
    profile: stringValue(fieldValue(capabilities, "capability_profile", "capabilityProfile", "CapabilityProfile")),
    contractVersion: numberValue(fieldValue(
      capabilities,
      "capability_contract_version",
      "capabilityContractVersion",
      "CapabilityContractVersion",
    )),
    allowedOperations,
    canUpdate: booleanValue(fieldValue(capabilities, "can_update", "canUpdate", "CanUpdate")),
    deleteMode: normalizeDeleteMode(fieldValue(
      capabilities,
      "catalog_delete_mode",
      "catalogDeleteMode",
      "CatalogDeleteMode",
    )),
  }
}

function normalizeDefinition(value: unknown): ControlObjectDefinition {
  const definition = recordValue(value)
  if (!definition) throw new Error("PMC_OBJECT_DEFINITION_INVALID")

  const objectTypeValue = normalizeObjectType(fieldValue(definition, "type", "Type", "object_type", "objectType"))
  const objectId = stringValue(fieldValue(definition, "object_id", "objectId", "ObjectId", "ObjectID"))
  if (!objectTypeValue || !objectId) throw new Error("PMC_OBJECT_DEFINITION_INVALID")

  const objectType = objectTypeName(objectTypeValue)
  const content = extractContent(definition, objectType)
  if (!content) throw new Error("PMC_OBJECT_DEFINITION_INVALID")

  const internalName = stringValue(fieldValue(content, "name", "Name"))
  const version = stringValue(fieldValue(
    definition,
    "object_version",
    "objectVersion",
    "ObjectVersion",
  )) || stringValue(fieldValue(content, "version", "Version"))
  if (!internalName || !version) throw new Error("PMC_OBJECT_DEFINITION_INVALID")

  const normalizedId = objectId.toLowerCase()

  return {
    objectId,
    objectType,
    objectTypeValue,
    internalName,
    displayName: BUILTIN_DISPLAY_NAMES.get(normalizedId) ?? internalName,
    subType: numberValue(fieldValue(content, "sub_type", "subType", "SubType", "subtype")),
    version,
    source: normalizeCreationSource(fieldValue(
      definition,
      "creation_source",
      "creationSource",
      "CreationSource",
    )),
    state: stringValue(fieldValue(definition, "object_state", "objectState", "ObjectState")) || "active",
    stateVersion: Math.max(0, numberValue(fieldValue(
      definition,
      "state_version",
      "stateVersion",
      "StateVersion",
    ))),
    capabilities: normalizeCapabilities(fieldValue(definition, "capabilities", "Capabilities")),
  }
}

function cloneDefinitionForDisplay(definition: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(definition)) as Record<string, unknown>
}

function expandContextForDisplay(definition: Record<string, unknown>, objectType: ControlObjectType) {
  const content = extractContent(definition, objectType)
  if (!content) return

  for (const key of ["context", "Context"]) {
    if (!Object.prototype.hasOwnProperty.call(content, key) || typeof content[key] !== "string") continue
    try {
      content[key] = JSON.parse(content[key] as string) as unknown
    } catch {
      // Context is an opaque string for some PMC objects; preserve it verbatim.
    }
    return
  }
}

function compareDefinitions(left: ControlObjectDefinition, right: ControlObjectDefinition) {
  const typeOrder = { config: 0, policy: 1, command: 2 } satisfies Record<ControlObjectType, number>
  return typeOrder[left.objectType] - typeOrder[right.objectType]
    || left.displayName.localeCompare(right.displayName, "zh-CN")
    || left.objectId.localeCompare(right.objectId)
}

function isControlLibraryObject(definition: ControlObjectDefinition) {
  return definition.source !== "remediation" && definition.source !== "mitigation"
}

export async function listControlObjectDefinitions(): Promise<ControlObjectDefinition[]> {
  const collected: ControlObjectDefinition[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (collected.length < total && page <= MAX_PAGES) {
    const result = (await http.post("listPMCObjectDefinitions", {
      request_id: createRequestId(),
      object_type: 0,
      lifecycle_state: "active",
      page,
      page_size: PAGE_SIZE,
    })) as ApiResult<RawListResponseData | null>

    const data = recordValue(result.data)
    const rawDefinitions = fieldValue(data, "definitions", "Definitions")
    const responseTotal = Math.max(0, numberValue(fieldValue(data, "total", "Total")))
    const normalizedDefinitions = rawDefinitions == null && responseTotal === 0
      ? []
      : rawDefinitions
    if (!Array.isArray(normalizedDefinitions)) throw new Error("PMC_OBJECT_LIST_INVALID")

    const pageItems = normalizedDefinitions.map(normalizeDefinition)
    collected.push(...pageItems)
    total = responseTotal || collected.length

    if (pageItems.length === 0 || collected.length >= total) break
    page += 1
  }

  if (collected.length < total) throw new Error("PMC_OBJECT_LIST_TRUNCATED")

  return Array.from(
    new Map(collected.map((definition) => [
      `${definition.objectTypeValue}:${definition.objectId.toLowerCase()}`,
      definition,
    ])).values(),
  ).filter(isControlLibraryObject).sort(compareDefinitions)
}

export async function getControlObjectDefinition(
  definition: ControlObjectDefinition,
): Promise<ControlObjectDetail> {
  const result = (await http.post("getPMCObjectDefinition", {
    request_id: createRequestId(),
    object_type: definition.objectTypeValue,
    object_id: definition.objectId,
    version: definition.version,
  })) as ApiResult<Record<string, unknown> | null>

  const data = recordValue(result.data)
  const rawDefinition = recordValue(fieldValue(data, "definition", "Definition"))
  if (!rawDefinition) throw new Error("PMC_OBJECT_DETAIL_INVALID")

  const normalized = normalizeDefinition(rawDefinition)
  if (
    normalized.objectTypeValue !== definition.objectTypeValue
    || normalized.objectId.toLowerCase() !== definition.objectId.toLowerCase()
    || normalized.version !== definition.version
  ) {
    throw new Error("PMC_OBJECT_DETAIL_MISMATCH")
  }

  const displayDefinition = cloneDefinitionForDisplay(rawDefinition)
  expandContextForDisplay(displayDefinition, normalized.objectType)

  return {
    definition: normalized,
    rawDefinition,
    displayJson: JSON.stringify(displayDefinition, null, 2),
  }
}

function normalizeAgentIds(agentIds: string[]) {
  return Array.from(new Set(agentIds.map((agentId) => agentId.trim()).filter(Boolean)))
}

function normalizeAgentState(
  value: unknown,
  definition: ControlObjectDefinition,
): ControlObjectAgentState {
  const agent = recordValue(value)
  if (!agent) throw new Error("PMC_OBJECT_AGENT_INVALID")

  const agentId = stringValue(fieldValue(agent, "agent_id", "agentId", "AgentId", "AgentID"))
  const objectType = normalizeObjectType(fieldValue(agent, "object_type", "objectType", "ObjectType"))
  const objectId = stringValue(fieldValue(agent, "object_id", "objectId", "ObjectId", "ObjectID"))
  if (
    !agentId
    || objectType !== definition.objectTypeValue
    || objectId.toLowerCase() !== definition.objectId.toLowerCase()
  ) {
    throw new Error("PMC_OBJECT_AGENT_INVALID")
  }

  const effect = recordValue(fieldValue(agent, "current_effect", "currentEffect", "CurrentEffect"))
  const currentEffect = effect
    ? {
        objectVersion: stringValue(fieldValue(
          effect,
          "object_version",
          "objectVersion",
          "ObjectVersion",
        )),
        currentState: stringValue(fieldValue(
          effect,
          "current_state",
          "currentState",
          "CurrentState",
        )).toLowerCase(),
        applyState: stringValue(fieldValue(
          effect,
          "apply_state",
          "applyState",
          "ApplyState",
        )).toLowerCase(),
      }
    : null

  return {
    agentId,
    objectVersion: stringValue(fieldValue(
      agent,
      "object_version",
      "objectVersion",
      "ObjectVersion",
    )),
    currentEffect,
    hasActiveChange: Boolean(recordValue(fieldValue(
      agent,
      "active_change",
      "activeChange",
      "ActiveChange",
    ))),
  }
}

export async function queryControlObjectAgents(
  definition: ControlObjectDefinition,
): Promise<ControlObjectAgentState[]> {
  const collected: ControlObjectAgentState[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (collected.length < total && page <= MAX_PAGES) {
    const result = (await http.post("queryPMCAgentsByObjectID", {
      request_id: createRequestId(),
      object_type: definition.objectTypeValue,
      object_id: definition.objectId,
      // Intentionally omit object_version: STOP/REMOVE must also find Agents
      // whose authoritative Current Effect is still on an older version.
      page,
      page_size: PAGE_SIZE,
    })) as ApiResult<RawAgentListResponseData | null>

    const data = recordValue(result.data)
    const rawAgents = fieldValue(data, "agents", "Agents")
    const responseTotal = Math.max(0, numberValue(fieldValue(data, "total", "Total")))
    const normalizedAgents = rawAgents == null && responseTotal === 0 ? [] : rawAgents
    if (!Array.isArray(normalizedAgents)) throw new Error("PMC_OBJECT_AGENT_LIST_INVALID")

    const pageItems = normalizedAgents.map((agent) => normalizeAgentState(agent, definition))
    collected.push(...pageItems)
    total = responseTotal || collected.length

    if (pageItems.length === 0 || collected.length >= total) break
    page += 1
  }

  if (collected.length < total) throw new Error("PMC_OBJECT_AGENT_LIST_TRUNCATED")

  return Array.from(new Map(
    collected.map((agent) => [agent.agentId, agent]),
  ).values())
}

function normalizeOperationResult(value: unknown): ControlObjectOperationResult {
  const operation = recordValue(value)
  const operationId = stringValue(fieldValue(operation, "operation_id", "operationId", "OperationId"))
  if (!operationId) throw new Error("PMC_OPERATION_RESPONSE_INVALID")

  return {
    operationId,
    planningStatus: stringValue(fieldValue(operation, "planning_status", "planningStatus", "PlanningStatus")),
    status: stringValue(fieldValue(operation, "status", "Status")),
    outcome: stringValue(fieldValue(operation, "outcome", "Outcome")),
    totalCount: Math.max(0, numberValue(fieldValue(operation, "total_count", "totalCount", "TotalCount"))),
    pendingCount: Math.max(0, numberValue(fieldValue(operation, "pending_count", "pendingCount", "PendingCount"))),
    runningCount: Math.max(0, numberValue(fieldValue(operation, "running_count", "runningCount", "RunningCount"))),
    successCount: Math.max(0, numberValue(fieldValue(operation, "success_count", "successCount", "SuccessCount"))),
    failedCount: Math.max(0, numberValue(fieldValue(operation, "failed_count", "failedCount", "FailedCount"))),
    skippedCount: Math.max(0, numberValue(fieldValue(operation, "skipped_count", "skippedCount", "SkippedCount"))),
    canceledCount: Math.max(0, numberValue(fieldValue(operation, "canceled_count", "canceledCount", "CanceledCount"))),
  }
}

export async function operateControlObject(
  definition: ControlObjectDefinition,
  operation: ControlObjectOperation,
  agentIds: string[],
): Promise<ControlObjectOperationResult> {
  if (definition.state.toLowerCase() !== "active") {
    throw new Error("PMC_OBJECT_NOT_ACTIVE")
  }
  if (!definition.capabilities.allowedOperations.includes(operation)) {
    throw new Error("PMC_OPERATION_NOT_ALLOWED")
  }

  const normalizedAgentIds = normalizeAgentIds(agentIds)
  if (normalizedAgentIds.length === 0 || normalizedAgentIds.length > 10_000) {
    throw new Error("PMC_AGENT_TARGETS_INVALID")
  }

  const result = (await http.post("operatePMCObject", {
    request_id: createRequestId(),
    object_type: definition.objectTypeValue,
    object_id: definition.objectId,
    object_version: definition.version,
    operation: OPERATION_TYPE_VALUE[operation],
    agent_ids: normalizedAgentIds,
  })) as ApiResult<Record<string, unknown> | null>

  const data = recordValue(result.data)
  return normalizeOperationResult(fieldValue(data, "operation", "Operation"))
}

export async function deleteControlObjectDefinition(
  definition: ControlObjectDefinition,
): Promise<ControlObjectDeleteResult> {
  if (definition.state.toLowerCase() !== "active") {
    throw new Error("PMC_OBJECT_NOT_ACTIVE")
  }
  if (
    definition.capabilities.deleteMode !== "metadata_only"
    && definition.capabilities.deleteMode !== "remove_effects"
  ) {
    throw new Error("PMC_DELETE_NOT_ALLOWED")
  }
  if (!Number.isSafeInteger(definition.stateVersion) || definition.stateVersion <= 0) {
    throw new Error("PMC_STATE_VERSION_INVALID")
  }

  const result = (await http.post("deletePMCObjectDefinition", {
    request_id: createRequestId(),
    object_type: definition.objectTypeValue,
    object_id: definition.objectId,
    expected_state_version: definition.stateVersion,
  })) as ApiResult<Record<string, unknown> | null>

  const data = recordValue(result.data)
  const object = recordValue(fieldValue(data, "object", "Object"))
  if (!object) throw new Error("PMC_DELETE_RESPONSE_INVALID")

  const objectId = stringValue(fieldValue(object, "object_id", "objectId", "ObjectId", "ObjectID"))
  if (objectId && objectId.toLowerCase() !== definition.objectId.toLowerCase()) {
    throw new Error("PMC_DELETE_RESPONSE_MISMATCH")
  }

  return {
    objectId: objectId || definition.objectId,
    state: stringValue(fieldValue(object, "object_state", "objectState", "ObjectState")),
    stateVersion: Math.max(0, numberValue(fieldValue(
      object,
      "state_version",
      "stateVersion",
      "StateVersion",
    ))),
    operationId: stringValue(fieldValue(data, "operation_id", "operationId", "OperationId")),
  }
}
