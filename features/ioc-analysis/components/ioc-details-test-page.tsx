"use client"

import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Database,
  FlaskConical,
  Layers3,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { listAttackWorkflows } from "@/features/attack/workflow/api"
import { IocVerificationDetailPanel } from "@/features/ioc-analysis/components/ioc-verification-detail-panel"
import {
  createAttackCaseIocVerifyTask,
  getAttackCaseIocVerification,
  getAttackCaseIocVerifyTask,
  listAttackCaseIocCandidates,
} from "@/features/ioc-analysis/api"
import type {
  AttackCaseIOCEvidenceField,
  AttackCaseIOCEvidenceFieldGroup,
  AttackCaseIOCEvidenceReason,
  AttackCaseIOCHitDetailView,
  AttackCaseIOCHitEvidence,
  AttackCaseIOCHitRelation,
  AttackCaseIOCHitSourceRef,
  AttackCaseIOCJSONEvidence,
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCIocEntryRecord,
  AttackCaseIOCIocObservation,
  AttackCaseIOCIocRelation,
  AttackCaseIOCIntelSource,
  AttackCaseIOCRawFieldGroup,
  AttackCaseIOCSourceFact,
  AttackCaseIOCSourceRecord,
  AttackCaseIOCVerificationItem,
  IocVerificationItem,
  IocVerificationStatus,
  IocVerificationType,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

const DEFAULT_TENANT_ID = "public"
const DEFAULT_SAMPLE_LIMIT = 80
const DEFAULT_WORKFLOW_SCAN_LIMIT = 80
const MAX_CASE_SCAN_COUNT = 50
const DETAIL_CONCURRENCY = 4
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90

type DetailSample = {
  item: IocVerificationItem
  detailLoaded: boolean
  error: string
}

type CoverageSpec = {
  id: string
  label: string
  description: string
  matched: boolean
}

type WhitelistMockRecord = {
  table: "ioc_allowlist_hash" | "ioc_allowlist_domain" | "ioc_allowlist_ip"
  entryKey: string
  tenantId: string
  scope: string
  matchType: string
  iocType: "hash" | "domain" | "ip"
  value: string
  hashType?: string
  hashHash?: string
  fileName?: string
  fileSize?: number
  productName?: string
  publisher?: string
  registeredDomain?: string
  ipVersion?: number
  cidrPrefix?: number
  cloudProvider?: string
  serviceName?: string
  region?: string
  allowLevel: string
  action: string
  sourceName: string
  sourceUrl: string
  sourceVersion: string
  confidence: number
  reason: string
  owner: string
  createdAt: string
  updatedAt: string
}

type BlacklistMockRecord = {
  indicatorKey: string
  iocType: "ip" | "hash"
  valueSubtype: string
  normalizedValue: string
  displayValue: string
  status: string
  categories: string[]
  confidence: number
  sourceCount: number
  feedCount: number
  sourceNames: string[]
  feedNames: string[]
  sourceUrls: string[]
  firstSeen: string
  lastSeen: string
  lastBatchId: string
  extraJson: string
}

type IocEntryMockRecordItem = {
  id: string
  iocType: IocVerificationType
  observableType: string
  normalizedValue: string
  displayValue: string
  status: string
  riskScore: number
  confidence: number
  tags: string[]
  extraJson: string
  firstSeen: string
  lastSeen: string
}

type IocEntryMockObservation = {
  sourceName: string
  sourceRecordId: string
  sourceUrl: string
  rawJson: string
  confidence: number
  firstSeen: string
  lastSeen: string
  tags: string[]
  reasons: AttackCaseIOCEvidenceReason[]
  fieldGroups: AttackCaseIOCEvidenceFieldGroup[]
  summary: string
}

type IocEntryMockRelation = {
  direction: "in" | "out"
  relationType: string
  peer: IocEntryMockRecordItem
  sourceName: string
  sourceRecordId: string
  sourceUrl: string
  rawJson: string
  firstSeen: string
  lastSeen: string
  fieldGroups: AttackCaseIOCEvidenceFieldGroup[]
}

type IocEntryMockRecord = {
  entry: IocEntryMockRecordItem
  observations: IocEntryMockObservation[]
  relations: IocEntryMockRelation[]
}

const IOC_TYPE_GROUPS = [
  {
    id: "hash",
    label: "hash",
    match: (type: IocVerificationType) =>
      type === "hash" || type === "md5" || type === "sha1" || type === "sha256",
  },
  { id: "ip", label: "ip", match: (type: IocVerificationType) => type === "ip" },
  { id: "url", label: "url", match: (type: IocVerificationType) => type === "url" },
  {
    id: "domain",
    label: "domain",
    match: (type: IocVerificationType) =>
      type === "domain" || type === "hostname",
  },
]

const SOURCE_TABLES = [
  "whitelist_db.ioc_allowlist_hash",
  "whitelist_db.ioc_allowlist_domain",
  "whitelist_db.ioc_allowlist_ip",
  "whitelist_db.ioc_allowlist_certificate",
  "whitelist_db.ioc_domain_popularity",
  "ioc.ioc_entry",
  "ioc.ioc_blacklist_indicator",
]

function getRouteParam(value: string | null) {
  return value?.trim() || ""
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizedStatus(value: string) {
  return value.trim().toLowerCase()
}

function isActiveTaskStatus(status: string) {
  return status === "pending" || status === "running"
}

function sampleLimitValue(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return DEFAULT_SAMPLE_LIMIT
  return Math.max(1, Math.min(200, parsed))
}

function verificationStatus(
  verification: AttackCaseIOCVerificationItem | null | undefined,
  fallback: IocVerificationStatus,
): IocVerificationStatus {
  if (!verification || verification.final_status === "unverified") return fallback
  if (
    verification.hit_status_key === "local_whitelist_hit" ||
    verification.hit_kind === "whitelist" ||
    verification.hit_verdict === "allow" ||
    verification.final_status === "allowlisted" ||
    verification.final_verdict === "allow" ||
    verification.whitelist_status === "hit"
  ) {
    return "allowlisted"
  }
  if (
    verification.hit_status_key === "local_ioc_hit" ||
    verification.hit_status_key === "remote_ioc_hit" ||
    (verification.hit && verification.hit_kind === "ioc") ||
    verification.hit_verdict === "malicious" ||
    verification.final_status === "local_hit" ||
    verification.final_status === "remote_hit" ||
    verification.final_verdict === "malicious"
  ) {
    return "hit"
  }
  if (
    verification.hit_status_key === "error" ||
    verification.hit_verdict === "error" ||
    verification.final_status === "local_error" ||
    verification.final_status === "remote_error" ||
    verification.final_verdict === "error"
  ) {
    return "error"
  }
  if (
    verification.hit_status_key === "no_hit" ||
    verification.final_status === "local_miss" ||
    verification.final_status === "remote_miss" ||
    verification.final_verdict === "unknown"
  ) {
    return "miss"
  }
  return fallback
}

function sourceTableText(item: IocVerificationItem) {
  const detailRef = item.verification_detail?.hit_source
  const detailViewRef = item.verification_detail?.detail_view?.source_ref
  const verification = item.verification
  const database =
    detailRef?.database ||
    detailViewRef?.database ||
    verification?.hit_source_database ||
    ""
  const table =
    detailRef?.table || detailViewRef?.table || verification?.hit_source_table || ""

  if (!database && !table) return "-"
  return [database, table].filter(Boolean).join(".")
}

function hitGroup(item: IocVerificationItem) {
  const verification = item.verification
  const sourceTable = sourceTableText(item)
  if (!verification) return "unverified"
  if (verification.hit_kind === "whitelist" || sourceTable.startsWith("whitelist_db.")) {
    return "whitelist"
  }
  if (sourceTable === "ioc.ioc_blacklist_indicator") return "blacklist"
  if (sourceTable === "ioc.ioc_entry") return "ioc_entry"
  if (verification.hit_status_key === "no_hit" || item.status === "miss") return "miss"
  if (item.status === "error") return "error"
  return verification.hit_kind || verification.final_status || item.status
}

function typeGroupLabel(item: IocVerificationItem) {
  const matched = IOC_TYPE_GROUPS.find((group) => group.match(item.type))
  return matched?.label || item.type
}

function hasUsableDetail(item: IocVerificationItem) {
  return Boolean(
    item.verification_detail?.detail_view ||
      item.verification_detail?.hit_source_detail?.ioc_entry ||
      item.verification_detail?.hit_source_detail?.blacklist_indicator,
  )
}

function sampleKey(item: IocVerificationItem) {
  return item.candidate_id || item.id
}

function caseCandidateKey(item: IocVerificationItem) {
  return [item.case_id, item.candidate_id || item.id].filter(Boolean).join(":")
}

function workflowCaseId(workflow: { case_id: string; root_type: string; root_id: string }) {
  if (workflow.case_id.trim()) return workflow.case_id.trim()
  if (workflow.root_type.trim().toLowerCase() === "case") return workflow.root_id.trim()
  return ""
}

function uniqueByCandidate(items: IocVerificationItem[]) {
  const byKey = new Map<string, IocVerificationItem>()
  for (const item of items) {
    const key = caseCandidateKey(item) || sampleKey(item)
    if (!key || byKey.has(key)) continue
    byKey.set(key, item)
  }
  return Array.from(byKey.values())
}

function candidateCoverageKey(item: IocVerificationItem) {
  const table = sourceTableText(item)
  const group = hitGroup(item)
  return [
    typeGroupLabel(item),
    table !== "-" ? table : group,
    item.verification ? "verified" : "unverified",
  ].join(":")
}

function prioritizeCandidates(items: IocVerificationItem[]) {
  const uniqueItems = uniqueByCandidate(items)
  const selected: IocVerificationItem[] = []
  const selectedIds = new Set<string>()
  const coverageKeys = new Set<string>()

  const preferred = [...uniqueItems].sort((left, right) => {
    const leftVerified = left.verification ? 1 : 0
    const rightVerified = right.verification ? 1 : 0
    if (leftVerified !== rightVerified) return rightVerified - leftVerified
    return sourceTableText(right).localeCompare(sourceTableText(left))
  })

  for (const item of preferred) {
    const coverageKey = candidateCoverageKey(item)
    if (coverageKeys.has(coverageKey)) continue
    coverageKeys.add(coverageKey)
    selected.push(item)
    selectedIds.add(caseCandidateKey(item) || sampleKey(item))
  }

  for (const item of preferred) {
    const key = caseCandidateKey(item) || sampleKey(item)
    if (selectedIds.has(key)) continue
    selected.push(item)
  }

  return selected
}

function displayValue(value: string | number | undefined | null) {
  if (typeof value === "number") return String(value)
  const normalized = value?.trim() || ""
  return normalized || "-"
}

function displayList(values: string[]) {
  if (!values.length) return "[]"
  return `[${values.map((value) => `'${value}'`).join(", ")}]`
}

function rawDisplayValue(value: unknown) {
  if (value === null || typeof value === "undefined") return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

function parsedJSON(rawJson: string) {
  try {
    return JSON.parse(rawJson) as unknown
  } catch {
    return null
  }
}

function jsonEvidence(rawJson: string): AttackCaseIOCJSONEvidence | null {
  const raw = rawJson.trim()
  if (!raw) return null

  const parsed = parsedJSON(raw)
  const keys =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.keys(parsed as Record<string, unknown>).sort()
      : []

  return {
    raw_json: raw,
    raw_json_preview: raw.length > 512 ? raw.slice(0, 512) : raw,
    raw_json_length: raw.length,
    raw_json_keys: keys,
  }
}

function rawGroupFromJSON(
  title: string,
  sourceTable: string,
  rawJson: string,
): AttackCaseIOCRawFieldGroup | null {
  const parsed = parsedJSON(rawJson)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null

  const fields = Object.entries(parsed as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({
      key,
      label: key,
      value: rawDisplayValue(value),
      value_type: Array.isArray(value) ? "array" : typeof value,
      copyable: typeof value === "string" && value.length > 0,
      multiline: typeof value === "object" && value !== null,
    }))

  if (!fields.length) return null

  return {
    title,
    source_table: sourceTable,
    fields,
  }
}

function sourceTypeForName(sourceName: string) {
  const normalized = sourceName.trim().toLowerCase()
  if (
    normalized === "urlhaus" ||
    normalized === "threatfox" ||
    normalized === "malwarebazaar"
  ) {
    return "threat_feed"
  }
  return normalized || "source"
}

function detailField(
  group: string,
  key: string,
  label: string,
  value: string | number | undefined | null,
  options: {
    valueType?: string
    copyable?: boolean
    important?: boolean
    sourcePath?: string
  } = {},
): AttackCaseIOCEvidenceField {
  return {
    group,
    key,
    label,
    value: displayValue(value),
    value_type: options.valueType || "string",
    copyable: options.copyable ?? false,
    important: options.important ?? true,
    source_path: options.sourcePath || key,
  }
}

function compactStrings(values: Array<string | undefined | null>) {
  const seen = new Set<string>()
  const items: string[] = []
  values.forEach((value) => {
    const normalized = value?.trim() || ""
    if (!normalized) return
    const key = normalized.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    items.push(normalized)
  })
  return items
}

function sourceFact(
  key: string,
  label: string,
  value: string | number | undefined | null,
  sourcePath = key,
): AttackCaseIOCSourceFact | null {
  const normalized = displayValue(value)
  if (normalized === "-") return null
  return {
    key,
    label,
    value: normalized,
    source_path: sourcePath,
  }
}

function compactSourceFacts(
  facts: Array<AttackCaseIOCSourceFact | null | undefined>,
) {
  const seen = new Set<string>()
  const items: AttackCaseIOCSourceFact[] = []
  facts.forEach((fact) => {
    if (!fact) return
    const key = `${fact.key.toLowerCase()}\u0000${fact.value.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    items.push(fact)
  })
  return items
}

function compactSourceFields(fields: AttackCaseIOCEvidenceField[]) {
  const seen = new Set<string>()
  const items: AttackCaseIOCEvidenceField[] = []
  fields.forEach((fieldItem) => {
    const key = `${fieldItem.source_path || fieldItem.key}\u0000${fieldItem.value}`.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    items.push(fieldItem)
  })
  return items
}

function minimumTextTime(values: string[]) {
  return compactStrings(values).sort()[0] || ""
}

function maximumTextTime(values: string[]) {
  const sorted = compactStrings(values).sort()
  return sorted[sorted.length - 1] || ""
}

function sourceRecordKind(sourceName: string, recordId: string) {
  const source = sourceName.trim().toLowerCase()
  const record = recordId.trim().toLowerCase()
  if (record.startsWith("misp:event:")) return "misp_export"
  if (source === "urlhaus" && /^\d+$/.test(record)) return "urlhaus_native"
  if (source === "threatfox" && /^\d+$/.test(record)) return "threatfox_native"
  if (source === "malwarebazaar" && /^\d+$/.test(record)) {
    return "malwarebazaar_native"
  }
  if (source) return `${source}_record`
  return "source_record"
}

function whitelistSourceRef(record: WhitelistMockRecord): AttackCaseIOCHitSourceRef {
  return {
    database: "whitelist_db",
    table: record.table,
    record_id: record.entryKey,
  }
}

function whitelistHashFieldGroups(
  record: WhitelistMockRecord,
): AttackCaseIOCEvidenceFieldGroup[] {
  if (record.iocType !== "hash") return []

  const groups: AttackCaseIOCEvidenceFieldGroup[] = [
    {
      group: "hash",
      title: "Hash",
      fields: [
        detailField("hash", "hash_type", "hash type", record.hashType || record.matchType, {
          sourcePath: "hash.hash_type",
        }),
        detailField("hash", "hash_value", "hash value", record.value, {
          copyable: true,
          sourcePath: "hash.hash_value",
        }),
      ],
    },
    {
      group: "file",
      title: "File",
      fields: [
        detailField("file", "file_name", "file name", record.fileName, {
          copyable: true,
          sourcePath: "hash.file_name",
        }),
        detailField("file", "file_size", "file size", record.fileSize, {
          valueType: "number",
          sourcePath: "hash.file_size",
        }),
        detailField("file", "product_name", "product name", record.productName, {
          sourcePath: "hash.product_name",
        }),
        detailField("file", "publisher", "publisher", record.publisher, {
          sourcePath: "hash.publisher",
        }),
      ],
    },
  ]

  if (record.hashHash) {
    groups.push({
      group: "metadata",
      title: "Metadata",
      fields: [
        detailField("metadata", "hash_hash", "hash hash", record.hashHash, {
          copyable: true,
          sourcePath: "hash_hash",
        }),
      ],
    })
  }

  return groups
}

function whitelistEvidence(record: WhitelistMockRecord): AttackCaseIOCHitEvidence {
  const networkFields =
    record.iocType === "hash"
      ? []
      : record.iocType === "domain"
      ? [
          detailField("network", "domain", "domain", record.value, {
            copyable: true,
            sourcePath: "domain.domain",
          }),
          detailField(
            "network",
            "registered_domain",
            "registered domain",
            record.registeredDomain,
            { sourcePath: "domain.registered_domain" },
          ),
        ]
      : [
          detailField("network", "ip_value", "IP value", record.value, {
            copyable: true,
            sourcePath: "ip.ip_value",
          }),
          detailField("network", "cloud_provider", "cloud provider", record.cloudProvider, {
            sourcePath: "ip.cloud_provider",
          }),
          detailField("network", "service_name", "service name", record.serviceName, {
            sourcePath: "ip.service_name",
          }),
          detailField("network", "region", "region", record.region, {
            sourcePath: "ip.region",
          }),
        ]

  return {
    evidence_id: record.entryKey,
    source: {
      source_name: record.sourceName,
      source_type: "whitelist",
      source_record_id: record.entryKey,
      source_url: record.sourceUrl,
      reporter: "",
      credits: "",
    },
    time: {
      first_seen: "",
      last_seen: record.updatedAt,
      observed_at: "",
      added_at: record.createdAt,
      event_time: "",
    },
    tags: [],
    scores: [
      {
        name: "confidence",
        value: String(record.confidence),
        normalized_score: record.confidence,
        source_path: "confidence",
      },
    ],
    reasons: record.reason
      ? [{ type: "reason", value: record.reason, source_path: "reason" }]
      : [],
    field_groups: [
      {
        group: "allowlist",
        title: "Whitelist",
        fields: [
          detailField("allowlist", "entry_key", "entry key", record.entryKey, {
            copyable: true,
            sourcePath: "entry_key",
          }),
          detailField("allowlist", "match_type", "match type", record.matchType, {
            sourcePath: "match_type",
          }),
          detailField("allowlist", "allow_level", "allow level", record.allowLevel, {
            sourcePath: "allow_level",
          }),
          detailField("allowlist", "action", "action", record.action, {
            sourcePath: "action",
          }),
          detailField(
            "allowlist",
            "source_version",
            "source version",
            record.sourceVersion,
            { sourcePath: "source_version" },
          ),
        ],
      },
      {
        group: "network",
        title: "Network",
        fields: networkFields,
      },
      ...whitelistHashFieldGroups(record),
    ],
    raw: null,
    title: `${record.sourceName} · ${record.updatedAt}`,
    summary: [
      `action=${record.action}`,
      `allow_level=${record.allowLevel}`,
      record.iocType === "hash" && record.fileName ? `file=${record.fileName}` : "",
      record.reason,
    ]
      .filter(Boolean)
      .join("; "),
  }
}

function whitelistSourceKeyFields(
  record: WhitelistMockRecord,
  evidence: AttackCaseIOCHitEvidence,
) {
  const detailFields = evidence.field_groups
    .filter((group) => group.group !== "allowlist")
    .flatMap((group) => group.fields)

  return compactSourceFields([
    detailField("allowlist", "entry_key", "entry key", record.entryKey, {
      copyable: true,
      sourcePath: "entry_key",
    }),
    detailField("allowlist", "match_type", "match type", record.matchType, {
      sourcePath: "match_type",
    }),
    detailField("allowlist", "display_value", "display value", record.value, {
      copyable: true,
      sourcePath: "display_value",
    }),
    ...detailFields,
  ])
}

function whitelistIntelSource(
  record: WhitelistMockRecord,
  evidence: AttackCaseIOCHitEvidence,
): AttackCaseIOCIntelSource {
  const facts = compactSourceFacts([
    sourceFact("allow_level", "allow level", record.allowLevel, "allow_level"),
    sourceFact("action", "action", record.action, "action"),
    sourceFact(
      "source_version",
      "source version",
      record.sourceVersion,
      "source_version",
    ),
    sourceFact("reason", "reason", record.reason, "reason"),
  ])
  const keyFields = whitelistSourceKeyFields(record, evidence)
  const sourceUrls = compactStrings([record.sourceUrl])

  return {
    source_type: "whitelist",
    source_name: record.sourceName || "whitelist",
    display_name: record.sourceName || "whitelist",
    source_urls: sourceUrls,
    tags: [],
    max_confidence: record.confidence,
    max_risk_score: 0,
    first_seen: "",
    last_seen: record.updatedAt,
    facts,
    key_fields: keyFields,
    records: [
      {
        record_id: record.entryKey,
        record_kind: "whitelist_entry",
        title: `${record.sourceName || "whitelist"} · ${record.updatedAt}`,
        source_url: record.sourceUrl,
        first_seen: "",
        last_seen: record.updatedAt,
        confidence: record.confidence,
        tags: [],
        facts,
        fields: keyFields,
        raw: evidence.raw,
      },
    ],
  }
}

function whitelistDetailView(record: WhitelistMockRecord): AttackCaseIOCHitDetailView {
  const sourceRef = whitelistSourceRef(record)
  const evidence = whitelistEvidence(record)

  return {
    source_ref: sourceRef,
    primary: {
      ioc_type: record.iocType,
      value_subtype: record.matchType,
      normalized_value: record.value,
      display_value: record.value,
      status: record.action,
      risk_score: 0,
      confidence: record.confidence,
      tags: record.iocType === "hash" ? [record.allowLevel].filter(Boolean) : [],
      first_seen: "",
      last_seen: record.updatedAt,
      source_names: [record.sourceName],
      feed_names: [],
      source_count: 0,
      feed_count: 0,
    },
    evidence: [evidence],
    relations: [],
    raw_groups: [],
    sources: [whitelistIntelSource(record, evidence)],
  }
}

function mockVerification(record: WhitelistMockRecord): AttackCaseIOCVerificationItem {
  const candidateId = `mock-${record.table}-${record.entryKey}`

  return {
    verification_id: `verification-${candidateId}`,
    candidate_id: candidateId,
    tenant_id: record.tenantId,
    case_id: "mock-whitelist-detail-case",
    local_decision: "allow",
    whitelist_status: "hit",
    local_status: "hit",
    local_hit_source: "whitelist",
    remote_status: "skipped",
    final_status: "allowlisted",
    final_verdict: "allow",
    risk_score: 0,
    confidence: record.confidence,
    checked_at: record.updatedAt,
    error_message: "",
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    hit: true,
    hit_scope: "local",
    hit_kind: "whitelist",
    hit_category:
      record.action === "skip_ioc_query" ? "whitelist_skip" : "whitelist_annotate",
    hit_status_key: "local_whitelist_hit",
    hit_verdict: "allow",
    hit_source_database: "whitelist_db",
    hit_source_table: record.table,
    hit_source_record_id: record.entryKey,
    local_eval_raw_json: "",
  }
}

function whitelistMockSample(record: WhitelistMockRecord): DetailSample {
  const candidateId = `mock-${record.table}-${record.entryKey}`
  const verification = mockVerification(record)
  const sourceRef = whitelistSourceRef(record)

  return {
    item: {
      id: candidateId,
      candidate_id: candidateId,
      tenant_id: record.tenantId,
      case_id: "mock-whitelist-detail-case",
      type: record.iocType,
      value: record.value,
      source: `mock:${sourceRef.database}.${sourceRef.table}`,
      evidence_refs: [record.entryKey],
      origin: "manual",
      query_type: record.iocType,
      normalized_value: record.value,
      source_ref_id: record.entryKey,
      source_field: record.iocType === "hash" ? "hash_value" : record.iocType,
      file_name: record.fileName,
      occurred_at: record.updatedAt,
      candidate_status: "active",
      last_seen_at: record.updatedAt,
      verification,
      verification_detail: {
        item: verification,
        local_eval_raw_json: "",
        hit_source: sourceRef,
        hit_source_detail: null,
        detail_view: whitelistDetailView(record),
      },
      status: "allowlisted",
      result: null,
      error: "",
    },
    detailLoaded: true,
    error: "",
  }
}

function blacklistSourceRef(record: BlacklistMockRecord): AttackCaseIOCHitSourceRef {
  return {
    database: "ioc",
    table: "ioc_blacklist_indicator",
    record_id: record.indicatorKey,
  }
}

function blacklistSummary(record: BlacklistMockRecord) {
  return [
    `status=${record.status}`,
    `confidence=${record.confidence}`,
    `sources=${record.sourceCount}`,
    `feeds=${record.feedCount}`,
    `categories=${record.categories.join(",")}`,
  ]
    .filter(Boolean)
    .join("; ")
}

function blacklistEvidence(record: BlacklistMockRecord): AttackCaseIOCHitEvidence {
  const sourceName = record.sourceNames[0] || "blacklist"
  const feedName = record.feedNames[0] || ""

  return {
    evidence_id: record.indicatorKey,
    source: {
      source_name: sourceName,
      source_type: "threat_feed",
      source_record_id: record.indicatorKey,
      source_url: record.sourceUrls[0] || "",
      reporter: "",
      credits: "",
    },
    time: {
      first_seen: record.firstSeen,
      last_seen: record.lastSeen,
      observed_at: "",
      added_at: record.lastSeen,
      event_time: "",
    },
    tags: record.categories.map((category) => ({
      value: category,
      source_path: "categories",
    })),
    scores: [
      {
        name: "confidence",
        value: String(record.confidence),
        normalized_score: record.confidence,
        source_path: "confidence",
      },
    ],
    reasons: [
      { type: "status", value: record.status, source_path: "status" },
      { type: "source", value: sourceName, source_path: "source_names[0]" },
      ...(feedName
        ? [{ type: "feed", value: feedName, source_path: "feed_names[0]" }]
        : []),
    ],
    field_groups: [
      {
        group: "intelligence",
        title: "Intelligence",
        fields: [
          detailField("intelligence", "indicator_key", "indicator key", record.indicatorKey, {
            copyable: true,
            sourcePath: "indicator_key",
          }),
          detailField("intelligence", "status", "status", record.status, {
            sourcePath: "status",
          }),
          detailField("intelligence", "source_count", "source count", record.sourceCount, {
            sourcePath: "source_count",
          }),
          detailField("intelligence", "feed_count", "feed count", record.feedCount, {
            sourcePath: "feed_count",
          }),
          detailField("intelligence", "source_names", "source names", displayList(record.sourceNames), {
            sourcePath: "source_names",
          }),
          detailField("intelligence", "feed_names", "feed names", displayList(record.feedNames), {
            sourcePath: "feed_names",
          }),
        ],
      },
    ],
    raw: null,
    title: `${sourceName} · ${record.lastSeen}`,
    summary: blacklistSummary(record),
  }
}

function blacklistIntelSource(
  record: BlacklistMockRecord,
  evidence: AttackCaseIOCHitEvidence,
): AttackCaseIOCIntelSource {
  const facts = compactSourceFacts([
    sourceFact("status", "status", record.status, "status"),
    sourceFact("categories", "categories", record.categories.join(", "), "categories"),
  ])
  const keyFields = compactSourceFields([
    detailField(
      "intelligence",
      "indicator_key",
      "indicator key",
      record.indicatorKey,
      {
        copyable: true,
        sourcePath: "indicator_key",
      },
    ),
    detailField(
      "intelligence",
      "value_subtype",
      "value subtype",
      record.valueSubtype,
      {
        sourcePath: "value_subtype",
      },
    ),
    detailField(
      "intelligence",
      "display_value",
      "display value",
      record.displayValue,
      {
        copyable: true,
        sourcePath: "display_value",
      },
    ),
    detailField(
      "intelligence",
      "normalized_value",
      "normalized value",
      record.normalizedValue,
      {
        copyable: true,
        sourcePath: "normalized_value",
      },
    ),
  ])

  return {
    source_type: "blacklist",
    source_name: "ioc_blacklist_indicator",
    display_name: "IOC Blacklist",
    source_urls: compactStrings(record.sourceUrls),
    tags: [],
    max_confidence: record.confidence,
    max_risk_score: 0,
    first_seen: record.firstSeen,
    last_seen: record.lastSeen,
    facts,
    key_fields: keyFields,
    records: [
      {
        record_id: record.indicatorKey,
        record_kind: "blacklist_indicator",
        title: `${record.sourceNames[0] || "IOC blacklist"} · ${record.firstSeen}`,
        source_url: record.sourceUrls[0] || "",
        first_seen: record.firstSeen,
        last_seen: record.lastSeen,
        confidence: record.confidence,
        tags: [],
        facts,
        fields: keyFields,
        raw: evidence.raw,
      },
    ],
  }
}

function blacklistDetailView(record: BlacklistMockRecord): AttackCaseIOCHitDetailView {
  const evidence = blacklistEvidence(record)

  return {
    source_ref: blacklistSourceRef(record),
    primary: {
      ioc_type: record.iocType,
      value_subtype: record.valueSubtype,
      normalized_value: record.normalizedValue,
      display_value: record.displayValue,
      status: record.status,
      risk_score: 0,
      confidence: record.confidence,
      tags: record.categories,
      first_seen: record.firstSeen,
      last_seen: record.lastSeen,
      source_names: record.sourceNames,
      feed_names: record.feedNames,
      source_count: record.sourceCount,
      feed_count: record.feedCount,
    },
    evidence: [evidence],
    relations: [],
    raw_groups: [],
    sources: [blacklistIntelSource(record, evidence)],
  }
}

function blacklistMockVerification(
  record: BlacklistMockRecord,
): AttackCaseIOCVerificationItem {
  const candidateId = `mock-ioc_blacklist_indicator-${record.indicatorKey}`

  return {
    verification_id: `verification-${candidateId}`,
    candidate_id: candidateId,
    tenant_id: DEFAULT_TENANT_ID,
    case_id: "mock-blacklist-detail-case",
    local_decision: "block",
    whitelist_status: "miss",
    local_status: "hit",
    local_hit_source: "blacklist",
    remote_status: "skipped",
    final_status: "local_blacklist_hit",
    final_verdict: "malicious",
    risk_score: 0,
    confidence: record.confidence,
    checked_at: record.lastSeen,
    error_message: "",
    created_at: record.firstSeen,
    updated_at: record.lastSeen,
    hit: true,
    hit_scope: "local",
    hit_kind: "blacklist",
    hit_category: "blacklist_indicator",
    hit_status_key: "local_blacklist_hit",
    hit_verdict: "malicious",
    hit_source_database: "ioc",
    hit_source_table: "ioc_blacklist_indicator",
    hit_source_record_id: record.indicatorKey,
    local_eval_raw_json: "",
  }
}

function blacklistMockSample(record: BlacklistMockRecord): DetailSample {
  const candidateId = `mock-ioc_blacklist_indicator-${record.indicatorKey}`
  const verification = blacklistMockVerification(record)
  const sourceRef = blacklistSourceRef(record)

  return {
    item: {
      id: candidateId,
      candidate_id: candidateId,
      tenant_id: DEFAULT_TENANT_ID,
      case_id: "mock-blacklist-detail-case",
      type: record.iocType,
      value: record.displayValue,
      source: `mock:${sourceRef.database}.${sourceRef.table}`,
      evidence_refs: [record.indicatorKey],
      origin: "manual",
      query_type: record.valueSubtype || record.iocType,
      normalized_value: record.normalizedValue,
      source_ref_id: record.indicatorKey,
      source_field: record.valueSubtype || record.iocType,
      occurred_at: record.lastSeen,
      candidate_status: "active",
      last_seen_at: record.lastSeen,
      verification,
      verification_detail: {
        item: verification,
        local_eval_raw_json: "",
        hit_source: sourceRef,
        hit_source_detail: null,
        detail_view: blacklistDetailView(record),
      },
      status: "hit",
      result: null,
      error: "",
    },
    detailLoaded: true,
    error: "",
  }
}

function iocEntrySourceRef(record: IocEntryMockRecord): AttackCaseIOCHitSourceRef {
  return {
    database: "ioc",
    table: "ioc_entry",
    record_id: record.entry.id,
  }
}

function iocEntryRecord(item: IocEntryMockRecordItem): AttackCaseIOCIocEntryRecord {
  return {
    id: item.id,
    ioc_type: item.iocType,
    observable_type: item.observableType,
    normalized_value: item.normalizedValue,
    display_value: item.displayValue,
    status: item.status,
    risk_score: item.riskScore,
    confidence: item.confidence,
    tags: item.tags,
    extra_json: item.extraJson,
    extra_json_keys: jsonEvidence(item.extraJson)?.raw_json_keys ?? [],
    first_seen: item.firstSeen,
    last_seen: item.lastSeen,
  }
}

function iocEntryObservation(
  observation: IocEntryMockObservation,
): AttackCaseIOCIocObservation {
  return {
    source_name: observation.sourceName,
    source_record_id: observation.sourceRecordId,
    source_url: observation.sourceUrl,
    confidence: observation.confidence,
    first_seen: observation.firstSeen,
    last_seen: observation.lastSeen,
    evidence: jsonEvidence(observation.rawJson),
  }
}

function iocEntryRelation(relation: IocEntryMockRelation): AttackCaseIOCIocRelation {
  return {
    relation_type: relation.relationType,
    direction: relation.direction,
    source_name: relation.sourceName,
    source_record_id: relation.sourceRecordId,
    first_seen: relation.firstSeen,
    last_seen: relation.lastSeen,
    evidence: jsonEvidence(relation.rawJson),
    peer_entry: iocEntryRecord(relation.peer),
  }
}

function iocEntryEvidence(
  observation: IocEntryMockObservation,
  index: number,
): AttackCaseIOCHitEvidence {
  return {
    evidence_id: `${observation.sourceName}:${observation.sourceRecordId || index}`,
    source: {
      source_name: observation.sourceName,
      source_type: sourceTypeForName(observation.sourceName),
      source_record_id: observation.sourceRecordId,
      source_url: observation.sourceUrl,
      reporter: "",
      credits: "",
    },
    time: {
      first_seen: observation.firstSeen,
      last_seen: observation.lastSeen,
      observed_at: "",
      added_at: observation.firstSeen,
      event_time: "",
    },
    tags: observation.tags.map((tag) => ({
      value: tag,
      source_path: "raw_json.tags",
    })),
    scores: [
      {
        name: "confidence",
        value: String(observation.confidence),
        normalized_score: observation.confidence,
        source_path: "confidence",
      },
    ],
    reasons: observation.reasons,
    field_groups: observation.fieldGroups,
    raw: jsonEvidence(observation.rawJson),
    title: `${observation.sourceName} · ${observation.firstSeen}`,
    summary: observation.summary,
  }
}

function iocEntryRelationView(relation: IocEntryMockRelation): AttackCaseIOCHitRelation {
  return {
    direction: relation.direction,
    relation_type: relation.relationType,
    peer_ioc_type: relation.peer.iocType,
    peer_value: relation.peer.displayValue,
    peer_entry_id: relation.peer.id,
    source: {
      source_name: relation.sourceName,
      source_type: sourceTypeForName(relation.sourceName),
      source_record_id: relation.sourceRecordId,
      source_url: relation.sourceUrl,
      reporter: "",
      credits: "",
    },
    time: {
      first_seen: relation.firstSeen,
      last_seen: relation.lastSeen,
      observed_at: "",
      added_at: relation.firstSeen,
      event_time: "",
    },
    field_groups: relation.fieldGroups,
    raw: jsonEvidence(relation.rawJson),
  }
}

function iocEntryHitDetail(record: IocEntryMockRecord): AttackCaseIOCIocEntryHitDetail {
  return {
    source: iocEntrySourceRef(record),
    entry: iocEntryRecord(record.entry),
    observations: record.observations.map(iocEntryObservation),
    observations_page: {
      total: record.observations.length,
      returned: record.observations.length,
      offset: 0,
      limit: 8,
      has_more: false,
    },
    relations: record.relations.map(iocEntryRelation),
    relations_page: {
      total: record.relations.length,
      returned: record.relations.length,
      offset: 0,
      limit: 8,
      has_more: false,
    },
  }
}

function iocEntryObservationKeyFields(observation: IocEntryMockObservation) {
  return compactSourceFields(
    observation.fieldGroups.flatMap((group) =>
      group.fields.filter((fieldItem) => fieldItem.important),
    ),
  )
}

function iocEntryObservationFacts(observation: IocEntryMockObservation) {
  return compactSourceFacts([
    ...observation.reasons.map((reason) =>
      sourceFact(reason.type, reason.type, reason.value, reason.source_path),
    ),
    sourceFact("summary", "summary", observation.summary, "summary"),
  ])
}

function iocEntrySourceRecord(
  observation: IocEntryMockObservation,
): AttackCaseIOCSourceRecord {
  return {
    record_id: observation.sourceRecordId,
    record_kind: sourceRecordKind(observation.sourceName, observation.sourceRecordId),
    title: `${observation.sourceName} · ${observation.firstSeen}`,
    source_url: observation.sourceUrl,
    first_seen: observation.firstSeen,
    last_seen: observation.lastSeen,
    confidence: observation.confidence,
    tags: compactStrings(observation.tags),
    facts: iocEntryObservationFacts(observation),
    fields: iocEntryObservationKeyFields(observation),
    raw: jsonEvidence(observation.rawJson),
  }
}

function iocEntryIntelSources(record: IocEntryMockRecord): AttackCaseIOCIntelSource[] {
  const byKey = new Map<string, AttackCaseIOCIntelSource>()

  record.observations.forEach((observation) => {
    const sourceType = sourceTypeForName(observation.sourceName)
    const sourceName = observation.sourceName.trim()
    const key = `${sourceType}\u0000${sourceName}`.toLowerCase()
    const existing =
      byKey.get(key) ??
      ({
        source_type: sourceType,
        source_name: sourceName,
        display_name: sourceName || sourceType,
        source_urls: [],
        tags: [],
        max_confidence: 0,
        max_risk_score: 0,
        first_seen: "",
        last_seen: "",
        facts: [],
        key_fields: [],
        records: [],
      } satisfies AttackCaseIOCIntelSource)

    existing.source_urls = compactStrings([
      ...existing.source_urls,
      observation.sourceUrl,
    ])
    existing.tags = compactStrings([...existing.tags, ...observation.tags])
    existing.max_confidence = Math.max(
      existing.max_confidence,
      observation.confidence,
    )
    existing.max_risk_score = Math.max(
      existing.max_risk_score,
      record.entry.riskScore,
    )
    existing.first_seen = minimumTextTime([
      existing.first_seen,
      observation.firstSeen,
    ])
    existing.last_seen = maximumTextTime([
      existing.last_seen,
      observation.lastSeen,
    ])
    existing.facts = compactSourceFacts([
      ...existing.facts,
      ...iocEntryObservationFacts(observation),
    ])
    existing.key_fields = compactSourceFields([
      ...existing.key_fields,
      ...iocEntryObservationKeyFields(observation),
    ])
    existing.records = [...existing.records, iocEntrySourceRecord(observation)]

    byKey.set(key, existing)
  })

  return Array.from(byKey.values()).sort((left, right) => {
    if (left.source_type !== right.source_type) {
      return left.source_type.localeCompare(right.source_type)
    }
    return left.display_name.localeCompare(right.display_name)
  })
}

function iocEntryDetailView(record: IocEntryMockRecord): AttackCaseIOCHitDetailView {
  const entryExtra = rawGroupFromJSON(
    "IOC Entry Context",
    "ioc.ioc_entry",
    record.entry.extraJson,
  )

  return {
    source_ref: iocEntrySourceRef(record),
    primary: {
      ioc_type: record.entry.iocType,
      value_subtype: record.entry.observableType,
      normalized_value: record.entry.normalizedValue,
      display_value: record.entry.displayValue,
      status: record.entry.status,
      risk_score: record.entry.riskScore,
      confidence: record.entry.confidence,
      tags: record.entry.tags,
      first_seen: record.entry.firstSeen,
      last_seen: record.entry.lastSeen,
      source_names: Array.from(
        new Set(record.observations.map((item) => item.sourceName).filter(Boolean)),
      ),
      feed_names: [],
      source_count: record.observations.length,
      feed_count: 0,
    },
    evidence: record.observations.map(iocEntryEvidence),
    relations: record.relations.map(iocEntryRelationView),
    raw_groups: entryExtra ? [entryExtra] : [],
    sources: iocEntryIntelSources(record),
  }
}

function iocEntryMockVerification(record: IocEntryMockRecord) {
  const candidateId = `mock-ioc_entry-${record.entry.id}`

  return {
    verification_id: `verification-${candidateId}`,
    candidate_id: candidateId,
    tenant_id: DEFAULT_TENANT_ID,
    case_id: "mock-ioc-entry-detail-case",
    local_decision: "hit",
    whitelist_status: "miss",
    local_status: "hit",
    local_hit_source: "ioc",
    remote_status: "skipped",
    final_status: "local_hit",
    final_verdict: "malicious",
    risk_score: record.entry.riskScore,
    confidence: record.entry.confidence,
    checked_at: record.entry.lastSeen,
    error_message: "",
    created_at: record.entry.firstSeen,
    updated_at: record.entry.lastSeen,
    hit: true,
    hit_scope: "local",
    hit_kind: "ioc",
    hit_category: "local_ioc_entry",
    hit_status_key: "local_ioc_hit",
    hit_verdict: "malicious",
    hit_source_database: "ioc",
    hit_source_table: "ioc_entry",
    hit_source_record_id: record.entry.id,
    local_eval_raw_json: "",
  } satisfies AttackCaseIOCVerificationItem
}

function iocEntryMockSample(record: IocEntryMockRecord): DetailSample {
  const candidateId = `mock-ioc_entry-${record.entry.id}`
  const verification = iocEntryMockVerification(record)
  const sourceRef = iocEntrySourceRef(record)

  return {
    item: {
      id: candidateId,
      candidate_id: candidateId,
      tenant_id: DEFAULT_TENANT_ID,
      case_id: "mock-ioc-entry-detail-case",
      type: record.entry.iocType,
      value: record.entry.displayValue,
      source: `mock:${sourceRef.database}.${sourceRef.table}`,
      evidence_refs: record.observations.map((item) => item.sourceRecordId),
      origin: "manual",
      query_type: record.entry.observableType || record.entry.iocType,
      normalized_value: record.entry.normalizedValue,
      source_ref_id: record.entry.id,
      source_field: record.entry.observableType || record.entry.iocType,
      occurred_at: record.entry.lastSeen,
      candidate_status: "active",
      last_seen_at: record.entry.lastSeen,
      verification,
      verification_detail: {
        item: verification,
        local_eval_raw_json: "",
        hit_source: sourceRef,
        hit_source_detail: {
          ioc_entry: iocEntryHitDetail(record),
          blacklist_indicator: null,
        },
        detail_view: iocEntryDetailView(record),
      },
      status: "hit",
      result: null,
      error: "",
    },
    detailLoaded: true,
    error: "",
  }
}

const WHITELIST_DETAIL_MOCK_RECORDS: WhitelistMockRecord[] = [
  // Real rows sampled from D:\coding\data\whitelist\hash\ioc_allowlist_hash_rds_exec_script.candidate.db.
  {
    table: "ioc_allowlist_hash",
    entryKey: "c5b1358c86f2dacb0393d93785576854",
    tenantId: "public",
    scope: "global",
    matchType: "md5",
    iocType: "hash",
    value: "000001d847e693ab82a15e6925d281ed",
    hashType: "md5",
    hashHash: "22caef75489138bc316ede5feb983e78",
    fileName: "15209.mfc140d.dll",
    fileSize: 66,
    productName: "Visual Studio Professional 2015",
    publisher: "Microsoft",
    allowLevel: "known_good_hash",
    action: "annotate_only",
    sourceName: "nsrl_rds_exec_script",
    sourceUrl: "https://www.nsrl.nist.gov/",
    sourceVersion: "2026.03.1",
    confidence: 100,
    reason:
      "executable or script hash extracted from NSRL RDS 2026.03.1 Modern Minimal",
    owner: "platform_security",
    createdAt: "2026-06-03 03:47:19.744",
    updatedAt: "2026-06-03 03:47:19.744",
  },
  {
    table: "ioc_allowlist_hash",
    entryKey: "e0461d1972ffedbc115f228387424ead",
    tenantId: "public",
    scope: "global",
    matchType: "md5",
    iocType: "hash",
    value: "000002b1180f80cbb246bae338903bdd",
    hashType: "md5",
    hashHash: "544151e3d9db123d61a241395531de3a",
    fileName: "zipfs.jar",
    fileSize: 68733,
    productName: "Java SE Development  Kit (JDK's)",
    publisher: "Oracle",
    allowLevel: "known_good_hash",
    action: "annotate_only",
    sourceName: "nsrl_rds_exec_script",
    sourceUrl: "https://www.nsrl.nist.gov/",
    sourceVersion: "2026.03.1",
    confidence: 100,
    reason:
      "executable or script hash extracted from NSRL RDS 2026.03.1 Modern Minimal",
    owner: "platform_security",
    createdAt: "2026-06-03 03:47:19.744",
    updatedAt: "2026-06-03 03:47:19.744",
  },
  {
    table: "ioc_allowlist_hash",
    entryKey: "ac5e825f55a2406cd5aad6b498b3b24e",
    tenantId: "public",
    scope: "global",
    matchType: "md5",
    iocType: "hash",
    value: "6b8825eef20c12fe0a583007183eeb2d",
    hashType: "md5",
    hashHash: "4135c6e093e81c32932b355728cc14de",
    fileName: "dotnet-install.cmd",
    fileSize: 101,
    productName: "Oracle Linux",
    publisher: "Oracle",
    allowLevel: "known_good_hash",
    action: "annotate_only",
    sourceName: "nsrl_rds_exec_script",
    sourceUrl: "https://www.nsrl.nist.gov/",
    sourceVersion: "2026.03.1",
    confidence: 100,
    reason:
      "executable or script hash extracted from NSRL RDS 2026.03.1 Modern Minimal",
    owner: "platform_security",
    createdAt: "2026-06-03 03:47:19.744",
    updatedAt: "2026-06-03 03:47:19.744",
  },
  {
    table: "ioc_allowlist_domain",
    entryKey: "0f7c8d12cbe4e787a9fc7cf331c93db1",
    tenantId: "public",
    scope: "tenant",
    matchType: "suffix",
    iocType: "domain",
    value: "trusted.example.org",
    registeredDomain: "example.org",
    allowLevel: "tenant_allow",
    action: "annotate_only",
    sourceName: "e2e_domain_allowlist",
    sourceUrl: "",
    sourceVersion: "2026-06-03-e2e",
    confidence: 90,
    reason: "e2e domain test",
    owner: "soc",
    createdAt: "2026-06-03 10:23:34.381",
    updatedAt: "2026-06-03 10:23:34.381",
  },
  {
    table: "ioc_allowlist_ip",
    entryKey: "62fc28bb3c237f245ede196db3270467",
    tenantId: "public",
    scope: "tenant",
    matchType: "exact",
    iocType: "ip",
    value: "8.8.8.8",
    ipVersion: 4,
    cidrPrefix: 32,
    allowLevel: "tenant_allow",
    action: "annotate_only",
    sourceName: "e2e_ip_exact_allowlist",
    sourceUrl: "",
    sourceVersion: "2026-06-03-e2e",
    confidence: 90,
    reason: "e2e ip exact test",
    owner: "soc",
    createdAt: "2026-06-03 10:23:34.381",
    updatedAt: "2026-06-03 10:23:34.381",
  },
  {
    table: "ioc_allowlist_ip",
    entryKey: "3b040d39581223f12d31d5f96c3e4b68",
    tenantId: "public",
    scope: "tenant",
    matchType: "cidr",
    iocType: "ip",
    value: "10.10.0.0/16",
    ipVersion: 4,
    cidrPrefix: 16,
    allowLevel: "tenant_allow",
    action: "annotate_only",
    sourceName: "e2e_ip_cidr_allowlist",
    sourceUrl: "",
    sourceVersion: "2026-06-03-e2e",
    confidence: 90,
    reason: "e2e ip cidr test",
    owner: "soc",
    createdAt: "2026-06-03 10:23:34.381",
    updatedAt: "2026-06-03 10:23:34.381",
  },
]

const WHITELIST_DETAIL_MOCK_SAMPLES = WHITELIST_DETAIL_MOCK_RECORDS.map(
  whitelistMockSample,
)

const BLACKLIST_DETAIL_MOCK_RECORDS: BlacklistMockRecord[] = [
  {
    indicatorKey: "a5b9fa3944cc7acef5b07a08ac6cf2c6",
    iocType: "ip",
    valueSubtype: "",
    normalizedValue: "101.126.85.58",
    displayValue: "101.126.85.58",
    status: "active",
    categories: [
      "aggregated_ip_reputation",
      "attacker_ip",
      "ip_blocklist",
      "malicious_ip",
      "ssh_password_auth_activity",
    ],
    confidence: 85,
    sourceCount: 5,
    feedCount: 7,
    sourceNames: ["blocklist_de", "dataplane", "ipsum", "romainmarcoux", "threatview"],
    feedNames: [
      "all",
      "ip_high_confidence",
      "level1",
      "level2",
      "level3",
      "malicious_ip_full",
      "ssh_password_auth",
    ],
    sourceUrls: [
      "https://api.github.com/repos/romainmarcoux/malicious-ip/contents?ref=main",
      "https://dataplane.org/sshpwauth.txt",
      "https://lists.blocklist.de/lists/all.txt",
      "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/1.txt",
      "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/2.txt",
      "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
      "https://threatview.io/Downloads/IP-High-Confidence-Feed.txt",
    ],
    firstSeen: "2026-05-28 03:59:57.508",
    lastSeen: "2026-05-28 03:59:57.508",
    lastBatchId: "20260528T140000Z",
    extraJson: "{}",
  },
  {
    indicatorKey: "7410d69b846dd3c2eb568fb5281f83d0",
    iocType: "hash",
    valueSubtype: "sha256",
    normalizedValue:
      "089573b3a1167f387dcdad5e014a5132e998b2c89bff29bcf8b06dd497d4e63d",
    displayValue:
      "089573b3a1167f387dcdad5e014a5132e998b2c89bff29bcf8b06dd497d4e63d",
    status: "active",
    categories: ["malicious_hash"],
    confidence: 75,
    sourceCount: 1,
    feedCount: 1,
    sourceNames: ["romainmarcoux"],
    feedNames: ["malicious_hash_sha256"],
    sourceUrls: [
      "https://raw.githubusercontent.com/romainmarcoux/malicious-hash/main/full-hash-sha256-aa.txt",
    ],
    firstSeen: "2026-05-28 03:59:57.508",
    lastSeen: "2026-05-28 03:59:57.508",
    lastBatchId: "20260528T140000Z",
    extraJson: "{}",
  },
]

const IOC_ENTRY_PEER_PAYLOAD_HASH: IocEntryMockRecordItem = {
  id: "cbc10e59d1786ccd0f59478759a3d41e",
  iocType: "hash",
  observableType: "sha256",
  normalizedValue:
    "f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a",
  displayValue:
    "f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a",
  status: "active",
  riskScore: 100,
  confidence: 100,
  tags: ["mirai", "sh", "wipi"],
  extraJson: JSON.stringify({
    file_name: "wipi",
    file_type_mime: "text/x-shellscript",
    file_type_normalized: "sh",
    ioc_algorithm: "sha256",
    md5_hash: "094a3f2e1d3325d2a2c9681c20b8966f",
    risk_strategy: "malwarebazaar_get_info_v1",
    sha1_hash: "78732cf77355889df993c903fafd7cebca07ddb6",
    sha256_hash:
      "f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a",
    signature: "Mirai",
    ssdeep: "12:yEdEqdwq4XmaZVgzd3/FZ7cll7qxOvK4aF:uTH7qxhF",
    tlsh: "T166F092974B91042B0F7508D0F0FDC714220563B65B24422C7D4A8570BBC52D7F373969",
  }),
  firstSeen: "2026-05-25 08:47:30.000",
  lastSeen: "2026-05-25 08:47:30.000",
}

const IOC_ENTRY_PEER_HOST_IP: IocEntryMockRecordItem = {
  id: "dd7f3f7027e86bf8356b88610d2f088d",
  iocType: "ip",
  observableType: "ip",
  normalizedValue: "203.145.34.131",
  displayValue: "203.145.34.131",
  status: "active",
  riskScore: 80,
  confidence: 100,
  tags: ["honeypot", "malware", "mirai", "script"],
  extraJson: JSON.stringify({
    category: "Payload delivery",
    comment: "Unknown malware payload delivery URL (confidence level: 75%)",
    data_level: "misp",
    derived_from: "url_host",
    has_malicious_tag: true,
    info: "ThreatFox IOCs for 2026-05-25",
    path: "misp:event:122768a7-62ab-46a2-a47e-b0c5bd171858:attr:c82325ce-580f-11f1-b930-42010aa4000a",
    source_confidence: 75,
    tags: ["honeypot", "malware", "mirai", "script"],
    threat_level_id: "2",
    to_ids: "true",
    type: "url",
  }),
  firstSeen: "2026-05-24 11:26:05.000",
  lastSeen: "2026-05-25 08:45:13.000",
}

const IOC_ENTRY_DETAIL_MOCK_RECORDS: IocEntryMockRecord[] = [
  {
    entry: {
      id: "8da26638ee4450e3b4547d93d31b455e",
      iocType: "url",
      observableType: "url",
      normalizedValue: "http://203.145.34.131/wipi",
      displayValue: "http://203.145.34.131/wipi",
      status: "active",
      riskScore: 100,
      confidence: 75,
      tags: ["Unknown malware", "honeypot", "payload_delivery"],
      extraJson: JSON.stringify({
        comment: "",
        ioc_type_desc: "URL that delivers a malware payload",
        is_compromised: false,
        malware: "unknown",
        malware_alias: "",
        malware_malpedia:
          "https://malpedia.caad.fkie.fraunhofer.de/details/unknown",
        malware_printable: "Unknown malware",
        reference: "https://greedybear.honeynet.org",
        reporter: "greedybear",
        risk_strategy: "threatfox_recent_iocs_v1",
        sightings: 0,
        source_ioc_type: "url",
        threat_type: "payload_delivery",
        threat_type_desc:
          "Indicator that identifies a malware distribution server (payload delivery)",
      }),
      firstSeen: "2026-05-25 08:45:13.000",
      lastSeen: "2026-05-25 08:45:13.000",
    },
    observations: [
      {
        sourceName: "threatfox",
        sourceRecordId: "1818267",
        sourceUrl: "https://greedybear.honeynet.org",
        rawJson: JSON.stringify({
          comment: null,
          confidence_level: 75,
          credits: null,
          first_seen: "2026-05-25 08:45:13 UTC",
          id: "1818267",
          ioc: "http://203.145.34.131/wipi",
          ioc_type: "url",
          ioc_type_desc: "URL that delivers a malware payload",
          is_compromised: false,
          last_seen: "",
          malware: "unknown",
          malware_alias: null,
          malware_malpedia:
            "https://malpedia.caad.fkie.fraunhofer.de/details/unknown",
          malware_printable: "Unknown malware",
          malware_samples: null,
          reference: "https://greedybear.honeynet.org",
          reporter: "greedybear",
          sightings: 0,
          tags: ["honeypot"],
          threat_type: "payload_delivery",
          threat_type_desc:
            "Indicator that identifies a malware distribution server (payload delivery)",
        }),
        confidence: 75,
        firstSeen: "2026-05-25 08:45:13.000",
        lastSeen: "2026-05-25 08:45:13.000",
        tags: ["honeypot"],
        reasons: [
          {
            type: "malware",
            value: "Unknown malware",
            source_path: "malware_printable",
          },
          {
            type: "threat_type",
            value: "payload_delivery",
            source_path: "threat_type",
          },
        ],
        fieldGroups: [
          {
            group: "threatfox_entity",
            title: "ThreatFox Entity",
            fields: [
              detailField("threatfox_entity", "ioc", "ioc", "http://203.145.34.131/wipi", {
                copyable: true,
                sourcePath: "ioc",
              }),
              detailField("threatfox_entity", "ioc_type", "ioc type", "url", {
                sourcePath: "ioc_type",
              }),
              detailField(
                "threatfox_entity",
                "ioc_type_desc",
                "ioc type desc",
                "URL that delivers a malware payload",
                { sourcePath: "ioc_type_desc" },
              ),
              detailField(
                "threatfox_entity",
                "malware_printable",
                "malware printable",
                "Unknown malware",
                { sourcePath: "malware_printable" },
              ),
              detailField(
                "threatfox_entity",
                "threat_type",
                "threat type",
                "payload_delivery",
                { sourcePath: "threat_type" },
              ),
              detailField("threatfox_entity", "reporter", "reporter", "greedybear", {
                sourcePath: "reporter",
              }),
              detailField(
                "threatfox_entity",
                "reference",
                "reference",
                "https://greedybear.honeynet.org",
                { copyable: true, sourcePath: "reference" },
              ),
              detailField("threatfox_entity", "sightings", "sightings", 0, {
                valueType: "number",
                sourcePath: "sightings",
              }),
            ],
          },
        ],
        summary:
          "malware=unknown; threat_type=payload_delivery; confidence=75; reporter=greedybear",
      },
      {
        sourceName: "threatfox",
        sourceRecordId:
          "misp:event:122768a7-62ab-46a2-a47e-b0c5bd171858:attr:c82325ce-580f-11f1-b930-42010aa4000a",
        sourceUrl:
          "https://threatfox.abuse.ch/downloads/misp/events/122768a7-62ab-46a2-a47e-b0c5bd171858.json",
        rawJson: JSON.stringify({
          attribute: {
            category: "Payload delivery",
            comment: "Unknown malware payload delivery URL (confidence level: 75%)",
            tags: ["honeypot"],
            timestamp: "1779698713",
            to_ids: "true",
            type: "url",
            value: "http://203.145.34.131/wipi",
          },
          event: {
            batch_id: "20260527T140000Z",
            event_date: "2026-05-25",
            event_info: "ThreatFox IOCs for 2026-05-25",
            event_timestamp: "1779753789",
            published: true,
            source_name: "threatfox",
            threat_level_id: "2",
          },
        }),
        confidence: 93,
        firstSeen: "2026-05-25 08:45:13.000",
        lastSeen: "2026-05-25 08:45:13.000",
        tags: ["honeypot"],
        reasons: [
          {
            type: "comment",
            value: "Unknown malware payload delivery URL (confidence level: 75%)",
            source_path: "attribute.comment",
          },
        ],
        fieldGroups: [
          {
            group: "misp_object",
            title: "MISP Object",
            fields: [
              detailField("misp_object", "attribute.category", "category", "Payload delivery", {
                sourcePath: "attribute.category",
              }),
              detailField("misp_object", "attribute.type", "type", "url", {
                sourcePath: "attribute.type",
              }),
              detailField(
                "misp_object",
                "attribute.value",
                "value",
                "http://203.145.34.131/wipi",
                { copyable: true, sourcePath: "attribute.value" },
              ),
              detailField(
                "misp_object",
                "attribute.comment",
                "comment",
                "Unknown malware payload delivery URL (confidence level: 75%)",
                { sourcePath: "attribute.comment" },
              ),
              detailField(
                "misp_object",
                "event.event_info",
                "event info",
                "ThreatFox IOCs for 2026-05-25",
                { sourcePath: "event.event_info" },
              ),
              detailField("misp_object", "event.batch_id", "batch id", "20260527T140000Z", {
                sourcePath: "event.batch_id",
              }),
            ],
          },
        ],
        summary:
          "category=Payload delivery; type=url; event=ThreatFox IOCs for 2026-05-25",
      },
      {
        sourceName: "urlhaus",
        sourceRecordId: "3852809",
        sourceUrl: "https://urlhaus.abuse.ch/url/3852809/",
        rawJson: JSON.stringify({
          blacklists: {
            spamhaus_dbl: "not listed",
            surbl: "not listed",
          },
          date_added: "2026-05-25 08:45:08 UTC",
          host: "203.145.34.131",
          id: "3852809",
          reporter: "geenensp",
          tags: ["mirai", "script"],
          threat: "malware_download",
          url: "http://203.145.34.131/wipi",
          url_status: "online",
          urlhaus_reference: "https://urlhaus.abuse.ch/url/3852809/",
        }),
        confidence: 90,
        firstSeen: "2026-05-25 08:45:08.000",
        lastSeen: "2026-05-25 08:45:08.000",
        tags: ["mirai", "script"],
        reasons: [
          {
            type: "threat",
            value: "malware_download",
            source_path: "threat",
          },
          {
            type: "status",
            value: "online",
            source_path: "url_status",
          },
        ],
        fieldGroups: [
          {
            group: "payload",
            title: "URLhaus URL",
            fields: [
              detailField("payload", "url", "url", "http://203.145.34.131/wipi", {
                copyable: true,
                sourcePath: "url",
              }),
              detailField("payload", "host", "host", "203.145.34.131", {
                copyable: true,
                sourcePath: "host",
              }),
              detailField("payload", "url_status", "url status", "online", {
                sourcePath: "url_status",
              }),
              detailField("payload", "threat", "threat", "malware_download", {
                sourcePath: "threat",
              }),
              detailField("payload", "reporter", "reporter", "geenensp", {
                sourcePath: "reporter",
              }),
              detailField(
                "payload",
                "urlhaus_reference",
                "urlhaus reference",
                "https://urlhaus.abuse.ch/url/3852809/",
                { copyable: true, sourcePath: "urlhaus_reference" },
              ),
            ],
          },
        ],
        summary:
          "status=online; threat=malware_download; reporter=geenensp; tags=mirai,script",
      },
    ],
    relations: [
      {
        direction: "out",
        relationType: "url_downloads_payload",
        peer: IOC_ENTRY_PEER_PAYLOAD_HASH,
        sourceName: "urlhaus",
        sourceRecordId:
          "urlhaus:urlid:3852809:sha256:f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a",
        sourceUrl: "https://urlhaus.abuse.ch/url/3852809/",
        rawJson: JSON.stringify({
          payload: {
            file_type: "sh",
            filename: "wipi",
            firstseen: "2026-05-25",
            imphash: "",
            magika: "",
            response_md5: "094a3f2e1d3325d2a2c9681c20b8966f",
            response_sha256:
              "f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a",
            response_size: "462",
            signature: "mirai",
            ssdeep: "",
            tlsh: "",
            urlhaus_download:
              "https://urlhaus-api.abuse.ch/v1/download/f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a/",
            virustotal: null,
          },
          url: "http://203.145.34.131/wipi",
          urlhaus_reference: "https://urlhaus.abuse.ch/url/3852809/",
          urlid: "3852809",
        }),
        firstSeen: "2026-05-25 00:00:00.000",
        lastSeen: "2026-05-25 00:00:00.000",
        fieldGroups: [
          {
            group: "payload",
            title: "Payload",
            fields: [
              detailField("payload", "url", "url", "http://203.145.34.131/wipi", {
                copyable: true,
                sourcePath: "url",
              }),
              detailField("payload", "payload.filename", "filename", "wipi", {
                sourcePath: "payload.filename",
              }),
              detailField("payload", "payload.file_type", "file type", "sh", {
                sourcePath: "payload.file_type",
              }),
              detailField(
                "payload",
                "payload.response_sha256",
                "response sha256",
                "f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a",
                { copyable: true, sourcePath: "payload.response_sha256" },
              ),
              detailField(
                "payload",
                "payload.response_md5",
                "response md5",
                "094a3f2e1d3325d2a2c9681c20b8966f",
                { copyable: true, sourcePath: "payload.response_md5" },
              ),
              detailField("payload", "payload.signature", "signature", "mirai", {
                sourcePath: "payload.signature",
              }),
              detailField("payload", "payload.response_size", "response size", "462", {
                sourcePath: "payload.response_size",
              }),
              detailField(
                "payload",
                "payload.urlhaus_download",
                "urlhaus download",
                "https://urlhaus-api.abuse.ch/v1/download/f2aba97b83192723c2ae0f691025497188e19aa6061cc0c42807fb3ad346a09a/",
                { copyable: true, sourcePath: "payload.urlhaus_download" },
              ),
            ],
          },
        ],
      },
      {
        direction: "in",
        relationType: "host_serves_url",
        peer: IOC_ENTRY_PEER_HOST_IP,
        sourceName: "urlhaus",
        sourceRecordId: "urlhaus:host:203.145.34.131:url:http://203.145.34.131/wipi",
        sourceUrl: "https://urlhaus.abuse.ch/url/3852809/",
        rawJson: JSON.stringify({
          host: "203.145.34.131",
          source_record_id: "3852809",
          url: "http://203.145.34.131/wipi",
        }),
        firstSeen: "2026-05-25 08:45:08.000",
        lastSeen: "2026-05-25 08:45:08.000",
        fieldGroups: [
          {
            group: "network",
            title: "Network",
            fields: [
              detailField("network", "host", "host", "203.145.34.131", {
                copyable: true,
                sourcePath: "host",
              }),
              detailField("network", "url", "url", "http://203.145.34.131/wipi", {
                copyable: true,
                sourcePath: "url",
              }),
              detailField("network", "source_record_id", "source record id", "3852809", {
                sourcePath: "source_record_id",
              }),
            ],
          },
        ],
      },
    ],
  },
]

const BLACKLIST_DETAIL_MOCK_SAMPLES = BLACKLIST_DETAIL_MOCK_RECORDS.map(
  blacklistMockSample,
)

const IOC_ENTRY_DETAIL_MOCK_SAMPLES = IOC_ENTRY_DETAIL_MOCK_RECORDS.map(
  iocEntryMockSample,
)

const LOCAL_DETAIL_MOCK_SAMPLES = [
  ...WHITELIST_DETAIL_MOCK_SAMPLES,
  ...BLACKLIST_DETAIL_MOCK_SAMPLES,
  ...IOC_ENTRY_DETAIL_MOCK_SAMPLES,
]

function withLocalMockSamples(samples: DetailSample[]) {
  const merged: DetailSample[] = []
  const seen = new Set<string>()

  for (const sample of [...LOCAL_DETAIL_MOCK_SAMPLES, ...samples]) {
    const key = sampleKey(sample.item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(sample)
  }

  return merged
}

function statusClass(status: IocVerificationStatus) {
  switch (status) {
    case "hit":
      return "bg-red-600 text-white"
    case "allowlisted":
      return "bg-emerald-600 text-white"
    case "miss":
      return "bg-slate-500 text-white"
    case "checking":
      return "bg-blue-600 text-white"
    case "error":
    case "suppressed":
      return "bg-rose-600 text-white"
    default:
      return "bg-slate-400 text-white"
  }
}

function sampleSummary(samples: DetailSample[]) {
  const loaded = samples.filter((sample) => sample.detailLoaded).length
  const errors = samples.filter((sample) => sample.error).length
  const tables = new Set(
    samples
      .map((sample) => sourceTableText(sample.item))
      .filter((table) => table && table !== "-"),
  )
  const kinds = new Set(samples.map((sample) => hitGroup(sample.item)).filter(Boolean))

  return {
    total: samples.length,
    loaded,
    errors,
    tables: tables.size,
    kinds: kinds.size,
  }
}

function buildCoverage(samples: DetailSample[]) {
  const items = samples.map((sample) => sample.item)
  const tables = new Set(items.map(sourceTableText))
  const groups = new Set(items.map(hitGroup))

  const types: CoverageSpec[] = IOC_TYPE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    description: "ioc type",
    matched: items.some((item) => group.match(item.type)),
  }))

  const hitKinds: CoverageSpec[] = [
    {
      id: "whitelist",
      label: "whitelist",
      description: "allowlist hit",
      matched: groups.has("whitelist"),
    },
    {
      id: "blacklist",
      label: "blacklist",
      description: "blacklist indicator hit",
      matched: groups.has("blacklist"),
    },
    {
      id: "ioc_entry",
      label: "ioc_entry",
      description: "local/remote IOC entry hit",
      matched: groups.has("ioc_entry"),
    },
    {
      id: "miss",
      label: "miss",
      description: "no hit",
      matched: groups.has("miss"),
    },
  ]

  const sourceTables: CoverageSpec[] = SOURCE_TABLES.map((table) => ({
    id: table,
    label: table,
    description: "source table",
    matched: tables.has(table),
  }))

  return { types, hitKinds, sourceTables }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = []
  let nextIndex = 0
  const workerCount = Math.min(concurrency, items.length)

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      for (;;) {
        const currentIndex = nextIndex
        nextIndex += 1
        if (currentIndex >= items.length) return
        results[currentIndex] = await mapper(items[currentIndex], currentIndex)
      }
    }),
  )

  return results
}

function CoveragePill({ spec }: { spec: CoverageSpec }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold",
        spec.matched
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-500",
      )}
      title={spec.description}
    >
      {spec.matched ? (
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
      ) : (
        <AlertCircle className="size-3.5" aria-hidden="true" />
      )}
      {spec.label}
    </span>
  )
}

function CoverageBlock({
  title,
  specs,
}: {
  title: string
  specs: CoverageSpec[]
}) {
  const matchedCount = specs.filter((spec) => spec.matched).length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-900">{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {matchedCount}/{specs.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {specs.map((spec) => (
          <CoveragePill key={spec.id} spec={spec} />
        ))}
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="size-4 text-sky-600" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-semibold text-slate-950">
        {value}
      </div>
    </div>
  )
}

function SampleRow({
  sample,
  selected,
  onSelect,
}: {
  sample: DetailSample
  selected: boolean
  onSelect: () => void
}) {
  const item = sample.item
  const table = sourceTableText(item)
  const kind = hitGroup(item)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full grid-cols-[minmax(160px,1.3fr)_72px_96px_128px_minmax(150px,0.9fr)] items-center gap-3 border-b border-slate-100 px-3 py-2 text-left transition-colors",
        selected ? "bg-sky-50" : "bg-white hover:bg-slate-50",
      )}
    >
      <div className="min-w-0">
        <div className="truncate font-mono text-[11px] font-semibold text-slate-900">
          {item.value}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-slate-500">
          {displayValue(item.file_name || item.source)}
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-700">
        {typeGroupLabel(item)}
      </span>
      <span
        className={cn(
          "inline-flex h-6 w-20 items-center justify-center rounded-full text-[11px] font-semibold",
          statusClass(item.status),
        )}
      >
        {item.status}
      </span>
      <span className="truncate text-xs font-medium text-slate-700" title={kind}>
        {kind}
      </span>
      <span
        className="truncate font-mono text-[11px] text-slate-500"
        title={table}
      >
        {table}
      </span>
    </button>
  )
}

export function IocDetailsTestPage() {
  const searchParams = useSearchParams()
  const initialCaseId =
    getRouteParam(searchParams.get("caseId")) ||
    getRouteParam(searchParams.get("case_id"))
  const initialTenantId =
    getRouteParam(searchParams.get("tenantId")) ||
    getRouteParam(searchParams.get("tenant_id")) ||
    DEFAULT_TENANT_ID

  const [caseId, setCaseId] = useState(initialCaseId)
  const [tenantId, setTenantId] = useState(initialTenantId)
  const [limit, setLimit] = useState(String(DEFAULT_SAMPLE_LIMIT))
  const [samples, setSamples] = useState<DetailSample[]>(LOCAL_DETAIL_MOCK_SAMPLES)
  const [selectedId, setSelectedId] = useState(
    sampleKey(LOCAL_DETAIL_MOCK_SAMPLES[0].item),
  )
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState(
    `Loaded ${LOCAL_DETAIL_MOCK_SAMPLES.length} local detail mocks from real whitelist_db, ioc blacklist, and ioc entry graph rows.`,
  )
  const [error, setError] = useState("")
  const runIdRef = useRef(0)
  const autoLoadedCaseRef = useRef("")

  const selectedSample = useMemo(
    () =>
      samples.find((sample) => sampleKey(sample.item) === selectedId) ??
      samples[0] ??
      null,
    [samples, selectedId],
  )
  const summary = useMemo(() => sampleSummary(samples), [samples])
  const coverage = useMemo(() => buildCoverage(samples), [samples])

  const loadSamples = useCallback(
    async (verifyFirst = false) => {
      const normalizedCaseId = caseId.trim()
      const normalizedTenantId = tenantId.trim() || DEFAULT_TENANT_ID
      const maxItems = sampleLimitValue(limit)

      const runId = runIdRef.current + 1
      runIdRef.current = runId
      setLoading(true)
      setVerifying(verifyFirst)
      setError("")
      setMessage(
        verifyFirst
          ? "Loading candidates before verification..."
          : normalizedCaseId
            ? "Loading candidates..."
            : "Finding recent cases with IOC candidates...",
      )

      try {
        if (verifyFirst && !normalizedCaseId) {
          throw new Error("Verify & load writes verification data, so it requires a caseId. Use Load details to auto-find read-only samples.")
        }

        let candidateItems: IocVerificationItem[] = []

        if (normalizedCaseId) {
          let candidateData = await listAttackCaseIocCandidates({
            caseId: normalizedCaseId,
            tenantId: normalizedTenantId,
          })

          if (runIdRef.current !== runId) return

          if (verifyFirst) {
            const candidateIds = Array.from(
              new Set(
                candidateData.items
                  .map((item) => item.candidate_id || item.id)
                  .filter(Boolean),
              ),
            ).slice(0, maxItems)

            if (!candidateIds.length) {
              throw new Error("No candidate IDs found for verification.")
            }

            setMessage(`Creating verification task for ${candidateIds.length} candidates...`)
            let task = (
              await createAttackCaseIocVerifyTask({
                caseId: normalizedCaseId,
                tenantId: normalizedTenantId,
                candidateIds,
              })
            ).task

            if (runIdRef.current !== runId) return

            let taskStatus = normalizedStatus(task.status)
            for (let attempt = 0; isActiveTaskStatus(taskStatus); attempt += 1) {
              if (attempt >= MAX_POLL_ATTEMPTS) {
                throw new Error("Verification task timeout.")
              }

              setMessage(
                `Verification running: ${task.done_count}/${task.total_count} (${taskStatus})`,
              )
              await delay(POLL_INTERVAL_MS)
              if (runIdRef.current !== runId) return

              task = await getAttackCaseIocVerifyTask({
                caseId: normalizedCaseId,
                tenantId: normalizedTenantId,
                taskId: task.task_id,
              })
              taskStatus = normalizedStatus(task.status)
            }

            if (taskStatus !== "success" && taskStatus !== "partial_success") {
              throw new Error(task.error_message || `Verification task ended with ${task.status}.`)
            }

            setMessage("Verification completed. Reloading candidates...")
            candidateData = await listAttackCaseIocCandidates({
              caseId: normalizedCaseId,
              tenantId: normalizedTenantId,
            })
          }

          candidateItems = prioritizeCandidates(candidateData.items).slice(0, maxItems)
        } else {
          const workflows = await listAttackWorkflows({
            tenantId: normalizedTenantId,
            page: 1,
            pageSize: DEFAULT_WORKFLOW_SCAN_LIMIT,
            statusScope: "all",
          })

          if (runIdRef.current !== runId) return

          const caseIds = Array.from(
            new Set(workflows.items.map(workflowCaseId).filter(Boolean)),
          ).slice(0, MAX_CASE_SCAN_COUNT)

          if (!caseIds.length) {
            throw new Error("No recent AttackWorkflow cases found.")
          }

          const collected: IocVerificationItem[] = []

          for (const [index, nextCaseId] of caseIds.entries()) {
            if (runIdRef.current !== runId) return
            setMessage(
              `Scanning cases for IOC samples: ${index + 1}/${caseIds.length}`,
            )

            try {
              const candidateData = await listAttackCaseIocCandidates({
                caseId: nextCaseId,
                tenantId: normalizedTenantId,
              })
              collected.push(...candidateData.items)
            } catch {
              // A single case without IOC extraction should not block test discovery.
            }

            if (prioritizeCandidates(collected).length >= maxItems * 2) break
          }

          candidateItems = prioritizeCandidates(collected).slice(0, maxItems)

          if (!candidateItems.length) {
            throw new Error("No IOC candidates found in recent AttackWorkflow cases.")
          }
        }

        if (runIdRef.current !== runId) return

        const detailCandidateItems = candidateItems.filter(
          (item) => (item.case_id || normalizedCaseId).trim() && (item.candidate_id || item.id).trim(),
        )
        setMessage(`Loading IOC details: 0/${detailCandidateItems.length}`)

        const detailSamples = await mapWithConcurrency(
          detailCandidateItems,
          DETAIL_CONCURRENCY,
          async (item, index): Promise<DetailSample> => {
            const candidateId = item.candidate_id || item.id
            const detailCaseId = item.case_id || normalizedCaseId

            try {
              const detail = await getAttackCaseIocVerification({
                caseId: detailCaseId,
                tenantId: item.tenant_id || normalizedTenantId,
                candidateId,
              })
              const verification = detail.item || item.verification
              const itemWithDetail: IocVerificationItem = {
                ...item,
                verification,
                verification_detail: detail,
                status: verificationStatus(verification, item.status),
                error: detail.item?.error_message || item.error,
              }

              if (runIdRef.current === runId) {
                setMessage(`Loading IOC details: ${index + 1}/${detailCandidateItems.length}`)
              }

              return {
                item: itemWithDetail,
                detailLoaded: hasUsableDetail(itemWithDetail),
                error: "",
              }
            } catch (detailError) {
              if (runIdRef.current === runId) {
                setMessage(`Loading IOC details: ${index + 1}/${detailCandidateItems.length}`)
              }

              return {
                item,
                detailLoaded: false,
                error:
                  detailError instanceof Error && detailError.message
                    ? detailError.message
                    : "Failed to load detail.",
              }
            }
          },
        )

        if (runIdRef.current !== runId) return

        const samplesWithMocks = withLocalMockSamples(detailSamples)

        setSamples(samplesWithMocks)
        setSelectedId(
          samplesWithMocks[0] ? sampleKey(samplesWithMocks[0].item) : "",
        )
        setMessage(
          `Loaded ${detailSamples.length} candidates and ${LOCAL_DETAIL_MOCK_SAMPLES.length} local mocks, ${samplesWithMocks.filter((sample) => sample.detailLoaded).length} details.`,
        )
      } catch (loadError) {
        if (runIdRef.current !== runId) return
        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Failed to load IOC details.",
        )
      } finally {
        if (runIdRef.current === runId) {
          setLoading(false)
          setVerifying(false)
        }
      }
    },
    [caseId, limit, tenantId],
  )

  const loadLocalMocks = useCallback(() => {
    runIdRef.current += 1
    setLoading(false)
    setVerifying(false)
    setError("")
    setSamples(LOCAL_DETAIL_MOCK_SAMPLES)
    setSelectedId(sampleKey(LOCAL_DETAIL_MOCK_SAMPLES[0].item))
    setMessage(
      `Loaded ${LOCAL_DETAIL_MOCK_SAMPLES.length} local detail mocks from real whitelist_db, ioc blacklist, and ioc entry graph rows.`,
    )
  }, [])

  useEffect(() => {
    if (!initialCaseId) return
    const autoLoadKey = initialCaseId || "__auto-discover__"
    if (autoLoadedCaseRef.current === autoLoadKey) return
    autoLoadedCaseRef.current = autoLoadKey
    void loadSamples(false)
  }, [initialCaseId, loadSamples])

  async function handleCopy(value: string) {
    if (!value || value === "-") return
    await navigator.clipboard.writeText(value)
    setMessage("Copied value to clipboard.")
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-5 py-5">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <FlaskConical className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-slate-950">
                    IOC Details Test Bench
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Render local mock details from real rows, or fetch backend detail
                    payloads for a case and render the existing IOC Details component.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_160px_110px_auto_auto_auto]">
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-semibold text-slate-500">
                  caseId optional
                </span>
                <Input
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                  placeholder="Leave empty to auto-find samples"
                  className="h-9 font-mono text-xs"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-slate-500">
                  tenantId
                </span>
                <Input
                  value={tenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                  placeholder={DEFAULT_TENANT_ID}
                  className="h-9 font-mono text-xs"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-slate-500">
                  limit
                </span>
                <Input
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                  className="h-9 font-mono text-xs"
                  inputMode="numeric"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 self-end"
                disabled={loading}
                onClick={() => void loadSamples(false)}
              >
                {loading && !verifying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="size-4" aria-hidden="true" />
                )}
                {caseId.trim() ? "Load case details" : "Find samples"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 self-end"
                disabled={loading}
                onClick={loadLocalMocks}
                title="Use real local whitelist_db, ioc blacklist, and ioc entry graph rows with synthetic case fields"
              >
                <Database className="size-4" aria-hidden="true" />
                Local mocks
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 self-end bg-slate-950 text-white hover:bg-slate-800"
                disabled={loading || !caseId.trim()}
                onClick={() => void loadSamples(true)}
                title={
                  caseId.trim()
                    ? "Create a verification task for this case, then load details"
                    : "Verification writes data and requires a caseId"
                }
              >
                {verifying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PlayCircle className="size-4" aria-hidden="true" />
                )}
                Verify & load
              </Button>
            </div>
          </div>

          {(message || error) && (
            <div
              className={cn(
                "mt-4 rounded-xl px-3 py-2 text-sm",
                error
                  ? "bg-rose-50 text-rose-700"
                  : "bg-sky-50 text-sky-700",
              )}
            >
              {error || message}
            </div>
          )}
        </section>

        <section className="grid gap-3 md:grid-cols-5">
          <MetricCard icon={Layers3} label="candidates" value={summary.total} />
          <MetricCard icon={CheckCircle2} label="details" value={summary.loaded} />
          <MetricCard icon={Database} label="source tables" value={summary.tables} />
          <MetricCard icon={ShieldCheck} label="hit groups" value={summary.kinds} />
          <MetricCard icon={AlertCircle} label="errors" value={summary.errors} />
        </section>

        <section className="grid gap-3 xl:grid-cols-[1fr_1fr_1.2fr]">
          <CoverageBlock title="IOC type coverage" specs={coverage.types} />
          <CoverageBlock title="hit kind coverage" specs={coverage.hitKinds} />
          <CoverageBlock title="source table coverage" specs={coverage.sourceTables} />
        </section>

        <section className="grid min-h-[640px] gap-4 xl:grid-cols-[minmax(520px,0.95fr)_minmax(0,1.4fr)]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Detail samples
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select one row to render the existing IOC Details component.
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {summary.loaded}/{summary.total}
              </span>
            </div>

            <div className="grid grid-cols-[minmax(160px,1.3fr)_72px_96px_128px_minmax(150px,0.9fr)] gap-3 border-b border-slate-100 bg-white px-3 py-2 text-[11px] font-semibold uppercase text-slate-400">
              <span>ioc</span>
              <span>type</span>
              <span>status</span>
              <span>hit kind</span>
              <span>source table</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {samples.length ? (
                samples.map((sample) => (
                  <SampleRow
                    key={sampleKey(sample.item)}
                    sample={sample}
                    selected={sampleKey(sample.item) === sampleKey(selectedSample?.item ?? sample.item)}
                    onSelect={() => setSelectedId(sampleKey(sample.item))}
                  />
                ))
              ) : (
                <div className="flex min-h-[280px] items-center justify-center px-4 text-center text-sm text-slate-500">
                  Use Find samples to auto-discover real IOC verification details.
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0">
            {selectedSample?.error ? (
              <section className="flex h-full min-h-[640px] flex-col overflow-hidden rounded-2xl border border-rose-200 bg-white">
                <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-4 py-3">
                  <AlertCircle className="size-5 text-rose-600" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-semibold text-rose-900">
                      Detail load failed
                    </h2>
                    <p className="text-xs text-rose-700">
                      {selectedSample.error}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-4 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-500">
                      candidate_id
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-slate-900">
                      {sampleKey(selectedSample.item)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-500">ioc</div>
                    <div className="mt-1 flex items-center gap-2 break-all font-mono text-xs text-slate-900">
                      <span>{selectedSample.item.value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 rounded-full"
                        onClick={() => void handleCopy(selectedSample.item.value)}
                        aria-label="Copy IOC value"
                      >
                        <Copy className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <IocVerificationDetailPanel
                className="h-full min-h-[640px]"
                item={selectedSample?.item ?? null}
                onCopy={handleCopy}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
