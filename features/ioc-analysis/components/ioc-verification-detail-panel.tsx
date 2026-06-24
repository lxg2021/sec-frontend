"use client"

import { Clipboard, Loader2, Table2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  AttackCaseIOCBlacklistIndicatorHitDetail,
  AttackCaseIOCEvidenceField,
  AttackCaseIOCEvidenceFieldGroup,
  AttackCaseIOCHitDetailView,
  AttackCaseIOCHitEvidence,
  AttackCaseIOCHitPrimary,
  AttackCaseIOCHitRelation,
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCIocObservation,
  AttackCaseIOCIocRelation,
  AttackCaseIOCIntelSource,
  AttackCaseIOCJSONEvidence,
  AttackCaseIOCRawFieldGroup,
  AttackCaseIOCSourceFact,
  AttackCaseIOCSourceRecord,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type DetailField = {
  column: string
  value: string
  wide?: boolean
  copyable?: boolean
}

type DetailFieldSection = {
  id: string
  title: string
  subtitle?: string
  fields: DetailField[]
}

const HIDDEN_DETAIL_FIELD_NAMES = new Set([
  "entry_key",
  "evidence_id",
  "event_time",
  "match_type",
  "normalized_value",
  "observed_at",
  "path",
  "record_id",
  "record_kind",
  "source_path",
  "source_record_id",
])

function formatList(values: string[]) {
  if (!values.length) return "-"
  return `[${values.map((value) => `'${value}'`).join(", ")}]`
}

function displayValue(value: string | number | undefined | null) {
  if (typeof value === "number") return String(value)
  const normalized = value?.trim() || ""
  return normalized || "-"
}

function scoreDisplayValue(value: string, mode: "risk" | "confidence") {
  const normalized = value.trim()
  if (!normalized || normalized === "-") return value

  const numericText = normalized.endsWith("%")
    ? normalized.slice(0, -1).trim()
    : normalized
  const numericValue = Number(numericText)
  if (!Number.isFinite(numericValue)) return value

  const cleanValue = Number.isInteger(numericValue)
    ? String(numericValue)
    : String(Number(numericValue.toFixed(1)))

  return mode === "risk" ? `${cleanValue}/100` : `${cleanValue}%`
}

const DETAIL_FIELD_LABELS: Record<string, string> = {
  action: "处理方式",
  added_at: "添加时间",
  allow_level: "放行级别",
  categories: "分类",
  cidr_prefix: "CIDR前缀",
  cloud_provider: "云厂商",
  confidence: "置信度",
  credits: "署名",
  direction: "方向",
  display_value: "IOC值",
  domain: "域名",
  entry_id: "条目ID",
  feed_count: "情报源数量",
  feed_names: "情报源",
  file_name: "文件名",
  file_size: "文件大小",
  hash_type: "哈希类型",
  hash_value: "哈希值",
  hostname: "主机名",
  indicator_key: "指标键",
  ioc_type: "IOC类型",
  ip: "IP",
  ip_value: "IP",
  ip_version: "IP版本",
  issuer: "颁发者",
  last_batch_id: "批次",
  last_seen: "最后发现时间",
  md5: "MD5",
  object_type: "对象类型",
  observable_type: "观测类型",
  peer_entry_id: "关联条目ID",
  peer_ioc_type: "关联IOC类型",
  peer_value: "关联IOC值",
  product_name: "产品名称",
  publisher: "发布者",
  reason: "原因",
  reasons: "命中原因",
  reference: "引用",
  registered_domain: "注册域名",
  region: "区域",
  relation_type: "关联类型",
  reporter: "报告者",
  risk: "风险",
  risk_score: "风险",
  sha1: "SHA1",
  sha256: "SHA256",
  source_count: "来源数量",
  source_name: "来源名称",
  source_names: "来源名称",
  source_type: "来源类型",
  source_url: "来源链接",
  source_urls: "来源链接",
  source_version: "来源版本",
  status: "状态",
  subject: "使用者",
  summary: "摘要",
  tags: "标签",
  threat_feed: "威胁情报源",
  url: "URL",
  value_subtype: "值类型",
  whitelist: "白名单来源",
}

const DETAIL_SECTION_TITLES: Record<string, string> = {
  certificate: "证书信息",
  evidence: "证据信息",
  file: "文件信息",
  hash: "哈希信息",
  ioc_entry_context: "IOC上下文",
  network: "网络信息",
  primary: "基础信息",
  raw: "原始字段",
  whitelist: "白名单信息",
}

const IOC_TYPE_VALUES: Record<string, string> = {
  certificate: "证书",
  domain: "域名",
  hash: "hash",
  hostname: "主机名",
  ip: "IP",
  md5: "MD5",
  sha1: "SHA1",
  sha256: "SHA256",
  service_name: "服务名称",
  url: "URL",
}

const STATUS_VALUES: Record<string, string> = {
  active: "启用",
  annotate_only: "仅标注",
  disabled: "禁用",
  inactive: "停用",
  skip_ioc_query: "跳过IOC查询",
}

const ALLOW_LEVEL_VALUES: Record<string, string> = {
  known_good_hash: "已知可信哈希",
  tenant_allow: "租户放行",
  trusted_vendor: "可信厂商",
}

const SOURCE_TYPE_VALUES: Record<string, string> = {
  threat_feed: "威胁情报源",
  whitelist: "白名单",
}

const DIRECTION_VALUES: Record<string, string> = {
  in: "入向",
  inbound: "入向",
  out: "出向",
  outbound: "出向",
}

function translateWhitelistDetailText(value: string) {
  return value
    .replace(/\baction=/g, "处理方式=")
    .replace(/\ballow_level=/g, "放行级别=")
    .replace(/\breason=/g, "原因=")
    .replace(/\bannotate_only\b/g, "仅标注")
    .replace(/\bskip_ioc_query\b/g, "跳过IOC查询")
    .replace(/\bknown_good_hash\b/g, "已知可信哈希")
    .replace(
      /executable or script hash extracted from NSRL RDS ([^'\];]+)/g,
      "来自 NSRL RDS $1 的可执行文件或脚本哈希",
    )
}

function detailFieldLabel(column: string) {
  const key = detailFieldKey(column)
  return DETAIL_FIELD_LABELS[key] || column
}

function detailSectionTitle(title: string) {
  const key = detailFieldKey(title)
  const knownTitle = DETAIL_SECTION_TITLES[key]
  if (knownTitle) return knownTitle

  const relationMatch = title.match(/^Relation(?:\s+→|\s+-|\s+)?\s*(.*)$/i)
  if (relationMatch) {
    const suffix = relationMatch[1]?.trim()
    return suffix ? `关联关系 ${suffix}` : "关联关系"
  }

  const evidenceMatch = title.match(/^Evidence\s+(\d+)$/i)
  if (evidenceMatch) return `证据 ${evidenceMatch[1]}`

  return title
}

function detailSectionSubtitle(subtitle: string) {
  return translateWhitelistDetailText(subtitle)
}

function detailFieldValue(field: DetailField) {
  const key = detailFieldKey(field.column)
  if (key === "risk_score") return scoreDisplayValue(field.value, "risk")
  if (key === "confidence") {
    return scoreDisplayValue(field.value, "confidence")
  }
  if (key === "ioc_type") {
    return IOC_TYPE_VALUES[normalizedDetailValue(field.value)] || field.value
  }
  if (key === "status" || key === "action") {
    return STATUS_VALUES[normalizedDetailValue(field.value)] || field.value
  }
  if (key === "allow_level") {
    return ALLOW_LEVEL_VALUES[normalizedDetailValue(field.value)] || field.value
  }
  if (key === "source_type") {
    return SOURCE_TYPE_VALUES[normalizedDetailValue(field.value)] || field.value
  }
  if (key === "direction") {
    return DIRECTION_VALUES[normalizedDetailValue(field.value)] || field.value
  }
  if (key === "reasons" || key === "summary") {
    return translateWhitelistDetailText(field.value)
  }
  return field.value
}

const COPYABLE_DETAIL_FIELD_KEYS = new Set([
  "authentihash",
  "certificate_thumbprint",
  "cert_thumbprint",
  "display_value",
  "domain",
  "file_name",
  "filename",
  "gimphash",
  "hash_value",
  "host",
  "hostname",
  "imphash",
  "import_hash",
  "ip",
  "ip_value",
  "issuer",
  "issuer_cn",
  "md5",
  "md5_hash",
  "normalized_value",
  "peer_value",
  "pehash",
  "rdata",
  "registered_domain",
  "reference",
  "rrname",
  "serial_number",
  "sha1",
  "sha1_hash",
  "sha224",
  "sha224_hash",
  "sha256",
  "sha256_hash",
  "sha384",
  "sha384_hash",
  "sha3_384",
  "sha3_384_hash",
  "sha512",
  "sha512_hash",
  "source_url",
  "source_urls",
  "ssdeep",
  "subject",
  "subject_cn",
  "telfhash",
  "tlsh",
  "url",
  "urlhaus_link",
  "urlhaus_reference",
  "vhash",
])

const NON_COPYABLE_DETAIL_FIELD_KEYS = new Set([
  "action",
  "allow_level",
  "categories",
  "confidence",
  "credits",
  "direction",
  "entry_id",
  "extra_json",
  "extra_json_keys",
  "feed_count",
  "feed_names",
  "first_seen",
  "first_seen_utc",
  "hash_algorithm",
  "hash_type",
  "indicator_key",
  "ioc_type",
  "last_batch_id",
  "last_seen",
  "last_seen_utc",
  "meta_category",
  "normalized_value_hash",
  "object_type",
  "observable_type",
  "peer_entry_id",
  "peer_ioc_type",
  "reason",
  "reasons",
  "relation_type",
  "reporter",
  "risk_score",
  "scores",
  "source",
  "source_count",
  "source_name",
  "source_names",
  "source_type",
  "status",
  "summary",
  "tags",
  "thumbprint_algorithm",
  "url_status",
  "value_hash",
  "value_subtype",
])

function shouldCopyDetailField(field: DetailField, value: string) {
  if (!value || value === "-" || value === "[]") return false

  const key = detailFieldKey(field.column)
  if (NON_COPYABLE_DETAIL_FIELD_KEYS.has(key)) return false
  if (typeof field.copyable === "boolean") return field.copyable
  if (COPYABLE_DETAIL_FIELD_KEYS.has(key)) return true

  return (
    key.endsWith("_url") ||
    key.endsWith("_hash") ||
    key.endsWith("_thumbprint")
  )
}

function isEmptyDisplayValue(value: string) {
  return !value || value === "-" || value === "[]"
}

function normalizedDetailValue(value: string) {
  return value.trim().toLowerCase()
}

function detailFieldKey(column: string) {
  return column.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

function sourceTableName(table: string | undefined | null) {
  const normalized = table?.trim().toLowerCase() || ""
  return normalized.split(".").pop() || normalized
}

function detailViewSourceTableName(detailView: AttackCaseIOCHitDetailView) {
  return sourceTableName(detailView.source_ref?.table)
}

function isBlacklistTableName(table: string | undefined | null) {
  const name = sourceTableName(table)
  return name === "ioc_blacklist_indicator" || name === "ioc_blacklist_host"
}

function isBlacklistDetailView(detailView: AttackCaseIOCHitDetailView) {
  return isBlacklistTableName(detailView.source_ref?.table)
}

function isHiddenDetailField(column: string) {
  const key = detailFieldKey(column)
  const segments = key.split(/[.[\]]+/).filter(Boolean)
  const leafKey = segments[segments.length - 1] || key

  return (
    key === "first_seen" ||
    key.startsWith("first_seen_") ||
    leafKey === "first_seen" ||
    leafKey.startsWith("first_seen_") ||
    HIDDEN_DETAIL_FIELD_NAMES.has(key) ||
    HIDDEN_DETAIL_FIELD_NAMES.has(leafKey)
  )
}

function compactFields(fields: DetailField[]) {
  const visibleFields = fields.filter(
    (field) =>
      !isHiddenDetailField(field.column) && !isEmptyDisplayValue(field.value),
  )
  const objectTypeValue =
    visibleFields.find(
      (field) => detailFieldKey(field.column) === "object_type",
    )?.value || ""
  const normalizedObjectType = normalizedDetailValue(objectTypeValue)

  return visibleFields.filter((field) => {
    const key = detailFieldKey(field.column)
    if (
      key === "meta_category" &&
      normalizedObjectType &&
      normalizedDetailValue(field.value) === normalizedObjectType
    ) {
      return false
    }
    return true
  })
}

function uniqueDetailFields(fields: DetailField[]) {
  const seen = new Set<string>()
  return fields.filter((field) => {
    const key = `${detailFieldKey(field.column)}\u0000${field.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function compactSections(sections: DetailFieldSection[]) {
  return sections
    .map((section) => ({
      ...section,
      fields: uniqueDetailFields(compactFields(section.fields)),
    }))
    .filter((section) => section.fields.length)
}

function field(
  column: string,
  value: string | number | undefined | null,
  wide = false,
  copyable?: boolean,
) {
  return { column, value: displayValue(value), wide, copyable }
}

function listField(column: string, values: string[], wide = false, copyable?: boolean) {
  return { column, value: formatList(values), wide, copyable }
}

function fieldTitle(value: string) {
  const normalized = value.trim()
  if (!normalized) return ""
  return normalized
    .split(/[_\s]+/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function rawGroupDisplayTitle(group: AttackCaseIOCRawFieldGroup) {
  const title = group.title.trim()
  if (title.toLowerCase() === "ioc entry extra") return "IOC Entry Context"
  return title || "Raw"
}

function fieldColumnLabel(label: string, key: string, sourcePath = "") {
  const normalizedPath = (sourcePath || key).trim().toLowerCase()
  if (normalizedPath === "object.name") return "object type"
  return label || key || sourcePath || "field"
}

function shouldUseWideField(column: string, value: string) {
  const normalized = column.toLowerCase()
  return (
    value.length > 72 ||
    normalized.includes("json") ||
    normalized.includes("url") ||
    normalized.includes("value") ||
    normalized.includes("summary") ||
    normalized.includes("reason") ||
    normalized.includes("record_id") ||
    normalized.includes("indicator_key")
  )
}

function hasFeedCoverage(detailView: AttackCaseIOCHitDetailView) {
  return isBlacklistDetailView(detailView)
}

function primaryValueColumn(primary: AttackCaseIOCHitPrimary) {
  const iocType = primary.ioc_type.trim().toLowerCase()
  const subtype = primary.value_subtype.trim().toLowerCase()

  if (iocType === "hash" && subtype) return subtype
  if (iocType === "domain" || iocType === "url" || iocType === "ip") {
    return iocType
  }
  if (iocType === "hostname") return "hostname"
  return subtype || iocType || "value"
}

function primaryValueField(primary: AttackCaseIOCHitPrimary) {
  const column = primaryValueColumn(primary)
  const value = primary.display_value || primary.normalized_value
  return field(column, value, shouldUseWideField(column, value), true)
}

function sourceField(source: AttackCaseIOCHitEvidence["source"]) {
  const sourceType = source?.source_type.trim() || ""
  const sourceName = source?.source_name.trim() || ""

  if (sourceType && sourceName) return field(sourceType, sourceName, false, false)
  if (sourceName) return field("source", sourceName, false, false)
  return field("source_type", sourceType, false, false)
}

function evidenceFieldToDetailField(item: AttackCaseIOCEvidenceField): DetailField {
  const column = fieldColumnLabel(item.label, item.key, item.source_path)
  return {
    column,
    value: displayValue(item.value),
    wide: shouldUseWideField(column, item.value),
    copyable: item.copyable || undefined,
  }
}

function sourceFactField(fact: AttackCaseIOCSourceFact): DetailField {
  const column = fieldColumnLabel(fact.label, fact.key, fact.source_path)
  return {
    column,
    value: displayValue(fact.value),
    wide: shouldUseWideField(column, fact.value),
  }
}

function sourceDisplayTitle(source: AttackCaseIOCIntelSource) {
  return (
    source.display_name.trim() ||
    source.source_name.trim() ||
    source.source_type.trim() ||
    "source"
  )
}

function sourceDisplaySubtitle(source: AttackCaseIOCIntelSource) {
  const parts = [
    source.source_type,
    source.records.length ? `${source.records.length} records` : "",
  ].filter(Boolean)
  return parts.join(" · ")
}

function sourceNameField(source: AttackCaseIOCIntelSource) {
  const sourceType = source.source_type.trim()
  const sourceName = source.source_name.trim()
  if (sourceType && sourceName) return field(sourceType, sourceName)
  if (sourceName) return field("source_name", sourceName)
  return field("source_type", sourceType)
}

function sourceRecordIdField(record: AttackCaseIOCSourceRecord, index: number) {
  const column = record.record_kind || `record_${index + 1}`
  const value = record.record_id || record.title || `record ${index + 1}`
  return field(column, value, true, true)
}

function sourceRecordOverviewFields(records: AttackCaseIOCSourceRecord[]) {
  if (records.length !== 1) return []

  const record = records[0]
  return compactFields([
    field("record_kind", record.record_kind),
    field("record_id", record.record_id, true, true),
    field("source_url", record.source_url, true, true),
  ])
}

const WHITELIST_DOMAIN_SOURCE_DUPLICATE_FIELD_KEYS = new Set([
  "domain",
  "registered_domain",
])

const WHITELIST_IP_SOURCE_DUPLICATE_FIELD_KEYS = new Set(["ip", "ip_value"])

function filterSourceOverviewFields(
  detailView: AttackCaseIOCHitDetailView,
  fields: DetailField[],
) {
  if (isWhitelistIPDetailView(detailView)) {
    return fields.filter(
      (item) =>
        !WHITELIST_IP_SOURCE_DUPLICATE_FIELD_KEYS.has(
          detailFieldKey(item.column),
        ),
    )
  }

  if (!isWhitelistDomainDetailView(detailView)) return fields

  return fields.filter(
    (item) =>
      !WHITELIST_DOMAIN_SOURCE_DUPLICATE_FIELD_KEYS.has(
        detailFieldKey(item.column),
      ),
  )
}

function sourceOverviewFields(
  source: AttackCaseIOCIntelSource,
  detailView: AttackCaseIOCHitDetailView,
) {
  return filterSourceOverviewFields(detailView, compactFields([
    sourceNameField(source),
    field("records", source.records.length),
    ...(source.max_confidence > 0
      ? [field("confidence", source.max_confidence)]
      : []),
    ...(source.max_risk_score > 0
      ? [field("risk_score", source.max_risk_score)]
      : []),
    listField("tags", source.tags),
    listField("source_urls", source.source_urls, true, true),
    field("first_seen", source.first_seen),
    field("last_seen", source.last_seen),
    ...sourceRecordOverviewFields(source.records),
    ...source.facts.map(sourceFactField),
    ...source.key_fields.map(evidenceFieldToDetailField),
  ]))
}

function sourceRecordSections(source: AttackCaseIOCIntelSource, sourceIndex: number) {
  if (source.records.length <= 1) return []

  return compactSections([
    {
      id: `source-${sourceIndex}-records`,
      title: `${sourceDisplayTitle(source)} records`,
      subtitle: source.source_type,
      fields: source.records.map(sourceRecordIdField),
    },
  ])
}

function legacySourcesFromEvidence(
  detailView: AttackCaseIOCHitDetailView,
): AttackCaseIOCIntelSource[] {
  const byKey = new Map<string, AttackCaseIOCIntelSource>()

  detailView.evidence.forEach((evidence) => {
    const source = evidence.source
    if (!source) return

    const sourceType = source.source_type.trim()
    const sourceName = source.source_name.trim()
    if (!sourceType && !sourceName) return

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

    if (source.source_url && !existing.source_urls.includes(source.source_url)) {
      existing.source_urls.push(source.source_url)
    }
    evidence.tags.forEach((tag) => {
      if (tag.value && !existing.tags.includes(tag.value)) {
        existing.tags.push(tag.value)
      }
    })
    evidence.scores.forEach((score) => {
      const scoreName = detailFieldKey(score.name)
      if (scoreName === "confidence") {
        existing.max_confidence = Math.max(
          existing.max_confidence,
          score.normalized_score,
        )
      }
      if (scoreName === "risk" || scoreName === "risk_score") {
        existing.max_risk_score = Math.max(
          existing.max_risk_score,
          score.normalized_score,
        )
      }
      existing.facts.push({
        key: score.name,
        label: score.name,
        value: score.value,
        source_path: score.source_path,
      })
    })
    evidence.reasons.forEach((reason) => {
      existing.facts.push({
        key: reason.type,
        label: reason.type,
        value: reason.value,
        source_path: reason.source_path,
      })
    })
    evidence.field_groups.forEach((group) => {
      group.fields.forEach((item) => {
        if (item.important) existing.key_fields.push(item)
      })
    })
    if (evidence.time?.first_seen) {
      existing.first_seen =
        !existing.first_seen || evidence.time.first_seen < existing.first_seen
          ? evidence.time.first_seen
          : existing.first_seen
    }
    if (evidence.time?.last_seen) {
      existing.last_seen =
        !existing.last_seen || evidence.time.last_seen > existing.last_seen
          ? evidence.time.last_seen
          : existing.last_seen
    }
    existing.records.push({
      record_id: source.source_record_id || evidence.evidence_id,
      record_kind: "source_record",
      title: evidence.title,
      source_url: source.source_url,
      first_seen: evidence.time?.first_seen || "",
      last_seen: evidence.time?.last_seen || "",
      confidence: existing.max_confidence,
      tags: evidence.tags.map((tag) => tag.value).filter(Boolean),
      facts: [],
      fields: [],
      raw: evidence.raw,
    })

    byKey.set(key, existing)
  })

  return Array.from(byKey.values())
}

function isWhitelistDomainDetailView(detailView: AttackCaseIOCHitDetailView) {
  const sourceTable = detailViewSourceTableName(detailView)
  const primaryType = detailView.primary?.ioc_type.trim().toLowerCase() || ""

  return sourceTable === "ioc_allowlist_domain" && primaryType === "domain"
}

function isWhitelistIPDetailView(detailView: AttackCaseIOCHitDetailView) {
  const sourceTable = detailViewSourceTableName(detailView)
  const primaryType = detailView.primary?.ioc_type.trim().toLowerCase() || ""

  return sourceTable === "ioc_allowlist_ip" && primaryType === "ip"
}

function whitelistDomainRegisteredDomainField(
  detailView: AttackCaseIOCHitDetailView,
) {
  if (!isWhitelistDomainDetailView(detailView)) return null

  for (const evidence of detailView.evidence) {
    for (const group of evidence.field_groups) {
      for (const item of group.fields) {
        if (detailFieldKey(item.key) !== "registered_domain") continue
        return field("registered_domain", item.value, false, item.copyable || undefined)
      }
    }
  }

  return null
}

function isHashWhitelistDetailView(detailView: AttackCaseIOCHitDetailView) {
  const sourceTable = detailViewSourceTableName(detailView)
  const primaryType = detailView.primary?.ioc_type.trim().toLowerCase() || ""

  return sourceTable === "ioc_allowlist_hash" && primaryType === "hash"
}

function isCompactWhitelistDetailView(detailView: AttackCaseIOCHitDetailView) {
  const sourceTable = detailViewSourceTableName(detailView)
  const primaryType = detailView.primary?.ioc_type.trim().toLowerCase() || ""

  return (
    (sourceTable === "ioc_allowlist_hash" && primaryType === "hash") ||
    (sourceTable === "ioc_allowlist_domain" && primaryType === "domain") ||
    (sourceTable === "ioc_allowlist_ip" && primaryType === "ip")
  )
}

function evidenceGroupFields(group: AttackCaseIOCEvidenceFieldGroup) {
  return group.fields.map(evidenceFieldToDetailField)
}

function hashWhitelistFileFields(detailView: AttackCaseIOCHitDetailView) {
  if (!isHashWhitelistDetailView(detailView)) return []

  return detailView.evidence.flatMap((evidence) =>
    evidence.field_groups
      .filter((group) => detailFieldKey(group.group) === "file")
      .flatMap(evidenceGroupFields),
  )
}

function primarySections(detailView: AttackCaseIOCHitDetailView): DetailFieldSection[] {
  const primary = detailView.primary
  if (!primary) return []
  const showFeedCoverage = hasFeedCoverage(detailView)
  const registeredDomainField = whitelistDomainRegisteredDomainField(detailView)
  const fileFields = hashWhitelistFileFields(detailView)

  return compactSections([
    {
      id: "primary",
      title: "Primary",
      fields: [
        primaryValueField(primary),
        ...(registeredDomainField ? [registeredDomainField] : []),
        field("ioc_type", primary.ioc_type),
        field("status", primary.status),
        field("risk_score", primary.risk_score),
        field("confidence", primary.confidence),
        listField("tags", primary.tags),
        ...(showFeedCoverage
          ? [
              field("source_count", primary.source_count),
              field("feed_count", primary.feed_count),
            ]
          : []),
        field("first_seen", primary.first_seen),
        field("last_seen", primary.last_seen),
        ...fileFields,
      ],
    },
  ])
}

function compactWhitelistFields(evidence: AttackCaseIOCHitEvidence) {
  const allowedKeys = new Set(["allow_level", "action", "source_version"])

  return evidence.field_groups
    .filter((group) => detailFieldKey(group.group) === "allowlist")
    .flatMap((group) =>
      group.fields
        .filter((item) => allowedKeys.has(detailFieldKey(item.key)))
        .map((item) => {
          const column = fieldColumnLabel(item.label, item.key, item.source_path)
          return {
            column,
            value: displayValue(item.value),
            wide: shouldUseWideField(column, item.value),
            copyable: item.copyable || undefined,
          }
        }),
    )
}

function isIntelligenceEvidenceFieldGroup(
  group: AttackCaseIOCEvidenceFieldGroup,
) {
  return (
    detailFieldKey(group.title) === "intelligence" ||
    detailFieldKey(group.group) === "intelligence"
  )
}

function evidenceFieldValue(
  group: AttackCaseIOCEvidenceFieldGroup,
  key: string,
) {
  const targetKey = detailFieldKey(key)
  const item = group.fields.find(
    (field) => detailFieldKey(field.key || field.label) === targetKey,
  )

  return displayValue(item?.value)
}

function blacklistIntelligenceStatus(detailView: AttackCaseIOCHitDetailView) {
  for (const evidence of detailView.evidence) {
    for (const group of evidence.field_groups) {
      if (!isIntelligenceEvidenceFieldGroup(group)) continue

      const status = evidenceFieldValue(group, "status")
      if (!isEmptyDisplayValue(status)) return status
    }
  }

  for (const group of detailView.raw_groups) {
    if (!isIntelligenceRawGroup(group)) continue

    const statusField = group.fields.find(
      (field) => detailFieldKey(field.key || field.label) === "status",
    )
    const status = displayValue(statusField?.value)
    if (!isEmptyDisplayValue(status)) return status
  }

  return ""
}

function evidenceSummary(
  detailView: AttackCaseIOCHitDetailView,
  evidence: AttackCaseIOCHitEvidence,
) {
  const summary = evidence.summary.trim()
  if (!isBlacklistDetailView(detailView) || /\bstatus\s*=/i.test(summary)) {
    return summary
  }

  const status = blacklistIntelligenceStatus(detailView)
  if (!status) return summary

  return summary ? `status=${status}; ${summary}` : `status=${status}`
}

function evidenceOverviewFields(
  detailView: AttackCaseIOCHitDetailView,
  evidence: AttackCaseIOCHitEvidence,
) {
  const source = evidence.source
  const time = evidence.time
  const summary = evidenceSummary(detailView, evidence)
  const status = isBlacklistDetailView(detailView)
    ? blacklistIntelligenceStatus(detailView)
    : ""
  const reasons = evidence.reasons
    .map((reason) =>
      [reason.type, reason.value].filter(Boolean).join("="),
    )
    .filter(Boolean)

  return compactFields([
    field("evidence_id", evidence.evidence_id, true),
    sourceField(source),
    field("status", status),
    field("source_record_id", source?.source_record_id, true),
    field("source_url", source?.source_url),
    field("reporter", source?.reporter),
    field("credits", source?.credits),
    field("first_seen", time?.first_seen),
    field("observed_at", time?.observed_at),
    field("added_at", time?.added_at),
    field("event_time", time?.event_time),
    listField(
      "tags",
      evidence.tags.map((tag) => tag.value).filter(Boolean),
    ),
    listField("reasons", reasons),
    field("summary", summary),
  ])
}

function evidenceFieldGroupSectionsForDetailView(
  detailView: AttackCaseIOCHitDetailView,
  evidence: AttackCaseIOCHitEvidence,
  evidenceIndex: number,
) {
  const compactWhitelist = isCompactWhitelistDetailView(detailView)

  return evidence.field_groups
    .filter((group) => {
      const groupKey = detailFieldKey(group.group)
      if (compactWhitelist && groupKey === "allowlist") return false
      if (isIntelligenceEvidenceFieldGroup(group)) return false
      if (isHashWhitelistDetailView(detailView) && groupKey === "file") {
        return false
      }
      return true
    })
    .map((group, groupIndex) =>
      fieldGroupSection(
        group,
        `evidence-${evidenceIndex}-group-${group.group || groupIndex}`,
        evidence.title,
      ),
    )
}

function fieldGroupSection(
  group: AttackCaseIOCEvidenceFieldGroup,
  id: string,
  subtitle?: string,
): DetailFieldSection {
  return {
    id,
    title: group.title || fieldTitle(group.group) || "Evidence",
    subtitle,
    fields: evidenceGroupFields(group),
  }
}

function evidenceSections(detailView: AttackCaseIOCHitDetailView) {
  return compactSections(
    detailView.evidence.flatMap((evidence, index) => {
      const title =
        evidence.title ||
        evidence.source?.source_name ||
        `Evidence ${index + 1}`
      const overview = [
        ...evidenceOverviewFields(detailView, evidence),
        ...(isCompactWhitelistDetailView(detailView)
          ? compactWhitelistFields(evidence)
          : []),
      ]
      return [
        ...(overview.length
          ? [
              {
                id: `evidence-${index}-overview`,
                title,
                subtitle: evidenceSummary(detailView, evidence),
                fields: overview,
              },
            ]
          : []),
        ...evidenceFieldGroupSectionsForDetailView(detailView, evidence, index),
      ]
    }),
  )
}

function relationSections(detailView: AttackCaseIOCHitDetailView) {
  return compactSections(
    detailView.relations.flatMap((relation, index) => {
      const source = relation.source
      const time = relation.time
      return [
        {
          id: `relation-${index}`,
          title: relation.relation_type
            ? `Relation · ${relation.relation_type}`
            : `Relation ${index + 1}`,
          fields: [
            field("direction", relation.direction),
            field("relation_type", relation.relation_type),
            field("peer_ioc_type", relation.peer_ioc_type),
            field("peer_value", relation.peer_value, true),
            field("peer_entry_id", relation.peer_entry_id, true),
            sourceField(source),
            field("source_record_id", source?.source_record_id, true),
            field("source_url", source?.source_url, true),
            field("first_seen", time?.first_seen),
            field("last_seen", time?.last_seen),
            field("observed_at", time?.observed_at),
            field("added_at", time?.added_at),
            field("event_time", time?.event_time),
          ],
        },
        ...relation.field_groups.map((group, groupIndex) =>
          fieldGroupSection(
            group,
            `relation-${index}-group-${group.group || groupIndex}`,
            relation.relation_type,
          ),
        ),
      ]
    }),
  )
}

function rawGroupSections(detailView: AttackCaseIOCHitDetailView) {
  return compactSections(
    detailView.raw_groups
      .filter((group) => !isIntelligenceRawGroup(group))
      .map((group, index) => rawGroupSection(group, index)),
  )
}

function isIntelligenceRawGroup(group: AttackCaseIOCRawFieldGroup) {
  return detailFieldKey(rawGroupDisplayTitle(group)) === "intelligence"
}

function rawGroupSection(
  group: AttackCaseIOCRawFieldGroup,
  index: number,
): DetailFieldSection {
  const title = rawGroupDisplayTitle(group)
  return {
    id: `raw-${index}-${title}`,
    title,
    subtitle: group.source_table,
    fields: group.fields.map((item) => {
      const column = fieldColumnLabel(item.label, item.key)
      return {
        column,
        value: displayValue(item.value),
        wide: item.multiline || shouldUseWideField(column, item.value),
        copyable: item.copyable || undefined,
      }
    }),
  }
}

function isDuplicatePrimaryHashSection(
  section: DetailFieldSection,
  detailView: AttackCaseIOCHitDetailView,
) {
  const primary = detailView.primary
  if (!primary || primary.ioc_type.trim().toLowerCase() !== "hash") return false
  if (detailFieldKey(section.title) !== "hash") return false

  const hashFieldKeys = new Set(["hash_type", "hash_value"])
  return (
    section.fields.length > 0 &&
    section.fields.every((field) =>
      hashFieldKeys.has(detailFieldKey(field.column)),
    )
  )
}

function isRedundantWhitelistNetworkSection(
  section: DetailFieldSection,
  detailView: AttackCaseIOCHitDetailView,
) {
  const sourceTable = detailViewSourceTableName(detailView)
  const primaryType = detailView.primary?.ioc_type.trim().toLowerCase() || ""
  const isNetworkSection = detailFieldKey(section.title) === "network"

  return (
    isNetworkSection &&
    ((sourceTable === "ioc_allowlist_ip" && primaryType === "ip") ||
      (sourceTable === "ioc_allowlist_domain" && primaryType === "domain"))
  )
}

function sourceSections(detailView: AttackCaseIOCHitDetailView) {
  const sources = detailView.sources.length
    ? detailView.sources
    : legacySourcesFromEvidence(detailView)

  return compactSections(
    sources.flatMap((source, index) => [
      {
        id: `source-${index}`,
        title: sourceDisplayTitle(source),
        subtitle: sourceDisplaySubtitle(source),
        fields: sourceOverviewFields(source, detailView),
      },
      ...sourceRecordSections(source, index),
    ]),
  )
}

function detailViewSections(detailView: AttackCaseIOCHitDetailView) {
  const sources = sourceSections(detailView)

  return compactSections([
    ...primarySections(detailView),
    ...(sources.length ? sources : evidenceSections(detailView)),
    ...relationSections(detailView),
    ...rawGroupSections(detailView),
  ]).filter(
    (section) =>
      !isDuplicatePrimaryHashSection(section, detailView) &&
      !isRedundantWhitelistNetworkSection(section, detailView),
  )
}

function blacklistFields(
  detail: AttackCaseIOCBlacklistIndicatorHitDetail,
): DetailField[] {
  return [
    { column: "indicator_key", value: displayValue(detail.indicator_key) },
    { column: "ioc_type", value: displayValue(detail.ioc_type) },
    { column: "value_subtype", value: displayValue(detail.value_subtype) },
    { column: "normalized_value", value: displayValue(detail.normalized_value) },
    { column: "display_value", value: displayValue(detail.display_value) },
    { column: "status", value: displayValue(detail.status) },
    { column: "categories", value: formatList(detail.categories) },
    { column: "confidence", value: displayValue(detail.confidence) },
    { column: "source_count", value: displayValue(detail.source_count) },
    { column: "feed_count", value: displayValue(detail.feed_count) },
    { column: "source_names", value: formatList(detail.source_names) },
    { column: "feed_names", value: formatList(detail.feed_names) },
    { column: "first_seen_utc", value: displayValue(detail.first_seen) },
    { column: "last_seen_utc", value: displayValue(detail.last_seen) },
    { column: "last_batch_id", value: displayValue(detail.last_batch_id) },
    { column: "extra_json_keys", value: formatList(detail.extra_json_keys) },
    { column: "source_urls", value: formatList(detail.source_urls), wide: true },
    { column: "extra_json", value: displayValue(detail.extra_json), wide: true },
  ]
}

function iocEntryFields(detail: AttackCaseIOCIocEntryHitDetail): DetailField[] {
  const entry = detail.entry
  if (!entry) return []

  return [
    { column: "entry_id", value: displayValue(entry.id) },
    { column: "ioc_type", value: displayValue(entry.ioc_type) },
    { column: "observable_type", value: displayValue(entry.observable_type) },
    { column: "status", value: displayValue(entry.status) },
    { column: "risk_score", value: displayValue(entry.risk_score) },
    { column: "confidence", value: displayValue(entry.confidence) },
    { column: "first_seen_utc", value: displayValue(entry.first_seen) },
    { column: "last_seen_utc", value: displayValue(entry.last_seen) },
    { column: "tags", value: formatList(entry.tags) },
    { column: "extra_json_keys", value: formatList(entry.extra_json_keys) },
    {
      column: "normalized_value",
      value: displayValue(entry.normalized_value),
      wide: true,
    },
    { column: "display_value", value: displayValue(entry.display_value), wide: true },
    { column: "extra_json", value: displayValue(entry.extra_json), wide: true },
  ]
}

function evidenceValue(evidence: AttackCaseIOCJSONEvidence | null) {
  if (!evidence) return "-"
  if (evidence.raw_json_preview) return evidence.raw_json_preview
  if (evidence.raw_json_keys.length) return formatList(evidence.raw_json_keys)
  return displayValue(evidence.raw_json_length)
}

function CopyValueButton({
  value,
  onCopy,
}: {
  value: string
  onCopy: (value: string) => void
}) {
  if (!value || value === "-") return null
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-sky-50 hover:text-sky-700"
      onClick={() => onCopy(value)}
      aria-label="Copy field value"
    >
      <Clipboard className="size-3.5" aria-hidden="true" />
    </Button>
  )
}

function DetailFieldTable({
  fields,
  columnLabel,
  valueLabel,
  onCopy,
}: {
  fields: DetailField[]
  columnLabel: string
  valueLabel: string
  onCopy: (value: string) => void
}) {
  const visibleFields = compactFields(fields)

  if (!visibleFields.length) {
    return (
      <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">
        -
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-10 grid grid-cols-[128px_minmax(0,1fr)] bg-white text-xs font-semibold text-slate-400 md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]">
        <div className="px-4 py-2">{columnLabel}</div>
        <div className="border-l border-slate-100 px-4 py-2">{valueLabel}</div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {columnLabel}
        </div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {valueLabel}
        </div>
      </div>
      <PairedFieldRows fields={visibleFields} onCopy={onCopy} />
    </div>
  )
}

function DetailFieldSections({
  sections,
  columnLabel,
  valueLabel,
  onCopy,
}: {
  sections: DetailFieldSection[]
  columnLabel: string
  valueLabel: string
  onCopy: (value: string) => void
}) {
  const visibleSections = compactSections(sections)

  if (!visibleSections.length) {
    return (
      <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">
        -
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-10 grid grid-cols-[128px_minmax(0,1fr)] bg-white text-xs font-semibold text-slate-400 md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]">
        <div className="px-4 py-2">{columnLabel}</div>
        <div className="border-l border-slate-100 px-4 py-2">{valueLabel}</div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {columnLabel}
        </div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {valueLabel}
        </div>
      </div>
      {visibleSections.map((section) => {
        const title = detailSectionTitle(section.title)
        const subtitle = section.subtitle
          ? detailSectionSubtitle(section.subtitle)
          : ""

        return (
          <div key={section.id} className="border-t border-slate-100">
            <div className="bg-slate-50 px-4 py-2">
              <div
                className="truncate text-xs font-semibold text-slate-700"
                title={title}
              >
                {title}
              </div>
              {subtitle ? (
                <div
                  className="mt-0.5 truncate text-[11px] text-slate-400"
                  title={subtitle}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>
            <PairedFieldRows fields={section.fields} onCopy={onCopy} />
          </div>
        )
      })}
    </div>
  )
}

function IocEntryObservationRows({
  observations,
}: {
  observations: AttackCaseIOCIocObservation[]
}) {
  if (!observations.length) return null

  return (
    <div className="border-t border-slate-100">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
        观测记录
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_80px_128px_1.4fr] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>来源名称</span>
            <span>置信度</span>
            <span>最后发现时间</span>
            <span>证据</span>
          </div>
          <div className="divide-y divide-slate-100">
            {observations.map((observation, index) => {
              const evidence = evidenceValue(observation.evidence)
              const confidence = scoreDisplayValue(
                displayValue(observation.confidence),
                "confidence",
              )
              const rowKey = `${observation.source_name}-${observation.source_record_id}-${index}`
              return (
                <div
                  key={rowKey}
                  className="grid grid-cols-[1fr_80px_128px_1.4fr] items-center px-4 py-2 text-xs text-slate-700"
                >
                  <span className="truncate font-medium" title={observation.source_name}>
                    {displayValue(observation.source_name)}
                  </span>
                  <span>{confidence}</span>
                  <span className="truncate" title={observation.last_seen}>
                    {displayValue(observation.last_seen)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code className="truncate font-mono" title={evidence}>
                      {evidence}
                    </code>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function IocEntryRelationRows({
  relations,
}: {
  relations: AttackCaseIOCIocRelation[]
}) {
  if (!relations.length) return null

  return (
    <div className="border-t border-slate-100">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
        关联关系
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[72px_1fr_1fr_1.4fr_128px] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>方向</span>
            <span>关联类型</span>
            <span>来源名称</span>
            <span>关联条目ID</span>
            <span>最后发现时间</span>
          </div>
          <div className="divide-y divide-slate-100">
            {relations.map((relation, index) => {
              const peerEntryId = relation.peer_entry?.id || ""
              const rowKey = `${relation.direction}-${relation.relation_type}-${peerEntryId}-${index}`
              return (
                <div
                  key={rowKey}
                  className="grid grid-cols-[72px_1fr_1fr_1.4fr_128px] items-center px-4 py-2 text-xs text-slate-700"
                >
                  <span>
                    {DIRECTION_VALUES[normalizedDetailValue(relation.direction)] ||
                      displayValue(relation.direction)}
                  </span>
                  <span className="truncate font-medium" title={relation.relation_type}>
                    {displayValue(relation.relation_type)}
                  </span>
                  <span className="truncate" title={relation.source_name}>
                    {displayValue(relation.source_name)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code
                      className="truncate font-mono font-semibold text-slate-800"
                      title={peerEntryId}
                    >
                      {displayValue(peerEntryId)}
                    </code>
                  </span>
                  <span className="truncate" title={relation.last_seen}>
                    {displayValue(relation.last_seen)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function IocEntryDetailView({
  detail,
  columnLabel,
  valueLabel,
  onCopy,
}: {
  detail: AttackCaseIOCIocEntryHitDetail
  columnLabel: string
  valueLabel: string
  onCopy: (value: string) => void
}) {
  return (
    <div>
      <DetailFieldTable
        fields={iocEntryFields(detail)}
        columnLabel={columnLabel}
        valueLabel={valueLabel}
        onCopy={onCopy}
      />
      <IocEntryObservationRows observations={detail.observations} />
      <IocEntryRelationRows relations={detail.relations} />
    </div>
  )
}

function HitDetailView({
  detailView,
  columnLabel,
  valueLabel,
  onCopy,
}: {
  detailView: AttackCaseIOCHitDetailView
  columnLabel: string
  valueLabel: string
  onCopy: (value: string) => void
}) {
  return (
    <DetailFieldSections
      sections={detailViewSections(detailView)}
      columnLabel={columnLabel}
      valueLabel={valueLabel}
      onCopy={onCopy}
    />
  )
}

function FieldRow({
  field,
  onCopy,
}: {
  field: DetailField
  onCopy: (value: string) => void
}) {
  const label = detailFieldLabel(field.column)
  const value = detailFieldValue(field)
  const copyable = shouldCopyDetailField(field, value)

  return (
    <div
      className={cn(
        "grid min-h-10 items-center border-t border-slate-100",
        field.wide
          ? "grid-cols-[128px_minmax(0,1fr)]"
          : "grid-cols-[128px_minmax(0,1fr)] md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]",
      )}
    >
      <div className="px-4 py-2 text-xs font-semibold text-slate-500">
        {label}
      </div>
      <div
        className="flex min-w-0 items-center gap-2 border-l border-slate-100 px-4 py-2"
      >
        <code
          className="min-w-0 flex-1 break-all font-mono text-[11px] font-semibold leading-5 text-slate-800"
          title={value}
        >
          {value}
        </code>
        {copyable ? <CopyValueButton value={value} onCopy={onCopy} /> : null}
      </div>
    </div>
  )
}

function PairedFieldRows({
  fields,
  onCopy,
}: {
  fields: DetailField[]
  onCopy: (value: string) => void
}) {
  const rows: Array<
    | { type: "pair"; left: DetailField; right: DetailField | null }
    | { type: "wide"; field: DetailField }
  > = []
  let pendingField: DetailField | null = null

  fields.forEach((field) => {
    if (field.wide) {
      if (pendingField) {
        rows.push({ type: "pair", left: pendingField, right: null })
        pendingField = null
      }
      rows.push({ type: "wide", field })
      return
    }

    if (pendingField) {
      rows.push({ type: "pair", left: pendingField, right: field })
      pendingField = null
      return
    }

    pendingField = field
  })

  if (pendingField) {
    rows.push({ type: "pair", left: pendingField, right: null })
  }

  return (
    <>
      {rows.map((row, rowIndex) => {
        if (row.type === "wide") {
          return (
            <FieldRow
              key={`wide-${rowIndex}-${row.field.column}`}
              field={row.field}
              onCopy={onCopy}
            />
          )
        }

        const { left, right } = row
        const leftLabel = detailFieldLabel(left.column)
        const leftValue = detailFieldValue(left)
        const leftCopyable = shouldCopyDetailField(left, leftValue)
        const rightLabel = right ? detailFieldLabel(right.column) : ""
        const rightValue = right ? detailFieldValue(right) : ""
        const rightCopyable = right ? shouldCopyDetailField(right, rightValue) : false

        return (
          <div
            key={`pair-${rowIndex}-${left.column}-${right?.column || "empty"}`}
            className="grid min-h-10 grid-cols-[128px_minmax(0,1fr)] border-t border-slate-100 md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]"
          >
            <div className="px-4 py-2 text-xs font-semibold text-slate-500">
              {leftLabel}
            </div>
            <div className="flex min-w-0 items-center gap-2 border-l border-slate-100 px-4 py-2">
              <code
                className="min-w-0 flex-1 break-all font-mono text-[11px] font-semibold leading-5 text-slate-800"
                title={leftValue}
              >
                {leftValue}
              </code>
              {leftCopyable ? (
                <CopyValueButton value={leftValue} onCopy={onCopy} />
              ) : null}
            </div>
            {right ? (
              <>
                <div className="border-l border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                  {rightLabel}
                </div>
                <div className="flex min-w-0 items-center gap-2 border-l border-slate-100 px-4 py-2">
                  <code
                    className="min-w-0 flex-1 break-all font-mono text-[11px] font-semibold leading-5 text-slate-800"
                    title={rightValue}
                  >
                    {rightValue}
                  </code>
                  {rightCopyable ? (
                    <CopyValueButton value={rightValue} onCopy={onCopy} />
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="hidden border-l border-slate-100 px-4 py-2 md:block" />
                <div className="hidden border-l border-slate-100 px-4 py-2 md:block" />
              </>
            )}
          </div>
        )
      })}
    </>
  )
}

export function IocVerificationDetailPanel({
  className,
  item,
  onCopy,
}: {
  className?: string
  item: IocVerificationItem | null
  onCopy: (value: string) => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")

  const detail = item?.verification_detail ?? null
  const detailView = detail?.detail_view ?? null
  const iocEntry = detail?.hit_source_detail?.ioc_entry ?? null
  const blacklist = detail?.hit_source_detail?.blacklist_indicator ?? null
  const detailColumnLabel = "字段"
  const detailValueLabel = "值"

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Table2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">
              {t("detail.title")}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {t("detail.description")}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!item ? (
          <div className="flex min-h-[156px] items-center justify-center px-4 py-8 text-sm text-slate-500">
            {t("detail.noSelection")}
          </div>
        ) : detailView ? (
          <HitDetailView
            detailView={detailView}
            columnLabel={detailColumnLabel}
            valueLabel={detailValueLabel}
            onCopy={onCopy}
          />
        ) : iocEntry ? (
          <IocEntryDetailView
            detail={iocEntry}
            columnLabel={detailColumnLabel}
            valueLabel={detailValueLabel}
            onCopy={onCopy}
          />
        ) : blacklist ? (
          <DetailFieldTable
            fields={blacklistFields(blacklist)}
            columnLabel={detailColumnLabel}
            valueLabel={detailValueLabel}
            onCopy={onCopy}
          />
        ) : item.verification && !detail ? (
          <div className="flex min-h-[156px] items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-sky-600" aria-hidden="true" />
            {t("detail.loading")}
          </div>
        ) : (
          <div className="min-h-[156px] px-4 py-5">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              {t("detail.unavailable")}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
