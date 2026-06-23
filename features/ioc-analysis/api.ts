"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type {
  AttackCaseIOCCandidateListData,
  AttackCaseIOCCandidateSummary,
  AttackCaseIOCExtractTask,
  AttackCaseIOCVerificationDetail,
  AttackCaseIOCVerificationItem,
  AttackCaseIOCVerifyTask,
  IocQueryEntry,
  IocQueryObservation,
  IocQueryPagination,
  IocQueryRelation,
  IocQueryResult,
  IocVerificationItem,
  IocVerificationStatus,
  IocVerificationType,
} from "./types"

type ApiResult<T> = {
  data: T
  raw?: unknown
}

type BackendObject = Record<string, unknown>

const IOC_QUERY_TYPE_CODE: Record<IocVerificationType, number> = {
  auto: 1,
  hash: 2,
  md5: 3,
  sha256: 4,
  url: 5,
  domain: 6,
  hostname: 7,
  ip: 8,
  email: 12,
  sha1: 13,
  certificate: 11,
}

const IOC_QUERY_TYPE_LABEL: Record<number, IocVerificationType | string> = {
  1: "auto",
  2: "hash",
  3: "md5",
  4: "sha256",
  5: "url",
  6: "domain",
  7: "hostname",
  8: "ip",
  9: "ip",
  10: "ip",
  11: "certificate",
  12: "email",
  13: "sha1",
}

const DEFAULT_TENANT_ID = "public"
const HIDDEN_CASE_IOC_TYPES = new Set<IocVerificationType>(["certificate"])

const HIT_SOURCE_LABEL: Record<number, string> = {
  1: "cache_hit",
  2: "local_hit",
  3: "remote_hit",
  4: "remote_miss",
  5: "miss_cache_hit",
  6: "remote_error_suppressed",
}

function objectValue(value: unknown): BackendObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as BackendObject)
    : {}
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function boolValue(value: unknown) {
  return value === true
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean)
    : []
}

function normalizeCaseIocType(value: unknown): IocVerificationType {
  const normalized = stringValue(value).toLowerCase()
  if (
    normalized === "hash" ||
    normalized === "md5" ||
    normalized === "sha1" ||
    normalized === "sha256" ||
    normalized === "url" ||
    normalized === "domain" ||
    normalized === "hostname" ||
    normalized === "ip" ||
    normalized === "email" ||
    normalized === "certificate"
  ) {
    return normalized
  }
  return "auto"
}

function enumCode(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
    const normalized = value.trim().toLowerCase()
    const queryType = Object.entries(IOC_QUERY_TYPE_LABEL).find(
      ([, label]) =>
        String(label).toLowerCase() === normalized ||
        `ioc_query_type_${label}`.toLowerCase() === normalized,
    )
    if (queryType) return Number(queryType[0])
    const hitSource = Object.entries(HIT_SOURCE_LABEL).find(
      ([, label]) =>
        label === normalized ||
        `query_hit_source_${label}`.toLowerCase() === normalized,
    )
    if (hitSource) return Number(hitSource[0])
  }
  return 0
}

function normalizeEntry(raw: unknown): IocQueryEntry | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    id: stringValue(item.id),
    ioc_type: stringValue(item.ioc_type),
    normalized_value: stringValue(item.normalized_value),
    display_value: stringValue(item.display_value),
    status: stringValue(item.status),
    risk_score: numberValue(item.risk_score),
    confidence: numberValue(item.confidence),
    tags: stringArray(item.tags),
    extra_json: stringValue(item.extra_json),
    first_seen: stringValue(item.first_seen),
    last_seen: stringValue(item.last_seen),
  }
}

function normalizeObservation(raw: unknown): IocQueryObservation {
  const item = objectValue(raw)
  return {
    source_name: stringValue(item.source_name),
    source_record_id: stringValue(item.source_record_id),
    source_url: stringValue(item.source_url),
    confidence: numberValue(item.confidence),
    first_seen: stringValue(item.first_seen),
    last_seen: stringValue(item.last_seen),
    raw_json: stringValue(item.raw_json),
  }
}

function normalizeRelation(raw: unknown): IocQueryRelation {
  const item = objectValue(raw)
  return {
    relation_type: stringValue(item.relation_type),
    direction: stringValue(item.direction),
    source_name: stringValue(item.source_name),
    source_record_id: stringValue(item.source_record_id),
    first_seen: stringValue(item.first_seen),
    last_seen: stringValue(item.last_seen),
    raw_json: stringValue(item.raw_json),
    peer_entry: normalizeEntry(item.peer_entry),
  }
}

function normalizePagination(raw: unknown): IocQueryPagination | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    total: numberValue(item.total),
    returned: numberValue(item.returned),
    offset: numberValue(item.offset),
    limit: numberValue(item.limit),
    has_more: boolValue(item.has_more),
    next_offset: numberValue(item.next_offset),
    raw_json_trimmed: boolValue(item.raw_json_trimmed),
  }
}

function normalizeQueryResult(raw: unknown): IocQueryResult {
  const item = objectValue(raw)
  const detectedTypeCode = enumCode(item.detected_type)
  const hitSourceCode = enumCode(item.hit_source)
  const truncation = objectValue(item.truncation)

  return {
    request_id: stringValue(item.request_id),
    hit: boolValue(item.hit),
    detected_type:
      IOC_QUERY_TYPE_LABEL[detectedTypeCode] ||
      stringValue(item.detected_type) ||
      "unknown",
    detected_type_code: detectedTypeCode,
    entry: normalizeEntry(item.entry),
    observations: Array.isArray(item.observations)
      ? item.observations.map(normalizeObservation)
      : [],
    relations: Array.isArray(item.relations)
      ? item.relations.map(normalizeRelation)
      : [],
    hit_source:
      HIT_SOURCE_LABEL[hitSourceCode] ||
      stringValue(item.hit_source) ||
      "unknown",
    hit_source_code: hitSourceCode,
    truncation: Object.keys(truncation).length
      ? {
          observations: normalizePagination(truncation.observations),
          relations: normalizePagination(truncation.relations),
        }
      : null,
  }
}

function normalizeExtractTask(raw: unknown): AttackCaseIOCExtractTask | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    task_id: numberValue(item.task_id),
    tenant_id: stringValue(item.tenant_id),
    case_id: stringValue(item.case_id),
    request_id: stringValue(item.request_id),
    trigger_source: stringValue(item.trigger_source),
    status: stringValue(item.status),
    attempt_count: numberValue(item.attempt_count),
    evidence_count: numberValue(item.evidence_count),
    candidate_count: numberValue(item.candidate_count),
    error_message: stringValue(item.error_message),
    created_at: stringValue(item.created_at),
    started_at: stringValue(item.started_at),
    finished_at: stringValue(item.finished_at),
    updated_at: stringValue(item.updated_at),
  }
}

function normalizeVerification(raw: unknown): AttackCaseIOCVerificationItem | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    verification_id: stringValue(item.verification_id),
    candidate_id: stringValue(item.candidate_id),
    tenant_id: stringValue(item.tenant_id),
    case_id: stringValue(item.case_id),
    local_decision: stringValue(item.local_decision),
    whitelist_status: stringValue(item.whitelist_status),
    local_status: stringValue(item.local_status),
    local_hit_source: stringValue(item.local_hit_source),
    remote_status: stringValue(item.remote_status),
    final_status: stringValue(item.final_status),
    final_verdict: stringValue(item.final_verdict),
    risk_score: numberValue(item.risk_score),
    confidence: numberValue(item.confidence),
    checked_at: stringValue(item.checked_at),
    error_message: stringValue(item.error_message),
    created_at: stringValue(item.created_at),
    updated_at: stringValue(item.updated_at),
    hit: boolValue(item.hit),
    hit_scope: stringValue(item.hit_scope),
    hit_kind: stringValue(item.hit_kind),
    hit_category: stringValue(item.hit_category),
    hit_status_key: stringValue(item.hit_status_key),
    hit_verdict: stringValue(item.hit_verdict),
    hit_source_database: stringValue(item.hit_source_database),
    hit_source_table: stringValue(item.hit_source_table),
    hit_source_record_id: stringValue(item.hit_source_record_id),
    local_eval_raw_json: stringValue(item.local_eval_raw_json),
  }
}

function statusFromVerification(
  verification: AttackCaseIOCVerificationItem | null,
): IocVerificationStatus {
  if (!verification || verification.final_status === "unverified") return "idle"
  if (
    verification.hit_status_key === "local_whitelist_hit" ||
    verification.hit_kind === "whitelist" ||
    verification.hit_verdict === "allow"
  ) {
    return "allowlisted"
  }
  if (
    verification.hit_status_key === "local_ioc_hit" ||
    verification.hit_status_key === "remote_ioc_hit" ||
    (verification.hit && verification.hit_kind === "ioc") ||
    verification.hit_verdict === "malicious"
  ) {
    return "hit"
  }
  if (
    verification.hit_status_key === "error" ||
    verification.hit_verdict === "error"
  ) {
    return "error"
  }
  if (verification.hit_status_key === "no_hit") return "miss"
  if (
    verification.final_status === "allowlisted" ||
    verification.final_verdict === "allow"
  ) {
    return "allowlisted"
  }
  if (
    verification.final_status === "local_hit" ||
    verification.final_status === "remote_hit" ||
    verification.final_verdict === "malicious"
  ) {
    return "hit"
  }
  if (
    verification.final_status === "local_error" ||
    verification.final_status === "remote_error" ||
    verification.final_verdict === "error"
  ) {
    return "error"
  }
  if (
    verification.final_status === "local_miss" ||
    verification.final_status === "remote_miss" ||
    verification.final_verdict === "unknown"
  ) {
    return "miss"
  }
  return "idle"
}

function normalizeCaseCandidate(raw: unknown): IocVerificationItem | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  const candidateId = stringValue(item.candidate_id)
  const type = normalizeCaseIocType(item.ioc_type || item.query_type)
  const value = stringValue(item.normalized_value) || stringValue(item.value)
  if (HIDDEN_CASE_IOC_TYPES.has(type)) return null
  if (!candidateId || !value) return null

  const verification = normalizeVerification(item.verification)
  const source = stringValue(item.source)
  const evidenceId = stringValue(item.evidence_id)
  const sourceRefId = stringValue(item.source_ref_id)
  const sourceField = stringValue(item.source_field)
  const fileName = stringValue(item.file_name)
  const filePath = stringValue(item.file_path)
  const eventName = stringValue(item.event_name)
  const evidenceRefs = [evidenceId, sourceRefId, sourceField, eventName].filter(Boolean)

  return {
    id: candidateId,
    candidate_id: candidateId,
    tenant_id: stringValue(item.tenant_id),
    case_id: stringValue(item.case_id),
    type,
    query_type: stringValue(item.query_type),
    value,
    normalized_value: stringValue(item.normalized_value),
    source,
    source_ref_id: sourceRefId,
    source_field: sourceField,
    file_name: fileName,
    file_path: filePath,
    evidence_id: evidenceId,
    event_name: eventName,
    source_unique_id: stringValue(item.source_unique_id),
    occurred_at: stringValue(item.occurred_at),
    agent_id: stringValue(item.agent_id),
    runtime_hit: boolValue(item.runtime_hit),
    runtime_ioc_entry_id: stringValue(item.runtime_ioc_entry_id),
    candidate_status: stringValue(item.status),
    last_seen_at: stringValue(item.last_seen_at),
    evidence_refs: Array.from(new Set(evidenceRefs)),
    origin: "case",
    verification,
    status: statusFromVerification(verification),
    result: null,
    error: verification?.error_message ?? "",
  }
}

function normalizeCandidateSummary(raw: unknown): AttackCaseIOCCandidateSummary {
  const item = objectValue(raw)
  return {
    total: numberValue(item.total),
    active_count: numberValue(item.active_count),
    ignored_count: numberValue(item.ignored_count),
    stale_count: numberValue(item.stale_count),
    deleted_count: numberValue(item.deleted_count),
    md5_count: numberValue(item.md5_count),
    sha1_count: numberValue(item.sha1_count),
    sha256_count: numberValue(item.sha256_count),
    ip_count: numberValue(item.ip_count),
    domain_count: numberValue(item.domain_count),
    url_count: numberValue(item.url_count),
    certificate_count: numberValue(item.certificate_count),
    runtime_hit_count: numberValue(item.runtime_hit_count),
  }
}

function normalizeCaseCandidateList(raw: unknown): AttackCaseIOCCandidateListData {
  const item = objectValue(raw)
  return {
    extract_task: normalizeExtractTask(item.extract_task),
    extract_task_exists: boolValue(item.extract_task_exists),
    items: Array.isArray(item.items)
      ? item.items.map(normalizeCaseCandidate).filter((entry): entry is IocVerificationItem => Boolean(entry))
      : [],
    summary: normalizeCandidateSummary(item.summary),
  }
}

function normalizeVerifyTask(raw: unknown): AttackCaseIOCVerifyTask {
  const item = objectValue(raw)
  return {
    task_id: numberValue(item.task_id),
    status: stringValue(item.status),
    scope: stringValue(item.scope),
    remote: boolValue(item.remote),
    total_count: numberValue(item.total_count),
    done_count: numberValue(item.done_count),
    failed_count: numberValue(item.failed_count),
    error_message: stringValue(item.error_message),
    started_at: stringValue(item.started_at),
    finished_at: stringValue(item.finished_at),
    updated_at: stringValue(item.updated_at),
  }
}

function normalizeVerificationDetail(raw: unknown): AttackCaseIOCVerificationDetail {
  const detail = objectValue(raw)
  const localEvalRawJson = stringValue(detail.local_eval_raw_json)
  const item = normalizeVerification(detail.item)

  if (item) {
    item.local_eval_raw_json = localEvalRawJson || item.local_eval_raw_json
  }

  return {
    item,
    local_eval_raw_json: localEvalRawJson,
  }
}

export function iocQueryTypeCode(type: IocVerificationType) {
  return IOC_QUERY_TYPE_CODE[type] ?? IOC_QUERY_TYPE_CODE.auto
}

export async function queryIoc({
  type,
  value,
}: {
  type: IocVerificationType
  value: string
}): Promise<IocQueryResult> {
  const result = (await http.post("/sensor/ioc/query", {
    request_id: createRequestId(),
    type: iocQueryTypeCode(type),
    value: value.trim(),
  })) as ApiResult<unknown>

  return normalizeQueryResult(result.data)
}

export async function listAttackCaseIocCandidates({
  caseId,
  tenantId = DEFAULT_TENANT_ID,
  iocType,
  status = "active",
}: {
  caseId: string
  tenantId?: string
  iocType?: string
  status?: string
}): Promise<AttackCaseIOCCandidateListData> {
  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    tenant_id: tenantId.trim() || DEFAULT_TENANT_ID,
    case_id: caseId.trim(),
  }
  if (iocType?.trim()) payload.ioc_type = iocType.trim()
  if (status?.trim()) payload.status = status.trim()

  const result = (await http.post(
    "/sensor/analysis/attack-workflow/ioc-candidates/list",
    payload,
  )) as ApiResult<unknown>

  return normalizeCaseCandidateList(result.data)
}

export async function createAttackCaseIocVerifyTask({
  caseId,
  tenantId = DEFAULT_TENANT_ID,
  candidateIds = [],
}: {
  caseId: string
  tenantId?: string
  candidateIds?: string[]
}): Promise<{ task: AttackCaseIOCVerifyTask; created: boolean }> {
  const result = (await http.post(
    "/sensor/analysis/attack-workflow/ioc-verify-task/create",
    {
      request_id: createRequestId(),
      tenant_id: tenantId.trim() || DEFAULT_TENANT_ID,
      case_id: caseId.trim(),
      candidate_ids: candidateIds,
      remote: false,
    },
  )) as ApiResult<unknown>

  const data = objectValue(result.data)
  return {
    task: normalizeVerifyTask(data.task),
    created: boolValue(data.created),
  }
}

export async function getAttackCaseIocVerifyTask({
  caseId,
  tenantId = DEFAULT_TENANT_ID,
  taskId,
}: {
  caseId: string
  tenantId?: string
  taskId: number
}): Promise<AttackCaseIOCVerifyTask> {
  const result = (await http.post(
    "/sensor/analysis/attack-workflow/ioc-verify-task/get",
    {
      request_id: createRequestId(),
      tenant_id: tenantId.trim() || DEFAULT_TENANT_ID,
      case_id: caseId.trim(),
      task_id: taskId,
    },
  )) as ApiResult<unknown>

  return normalizeVerifyTask(result.data)
}

export async function getAttackCaseIocVerification({
  caseId,
  tenantId = DEFAULT_TENANT_ID,
  candidateId,
}: {
  caseId: string
  tenantId?: string
  candidateId: string
}): Promise<AttackCaseIOCVerificationDetail> {
  const result = (await http.post(
    "/sensor/analysis/attack-workflow/ioc-verification/get",
    {
      request_id: createRequestId(),
      tenant_id: tenantId.trim() || DEFAULT_TENANT_ID,
      case_id: caseId.trim(),
      candidate_id: candidateId.trim(),
    },
  )) as ApiResult<unknown>

  return normalizeVerificationDetail(result.data)
}
