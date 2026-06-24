import type {
  AttackCaseIOCHitDetailView,
} from "@/features/ioc-analysis/types"

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

type IocDetailLocale = "zh-CN" | "en"

type LocalizedDetailMap = Record<IocDetailLocale, Record<string, string>>

function normalizeDetailLocale(locale?: string | null): IocDetailLocale {
  return locale?.toLowerCase().startsWith("zh") ? "zh-CN" : "en"
}

function localizedDetailValue(
  map: LocalizedDetailMap,
  key: string,
  locale?: string | null,
) {
  const detailLocale = normalizeDetailLocale(locale)
  return map[detailLocale]?.[key]
}

const HIDDEN_DETAIL_FIELD_NAMES = new Set([
  "entry_key",
  "evidence_id",
  "event_time",
  "domain_hash",
  "hash_hash",
  "ip_hash",
  "match_type",
  "normalized_value",
  "normalized_value_hash",
  "observed_at",
  "path",
  "record_id",
  "record_kind",
  "scope",
  "source_path",
  "source_record_id",
  "tenant_id",
  "threat_level_id",
  "value_hash",
  "indicator_key",
])

function formatList(values: string[]) {
  const visibleValues = values.map((value) => value.trim()).filter(Boolean)
  if (!visibleValues.length) return "-"
  return visibleValues.join("、")
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

const DETAIL_FIELD_LABELS: LocalizedDetailMap = {
  "zh-CN": {
    action: "处理方式",
    added_at: "添加时间",
    allow_level: "放行级别",
    categories: "分类",
    cidr_prefix: "CIDR前缀",
    cloud_provider: "云厂商",
    comment: "备注",
    confidence: "置信度",
    credits: "署名",
    created_at: "创建时间",
    data_level: "数据层级",
    description: "描述",
    direction: "方向",
    display_value: "IOC值",
    domain: "域名",
    downloads: "下载次数",
    enabled: "是否启用",
    entry_id: "条目ID",
    event_info: "事件信息",
    batch_id: "批次",
    category: "分类",
    feed: "情报源",
    feed_count: "情报源数量",
    feed_names: "情报源",
    file_type: "文件类型",
    file_name: "文件名",
    file_size: "文件大小",
    filename: "文件名",
    has_malicious_tag: "含恶意标签",
    hash_type: "哈希类型",
    hash_value: "哈希值",
    host: "主机",
    hostname: "主机名",
    indicator_key: "指标键",
    import_hash: "导入哈希",
    info: "信息",
    ioc: "IOC",
    ioc_type_desc: "IOC类型说明",
    ioc_type: "IOC类型",
    ip: "IP",
    ip_value: "IP",
    ip_version: "IP版本",
    issuer: "颁发者",
    is_compromised: "是否失陷",
    last_batch_id: "批次",
    last_seen: "最后发现时间",
    malware: "恶意软件",
    malware_malpedia: "Malpedia链接",
    malware_printable: "恶意软件",
    md5: "MD5",
    mime_type: "MIME类型",
    object_comment: "对象备注",
    object_description: "对象描述",
    object_name: "对象名称",
    object_type: "对象类型",
    observable_type: "观测类型",
    owner: "所有者",
    peer_entry_id: "关联条目ID",
    peer_ioc_type: "关联IOC类型",
    peer_value: "关联IOC值",
    product_name: "产品名称",
    publisher: "发布者",
    percent: "检出率",
    reason: "原因",
    reasons: "命中原因",
    reference: "引用",
    registered_domain: "注册域名",
    region: "区域",
    relation_type: "关联类型",
    reporter: "报告者",
    result: "检测结果",
    response_md5: "响应MD5",
    response_sha256: "响应SHA256",
    response_size: "响应大小",
    risk: "风险",
    risk_score: "风险",
    risk_strategy: "风险策略",
    sha1: "SHA1",
    sha256: "SHA256",
    signature: "签名",
    sightings: "观测次数",
    size_bytes: "大小(字节)",
    source: "来源",
    source_count: "来源数量",
    source_ioc_type: "来源IOC类型",
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
    threat: "威胁",
    threat_feed: "威胁情报源",
    threat_type: "威胁类型",
    threat_type_desc: "威胁类型说明",
    tlsh: "TLSH",
    type: "类型",
    url: "URL",
    url_status: "URL状态",
    urlhaus_download: "URLhaus下载链接",
    urlhaus_reference: "URLhaus引用",
    uploads: "上传次数",
    url_count: "URL数量",
    updated_at: "更新时间",
    value: "值",
    value_subtype: "值类型",
    vtpercent: "VirusTotal检出率",
    whitelist: "白名单来源",
  },
  en: {
    action: "Action",
    added_at: "Added at",
    allow_level: "Allow level",
    categories: "Categories",
    cidr_prefix: "CIDR prefix",
    cloud_provider: "Cloud provider",
    comment: "Comment",
    confidence: "Confidence",
    credits: "Credits",
    created_at: "Created at",
    data_level: "Data level",
    description: "Description",
    direction: "Direction",
    display_value: "IOC value",
    domain: "Domain",
    downloads: "Downloads",
    enabled: "Enabled",
    entry_id: "Entry ID",
    event_info: "Event info",
    batch_id: "Batch",
    category: "Category",
    feed: "Feed",
    feed_count: "Feed count",
    feed_names: "Feed",
    file_type: "File type",
    file_name: "File name",
    file_size: "File size",
    filename: "File name",
    has_malicious_tag: "Has malicious tag",
    hash_type: "Hash type",
    hash_value: "Hash value",
    host: "Host",
    hostname: "Hostname",
    indicator_key: "Indicator key",
    import_hash: "Import hash",
    info: "Info",
    ioc: "IOC",
    ioc_type_desc: "IOC type description",
    ioc_type: "IOC type",
    ip: "IP",
    ip_value: "IP",
    ip_version: "IP version",
    issuer: "Issuer",
    is_compromised: "Compromised",
    last_batch_id: "Batch",
    last_seen: "Last seen",
    malware: "Malware",
    malware_malpedia: "Malpedia link",
    malware_printable: "Malware",
    md5: "MD5",
    mime_type: "MIME type",
    object_comment: "Object comment",
    object_description: "Object description",
    object_name: "Object name",
    object_type: "Object type",
    observable_type: "Observable type",
    owner: "Owner",
    peer_entry_id: "Peer entry ID",
    peer_ioc_type: "Peer IOC type",
    peer_value: "Peer IOC value",
    product_name: "Product name",
    publisher: "Publisher",
    percent: "Detection rate",
    reason: "Reason",
    reasons: "Reasons",
    reference: "Reference",
    registered_domain: "Registered domain",
    region: "Region",
    relation_type: "Relation type",
    reporter: "Reporter",
    result: "Detection result",
    response_md5: "Response MD5",
    response_sha256: "Response SHA256",
    response_size: "Response size",
    risk: "Risk",
    risk_score: "Risk",
    risk_strategy: "Risk strategy",
    sha1: "SHA1",
    sha256: "SHA256",
    signature: "Signature",
    sightings: "Sightings",
    size_bytes: "Size bytes",
    source: "Source",
    source_count: "Source count",
    source_ioc_type: "Source IOC type",
    source_name: "Source name",
    source_names: "Source name",
    source_type: "Source type",
    source_url: "Source link",
    source_urls: "Source link",
    source_version: "Source version",
    status: "Status",
    subject: "Subject",
    summary: "Summary",
    tags: "Tags",
    threat: "Threat",
    threat_feed: "Threat feed",
    threat_type: "Threat type",
    threat_type_desc: "Threat type description",
    tlsh: "TLSH",
    type: "Type",
    url: "URL",
    url_status: "URL status",
    urlhaus_download: "URLhaus download link",
    urlhaus_reference: "URLhaus reference",
    uploads: "Uploads",
    url_count: "URL count",
    updated_at: "Updated at",
    value: "Value",
    value_subtype: "Value subtype",
    vtpercent: "VirusTotal detection rate",
    whitelist: "Whitelist source",
  },
}

const DETAIL_SECTION_TITLES: LocalizedDetailMap = {
  "zh-CN": {
    certificate: "证书信息",
    evidence: "证据信息",
    file: "文件信息",
    hash: "哈希信息",
    ioc_entry_context: "IOC上下文",
    network: "网络信息",
    payload: "载荷信息",
    primary: "基础信息",
    raw: "原始字段",
    whitelist: "白名单信息",
  },
  en: {
    certificate: "Certificate",
    evidence: "Evidence",
    file: "File",
    hash: "Hash",
    ioc_entry_context: "IOC Entry Context",
    network: "Network",
    payload: "Payload",
    primary: "Basic Information",
    raw: "Raw Fields",
    whitelist: "Whitelist",
  },
}

const IOC_TYPE_VALUES: LocalizedDetailMap = {
  "zh-CN": {
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
  },
  en: {
    certificate: "Certificate",
    domain: "Domain",
    hash: "Hash",
    hostname: "Hostname",
    ip: "IP",
    md5: "MD5",
    sha1: "SHA1",
    sha256: "SHA256",
    service_name: "Service name",
    url: "URL",
  },
}

const STATUS_VALUES: LocalizedDetailMap = {
  "zh-CN": {
    active: "启用",
    annotate_only: "仅标注",
    disabled: "禁用",
    inactive: "停用",
    skip_ioc_query: "跳过IOC查询",
  },
  en: {
    active: "Active",
    annotate_only: "Annotate only",
    disabled: "Disabled",
    inactive: "Inactive",
    skip_ioc_query: "Skip IOC lookup",
  },
}

const ALLOW_LEVEL_VALUES: LocalizedDetailMap = {
  "zh-CN": {
    known_good_hash: "已知可信哈希",
    tenant_allow: "租户放行",
    trusted_vendor: "可信厂商",
  },
  en: {
    known_good_hash: "Known good hash",
    tenant_allow: "Tenant allow",
    trusted_vendor: "Trusted vendor",
  },
}

const SOURCE_TYPE_VALUES: LocalizedDetailMap = {
  "zh-CN": {
    threat_feed: "威胁情报源",
    whitelist: "白名单",
  },
  en: {
    threat_feed: "Threat feed",
    whitelist: "Whitelist",
  },
}

const DIRECTION_VALUES: LocalizedDetailMap = {
  "zh-CN": {
    in: "入向",
    inbound: "入向",
    out: "出向",
    outbound: "出向",
  },
  en: {
    in: "Inbound",
    inbound: "Inbound",
    out: "Outbound",
    outbound: "Outbound",
  },
}

const BOOLEAN_VALUES: LocalizedDetailMap = {
  "zh-CN": {
    "0": "否",
    "1": "是",
    false: "否",
    no: "否",
    true: "是",
    yes: "是",
  },
  en: {
    "0": "No",
    "1": "Yes",
    false: "No",
    no: "No",
    true: "Yes",
    yes: "Yes",
  },
}

const BOOLEAN_FIELD_KEYS = new Set([
  "enabled",
  "has_malicious_tag",
  "is_compromised",
])

function translateWhitelistDetailText(value: string, locale?: string | null) {
  if (normalizeDetailLocale(locale) === "en") return value

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

function detailFieldLabel(column: string, locale?: string | null) {
  const key = detailFieldKey(column)
  return localizedDetailValue(DETAIL_FIELD_LABELS, key, locale) || column
}

function detailSectionTitle(title: string, locale?: string | null) {
  const detailLocale = normalizeDetailLocale(locale)
  const key = detailFieldKey(title)
  const knownTitle = localizedDetailValue(DETAIL_SECTION_TITLES, key, detailLocale)
  if (knownTitle) return knownTitle

  const relationMatch = title.match(/^Relation(?:\s+→|\s+-|\s+)?\s*(.*)$/i)
  if (relationMatch) {
    const suffix = relationMatch[1]?.trim()
    const relationTitle = detailLocale === "zh-CN" ? "关联关系" : "Relation"
    return suffix ? `${relationTitle} ${suffix}` : relationTitle
  }

  const evidenceMatch = title.match(/^Evidence\s+(\d+)$/i)
  if (evidenceMatch) {
    return detailLocale === "zh-CN"
      ? `证据 ${evidenceMatch[1]}`
      : `Evidence ${evidenceMatch[1]}`
  }

  return title
}

function detailSectionSubtitle(subtitle: string, locale?: string | null) {
  return translateWhitelistDetailText(subtitle, locale)
}

function detailFieldValue(field: DetailField, locale?: string | null) {
  const key = detailFieldKey(field.column)
  if (key === "risk_score") return scoreDisplayValue(field.value, "risk")
  if (key === "confidence") {
    return scoreDisplayValue(field.value, "confidence")
  }
  if (key === "ioc_type") {
    return (
      localizedDetailValue(IOC_TYPE_VALUES, normalizedDetailValue(field.value), locale) ||
      field.value
    )
  }
  if (key === "status" || key === "action") {
    return (
      localizedDetailValue(STATUS_VALUES, normalizedDetailValue(field.value), locale) ||
      field.value
    )
  }
  if (key === "allow_level") {
    return (
      localizedDetailValue(ALLOW_LEVEL_VALUES, normalizedDetailValue(field.value), locale) ||
      field.value
    )
  }
  if (key === "source_type") {
    return (
      localizedDetailValue(SOURCE_TYPE_VALUES, normalizedDetailValue(field.value), locale) ||
      field.value
    )
  }
  if (key === "direction") {
    return (
      localizedDetailValue(DIRECTION_VALUES, normalizedDetailValue(field.value), locale) ||
      field.value
    )
  }
  if (BOOLEAN_FIELD_KEYS.has(key)) {
    return (
      localizedDetailValue(BOOLEAN_VALUES, normalizedDetailValue(field.value), locale) ||
      field.value
    )
  }
  if (key === "reason" || key === "reasons" || key === "summary") {
    return translateWhitelistDetailText(field.value, locale)
  }
  if (LIST_VALUE_FIELD_KEYS.has(key)) {
    return translateDisplayListValue(field.value, locale)
  }
  return field.value
}

function detailTokenDisplayValue(value: string, locale?: string | null) {
  const key = normalizedDetailValue(value)
  return (
    localizedDetailValue(ALLOW_LEVEL_VALUES, key, locale) ||
    localizedDetailValue(STATUS_VALUES, key, locale) ||
    localizedDetailValue(SOURCE_TYPE_VALUES, key, locale) ||
    value
  )
}

function translateDisplayListValue(value: string, locale?: string | null) {
  const items = displayListItems(value)
  if (!items.length) return detailTokenDisplayValue(value, locale)
  const separator = normalizeDetailLocale(locale) === "zh-CN" ? "、" : ", "
  return items.map((item) => detailTokenDisplayValue(item, locale)).join(separator)
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

const LIST_VALUE_FIELD_KEYS = new Set([
  "categories",
  "feed_names",
  "reasons",
  "source_names",
  "source_urls",
  "tags",
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
  return column.trim().toLowerCase().replace(/[.[\]\s-]+/g, "_")
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

function uniqueDetailFields(fields: DetailField[], locale?: string | null) {
  const seen = new Set<string>()
  return fields.filter((field) => {
    const rawKey = `${detailFieldKey(field.column)}\u0000${field.value}`
    const displayKey = `${detailFieldLabel(field.column, locale)}\u0000${detailFieldValue(field, locale)}`
    if (seen.has(rawKey) || seen.has(displayKey)) return false
    seen.add(rawKey)
    seen.add(displayKey)
    return true
  })
}

const DETAIL_FIELD_DUPLICATE_ALIASES: Record<string, string[]> = {
  action: ["action"],
  confidence: ["confidence"],
  display_value: [
    "display_value",
    "normalized_value",
    "md5",
    "md5_hash",
    "sha1",
    "sha1_hash",
    "sha256",
    "sha256_hash",
    "hash_value",
    "domain",
    "ip",
    "ip_value",
    "url",
    "hostname",
  ],
  domain: ["domain", "display_value", "normalized_value"],
  file_name: ["file_name", "filename"],
  file_size: ["file_size"],
  filename: ["file_name", "filename"],
  hash_value: [
    "hash_value",
    "md5",
    "md5_hash",
    "sha1",
    "sha1_hash",
    "sha256",
    "sha256_hash",
    "display_value",
    "normalized_value",
  ],
  host: ["host", "hostname", "ip", "ip_value", "display_value", "normalized_value"],
  hostname: ["hostname", "display_value", "normalized_value"],
  ioc: ["ioc", "display_value", "normalized_value", "url", "domain", "ip", "ip_value"],
  ip: ["ip", "ip_value", "display_value", "normalized_value"],
  ip_value: ["ip", "ip_value", "display_value", "normalized_value"],
  md5: ["md5", "md5_hash", "hash_value", "display_value", "normalized_value"],
  md5_hash: ["md5", "md5_hash", "hash_value", "display_value", "normalized_value"],
  normalized_value: [
    "normalized_value",
    "display_value",
    "md5",
    "md5_hash",
    "sha1",
    "sha1_hash",
    "sha256",
    "sha256_hash",
    "hash_value",
    "domain",
    "ip",
    "ip_value",
    "url",
    "hostname",
  ],
  product_name: ["product_name"],
  publisher: ["publisher"],
  registered_domain: ["registered_domain"],
  risk: ["risk", "risk_score"],
  risk_score: ["risk", "risk_score"],
  sha1: ["sha1", "sha1_hash", "hash_value", "display_value", "normalized_value"],
  sha1_hash: ["sha1", "sha1_hash", "hash_value", "display_value", "normalized_value"],
  sha256: [
    "sha256",
    "sha256_hash",
    "hash_value",
    "display_value",
    "normalized_value",
  ],
  sha256_hash: [
    "sha256",
    "sha256_hash",
    "hash_value",
    "display_value",
    "normalized_value",
  ],
  status: ["status"],
  tags: ["tags"],
  url: ["url", "display_value", "normalized_value"],
  value: ["value", "display_value", "normalized_value", "url", "domain", "ip", "ip_value"],
}

function duplicateFieldKeys(column: string) {
  const key = detailFieldKey(column)
  return DETAIL_FIELD_DUPLICATE_ALIASES[key] || [key]
}

function normalizedDuplicateValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function duplicateTokensForField(field: DetailField) {
  const value = normalizedDuplicateValue(field.value)
  if (!value || value === "-" || value === "[]") return []
  return duplicateFieldKeys(field.column).map((key) => `${key}\u0000${value}`)
}

function displayListItems(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized === "-") return []
  const match = normalized.match(/^\[(.*)\]$/)
  const listText = match ? match[1] : normalized
  const separator = listText.includes("、") ? /、/ : /,/

  return listText
    .split(separator)
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean)
}

export type { DetailField, DetailFieldSection, IocDetailLocale }

export {
  DIRECTION_VALUES,
  compactFields,
  detailFieldKey,
  detailFieldLabel,
  detailFieldValue,
  detailSectionSubtitle,
  detailSectionTitle,
  detailViewSourceTableName,
  displayListItems,
  displayValue,
  duplicateTokensForField,
  formatList,
  isBlacklistDetailView,
  isBlacklistTableName,
  isEmptyDisplayValue,
  normalizeDetailLocale,
  normalizedDuplicateValue,
  normalizedDetailValue,
  scoreDisplayValue,
  shouldCopyDetailField,
  sourceTableName,
  translateWhitelistDetailText,
  uniqueDetailFields,
}
