import type {
  AttackCaseIOCEvidenceField,
  AttackCaseIOCEvidenceFieldGroup,
  AttackCaseIOCHitDetailView,
  AttackCaseIOCHitEvidence,
  AttackCaseIOCHitPrimary,
  AttackCaseIOCIntelSource,
  AttackCaseIOCRawFieldGroup,
  AttackCaseIOCSourceFact,
  AttackCaseIOCSourceRecord,
} from "@/features/ioc-analysis/types"

import type {
  DetailField,
  DetailFieldSection,
  IocDetailLocale,
} from "./detail-fields"
import {
  compactFields,
  detailFieldValue,
  detailFieldKey,
  detailViewSourceTableName,
  displayListItems,
  displayValue,
  duplicateTokensForField,
  formatList,
  isBlacklistDetailView,
  isEmptyDisplayValue,
  normalizedDuplicateValue,
  normalizedDetailValue,
  sourceTableName,
  translateWhitelistDetailText,
  uniqueDetailFields,
} from "./detail-fields"

function primaryDuplicateTokens(detailView: AttackCaseIOCHitDetailView) {
  const tokens = new Set<string>()
  primarySections(detailView).forEach((section) => {
    section.fields.forEach((field) => {
      duplicateTokensForField(field).forEach((token) => tokens.add(token))
    })
  })
  return tokens
}

function removePrimaryDuplicateFields(
  detailView: AttackCaseIOCHitDetailView,
  fields: DetailField[],
) {
  const primaryTokens = primaryDuplicateTokens(detailView)
  return fields.filter(
    (field) =>
      !duplicateTokensForField(field).some((token) => primaryTokens.has(token)),
  )
}

function removeSourceInternalDuplicateFields(fields: DetailField[]) {
  const sourceUrlValues = new Set<string>()
  const sourceNameValues = new Set<string>()
  const feedNameValues = new Set<string>()

  fields.forEach((field) => {
    const key = detailFieldKey(field.column)
    if (key === "source_urls") {
      displayListItems(field.value).forEach((value) =>
        sourceUrlValues.add(normalizedDuplicateValue(value)),
      )
    }
    if (key === "source_names") {
      displayListItems(field.value).forEach((value) =>
        sourceNameValues.add(normalizedDuplicateValue(value)),
      )
    }
    if (key === "feed_names") {
      displayListItems(field.value).forEach((value) =>
        feedNameValues.add(normalizedDuplicateValue(value)),
      )
    }
  })

  return fields.filter((field) => {
    const key = detailFieldKey(field.column)
    const value = normalizedDuplicateValue(field.value)
    if (key === "source_url") return !sourceUrlValues.has(value)
    if (key === "source") return !sourceNameValues.has(value)
    if (key === "feed") return !feedNameValues.has(value)
    return true
  })
}

function isSourceHeaderDuplicateField(
  source: AttackCaseIOCIntelSource,
  field: DetailField,
) {
  if (detailFieldKey(field.column) !== "source_names") return false

  const sourceName = source.source_name.trim() || source.display_name.trim()
  const names = displayListItems(field.value)
  return (
    names.length === 1 &&
    normalizedDuplicateValue(names[0]) === normalizedDuplicateValue(sourceName)
  )
}

function compactSections(
  sections: DetailFieldSection[],
  locale?: IocDetailLocale,
) {
  return sections
    .map((section) => ({
      ...section,
      fields: uniqueDetailFields(compactFields(section.fields), locale),
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

const LAST_SEEN_FIELD_KEYS = new Set(["last_seen", "last_seen_utc"])

function isLastSeenField(column: string) {
  return LAST_SEEN_FIELD_KEYS.has(detailFieldKey(column))
}

function comparableTimeValue(value: string) {
  const normalized = displayValue(value)
  if (!normalized || normalized === "-") return null

  const isoLike = normalized
    .replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T")
    .replace(/\s+\+(\d{2})(\d{2})$/, "+$1:$2")
    .replace(/\s+UTC$/i, "Z")
  const timestamp = Date.parse(isoLike)

  return Number.isFinite(timestamp)
    ? { timestamp, text: normalized }
    : { timestamp: null, text: normalized }
}

function minimumTimeValue(values: string[]) {
  return values.reduce<string>((minimum, value) => {
    const candidate = comparableTimeValue(value)
    if (!candidate) return minimum
    const current = comparableTimeValue(minimum)
    if (!current) return candidate.text

    if (
      candidate.timestamp !== null &&
      current.timestamp !== null &&
      candidate.timestamp < current.timestamp
    ) {
      return candidate.text
    }

    if (
      (candidate.timestamp === null || current.timestamp === null) &&
      candidate.text < current.text
    ) {
      return candidate.text
    }

    return minimum
  }, "")
}

function sourceMinimumLastSeen(source: AttackCaseIOCIntelSource) {
  const factLastSeen = source.facts
    .filter((fact) => isLastSeenField(fact.label || fact.key))
    .map((fact) => fact.value)
  const keyFieldLastSeen = source.key_fields
    .filter((item) => isLastSeenField(item.label || item.key))
    .map((item) => item.value)

  return minimumTimeValue([
    source.last_seen,
    ...source.records.map((record) => record.last_seen),
    ...factLastSeen,
    ...keyFieldLastSeen,
  ])
}

function coalesceLastSeenFields(fields: DetailField[]) {
  const minimumLastSeen = minimumTimeValue(
    fields
      .filter((field) => isLastSeenField(field.column))
      .map((field) => field.value),
  )

  if (!minimumLastSeen) return fields

  let hasLastSeen = false
  return fields.reduce<DetailField[]>((items, field) => {
    if (!isLastSeenField(field.column)) {
      items.push(field)
      return items
    }

    if (hasLastSeen) return items
    hasLastSeen = true
    items.push({ ...field, value: minimumLastSeen })
    return items
  }, [])
}

function moveLastSeenFieldToMiddle(fields: DetailField[]) {
  const lastSeenIndex = fields.findIndex((field) => isLastSeenField(field.column))
  if (lastSeenIndex < 0) return fields

  const lastSeenField = fields[lastSeenIndex]
  const otherFields = fields.filter((_, index) => index !== lastSeenIndex)
  const insertIndex = Math.min(
    otherFields.length,
    Math.max(2, Math.ceil(otherFields.length / 2)),
  )

  return [
    ...otherFields.slice(0, insertIndex),
    lastSeenField,
    ...otherFields.slice(insertIndex),
  ]
}

function sourceDisplaySubtitle(
  source: AttackCaseIOCIntelSource,
  locale: IocDetailLocale,
) {
  const sourceType = source.source_type
    ? detailFieldValue({ column: "source_type", value: source.source_type }, locale)
    : ""
  const parts = [
    sourceType,
    source.records.length > 1
      ? locale === "zh-CN"
        ? `${source.records.length} 条记录`
        : `${source.records.length} records`
      : "",
    sourceMinimumLastSeen(source) || source.first_seen,
  ].filter(Boolean)
  return parts.join(" · ")
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

function sourceTwoColumnFields(fields: DetailField[]) {
  return fields.map((item) => ({ ...item, wide: false }))
}

const WHITELIST_DOMAIN_SOURCE_DUPLICATE_FIELD_KEYS = new Set([
  "domain",
  "registered_domain",
])

const WHITELIST_IP_SOURCE_DUPLICATE_FIELD_KEYS = new Set(["ip", "ip_value"])
const WHITELIST_HASH_SOURCE_DUPLICATE_FIELD_KEYS = new Set(["hash_type"])

function filterSourceOverviewFields(
  detailView: AttackCaseIOCHitDetailView,
  fields: DetailField[],
) {
  let visibleFields = removePrimaryDuplicateFields(
    detailView,
    removeSourceInternalDuplicateFields(fields),
  )

  if (isWhitelistIPDetailView(detailView)) {
    visibleFields = visibleFields.filter(
      (item) =>
        !WHITELIST_IP_SOURCE_DUPLICATE_FIELD_KEYS.has(
          detailFieldKey(item.column),
        ),
    )
  }

  if (isWhitelistDomainDetailView(detailView)) {
    visibleFields = visibleFields.filter(
      (item) =>
        !WHITELIST_DOMAIN_SOURCE_DUPLICATE_FIELD_KEYS.has(
          detailFieldKey(item.column),
        ),
    )
  }

  if (isHashWhitelistDetailView(detailView)) {
    visibleFields = visibleFields.filter(
      (item) =>
        !WHITELIST_HASH_SOURCE_DUPLICATE_FIELD_KEYS.has(
          detailFieldKey(item.column),
        ),
    )
  }

  return visibleFields
}

function sourceOverviewFields(
  source: AttackCaseIOCIntelSource,
  detailView: AttackCaseIOCHitDetailView,
) {
  return sourceTwoColumnFields(
    moveLastSeenFieldToMiddle(
      coalesceLastSeenFields(
        filterSourceOverviewFields(detailView, compactFields([
          ...(source.max_confidence > 0
            ? [field("confidence", source.max_confidence)]
            : []),
          ...(source.max_risk_score > 0
            ? [field("risk_score", source.max_risk_score)]
            : []),
          listField("tags", source.tags),
          listField("source_urls", source.source_urls, true, true),
          ...sourceRecordOverviewFields(source.records),
          ...source.facts.map(sourceFactField),
          ...source.key_fields.map(evidenceFieldToDetailField),
        ])).filter((item) => !isSourceHeaderDuplicateField(source, item)),
      ),
    ),
  )
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

function sourceSections(
  detailView: AttackCaseIOCHitDetailView,
  locale: IocDetailLocale,
) {
  const sources = detailView.sources.length
    ? detailView.sources
    : legacySourcesFromEvidence(detailView)

  return compactSections(
    sources.map((source, index) => ({
      id: `source-${index}`,
      title: sourceDisplayTitle(source),
      subtitle: sourceDisplaySubtitle(source, locale),
      fields: sourceOverviewFields(source, detailView),
    })),
    locale,
  )
}

function detailViewSections(
  detailView: AttackCaseIOCHitDetailView,
  locale: IocDetailLocale = "zh-CN",
) {
  const sources = sourceSections(detailView, locale)

  return compactSections([
    ...primarySections(detailView),
    ...(sources.length ? sources : evidenceSections(detailView)),
    ...relationSections(detailView),
    ...rawGroupSections(detailView),
  ], locale).filter(
    (section) =>
      !isDuplicatePrimaryHashSection(section, detailView) &&
      !isRedundantWhitelistNetworkSection(section, detailView),
  )
}

export {
  compactSections,
  detailViewSections,
}
