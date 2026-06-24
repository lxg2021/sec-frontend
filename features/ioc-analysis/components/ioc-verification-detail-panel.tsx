"use client"

import { Clipboard, Loader2, Table2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  AttackCaseIOCBlacklistIndicatorHitDetail,
  AttackCaseIOCEvidenceFieldGroup,
  AttackCaseIOCHitDetailView,
  AttackCaseIOCHitEvidence,
  AttackCaseIOCHitRelation,
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCIocObservation,
  AttackCaseIOCIocRelation,
  AttackCaseIOCJSONEvidence,
  AttackCaseIOCRawFieldGroup,
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
  "evidence_id",
  "event_time",
  "normalized_value",
  "observed_at",
  "path",
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

function detailFieldLabel(column: string) {
  const key = detailFieldKey(column)
  if (key === "risk_score") return "risk"
  return column
}

function detailFieldValue(field: DetailField) {
  const key = detailFieldKey(field.column)
  if (key === "risk_score") return scoreDisplayValue(field.value, "risk")
  if (key === "confidence") {
    return scoreDisplayValue(field.value, "confidence")
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

  const key = detailFieldKey(detailFieldLabel(field.column))
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

function detailFieldKey(column: string) {
  return column.trim().toLowerCase().replace(/[\s-]+/g, "_")
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
  return fields.filter(
    (field) =>
      !isHiddenDetailField(field.column) && !isEmptyDisplayValue(field.value),
  )
}

function compactSections(sections: DetailFieldSection[]) {
  return sections
    .map((section) => ({ ...section, fields: compactFields(section.fields) }))
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
  const table = detailView.source_ref?.table.trim().toLowerCase() || ""
  return table === "ioc_blacklist_indicator" || table === "ioc_blacklist_host"
}

function primarySections(detailView: AttackCaseIOCHitDetailView): DetailFieldSection[] {
  const primary = detailView.primary
  if (!primary) return []
  const showFeedCoverage = hasFeedCoverage(detailView)

  return compactSections([
    {
      id: "primary",
      title: "Primary",
      fields: [
        field("display_value", primary.display_value),
        field("ioc_type", primary.ioc_type),
        field("value_subtype", primary.value_subtype),
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
        ...(showFeedCoverage
          ? [
              listField("source_names", primary.source_names, true),
              listField("feed_names", primary.feed_names, true),
            ]
          : []),
        field("normalized_value", primary.normalized_value, true),
      ],
    },
  ])
}

function evidenceOverviewFields(evidence: AttackCaseIOCHitEvidence) {
  const source = evidence.source
  const time = evidence.time
  const scores = evidence.scores
    .map((score) =>
      [score.name, score.value || score.normalized_score || ""]
        .filter(Boolean)
        .join("="),
    )
    .filter(Boolean)
  const reasons = evidence.reasons
    .map((reason) =>
      [reason.type, reason.value].filter(Boolean).join("="),
    )
    .filter(Boolean)

  return compactFields([
    field("evidence_id", evidence.evidence_id, true),
    field("source_name", source?.source_name),
    field("source_type", source?.source_type),
    field("source_record_id", source?.source_record_id, true),
    field("source_url", source?.source_url),
    field("reporter", source?.reporter),
    field("credits", source?.credits),
    field("first_seen", time?.first_seen),
    field("last_seen", time?.last_seen),
    field("observed_at", time?.observed_at),
    field("added_at", time?.added_at),
    field("event_time", time?.event_time),
    listField(
      "tags",
      evidence.tags.map((tag) => tag.value).filter(Boolean),
    ),
    listField("scores", scores, true),
    listField("reasons", reasons),
    field("summary", evidence.summary),
  ])
}

function evidenceFieldGroupSections(
  evidence: AttackCaseIOCHitEvidence,
  evidenceIndex: number,
) {
  return evidence.field_groups.map((group, groupIndex) =>
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
    fields: group.fields.map((item) => {
      const column = fieldColumnLabel(item.label, item.key, item.source_path)
      return {
        column,
        value: displayValue(item.value),
        wide: shouldUseWideField(column, item.value),
        copyable: item.copyable || undefined,
      }
    }),
  }
}

function evidenceSections(detailView: AttackCaseIOCHitDetailView) {
  return compactSections(
    detailView.evidence.flatMap((evidence, index) => {
      const title =
        evidence.title ||
        evidence.source?.source_name ||
        `Evidence ${index + 1}`
      const overview = evidenceOverviewFields(evidence)
      return [
        ...(overview.length
          ? [
              {
                id: `evidence-${index}-overview`,
                title,
                subtitle: evidence.summary,
                fields: overview,
              },
            ]
          : []),
        ...evidenceFieldGroupSections(evidence, index),
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
            field("source_name", source?.source_name),
            field("source_type", source?.source_type),
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
    detailView.raw_groups.map((group, index) => rawGroupSection(group, index)),
  )
}

function rawGroupSection(
  group: AttackCaseIOCRawFieldGroup,
  index: number,
): DetailFieldSection {
  return {
    id: `raw-${index}-${group.title || "group"}`,
    title: group.title || "Raw",
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

function detailViewSections(detailView: AttackCaseIOCHitDetailView) {
  return compactSections([
    ...primarySections(detailView),
    ...evidenceSections(detailView),
    ...relationSections(detailView),
    ...rawGroupSections(detailView),
  ])
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
  return (
    evidence.raw_json_preview ||
    formatList(evidence.raw_json_keys) ||
    displayValue(evidence.raw_json_length)
  )
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
      {visibleSections.map((section) => (
        <div key={section.id} className="border-t border-slate-100">
          <div className="bg-slate-50 px-4 py-2">
            <div className="truncate text-xs font-semibold text-slate-700">
              {section.title}
            </div>
            {section.subtitle ? (
              <div className="mt-0.5 truncate text-[11px] text-slate-400">
                {section.subtitle}
              </div>
            ) : null}
          </div>
          <PairedFieldRows fields={section.fields} onCopy={onCopy} />
        </div>
      ))}
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
        observations
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_80px_128px_1.4fr] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>source_name</span>
            <span>confidence</span>
            <span>last_seen</span>
            <span>evidence</span>
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
        relations
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[72px_1fr_1fr_1.4fr_128px] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>direction</span>
            <span>relation_type</span>
            <span>source_name</span>
            <span>peer_entry_id</span>
            <span>last_seen</span>
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
                  <span>{displayValue(relation.direction)}</span>
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
      {rows.map((row) => {
        if (row.type === "wide") {
          return (
            <FieldRow
              key={`wide-${row.field.column}`}
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
            key={`${left.column}-${right?.column || "empty"}`}
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
            columnLabel={t("detail.column")}
            valueLabel={t("detail.value")}
            onCopy={onCopy}
          />
        ) : iocEntry ? (
          <IocEntryDetailView
            detail={iocEntry}
            columnLabel={t("detail.column")}
            valueLabel={t("detail.value")}
            onCopy={onCopy}
          />
        ) : blacklist ? (
          <DetailFieldTable
            fields={blacklistFields(blacklist)}
            columnLabel={t("detail.column")}
            valueLabel={t("detail.value")}
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
