"use client"

import { http } from "@/shared/lib/http/client"
import { createUuidRequestId } from "@/shared/lib/utils"

import { ACCESS_ACTIONS } from "./access-control-options"
import type {
  AccessAccount,
  AccessControlOperation,
  AccessControlPolicyDraft,
  AccessHash,
  AccessPolicyType,
  AccessRuleDraft,
  AccessSubjectDraft,
  CreatedAccessControlPolicy,
} from "./access-control-types"

const PMC_OBJECT_TYPE_POLICY = 1
const PMC_OPERATION_APPLY = 1
const POLICY_VERSION_PATTERN = /^\d+\.\d+\.\d+$/
const MD5_PATTERN = /^[a-fA-F0-9]{32}$/

interface ApiResult<T> {
  data: T
}

interface CreateControlResponseData {
  object_id?: string
  type?: number
  name?: string
  version?: string | null
}

interface OperatePMCObjectResponseData {
  operation?: {
    operation_id?: string
    planning_status?: string
    status?: string
    outcome?: string
    total_count?: number
    materialized_count?: number
    pending_count?: number
    running_count?: number
    success_count?: number
    failed_count?: number
    uncertain_count?: number
    skipped_count?: number
    canceled_count?: number
  } | null
}

interface ProtoAccessSubject {
  type: AccessSubjectDraft["type"]
  path?: string[]
  hash?: AccessHash[]
  accounts?: AccessAccount[]
}

interface ProtoAccessRule {
  action: string
  effect: AccessRuleDraft["effect"]
  audit: boolean
}

interface CommonCreateRequest {
  request_id: string
  name: string
  version: string
}

export type CreateAccessControlPolicyRequest =
  | (CommonCreateRequest & {
      policy_info: {
        except: ProtoAccessSubject[]
        subject: ProtoAccessSubject[]
        object: { type: "file" | "registry"; path: string[] }
        rules: ProtoAccessRule[]
        priority: number
      }
    })
  | (CommonCreateRequest & {
      policy_info: {
        except: ProtoAccessSubject[]
        subject: ProtoAccessSubject[]
        object: { type: "process"; path: string[]; hash: AccessHash[] }
        rules: ProtoAccessRule[]
        priority: number
      }
    })
  | (CommonCreateRequest & {
      network_info: {
        rule: {
          direction: "in" | "out"
          action: "allow" | "block" | "bypass"
          profile: "domain" | "private" | "public" | "any"
        }
        protocol: {
          type: "tcp" | "udp" | "icmp" | "any"
          localport: string
          remoteport: string
        }
        address: { local: string; remote: string }
        program: { path: string; md5?: string }
        priority: number
      }
    })

const CREATE_ENDPOINTS: Record<AccessPolicyType, string> = {
  file: "createFileAccessPolicy",
  registry: "createRegistryAccessPolicy",
  process: "createProcessAccessPolicy",
  network: "createNetworkAccessPolicy",
}

const CREATE_ENDPOINT_PATHS: Record<AccessPolicyType, string> = {
  file: "/api/v1/sensor/control/fileaccess/policy",
  registry: "/api/v1/sensor/control/registryaccess/policy",
  process: "/api/v1/sensor/control/processaccess/policy",
  network: "/api/v1/sensor/control/network/policy",
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function normalizeHashes(hashes: AccessHash[]) {
  return hashes
    .map((hash) => ({ algo: hash.algo, value: hash.value.trim() }))
    .filter((hash) => hash.value)
}

function normalizeAccounts(accounts: AccessAccount[]) {
  return accounts
    .map((account) => ({
      ...(account.user_name?.trim() ? { user_name: account.user_name.trim() } : {}),
      ...(account.group_name?.trim() ? { group_name: account.group_name.trim() } : {}),
      sid: account.sid.trim(),
    }))
    .filter((account) => account.sid)
}

function normalizeSubject(subject: AccessSubjectDraft): ProtoAccessSubject {
  if (subject.type === "process") {
    return {
      type: "process",
      path: uniqueStrings(subject.paths),
      hash: normalizeHashes(subject.hashes),
    }
  }

  return {
    type: subject.type,
    accounts: normalizeAccounts(subject.accounts),
  }
}

function validateSubject(subject: AccessSubjectDraft) {
  if (subject.type === "process") {
    const paths = uniqueStrings(subject.paths)
    const hashes = normalizeHashes(subject.hashes)
    if (paths.length === 0 && hashes.length === 0) return false
    return hashes.every((hash) => hash.value.length > 0)
  }

  const accounts = normalizeAccounts(subject.accounts)
  return accounts.length > 0 && accounts.every((account) => account.sid.length > 0)
}

function validatePortExpression(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === "any") return true
  if (!normalized) return false

  return normalized.split(",").every((token) => {
    const parts = token.trim().split("-")
    if (parts.length > 2 || parts.some((part) => !/^\d+$/.test(part))) return false
    const numbers = parts.map(Number)
    if (numbers.some((port) => port < 0 || port > 65535)) return false
    return numbers.length === 1 || numbers[0] <= numbers[1]
  })
}

export function validateAccessControlDraft(draft: AccessControlPolicyDraft) {
  const errors: string[] = []
  if (!draft.name.trim()) errors.push("POLICY_NAME_REQUIRED")
  if (!POLICY_VERSION_PATTERN.test(draft.version.trim())) errors.push("POLICY_VERSION_INVALID")
  if (!Number.isInteger(draft.priority) || draft.priority < 0 || draft.priority > 255) {
    errors.push("POLICY_PRIORITY_INVALID")
  }

  if (draft.type === "network") {
    const network = draft.network
    if (!validatePortExpression(network.localPort) || !validatePortExpression(network.remotePort)) {
      errors.push("NETWORK_PORT_INVALID")
    }
    if (!network.localAddress.trim() || !network.remoteAddress.trim()) {
      errors.push("NETWORK_ADDRESS_REQUIRED")
    }
    if (!network.programPath.trim()) errors.push("NETWORK_PROGRAM_REQUIRED")
    if (network.programMd5.trim() && !MD5_PATTERN.test(network.programMd5.trim())) {
      errors.push("NETWORK_PROGRAM_MD5_INVALID")
    }
    return errors
  }

  if (draft.subjects.length === 0 || !draft.subjects.every(validateSubject)) {
    errors.push("SUBJECT_INVALID")
  }
  if (!draft.exceptions.every(validateSubject)) errors.push("EXCEPTION_INVALID")
  if (uniqueStrings(draft.objectPaths).length === 0) errors.push("OBJECT_PATH_REQUIRED")
  if (draft.objectHashes.some((hash) => !hash.value.trim())) errors.push("OBJECT_HASH_INVALID")

  const allowedActions = new Set(ACCESS_ACTIONS[draft.type])
  if (draft.rules.length === 0 || draft.rules.some((rule) => !allowedActions.has(rule.action))) {
    errors.push("RULE_INVALID")
  }
  if (new Set(draft.rules.map((rule) => rule.action)).size !== draft.rules.length) {
    errors.push("RULE_ACTION_DUPLICATED")
  }

  return errors
}

export function buildCreateAccessControlPolicyRequest(
  draft: AccessControlPolicyDraft,
  requestId: string,
): CreateAccessControlPolicyRequest {
  const errors = validateAccessControlDraft(draft)
  if (errors.length > 0) {
    throw new Error(`invalid access control policy draft: ${errors.join(",")}`)
  }

  const common = {
    request_id: requestId,
    name: draft.name.trim(),
    version: draft.version.trim(),
  }

  if (draft.type === "network") {
    const network = draft.network
    return {
      ...common,
      network_info: {
        rule: {
          direction: network.direction,
          action: network.action,
          profile: network.profile,
        },
        protocol: {
          type: network.protocol,
          localport: network.localPort.trim().toLowerCase(),
          remoteport: network.remotePort.trim().toLowerCase(),
        },
        address: {
          local: network.localAddress.trim(),
          remote: network.remoteAddress.trim(),
        },
        program: {
          path: network.programPath.trim(),
          ...(network.programMd5.trim() ? { md5: network.programMd5.trim().toLowerCase() } : {}),
        },
        priority: draft.priority,
      },
    }
  }

  const commonPolicyInfo = {
    except: draft.exceptions.map(normalizeSubject),
    subject: draft.subjects.map(normalizeSubject),
    rules: draft.rules.map((rule) => ({
      action: rule.action,
      effect: rule.effect,
      audit: rule.audit,
    })),
    priority: draft.priority,
  }

  if (draft.type === "process") {
    return {
      ...common,
      policy_info: {
        ...commonPolicyInfo,
        object: {
          type: "process",
          path: uniqueStrings(draft.objectPaths),
          hash: normalizeHashes(draft.objectHashes),
        },
      },
    }
  }

  return {
    ...common,
    policy_info: {
      ...commonPolicyInfo,
      object: {
        type: draft.type,
        path: uniqueStrings(draft.objectPaths),
      },
    },
  }
}

export function getAccessControlDraftFingerprint(draft: AccessControlPolicyDraft) {
  return JSON.stringify(buildCreateAccessControlPolicyRequest(draft, ""), [
    "name",
    "version",
    "policy_info",
    "network_info",
    "except",
    "subject",
    "object",
    "rules",
    "priority",
    "type",
    "path",
    "hash",
    "accounts",
    "algo",
    "value",
    "user_name",
    "group_name",
    "sid",
    "action",
    "effect",
    "audit",
    "rule",
    "profile",
    "direction",
    "protocol",
    "localport",
    "remoteport",
    "address",
    "local",
    "remote",
    "program",
    "md5",
  ])
}

export async function createAccessControlPolicy(
  draft: AccessControlPolicyDraft,
): Promise<CreatedAccessControlPolicy> {
  const request = buildCreateAccessControlPolicyRequest(draft, createUuidRequestId())
  const result = (await http.post(CREATE_ENDPOINTS[draft.type], request)) as ApiResult<CreateControlResponseData | null>
  const data = result.data
  const objectId = stringValue(data?.object_id)
  if (!objectId) throw new Error("missing access control policy object_id in response")

  return {
    objectId,
    objectType: numberValue(data?.type, PMC_OBJECT_TYPE_POLICY),
    name: stringValue(data?.name) || draft.name.trim(),
    version: stringValue(data?.version) || draft.version.trim(),
  }
}

export async function applyAccessControlPolicy(
  policy: CreatedAccessControlPolicy,
  agentIds: string[],
): Promise<AccessControlOperation> {
  const normalizedAgentIds = uniqueStrings(agentIds)
  if (normalizedAgentIds.length === 0) throw new Error("at least one target Agent is required")

  const result = (await http.post("operatePMCObject", {
    request_id: createUuidRequestId(),
    object_type: PMC_OBJECT_TYPE_POLICY,
    object_id: policy.objectId,
    object_version: policy.version,
    operation: PMC_OPERATION_APPLY,
    agent_ids: normalizedAgentIds,
  })) as ApiResult<OperatePMCObjectResponseData | null>

  const operation = result.data?.operation
  const operationId = stringValue(operation?.operation_id)
  if (!operationId) throw new Error("missing PMC operation_id in response")

  return {
    operationId,
    planningStatus: stringValue(operation?.planning_status),
    status: stringValue(operation?.status),
    outcome: stringValue(operation?.outcome),
    totalCount: numberValue(operation?.total_count),
    materializedCount: numberValue(operation?.materialized_count),
    pendingCount: numberValue(operation?.pending_count),
    runningCount: numberValue(operation?.running_count),
    successCount: numberValue(operation?.success_count),
    failedCount: numberValue(operation?.failed_count),
    uncertainCount: numberValue(operation?.uncertain_count),
    skippedCount: numberValue(operation?.skipped_count),
    canceledCount: numberValue(operation?.canceled_count),
  }
}

export function getCreatePolicyEndpoint(type: AccessPolicyType) {
  return CREATE_ENDPOINTS[type]
}

export function getCreatePolicyPath(type: AccessPolicyType) {
  return CREATE_ENDPOINT_PATHS[type]
}
