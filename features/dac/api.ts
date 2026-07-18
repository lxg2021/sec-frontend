"use client"

import { http } from "@/shared/lib/http/client"
import { createUuidRequestId } from "@/shared/lib/utils"

import { ACCESS_ACTIONS, createInitialAccessControlDraft } from "./access-control-options"
import type {
  AccessAccount,
  AccessControlOperation,
  AccessControlPolicyDraft,
  AccessHash,
  AccessPolicyType,
  AccessRuleDraft,
  AccessSubjectDraft,
  CreatedAccessControlPolicy,
  ExistingAccessControlPolicy,
} from "./access-control-types"

const PMC_OBJECT_TYPE_POLICY = 1
const PMC_OPERATION_APPLY = 1
const PMC_LIST_PAGE_SIZE = 100
const ACCESS_POLICY_TYPE_BY_SUB_TYPE: Record<number, AccessPolicyType> = {
  20: "network",
  90: "file",
  91: "process",
  92: "registry",
}
const POLICY_VERSION_PATTERN = /^\d+\.\d+\.\d+$/
const MD5_PATTERN = /^[a-fA-F0-9]{32}$/
const HASH_PATTERNS: Record<AccessHash["algo"], RegExp> = {
  md5: /^[a-fA-F0-9]{32}$/,
  sha1: /^[a-fA-F0-9]{40}$/,
  sha256: /^[a-fA-F0-9]{64}$/,
}
const SID_PATTERN = /^S-\d-\d+(?:-\d+)+$/i
const REGISTRY_PATH_PATTERN = /^(?:HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG|HKLM|HKCU|HKCR|HKU|HKCC)(?:\\.*)?$/i

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

interface PMCPolicyData {
  name?: string
  sub_type?: number
  version?: string
  context?: string
}

interface PMCPolicyDefinitionData {
  type?: number
  object_id?: string
  object_version?: string
  object_state?: string
  Content?: {
    policy?: PMCPolicyData | null
  } | null
  policy?: {
    name?: string
    sub_type?: number
    version?: string
    context?: string
  } | null
}

interface ListPMCObjectDefinitionsResponseData {
  definitions?: PMCPolicyDefinitionData[]
  total?: number
  page?: number
  page_size?: number
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

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
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

export function isValidWindowsPathPattern(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized.length > 4096 || /[\u0000-\u001f]/.test(normalized)) return false
  if (["*", "#", "?"].includes(normalized)) return true
  return /^[a-z]:\\/i.test(normalized) || /^\\\\[^\\]+\\[^\\]+/.test(normalized)
}

export function isValidRegistryPath(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= 4096 && !/[\u0000-\u001f]/.test(normalized) && REGISTRY_PATH_PATTERN.test(normalized)
}

function isValidAccessHash(hash: AccessHash) {
  return HASH_PATTERNS[hash.algo].test(hash.value.trim())
}

function isValidSid(value: string) {
  return SID_PATTERN.test(value.trim())
}

function validateSubject(subject: AccessSubjectDraft) {
  if (subject.type === "process") {
    const paths = uniqueStrings(subject.paths)
    const hashes = normalizeHashes(subject.hashes)
    if (paths.length === 0 && hashes.length === 0) return false
    return paths.every(isValidWindowsPathPattern) && hashes.every(isValidAccessHash)
  }

  const accounts = normalizeAccounts(subject.accounts)
  return accounts.length > 0 && accounts.every((account) => isValidSid(account.sid))
}

function validatePortExpression(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === "any") return true
  if (!normalized) return false

  return normalized.split(",").every((token) => {
    const parts = token.trim().split("-")
    if (parts.length > 2 || parts.some((part) => !/^\d+$/.test(part))) return false
    const numbers = parts.map(Number)
    if (numbers.some((port) => port < 1 || port > 65535)) return false
    return numbers.length === 1 || numbers[0] <= numbers[1]
  })
}

function isValidIPv4(value: string) {
  const parts = value.split(".")
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

function isValidIPv6(value: string) {
  if (!value.includes(":")) return false
  try {
    return new URL(`http://[${value}]/`).hostname.length > 2
  } catch {
    return false
  }
}

function isValidNetworkAddress(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === "any") return true
  const [address, prefix, ...rest] = normalized.split("/")
  if (rest.length > 0) return false
  const ipv4 = isValidIPv4(address)
  const ipv6 = isValidIPv6(address)
  if (!ipv4 && !ipv6) return false
  if (prefix === undefined) return true
  if (!/^\d+$/.test(prefix)) return false
  const prefixNumber = Number(prefix)
  return prefixNumber >= 0 && prefixNumber <= (ipv4 ? 32 : 128)
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
    if (!isValidNetworkAddress(network.localAddress) || !isValidNetworkAddress(network.remoteAddress)) {
      errors.push("NETWORK_ADDRESS_INVALID")
    }
    if (!isValidWindowsPathPattern(network.programPath)) errors.push("NETWORK_PROGRAM_INVALID")
    if (network.programMd5.trim() && !MD5_PATTERN.test(network.programMd5.trim())) {
      errors.push("NETWORK_PROGRAM_MD5_INVALID")
    }
    return errors
  }

  if (draft.subjects.length === 0 || !draft.subjects.every(validateSubject)) {
    errors.push("SUBJECT_INVALID")
  }
  if (!draft.exceptions.every(validateSubject)) errors.push("EXCEPTION_INVALID")
  const objectPaths = uniqueStrings(draft.objectPaths)
  const objectPathValid = draft.type === "registry" ? isValidRegistryPath : isValidWindowsPathPattern
  if (objectPaths.length === 0) errors.push("OBJECT_PATH_REQUIRED")
  else if (!objectPaths.every(objectPathValid)) errors.push("OBJECT_PATH_INVALID")
  if (!draft.objectHashes.every(isValidAccessHash)) errors.push("OBJECT_HASH_INVALID")

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

export async function listExistingAccessControlPolicies(): Promise<ExistingAccessControlPolicy[]> {
  const definitions: PMCPolicyDefinitionData[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (definitions.length < total) {
    const result = (await http.post("listPMCObjectDefinitions", {
      request_id: createUuidRequestId(),
      object_type: PMC_OBJECT_TYPE_POLICY,
      lifecycle_state: "active",
      page,
      page_size: PMC_LIST_PAGE_SIZE,
    })) as ApiResult<ListPMCObjectDefinitionsResponseData | null>

    const batch = Array.isArray(result.data?.definitions) ? result.data.definitions : []
    definitions.push(...batch)
    total = Math.max(0, numberValue(result.data?.total, definitions.length))

    if (batch.length === 0 || batch.length < PMC_LIST_PAGE_SIZE) break
    page += 1
  }

  const policies = definitions
    .map(normalizeExistingAccessControlPolicy)
    .filter((policy): policy is ExistingAccessControlPolicy => Boolean(policy))

  return Array.from(new Map(policies.map((policy) => [policy.objectId, policy])).values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  )
}

function normalizeExistingAccessControlPolicy(
  definition: PMCPolicyDefinitionData,
): ExistingAccessControlPolicy | null {
  const policy = definition.Content?.policy ?? definition.policy
  const objectId = stringValue(definition.object_id)
  const subType = numberValue(policy?.sub_type)
  const policyType = ACCESS_POLICY_TYPE_BY_SUB_TYPE[subType]
  const version = stringValue(definition.object_version) || stringValue(policy?.version)

  if (
    numberValue(definition.type) !== PMC_OBJECT_TYPE_POLICY ||
    !objectId ||
    !policyType ||
    !version
  ) {
    return null
  }

  return {
    objectId,
    objectType: PMC_OBJECT_TYPE_POLICY,
    name: stringValue(policy?.name) || objectId,
    version,
    policyType,
    subType,
    context: stringValue(policy?.context),
    objectState: stringValue(definition.object_state) || "active",
  }
}

export function buildAccessControlDraftFromExistingPolicy(
  policy: ExistingAccessControlPolicy,
): AccessControlPolicyDraft {
  const initial = createInitialAccessControlDraft()
  const policyType = policy.policyType
  let body: Record<string, unknown> = {}

  try {
    const envelope = recordValue(JSON.parse(policy.context))
    body = recordValue(recordValue(envelope.policy).body)
  } catch {
    // The Catalog identity remains usable for dispatch even if an old context cannot be rendered.
  }

  const priority = numberValue(body.priority, initial.priority)
  if (policyType === "network") {
    const rule = recordValue(body.rule)
    const protocol = recordValue(body.protocol)
    const address = recordValue(body.address)
    const program = recordValue(body.program)

    return {
      ...initial,
      type: "network",
      name: policy.name,
      version: policy.version,
      priority,
      network: {
        direction: oneOf(stringValue(rule.direction), ["in", "out"], initial.network.direction),
        action: oneOf(stringValue(rule.action), ["allow", "block", "bypass"], initial.network.action),
        profile: oneOf(stringValue(rule.profile), ["domain", "private", "public", "any"], initial.network.profile),
        protocol: oneOf(stringValue(protocol.type), ["tcp", "udp", "icmp", "any"], initial.network.protocol),
        localPort: stringValue(protocol.localport) || initial.network.localPort,
        remotePort: stringValue(protocol.remoteport) || initial.network.remotePort,
        localAddress: stringValue(address.local) || initial.network.localAddress,
        remoteAddress: stringValue(address.remote) || initial.network.remoteAddress,
        programPath: stringValue(program.path),
        programMd5: stringValue(program.md5),
      },
    }
  }

  const object = recordValue(body.object)
  const subjects = normalizeStoredSubjects(body.subject)

  return {
    ...initial,
    type: policyType,
    name: policy.name,
    version: policy.version,
    priority,
    subjects: subjects.length > 0 ? subjects : initial.subjects,
    exceptions: normalizeStoredSubjects(body.except),
    objectPaths: stringArray(object.path),
    objectHashes: normalizeStoredHashes(object.hash),
    rules: normalizeStoredRules(body.rules, policyType),
  }
}

function oneOf<T extends string>(value: string, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? value as T : fallback
}

function stringArray(value: unknown) {
  return arrayValue(value).map(stringValue).filter(Boolean)
}

function normalizeStoredHashes(value: unknown): AccessHash[] {
  return arrayValue(value).flatMap((entry) => {
    const hash = recordValue(entry)
    const algo = oneOf(stringValue(hash.algo), ["md5", "sha1", "sha256"] as const, "md5")
    const normalizedValue = stringValue(hash.value)
    return normalizedValue ? [{ algo, value: normalizedValue }] : []
  })
}

function normalizeStoredSubjects(value: unknown): AccessSubjectDraft[] {
  return arrayValue(value).map((entry) => {
    const subject = recordValue(entry)
    const type = oneOf(stringValue(subject.type), ["windowsuser", "windowsgroup", "process"] as const, "process")
    return {
      id: crypto.randomUUID(),
      type,
      paths: stringArray(subject.path),
      hashes: normalizeStoredHashes(subject.hash),
      accounts: arrayValue(subject.accounts).flatMap((accountValue) => {
        const account = recordValue(accountValue)
        const sid = stringValue(account.sid)
        if (!sid) return []
        return [{
          ...(stringValue(account.user_name) ? { user_name: stringValue(account.user_name) } : {}),
          ...(stringValue(account.group_name) ? { group_name: stringValue(account.group_name) } : {}),
          sid,
        }]
      }),
    }
  })
}

function normalizeStoredRules(value: unknown, type: Exclude<AccessPolicyType, "network">): AccessRuleDraft[] {
  const allowedActions = new Set<string>(ACCESS_ACTIONS[type])
  return arrayValue(value).flatMap((entry) => {
    const rule = recordValue(entry)
    const action = stringValue(rule.action)
    if (!allowedActions.has(action)) return []
    return [{
      id: crypto.randomUUID(),
      action: action as AccessRuleDraft["action"],
      effect: oneOf(stringValue(rule.effect), ["allow", "block", "prompt"] as const, "block"),
      audit: Boolean(rule.audit),
    }]
  })
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
