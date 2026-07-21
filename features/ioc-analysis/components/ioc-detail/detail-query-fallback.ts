import type {
  AttackCaseIOCEvidenceField,
  AttackCaseIOCEvidenceFieldGroup,
  AttackCaseIOCEvidenceReason,
  AttackCaseIOCEvidenceScore,
  AttackCaseIOCEvidenceTag,
  AttackCaseIOCHitDetailView,
  AttackCaseIOCHitEvidence,
  AttackCaseIOCHitEvidenceSource,
  AttackCaseIOCHitEvidenceTime,
  AttackCaseIOCHitRelation,
  AttackCaseIOCHitSourceRef,
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCIocEntryRecord,
  AttackCaseIOCJSONEvidence,
  IocQueryEntry,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"

type RawField = {
  path: string
  key: string
  value: string
  valueType: string
}

const HASH_ALGORITHMS = new Set([
  "md5",
  "sha1",
  "sha224",
  "sha256",
  "sha384",
  "sha512",
  "sha3_384",
])

function compactStrings(values: string[]) {
  const seen = new Set<string>()
  const out: string[] = []

  values.forEach((item) => {
    const value = item.trim()
    if (!value) return
    const key = value.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(value)
  })

  return out
}

function parseJSON(raw: string) {
  const value = raw.trim()
  if (!value) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function jsonKeys(raw: string) {
  const parsed = parseJSON(raw)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return []
  return Object.keys(parsed).sort()
}

function jsonEvidence(raw: string): AttackCaseIOCJSONEvidence | null {
  const value = raw.trim()
  if (!value) return null
  return {
    raw_json: value,
    raw_json_preview: value.length > 512 ? value.slice(0, 512) : value,
    raw_json_length: value.length,
    raw_json_keys: jsonKeys(value),
  }
}

function jsonPrimitiveText(value: unknown): { value: string; valueType: string } {
  if (value === null || value === undefined) return { value: "", valueType: "null" }
  if (typeof value === "string") return { value: value.trim(), valueType: "string" }
  if (typeof value === "number") return { value: String(value), valueType: "number" }
  if (typeof value === "boolean") return { value: String(value), valueType: "bool" }
  return { value: JSON.stringify(value), valueType: Array.isArray(value) ? "array" : "json" }
}

function appendRawField(path: string, value: unknown, out: RawField[]) {
  const normalizedPath = path.trim()
  const text = jsonPrimitiveText(value)
  if (!normalizedPath || !text.value.trim()) return

  out.push({
    path: normalizedPath,
    key: pathBase(normalizedPath),
    value: text.value.trim(),
    valueType: text.valueType,
  })
}

function flattenJSONValue(path: string, value: unknown, out: RawField[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item === null || item === undefined) return
      const nextPath = `${path}[]`
      if (typeof item === "object" && !Array.isArray(item)) {
        flattenJSONValue(nextPath, item, out)
        return
      }
      appendRawField(nextPath, item, out)
    })
    return
  }

  if (value && typeof value === "object") {
    Object.keys(value as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        const nextPath = path ? `${path}.${key}` : key
        flattenJSONValue(nextPath, (value as Record<string, unknown>)[key], out)
      })
    return
  }

  appendRawField(path, value, out)
}

function extractRawJSONFields(raw: string) {
  const parsed = parseJSON(raw)
  if (!parsed) return []

  const fields: RawField[] = []
  flattenJSONValue("", parsed, fields)

  const seen = new Set<string>()
  return fields.filter((field) => {
    const key = `${normalizePath(field.path)}\u0000${field.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizePath(path: string) {
  return path.trim().toLowerCase()
}

function pathBase(path: string) {
  const normalized = normalizePath(path).replace(/\[\]$/g, "")
  const index = normalized.lastIndexOf(".")
  return index >= 0 ? normalized.slice(index + 1).replace(/\[\]$/g, "") : normalized
}

function stringInSet(value: string, candidates: string[]) {
  const normalized = value.trim().toLowerCase()
  return candidates.some((item) => item.trim().toLowerCase() === normalized)
}

function firstFieldValue(fields: RawField[], paths: string[]) {
  const normalizedPaths = paths.map(normalizePath)
  for (const path of normalizedPaths) {
    const found = fields.find((field) => normalizePath(field.path) === path)
    if (found?.value.trim()) return found.value.trim()
  }
  return ""
}

function sourceTypeForName(sourceName: string) {
  const normalized = sourceName.trim().toLowerCase()
  if (
    ["urlhaus", "malwarebazaar", "threatfox", "circl", "botvrij", "infoblox"].includes(
      normalized,
    )
  ) {
    return "threat_feed"
  }
  if (!normalized) return ""
  return "external_source"
}

function inferIOCTypeFromValue(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return ""
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return "url"
  if (/^[a-f0-9]{32}$/.test(normalized)) return "hash"
  if (/^[a-f0-9]{40}$/.test(normalized)) return "hash"
  if (/^[a-f0-9]{64}$/.test(normalized)) return "hash"
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) return "ip"
  if (normalized.includes(".")) return "domain"
  return ""
}

function isTagPath(path: string) {
  const normalized = normalizePath(path)
  return normalized === "tags" || normalized === "tags[]" || normalized.endsWith(".tags[]")
}

function isTimePath(path: string) {
  return stringInSet(pathBase(path), [
    "date_added",
    "dateadded",
    "event_date",
    "event_timestamp",
    "first_seen",
    "firstseen",
    "last_online",
    "last_seen",
    "lastseen",
    "time_first",
    "time_last",
    "timestamp",
    "updated_at",
  ])
}

function isSourcePath(path: string) {
  const normalized = normalizePath(path)
  const key = pathBase(normalized)
  return (
    stringInSet(key, [
      "credits",
      "id",
      "reference",
      "reporter",
      "source_name",
      "source_record_id",
      "source_url",
      "url_id",
      "urlid",
      "urlhaus_link",
      "urlhaus_reference",
    ]) ||
    (normalized.includes("virustotal") && normalized.endsWith(".link"))
  )
}

function isScorePath(path: string) {
  const normalized = normalizePath(path)
  const key = pathBase(normalized)
  return (
    stringInSet(key, [
      "confidence",
      "confidence_level",
      "downloads",
      "percent",
      "rank",
      "result",
      "score",
      "sightings",
      "uploads",
      "url_count",
      "vtpercent",
    ]) || normalized.includes("virustotal")
  )
}

function isReasonPath(path: string) {
  const normalized = normalizePath(path)
  const key = pathBase(normalized)
  return (
    stringInSet(key, [
      "action",
      "allow_level",
      "comment",
      "cscb_reason",
      "detection",
      "description",
      "reason",
      "risk_strategy",
      "status",
      "threat",
      "threat_name",
      "url_status",
      "verdict",
    ]) || normalized.includes("yara_rules")
  )
}

function entityGroupForPath(path: string) {
  const normalized = normalizePath(path)
  const key = pathBase(normalized)
  if (isSourcePath(normalized) || isTagPath(normalized) || isTimePath(normalized)) {
    return ""
  }
  if (isScorePath(normalized) || isReasonPath(normalized)) return ""
  if (normalized.startsWith("payload.")) return "payload"
  if (normalized.startsWith("passive_dns.")) return "dns"
  if (normalized.startsWith("attribute.") || normalized.startsWith("object.")) {
    return "misp_object"
  }
  if (
    normalized.startsWith("code_sign[].") ||
    stringInSet(key, [
      "certificate_thumbprint",
      "issuer",
      "issuer_cn",
      "serial_number",
      "subject",
      "subject_cn",
      "thumbprint",
      "thumbprint_algorithm",
    ])
  ) {
    return "certificate"
  }
  if (
    stringInSet(key, [
      "authentihash",
      "gimphash",
      "hash_value",
      "imphash",
      "md5_hash",
      "response_md5",
      "response_sha256",
      "sha1_hash",
      "sha256_hash",
      "sha3_384_hash",
      "ssdeep",
      "telfhash",
      "tlsh",
    ])
  ) {
    return "hash"
  }
  if (
    stringInSet(key, [
      "file_arch",
      "file_format",
      "file_name",
      "file_size",
      "file_type",
      "file_type_guess",
      "file_type_mime",
      "filename",
      "magika",
      "mime_type",
      "product_name",
      "publisher",
      "signature",
    ])
  ) {
    return "file"
  }
  if (
    stringInSet(key, [
      "domain",
      "host",
      "ip_value",
      "registered_domain",
      "url",
      "urlhaus_download",
    ])
  ) {
    return "network"
  }
  if (
    stringInSet(key, [
      "ioc",
      "ioc_algorithm",
      "ioc_type",
      "ioc_type_desc",
      "is_compromised",
      "malware",
      "malware_printable",
      "threat_type",
      "threat_type_desc",
    ])
  ) {
    return "threatfox_entity"
  }
  return ""
}

function groupTitle(group: string) {
  switch (group) {
    case "certificate":
      return "Certificate"
    case "dns":
      return "DNS"
    case "file":
      return "File"
    case "hash":
      return "Hash"
    case "misp_object":
      return "MISP"
    case "network":
      return "Network"
    case "payload":
      return "Payload"
    case "threatfox_entity":
      return "ThreatFox"
    default:
      return group.replace(/_/g, " ")
  }
}

function fieldLabel(path: string) {
  const normalized = normalizePath(path)
  if (normalized === "object.name") return "object type"
  const key = pathBase(normalized)
  const labels: Record<string, string> = {
    file_name: "file name",
    file_size: "file size",
    file_type: "file type",
    file_type_mime: "MIME type",
    imphash: "import hash",
    ioc_algorithm: "hash algorithm",
    is_compromised: "is compromised",
    md5_hash: "MD5",
    response_md5: "response MD5",
    response_sha256: "response SHA256",
    sha1_hash: "SHA1",
    sha256_hash: "SHA256",
    ssdeep: "ssdeep",
    telfhash: "telfhash",
    threat_type: "threat type",
    threat_type_desc: "threat type description",
    tlsh: "TLSH",
    urlhaus_download: "URLhaus download",
  }
  return labels[key] || key.replace(/_/g, " ")
}

function isCopyableField(path: string) {
  const key = pathBase(path)
  return (
    key.includes("hash") ||
    stringInSet(key, [
      "domain",
      "host",
      "ip_value",
      "reference",
      "response_md5",
      "response_sha256",
      "serial_number",
      "source_url",
      "subject",
      "url",
      "urlhaus_download",
      "urlhaus_reference",
    ])
  )
}

function isImportantField(path: string) {
  const key = pathBase(path)
  return stringInSet(key, [
    "file_name",
    "filename",
    "host",
    "md5_hash",
    "malware",
    "response_md5",
    "response_sha256",
    "sha1_hash",
    "sha256_hash",
    "signature",
    "threat_type",
    "url",
  ])
}

function detailField(field: RawField): AttackCaseIOCEvidenceField | null {
  const group = entityGroupForPath(field.path)
  if (!group) return null

  return {
    group,
    key: pathBase(field.path),
    label: fieldLabel(field.path),
    value: field.value,
    value_type: field.valueType,
    copyable: isCopyableField(field.path),
    important:
      isImportantField(field.path) ||
      [
        "certificate",
        "dns",
        "file",
        "hash",
        "misp_object",
        "network",
        "payload",
        "threatfox_entity",
      ].includes(group),
    source_path: field.path,
  }
}

function compactEvidenceFields(fields: AttackCaseIOCEvidenceField[]) {
  const seen = new Set<string>()
  return fields.filter((field) => {
    if (!field.value.trim()) return false
    const key = `${field.source_path}\u0000${field.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function groupEvidenceFields(fields: AttackCaseIOCEvidenceField[]) {
  const groups = new Map<string, AttackCaseIOCEvidenceField[]>()
  compactEvidenceFields(fields).forEach((field) => {
    const items = groups.get(field.group) ?? []
    items.push(field)
    groups.set(field.group, items)
  })

  return Array.from(groups.entries()).map<AttackCaseIOCEvidenceFieldGroup>(
    ([group, items]) => ({
      group,
      title: groupTitle(group),
      fields: items.slice(0, 24),
    }),
  )
}

function buildEntityFieldGroups(fields: RawField[]) {
  return groupEvidenceFields(
    fields
      .map(detailField)
      .filter((field): field is AttackCaseIOCEvidenceField => Boolean(field)),
  )
}

function normalizedScore(value: string) {
  const text = value.trim()
  if (!text) return 0
  if (text.includes("/")) {
    const [left, right] = text.split("/", 2).map((item) => Number(item.trim()))
    if (Number.isFinite(left) && Number.isFinite(right) && right > 0) {
      return Math.max(0, Math.min(100, Math.round((left / right) * 100)))
    }
  }
  const numeric = Number(text.replace(/%$/, "").trim())
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function extractScores(fields: RawField[]) {
  const out: AttackCaseIOCEvidenceScore[] = []
  fields.forEach((field) => {
    if (!isScorePath(field.path)) return
    const score = normalizedScore(field.value)
    if (!score) return
    out.push({
      name: pathBase(field.path),
      value: field.value,
      normalized_score: score,
      source_path: field.path,
    })
  })
  return compactScores(out)
}

function compactScores(scores: AttackCaseIOCEvidenceScore[]) {
  const seen = new Set<string>()
  return scores.filter((score) => {
    const key = `${score.name}\u0000${score.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractReasons(fields: RawField[]) {
  const out: AttackCaseIOCEvidenceReason[] = []
  fields.forEach((field) => {
    if (!isReasonPath(field.path)) return
    out.push({
      type: pathBase(field.path),
      value: field.value,
      source_path: field.path,
    })
  })
  return compactReasons(out)
}

function compactReasons(reasons: AttackCaseIOCEvidenceReason[]) {
  const seen = new Set<string>()
  return reasons.filter((reason) => {
    const value = reason.value.trim()
    if (!value) return false
    const key = `${reason.type}\u0000${value}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractTags(fields: RawField[], fallbackTags: string[]) {
  const values = fields.filter((field) => isTagPath(field.path)).map((field) => field.value)
  return compactStrings([...fallbackTags, ...values]).map<AttackCaseIOCEvidenceTag>(
    (value) => ({
      value,
      source_path: "tags",
    }),
  )
}

function evidenceSummary(
  reasons: AttackCaseIOCEvidenceReason[],
  groups: AttackCaseIOCEvidenceFieldGroup[],
) {
  const parts = reasons.map((reason) => reason.value).filter(Boolean)

  groups.forEach((group) => {
    group.fields.forEach((field) => {
      if (!field.important || parts.length >= 4) return
      const value = field.value.length > 96 ? `${field.value.slice(0, 96)}...` : field.value
      parts.push(`${field.label}=${value}`)
    })
  })

  return compactStrings(parts).slice(0, 4).join("; ")
}

function sourceFromFields(
  sourceName: string,
  sourceRecordId: string,
  sourceUrl: string,
  fields: RawField[],
): AttackCaseIOCHitEvidenceSource {
  const resolvedSourceName =
    sourceName || firstFieldValue(fields, ["source_name", "event.source_name"])

  return {
    source_name: resolvedSourceName,
    source_type: sourceTypeForName(resolvedSourceName),
    source_record_id:
      sourceRecordId || firstFieldValue(fields, ["source_record_id", "id", "urlid", "url_id"]),
    source_url:
      sourceUrl ||
      firstFieldValue(fields, [
        "source_url",
        "reference",
        "urlhaus_reference",
        "urlhaus_link",
        "virustotal.link",
        "payload.virustotal.link",
      ]),
    reporter: firstFieldValue(fields, ["reporter"]),
    credits: firstFieldValue(fields, ["credits"]),
  }
}

function timeFromFields(
  firstSeen: string,
  lastSeen: string,
  fields: RawField[],
): AttackCaseIOCHitEvidenceTime {
  return {
    first_seen:
      firstSeen || firstFieldValue(fields, ["first_seen", "firstseen", "passive_dns.time_first"]),
    last_seen:
      lastSeen || firstFieldValue(fields, ["last_seen", "lastseen", "last_online", "passive_dns.time_last"]),
    observed_at: firstFieldValue(fields, ["observed_at", "event_timestamp", "timestamp"]),
    added_at: firstFieldValue(fields, ["date_added", "dateadded"]),
    event_time: firstFieldValue(fields, ["event_time", "event_date"]),
  }
}

function entryValueSubtype(entry: AttackCaseIOCIocEntryRecord) {
  const iocType = entry.ioc_type.trim().toLowerCase()
  const normalizedPrefix = entry.normalized_value.trim().match(/^([a-z0-9_]+):/i)?.[1]
  if (iocType === "hash" && normalizedPrefix && HASH_ALGORITHMS.has(normalizedPrefix)) {
    return normalizedPrefix
  }

  const rawFields = extractRawJSONFields(entry.extra_json)
  const algorithm = firstFieldValue(rawFields, ["ioc_algorithm", "hash_algorithm"])
    .trim()
    .toLowerCase()
  if (iocType === "hash" && HASH_ALGORITHMS.has(algorithm)) return algorithm

  return entry.observable_type || entry.ioc_type
}

function entryDisplayValue(entry: AttackCaseIOCIocEntryRecord) {
  const display = entry.display_value.trim()
  if (display) return display

  const normalized = entry.normalized_value.trim()
  const prefixed = normalized.match(/^[a-z0-9_]+:(.+)$/i)
  return prefixed?.[1] || normalized
}

function entryRecord(entry: IocQueryEntry | null): AttackCaseIOCIocEntryRecord | null {
  if (!entry) return null
  return {
    id: entry.id,
    ioc_type: entry.ioc_type,
    observable_type: entry.ioc_type,
    normalized_value: entry.normalized_value,
    display_value: entry.display_value,
    status: entry.status,
    risk_score: entry.risk_score,
    confidence: entry.confidence,
    tags: entry.tags,
    extra_json: entry.extra_json,
    extra_json_keys: jsonKeys(entry.extra_json),
    first_seen: entry.first_seen,
    last_seen: entry.last_seen,
  }
}

function queryResultEntryDetail(
  item: IocVerificationItem | null,
): AttackCaseIOCIocEntryHitDetail | null {
  const result = item?.result
  if (!result?.hit || !result.entry) return null

  const source: AttackCaseIOCHitSourceRef = {
    database: "ioc",
    table: "ioc_entry",
    record_id: result.entry.id,
  }

  return {
    source,
    entry: entryRecord(result.entry),
    observations: result.observations.map((observation) => ({
      source_name: observation.source_name,
      source_record_id: observation.source_record_id,
      source_url: observation.source_url,
      confidence: observation.confidence,
      first_seen: observation.first_seen,
      last_seen: observation.last_seen,
      evidence: jsonEvidence(observation.raw_json),
    })),
    observations_page: result.truncation?.observations
      ? {
          total: result.truncation.observations.total,
          returned: result.truncation.observations.returned,
          offset: result.truncation.observations.offset,
          limit: result.truncation.observations.limit,
          has_more: result.truncation.observations.has_more,
        }
      : null,
    relations: result.relations.map((relation) => ({
      relation_type: relation.relation_type,
      direction: relation.direction,
      source_name: relation.source_name,
      source_record_id: relation.source_record_id,
      first_seen: relation.first_seen,
      last_seen: relation.last_seen,
      evidence: jsonEvidence(relation.raw_json),
      peer_entry: entryRecord(relation.peer_entry),
    })),
    relations_page: result.truncation?.relations
      ? {
          total: result.truncation.relations.total,
          returned: result.truncation.relations.returned,
          offset: result.truncation.relations.offset,
          limit: result.truncation.relations.limit,
          has_more: result.truncation.relations.has_more,
        }
      : null,
  }
}

function observationView(
  observation: AttackCaseIOCIocEntryHitDetail["observations"][number],
  index: number,
  entryTags: string[],
): AttackCaseIOCHitEvidence {
  const raw = observation.evidence?.raw_json || ""
  const fields = extractRawJSONFields(raw)
  const source = sourceFromFields(
    observation.source_name,
    observation.source_record_id,
    observation.source_url,
    fields,
  )
  const time = timeFromFields(observation.first_seen, observation.last_seen, fields)
  const groups = buildEntityFieldGroups(fields)
  const scores = extractScores(fields)
  if (observation.confidence > 0) {
    scores.push({
      name: "confidence",
      value: String(observation.confidence),
      normalized_score: observation.confidence,
      source_path: "ioc_observation.confidence",
    })
  }
  const reasons = extractReasons(fields)
  const title = [source.source_name || "source", time.observed_at || time.first_seen]
    .filter(Boolean)
    .join(" - ")

  return {
    evidence_id: `${source.source_name || "source"}:${source.source_record_id || index}`,
    source,
    time,
    tags: extractTags(fields, entryTags),
    scores: compactScores(scores),
    reasons,
    field_groups: groups,
    raw: observation.evidence,
    title,
    summary: evidenceSummary(reasons, groups),
  }
}

function relationView(
  relation: AttackCaseIOCIocEntryHitDetail["relations"][number],
): AttackCaseIOCHitRelation {
  const raw = relation.evidence?.raw_json || ""
  const fields = extractRawJSONFields(raw)
  const source = sourceFromFields(
    relation.source_name,
    relation.source_record_id,
    "",
    fields,
  )
  const time = timeFromFields(relation.first_seen, relation.last_seen, fields)
  const peerValue =
    relation.peer_entry?.display_value ||
    firstFieldValue(fields, [
      "attribute.value",
      "host",
      "passive_dns.rdata",
      "passive_dns.rrname",
      "payload.response_md5",
      "payload.response_sha256",
      "url",
    ])

  return {
    direction: relation.direction,
    relation_type: relation.relation_type,
    peer_ioc_type: relation.peer_entry?.ioc_type || inferIOCTypeFromValue(peerValue),
    peer_value: peerValue,
    peer_entry_id: relation.peer_entry?.id || "",
    source,
    time,
    field_groups: buildEntityFieldGroups(fields),
    raw: relation.evidence,
  }
}

function entryExtraEvidence(
  entry: AttackCaseIOCIocEntryRecord,
): AttackCaseIOCHitEvidence | null {
  const fields = extractRawJSONFields(entry.extra_json)
  if (!fields.length) return null
  const source = sourceFromFields("ioc_entry", entry.id, "", fields)
  const time = timeFromFields(entry.first_seen, entry.last_seen, fields)
  const groups = buildEntityFieldGroups(fields)
  if (!groups.length) return null
  const reasons = extractReasons(fields)

  return {
    evidence_id: `ioc_entry:${entry.id}`,
    source,
    time,
    tags: entry.tags.map((value) => ({ value, source_path: "ioc_entry.tags" })),
    scores: [],
    reasons,
    field_groups: groups,
    raw: jsonEvidence(entry.extra_json),
    title: [source.source_name, time.first_seen].filter(Boolean).join(" - "),
    summary: evidenceSummary(reasons, groups),
  }
}

function iocEntryHitDetailView(
  detail: AttackCaseIOCIocEntryHitDetail | null,
): AttackCaseIOCHitDetailView | null {
  const entry = detail?.entry
  if (!detail || !entry) return null

  const evidence = detail.observations.map((item, index) =>
    observationView(item, index, entry.tags),
  )
  const fallbackEvidence = evidence.length
    ? []
    : [entryExtraEvidence(entry)].filter(
        (item): item is AttackCaseIOCHitEvidence => Boolean(item),
      )
  const sourceRef =
    detail.source ??
    ({
      database: "ioc",
      table: "ioc_entry",
      record_id: entry.id,
    } satisfies AttackCaseIOCHitSourceRef)

  return {
    source_ref: sourceRef,
    primary: {
      ioc_type: entry.ioc_type,
      value_subtype: entryValueSubtype(entry),
      normalized_value: entry.normalized_value,
      display_value: entryDisplayValue(entry),
      status: entry.status,
      risk_score: entry.risk_score,
      confidence: entry.confidence,
      tags: entry.tags,
      first_seen: entry.first_seen,
      last_seen: entry.last_seen,
      source_names: compactStrings(detail.observations.map((item) => item.source_name)),
      feed_names: [],
      source_count: detail.observations.length,
      feed_count: 0,
    },
    evidence: [...evidence, ...fallbackEvidence],
    relations: detail.relations.map(relationView),
    raw_groups: [],
    sources: [],
  }
}

function queryResultDetailView(item: IocVerificationItem | null) {
  return iocEntryHitDetailView(queryResultEntryDetail(item))
}

export { iocEntryHitDetailView, queryResultDetailView }
