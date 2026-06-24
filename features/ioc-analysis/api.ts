"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type {
  AttackCaseIOCCandidateListData,
  AttackCaseIOCCandidateSummary,
  AttackCaseIOCExtractTask,
  AttackCaseIOCBlacklistIndicatorHitDetail,
  AttackCaseIOCDetailPage,
  AttackCaseIOCEvidenceField,
  AttackCaseIOCEvidenceFieldGroup,
  AttackCaseIOCEvidenceReason,
  AttackCaseIOCEvidenceScore,
  AttackCaseIOCEvidenceTag,
  AttackCaseIOCHitDetailView,
  AttackCaseIOCHitEvidence,
  AttackCaseIOCHitEvidenceSource,
  AttackCaseIOCHitEvidenceTime,
  AttackCaseIOCHitPrimary,
  AttackCaseIOCHitRelation,
  AttackCaseIOCHitSourceRef,
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCIocEntryRecord,
  AttackCaseIOCIocObservation,
  AttackCaseIOCIocRelation,
  AttackCaseIOCJSONEvidence,
  AttackCaseIOCRawField,
  AttackCaseIOCRawFieldGroup,
  AttackCaseIOCIntelSource,
  AttackCaseIOCSourceFact,
  AttackCaseIOCSourceRecord,
  AttackCaseIOCVerificationDetail,
  AttackCaseIOCVerificationHitSourceDetail,
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

function fieldValue(item: BackendObject, ...keys: string[]) {
  for (const key of keys) {
    if (key in item) return item[key]
  }
  return undefined
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

function normalizeHitSourceRef(raw: unknown): AttackCaseIOCHitSourceRef | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  const database = stringValue(fieldValue(item, "database", "Database"))
  const table = stringValue(fieldValue(item, "table", "Table"))
  const recordId = stringValue(fieldValue(item, "record_id", "recordId", "RecordId"))

  if (!database && !table && !recordId) return null

  return {
    database,
    table,
    record_id: recordId,
  }
}

function normalizeJSONEvidence(raw: unknown): AttackCaseIOCJSONEvidence | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    raw_json: stringValue(fieldValue(item, "raw_json", "rawJson", "RawJson")),
    raw_json_preview: stringValue(
      fieldValue(item, "raw_json_preview", "rawJsonPreview", "RawJsonPreview"),
    ),
    raw_json_length: numberValue(
      fieldValue(item, "raw_json_length", "rawJsonLength", "RawJsonLength"),
    ),
    raw_json_keys: stringArray(
      fieldValue(item, "raw_json_keys", "rawJsonKeys", "RawJsonKeys"),
    ),
  }
}

function normalizeHitPrimary(raw: unknown): AttackCaseIOCHitPrimary | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    ioc_type: stringValue(fieldValue(item, "ioc_type", "iocType", "IocType")),
    value_subtype: stringValue(
      fieldValue(item, "value_subtype", "valueSubtype", "ValueSubtype"),
    ),
    normalized_value: stringValue(
      fieldValue(item, "normalized_value", "normalizedValue", "NormalizedValue"),
    ),
    display_value: stringValue(
      fieldValue(item, "display_value", "displayValue", "DisplayValue"),
    ),
    status: stringValue(fieldValue(item, "status", "Status")),
    risk_score: numberValue(fieldValue(item, "risk_score", "riskScore", "RiskScore")),
    confidence: numberValue(fieldValue(item, "confidence", "Confidence")),
    tags: stringArray(fieldValue(item, "tags", "Tags")),
    first_seen: stringValue(fieldValue(item, "first_seen", "firstSeen", "FirstSeen")),
    last_seen: stringValue(fieldValue(item, "last_seen", "lastSeen", "LastSeen")),
    source_names: stringArray(
      fieldValue(item, "source_names", "sourceNames", "SourceNames"),
    ),
    feed_names: stringArray(fieldValue(item, "feed_names", "feedNames", "FeedNames")),
    source_count: numberValue(
      fieldValue(item, "source_count", "sourceCount", "SourceCount"),
    ),
    feed_count: numberValue(fieldValue(item, "feed_count", "feedCount", "FeedCount")),
  }
}

function normalizeEvidenceSource(
  raw: unknown,
): AttackCaseIOCHitEvidenceSource | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    source_name: stringValue(
      fieldValue(item, "source_name", "sourceName", "SourceName"),
    ),
    source_type: stringValue(
      fieldValue(item, "source_type", "sourceType", "SourceType"),
    ),
    source_record_id: stringValue(
      fieldValue(item, "source_record_id", "sourceRecordId", "SourceRecordId"),
    ),
    source_url: stringValue(fieldValue(item, "source_url", "sourceUrl", "SourceUrl")),
    reporter: stringValue(fieldValue(item, "reporter", "Reporter")),
    credits: stringValue(fieldValue(item, "credits", "Credits")),
  }
}

function normalizeEvidenceTime(raw: unknown): AttackCaseIOCHitEvidenceTime | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    first_seen: stringValue(fieldValue(item, "first_seen", "firstSeen", "FirstSeen")),
    last_seen: stringValue(fieldValue(item, "last_seen", "lastSeen", "LastSeen")),
    observed_at: stringValue(
      fieldValue(item, "observed_at", "observedAt", "ObservedAt"),
    ),
    added_at: stringValue(fieldValue(item, "added_at", "addedAt", "AddedAt")),
    event_time: stringValue(fieldValue(item, "event_time", "eventTime", "EventTime")),
  }
}

function normalizeEvidenceTag(raw: unknown): AttackCaseIOCEvidenceTag {
  const item = objectValue(raw)
  return {
    value: stringValue(fieldValue(item, "value", "Value")),
    source_path: stringValue(
      fieldValue(item, "source_path", "sourcePath", "SourcePath"),
    ),
  }
}

function normalizeEvidenceScore(raw: unknown): AttackCaseIOCEvidenceScore {
  const item = objectValue(raw)
  return {
    name: stringValue(fieldValue(item, "name", "Name")),
    value: stringValue(fieldValue(item, "value", "Value")),
    normalized_score: numberValue(
      fieldValue(item, "normalized_score", "normalizedScore", "NormalizedScore"),
    ),
    source_path: stringValue(
      fieldValue(item, "source_path", "sourcePath", "SourcePath"),
    ),
  }
}

function normalizeEvidenceReason(raw: unknown): AttackCaseIOCEvidenceReason {
  const item = objectValue(raw)
  return {
    type: stringValue(fieldValue(item, "type", "Type")),
    value: stringValue(fieldValue(item, "value", "Value")),
    source_path: stringValue(
      fieldValue(item, "source_path", "sourcePath", "SourcePath"),
    ),
  }
}

function normalizeEvidenceField(raw: unknown): AttackCaseIOCEvidenceField {
  const item = objectValue(raw)
  return {
    group: stringValue(fieldValue(item, "group", "Group")),
    key: stringValue(fieldValue(item, "key", "Key")),
    label: stringValue(fieldValue(item, "label", "Label")),
    value: stringValue(fieldValue(item, "value", "Value")),
    value_type: stringValue(fieldValue(item, "value_type", "valueType", "ValueType")),
    copyable: boolValue(fieldValue(item, "copyable", "Copyable")),
    important: boolValue(fieldValue(item, "important", "Important")),
    source_path: stringValue(
      fieldValue(item, "source_path", "sourcePath", "SourcePath"),
    ),
  }
}

function normalizeEvidenceFieldGroup(
  raw: unknown,
): AttackCaseIOCEvidenceFieldGroup {
  const item = objectValue(raw)
  return {
    group: stringValue(fieldValue(item, "group", "Group")),
    title: stringValue(fieldValue(item, "title", "Title")),
    fields: Array.isArray(fieldValue(item, "fields", "Fields"))
      ? (fieldValue(item, "fields", "Fields") as unknown[]).map(
          normalizeEvidenceField,
        )
      : [],
  }
}

function normalizeHitEvidence(raw: unknown): AttackCaseIOCHitEvidence {
  const item = objectValue(raw)
  return {
    evidence_id: stringValue(
      fieldValue(item, "evidence_id", "evidenceId", "EvidenceId"),
    ),
    source: normalizeEvidenceSource(fieldValue(item, "source", "Source")),
    time: normalizeEvidenceTime(fieldValue(item, "time", "Time")),
    tags: Array.isArray(fieldValue(item, "tags", "Tags"))
      ? (fieldValue(item, "tags", "Tags") as unknown[]).map(normalizeEvidenceTag)
      : [],
    scores: Array.isArray(fieldValue(item, "scores", "Scores"))
      ? (fieldValue(item, "scores", "Scores") as unknown[]).map(
          normalizeEvidenceScore,
        )
      : [],
    reasons: Array.isArray(fieldValue(item, "reasons", "Reasons"))
      ? (fieldValue(item, "reasons", "Reasons") as unknown[]).map(
          normalizeEvidenceReason,
        )
      : [],
    field_groups: Array.isArray(
      fieldValue(item, "field_groups", "fieldGroups", "FieldGroups"),
    )
      ? (
          fieldValue(
            item,
            "field_groups",
            "fieldGroups",
            "FieldGroups",
          ) as unknown[]
        ).map(normalizeEvidenceFieldGroup)
      : [],
    raw: normalizeJSONEvidence(fieldValue(item, "raw", "Raw")),
    title: stringValue(fieldValue(item, "title", "Title")),
    summary: stringValue(fieldValue(item, "summary", "Summary")),
  }
}

function normalizeHitRelation(raw: unknown): AttackCaseIOCHitRelation {
  const item = objectValue(raw)
  return {
    direction: stringValue(fieldValue(item, "direction", "Direction")),
    relation_type: stringValue(
      fieldValue(item, "relation_type", "relationType", "RelationType"),
    ),
    peer_ioc_type: stringValue(
      fieldValue(item, "peer_ioc_type", "peerIocType", "PeerIocType"),
    ),
    peer_value: stringValue(fieldValue(item, "peer_value", "peerValue", "PeerValue")),
    peer_entry_id: stringValue(
      fieldValue(item, "peer_entry_id", "peerEntryId", "PeerEntryId"),
    ),
    source: normalizeEvidenceSource(fieldValue(item, "source", "Source")),
    time: normalizeEvidenceTime(fieldValue(item, "time", "Time")),
    field_groups: Array.isArray(
      fieldValue(item, "field_groups", "fieldGroups", "FieldGroups"),
    )
      ? (
          fieldValue(
            item,
            "field_groups",
            "fieldGroups",
            "FieldGroups",
          ) as unknown[]
        ).map(normalizeEvidenceFieldGroup)
      : [],
    raw: normalizeJSONEvidence(fieldValue(item, "raw", "Raw")),
  }
}

function normalizeRawField(raw: unknown): AttackCaseIOCRawField {
  const item = objectValue(raw)
  return {
    key: stringValue(fieldValue(item, "key", "Key")),
    label: stringValue(fieldValue(item, "label", "Label")),
    value: stringValue(fieldValue(item, "value", "Value")),
    value_type: stringValue(fieldValue(item, "value_type", "valueType", "ValueType")),
    copyable: boolValue(fieldValue(item, "copyable", "Copyable")),
    multiline: boolValue(fieldValue(item, "multiline", "Multiline")),
  }
}

function normalizeRawFieldGroup(raw: unknown): AttackCaseIOCRawFieldGroup {
  const item = objectValue(raw)
  return {
    title: stringValue(fieldValue(item, "title", "Title")),
    source_table: stringValue(
      fieldValue(item, "source_table", "sourceTable", "SourceTable"),
    ),
    fields: Array.isArray(fieldValue(item, "fields", "Fields"))
      ? (fieldValue(item, "fields", "Fields") as unknown[]).map(normalizeRawField)
      : [],
  }
}

function normalizeSourceFact(raw: unknown): AttackCaseIOCSourceFact {
  const item = objectValue(raw)
  return {
    key: stringValue(fieldValue(item, "key", "Key")),
    label: stringValue(fieldValue(item, "label", "Label")),
    value: stringValue(fieldValue(item, "value", "Value")),
    source_path: stringValue(
      fieldValue(item, "source_path", "sourcePath", "SourcePath"),
    ),
  }
}

function normalizeSourceRecord(raw: unknown): AttackCaseIOCSourceRecord {
  const item = objectValue(raw)
  return {
    record_id: stringValue(
      fieldValue(item, "record_id", "recordId", "RecordId"),
    ),
    record_kind: stringValue(
      fieldValue(item, "record_kind", "recordKind", "RecordKind"),
    ),
    title: stringValue(fieldValue(item, "title", "Title")),
    source_url: stringValue(
      fieldValue(item, "source_url", "sourceUrl", "SourceUrl"),
    ),
    first_seen: stringValue(
      fieldValue(item, "first_seen", "firstSeen", "FirstSeen"),
    ),
    last_seen: stringValue(
      fieldValue(item, "last_seen", "lastSeen", "LastSeen"),
    ),
    confidence: numberValue(fieldValue(item, "confidence", "Confidence")),
    tags: stringArray(fieldValue(item, "tags", "Tags")),
    facts: Array.isArray(fieldValue(item, "facts", "Facts"))
      ? (fieldValue(item, "facts", "Facts") as unknown[]).map(
          normalizeSourceFact,
        )
      : [],
    fields: Array.isArray(fieldValue(item, "fields", "Fields"))
      ? (fieldValue(item, "fields", "Fields") as unknown[]).map(
          normalizeEvidenceField,
        )
      : [],
    raw: normalizeJSONEvidence(fieldValue(item, "raw", "Raw")),
  }
}

function normalizeIntelSource(raw: unknown): AttackCaseIOCIntelSource {
  const item = objectValue(raw)
  return {
    source_type: stringValue(
      fieldValue(item, "source_type", "sourceType", "SourceType"),
    ),
    source_name: stringValue(
      fieldValue(item, "source_name", "sourceName", "SourceName"),
    ),
    display_name: stringValue(
      fieldValue(item, "display_name", "displayName", "DisplayName"),
    ),
    source_urls: stringArray(
      fieldValue(item, "source_urls", "sourceUrls", "SourceUrls"),
    ),
    tags: stringArray(fieldValue(item, "tags", "Tags")),
    max_confidence: numberValue(
      fieldValue(item, "max_confidence", "maxConfidence", "MaxConfidence"),
    ),
    max_risk_score: numberValue(
      fieldValue(item, "max_risk_score", "maxRiskScore", "MaxRiskScore"),
    ),
    first_seen: stringValue(
      fieldValue(item, "first_seen", "firstSeen", "FirstSeen"),
    ),
    last_seen: stringValue(fieldValue(item, "last_seen", "lastSeen", "LastSeen")),
    facts: Array.isArray(fieldValue(item, "facts", "Facts"))
      ? (fieldValue(item, "facts", "Facts") as unknown[]).map(
          normalizeSourceFact,
        )
      : [],
    key_fields: Array.isArray(
      fieldValue(item, "key_fields", "keyFields", "KeyFields"),
    )
      ? (
          fieldValue(item, "key_fields", "keyFields", "KeyFields") as unknown[]
        ).map(normalizeEvidenceField)
      : [],
    records: Array.isArray(fieldValue(item, "records", "Records"))
      ? (fieldValue(item, "records", "Records") as unknown[]).map(
          normalizeSourceRecord,
        )
      : [],
  }
}

function normalizeHitDetailView(raw: unknown): AttackCaseIOCHitDetailView | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    source_ref: normalizeHitSourceRef(
      fieldValue(item, "source_ref", "sourceRef", "SourceRef"),
    ),
    primary: normalizeHitPrimary(fieldValue(item, "primary", "Primary")),
    evidence: Array.isArray(fieldValue(item, "evidence", "Evidence"))
      ? (fieldValue(item, "evidence", "Evidence") as unknown[]).map(
          normalizeHitEvidence,
        )
      : [],
    relations: Array.isArray(fieldValue(item, "relations", "Relations"))
      ? (fieldValue(item, "relations", "Relations") as unknown[]).map(
          normalizeHitRelation,
        )
      : [],
    raw_groups: Array.isArray(
      fieldValue(item, "raw_groups", "rawGroups", "RawGroups"),
    )
      ? (
          fieldValue(item, "raw_groups", "rawGroups", "RawGroups") as unknown[]
        ).map(normalizeRawFieldGroup)
      : [],
    sources: Array.isArray(fieldValue(item, "sources", "Sources"))
      ? (fieldValue(item, "sources", "Sources") as unknown[]).map(
          normalizeIntelSource,
        )
      : [],
  }
}

function normalizeDetailPage(raw: unknown): AttackCaseIOCDetailPage | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    total: numberValue(fieldValue(item, "total", "Total")),
    returned: numberValue(fieldValue(item, "returned", "Returned")),
    offset: numberValue(fieldValue(item, "offset", "Offset")),
    limit: numberValue(fieldValue(item, "limit", "Limit")),
    has_more: boolValue(fieldValue(item, "has_more", "hasMore", "HasMore")),
  }
}

function normalizeIocEntryRecord(raw: unknown): AttackCaseIOCIocEntryRecord | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    id: stringValue(fieldValue(item, "id", "Id", "ID")),
    ioc_type: stringValue(fieldValue(item, "ioc_type", "iocType", "IocType")),
    observable_type: stringValue(
      fieldValue(item, "observable_type", "observableType", "ObservableType"),
    ),
    normalized_value: stringValue(
      fieldValue(item, "normalized_value", "normalizedValue", "NormalizedValue"),
    ),
    display_value: stringValue(
      fieldValue(item, "display_value", "displayValue", "DisplayValue"),
    ),
    status: stringValue(fieldValue(item, "status", "Status")),
    risk_score: numberValue(fieldValue(item, "risk_score", "riskScore", "RiskScore")),
    confidence: numberValue(fieldValue(item, "confidence", "Confidence")),
    tags: stringArray(fieldValue(item, "tags", "Tags")),
    extra_json: stringValue(fieldValue(item, "extra_json", "extraJson", "ExtraJson")),
    extra_json_keys: stringArray(
      fieldValue(item, "extra_json_keys", "extraJsonKeys", "ExtraJsonKeys"),
    ),
    first_seen: stringValue(fieldValue(item, "first_seen", "firstSeen", "FirstSeen")),
    last_seen: stringValue(fieldValue(item, "last_seen", "lastSeen", "LastSeen")),
  }
}

function normalizeIocObservation(raw: unknown): AttackCaseIOCIocObservation {
  const item = objectValue(raw)
  return {
    source_name: stringValue(fieldValue(item, "source_name", "sourceName", "SourceName")),
    source_record_id: stringValue(
      fieldValue(item, "source_record_id", "sourceRecordId", "SourceRecordId"),
    ),
    source_url: stringValue(fieldValue(item, "source_url", "sourceUrl", "SourceUrl")),
    confidence: numberValue(fieldValue(item, "confidence", "Confidence")),
    first_seen: stringValue(fieldValue(item, "first_seen", "firstSeen", "FirstSeen")),
    last_seen: stringValue(fieldValue(item, "last_seen", "lastSeen", "LastSeen")),
    evidence: normalizeJSONEvidence(fieldValue(item, "evidence", "Evidence")),
  }
}

function normalizeIocRelation(raw: unknown): AttackCaseIOCIocRelation {
  const item = objectValue(raw)
  return {
    relation_type: stringValue(
      fieldValue(item, "relation_type", "relationType", "RelationType"),
    ),
    direction: stringValue(fieldValue(item, "direction", "Direction")),
    source_name: stringValue(fieldValue(item, "source_name", "sourceName", "SourceName")),
    source_record_id: stringValue(
      fieldValue(item, "source_record_id", "sourceRecordId", "SourceRecordId"),
    ),
    first_seen: stringValue(fieldValue(item, "first_seen", "firstSeen", "FirstSeen")),
    last_seen: stringValue(fieldValue(item, "last_seen", "lastSeen", "LastSeen")),
    evidence: normalizeJSONEvidence(fieldValue(item, "evidence", "Evidence")),
    peer_entry: normalizeIocEntryRecord(
      fieldValue(item, "peer_entry", "peerEntry", "PeerEntry"),
    ),
  }
}

function normalizeIocEntryHitDetail(
  raw: unknown,
): AttackCaseIOCIocEntryHitDetail | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    source: normalizeHitSourceRef(fieldValue(item, "source", "Source")),
    entry: normalizeIocEntryRecord(fieldValue(item, "entry", "Entry")),
    observations: Array.isArray(
      fieldValue(item, "observations", "Observations"),
    )
      ? (fieldValue(item, "observations", "Observations") as unknown[]).map(
          normalizeIocObservation,
        )
      : [],
    observations_page: normalizeDetailPage(
      fieldValue(item, "observations_page", "observationsPage", "ObservationsPage"),
    ),
    relations: Array.isArray(fieldValue(item, "relations", "Relations"))
      ? (fieldValue(item, "relations", "Relations") as unknown[]).map(
          normalizeIocRelation,
        )
      : [],
    relations_page: normalizeDetailPage(
      fieldValue(item, "relations_page", "relationsPage", "RelationsPage"),
    ),
  }
}

function normalizeBlacklistIndicatorHitDetail(
  raw: unknown,
): AttackCaseIOCBlacklistIndicatorHitDetail | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    source: normalizeHitSourceRef(fieldValue(item, "source", "Source")),
    indicator_key: stringValue(fieldValue(item, "indicator_key", "indicatorKey", "IndicatorKey")),
    ioc_type: stringValue(fieldValue(item, "ioc_type", "iocType", "IocType")),
    value_subtype: stringValue(fieldValue(item, "value_subtype", "valueSubtype", "ValueSubtype")),
    normalized_value: stringValue(fieldValue(item, "normalized_value", "normalizedValue", "NormalizedValue")),
    display_value: stringValue(fieldValue(item, "display_value", "displayValue", "DisplayValue")),
    status: stringValue(fieldValue(item, "status", "Status")),
    categories: stringArray(fieldValue(item, "categories", "Categories")),
    confidence: numberValue(fieldValue(item, "confidence", "Confidence")),
    source_count: numberValue(fieldValue(item, "source_count", "sourceCount", "SourceCount")),
    feed_count: numberValue(fieldValue(item, "feed_count", "feedCount", "FeedCount")),
    source_names: stringArray(fieldValue(item, "source_names", "sourceNames", "SourceNames")),
    feed_names: stringArray(fieldValue(item, "feed_names", "feedNames", "FeedNames")),
    source_urls: stringArray(fieldValue(item, "source_urls", "sourceUrls", "SourceUrls")),
    first_seen: stringValue(fieldValue(item, "first_seen", "firstSeen", "FirstSeen")),
    last_seen: stringValue(fieldValue(item, "last_seen", "lastSeen", "LastSeen")),
    last_batch_id: stringValue(fieldValue(item, "last_batch_id", "lastBatchId", "LastBatchId")),
    extra_json: stringValue(fieldValue(item, "extra_json", "extraJson", "ExtraJson")),
    extra_json_keys: stringArray(fieldValue(item, "extra_json_keys", "extraJsonKeys", "ExtraJsonKeys")),
  }
}

function normalizeHitSourceDetail(
  raw: unknown,
): AttackCaseIOCVerificationHitSourceDetail | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  const blacklistIndicator = normalizeBlacklistIndicatorHitDetail(
    fieldValue(item, "blacklist_indicator", "blacklistIndicator", "BlacklistIndicator"),
  )
  const iocEntry = normalizeIocEntryHitDetail(
    fieldValue(item, "ioc_entry", "iocEntry", "IocEntry"),
  )

  if (!blacklistIndicator && !iocEntry) return null

  return {
    ioc_entry: iocEntry,
    blacklist_indicator: blacklistIndicator,
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
  const hitSource = normalizeHitSourceRef(
    fieldValue(detail, "hit_source", "hitSource", "HitSource"),
  )
  const detailView = normalizeHitDetailView(
    fieldValue(detail, "detail_view", "detailView", "DetailView"),
  )
  const hitSourceDetailRaw = objectValue(
    fieldValue(detail, "hit_source_detail", "hitSourceDetail", "HitSourceDetail"),
  )
  const directIocEntry = fieldValue(detail, "ioc_entry", "iocEntry", "IocEntry")
  const directBlacklistIndicator = fieldValue(
    detail,
    "blacklist_indicator",
    "blacklistIndicator",
    "BlacklistIndicator",
  )
  const hitSourceDetail = normalizeHitSourceDetail({
    ...hitSourceDetailRaw,
    ...(directIocEntry ? { ioc_entry: directIocEntry } : {}),
    ...(directBlacklistIndicator
      ? { blacklist_indicator: directBlacklistIndicator }
      : {}),
  })

  if (item) {
    item.local_eval_raw_json = localEvalRawJson || item.local_eval_raw_json
  }

  return {
    item,
    local_eval_raw_json: localEvalRawJson,
    hit_source: hitSource,
    hit_source_detail: hitSourceDetail,
    detail_view: detailView,
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
      include_raw_json: true,
    },
  )) as ApiResult<unknown>

  return normalizeVerificationDetail(result.data)
}
