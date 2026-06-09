"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import { ATTCK_STAGE_DEFINITIONS, getAttckStageDefinition, resolveAttckStage } from "@/features/attack/constants/attck-stages"
import type {
  AttackCaseTimelineGroup,
  AttackCaseTimelineResult,
  AttackCaseTimelineSummary,
  AttackGroupTimelineInstance,
  AttackGroupTimelineSummary,
  AttackIocEvidence,
  AttackStageHostDistributionItem,
  AttackStageInstanceDistributionItem,
  AttackSnapshotsResult,
  AttackStatsTrendParams,
  AttackTimelineCasesResult,
  AttackTimelineEvidenceItem,
  AttackOverview,
  AttackSnapshotPagination,
  AttackTaskStatus,
  AttackTriggerDefaultRange,
  AttackTopHostItem,
  AttackTrendPoint,
  BatchDescribeEventSourceItem,
  BatchDescribeEventSourcesResult,
  BucketType,
  EventSourceDescription,
  EventSourceDescriptionKey,
  EventSourceDescriptionSlot,
  ResolveAttackStatsRangeSnapshotResult,
  TriggerCheckPayload,
  TriggerCheckResult,
} from "@/features/attack/dashboard/types"
import type {
  GetAttackEventTimelineDistributionData,
  Granularity,
} from "@/features/attack/dashboard/components/attack-distribution-timeline"
import type {
  AttackRuleMeta,
  AttckData,
  AttckDetail,
  AttckStage,
  Severity,
  Top10Item,
} from "@/features/attack/utils/attck-utils"

interface ApiResult<T> {
  data: T
  raw?: unknown
}

interface BackendAttackStatsBucket {
  bucket_type?: string
  bucket_start?: string
  bucket_end?: string
  trigger_source?: string
  last_request_id?: string
  snapshot_id?: string
}

type BackendAttackRuleMeta = AttackRuleMeta

interface BackendAttackStatsOverviewItem {
  bucket?: BackendAttackStatsBucket
  total_rules?: number | string
  total_groups?: number | string
  total_instances?: number | string
  total_sources?: number | string
  total_hosts?: number | string
  total_cases?: number | string
  critical_count?: number | string
  high_count?: number | string
  medium_count?: number | string
  low_count?: number | string
}

interface BackendAttackStatsOverviewData {
  overview?: BackendAttackStatsOverviewItem
}

interface BackendAttackRuleStatsItem {
  meta?: BackendAttackRuleMeta
  total_groups?: number | string
  total_instances?: number | string
  total_sources?: number | string
  total_hosts?: number | string
  total_cases?: number | string
}

interface BackendTopAttackRulesData {
  items?: BackendAttackRuleStatsItem[]
}

interface BackendAttackStageHostDistributionItem {
  stage?: string
  stageKey?: string
  stage_key?: string
  hostCount?: number | string
  host_count?: number | string
}

interface BackendAttackStageHostDistributionData {
  items?: BackendAttackStageHostDistributionItem[]
}

interface BackendAttackStageInstanceDistributionItem {
  stage?: string
  stageKey?: string
  stage_key?: string
  instanceCount?: number | string
  instance_count?: number | string
}

interface BackendAttackStageInstanceDistributionData {
  items?: BackendAttackStageInstanceDistributionItem[]
}

interface BackendAttackHostStatsItem {
  agent_id?: string
  hostname?: string
  total_rules?: number | string
  total_groups?: number | string
  total_instances?: number | string
  total_sources?: number | string
  risk_score?: number | string
  total_cases?: number | string
}

interface BackendTopAttackHostsData {
  items?: BackendAttackHostStatsItem[]
}

interface BackendAttackStatsTrendData {
  items?: BackendAttackStatsOverviewItem[]
}

interface BackendAttackEventTimelinePoint {
  bucket_start?: string
  bucket_end?: string
  total_sources?: number | string
  total_instances?: number | string
  total_groups?: number | string
  total_rules?: number | string
  total_hosts?: number | string
  total_cases?: number | string
}

interface BackendAttackEventTimelineData {
  start_time?: string
  end_time?: string
  timezone?: string
  granularity?: string
  coverage_status?: string
  total_sources?: number | string
  total_instances?: number | string
  total_groups?: number | string
  total_rules?: number | string
  total_hosts?: number | string
  total_cases?: number | string
  items?: BackendAttackEventTimelinePoint[]
}

interface BackendResolveAttackStatsRangeSnapshotData {
  snapshot_id?: string
  task_id?: string
  status?: string
  source?: string
  coverage_status?: string
}

interface BackendPaginationInfo {
  current_page?: number | string
  page_size?: number | string
  total_count?: number | string
  total_pages?: number | string
  has_previous?: boolean
  has_next?: boolean
}

interface BackendAttackStatsSnapshotsData {
  items?: BackendAttackStatsOverviewItem[]
  pagination?: BackendPaginationInfo
}

interface BackendAttackRuleHostStatsItem {
  agent_id?: string
  hostname?: string
  total_groups?: number | string
  total_instances?: number | string
  total_sources?: number | string
  risk_score?: number | string
  total_cases?: number | string
}

interface BackendAttackRuleDetailData {
  rule?: BackendAttackRuleStatsItem
  items?: BackendAttackRuleHostStatsItem[]
}

interface BackendTriggerStatTaskData {
  task_id?: string
  status?: string
}

interface BackendAttackTriggerDefaultRangeData {
  start_time?: string
  end_time?: string
  timezone?: string
  reserve_seconds?: number | string
  last_success_time?: string
}

interface BackendTaskStatusData {
  task_id?: string
  status?: string
  error_message?: string
  snapshot_id?: string
}

interface BackendAttackTimelinePageInfo {
  next_page_token?: string
  has_more?: boolean
}

interface BackendAttackCaseTimelineSummary {
  case_id?: string
  tenant_id?: string
  title?: string
  summary?: string
  severity?: string
  primary_phase?: string
  phases?: unknown
  start_time?: string
  end_time?: string
  rule_count?: number | string
  group_count?: number | string
  instance_count?: number | string
  evidence_count?: number | string
  host_count?: number | string
  rule_ids?: unknown
  tags?: unknown
  agent_ids?: unknown
}

interface BackendAttackIocEvidence {
  attack_mark?: string
  marker?: string
  rule_id?: string
  candidate_type?: string
  candidate_field?: string
  candidate_value?: string
  certificate?: string
  decision?: string
  hit_source?: string
  ioc_storage?: string
  ioc_entry_id?: string
  ioc_type?: string
  ioc_value_subtype?: string
  ioc_normalized_value?: string
  ioc_display_value?: string
  ioc_indicator_key?: string
  risk_score?: number | string
  confidence?: number | string
  summary_json?: string
}

interface BackendAttackTimelineEvidenceItem {
  evidence_id?: string
  occurred_at?: string
  primary_phase?: string
  phases?: unknown
  rule_id?: string
  rule_title?: string
  instance_id?: string
  group_id?: string
  agent_id?: string
  source_unique_id?: string
  event_type?: number | string
  event_name?: string
  detection_name?: string
  find_string?: string
  matched_attack_marks?: unknown
  attack_techniques?: unknown
  ioc_evidences?: BackendAttackIocEvidence[]
}

interface BackendAttackGroupTimelineSummary {
  group_id?: string
  rule_id?: string
  tenant_id?: string
  agent_id?: string
  primary_phase?: string
  phases?: unknown
  start_time?: string
  end_time?: string
  instance_count?: number | string
  evidence_count?: number | string
}

interface BackendAttackGroupTimelineInstance {
  instance_id?: string
  group_id?: string
  rule_id?: string
  tenant_id?: string
  agent_id?: string
  primary_phase?: string
  phases?: unknown
  start_time?: string
  end_time?: string
  evidence_count?: number | string
  items?: BackendAttackTimelineEvidenceItem[]
}

interface BackendAttackCaseTimelineGroup {
  group?: BackendAttackGroupTimelineSummary
  instances?: BackendAttackGroupTimelineInstance[]
}

interface BackendAttackCaseTimelineData {
  case?: BackendAttackCaseTimelineSummary
  groups?: BackendAttackCaseTimelineGroup[]
}

interface BackendEventSourceDescriptionKey {
  event_type?: number | string
  event_name?: string
  source_unique_id?: string
}

interface BackendEventSourceDescriptionSlot {
  slot_id?: string
  role?: string
  entity_type?: string
  label?: string
  display_value?: string
  raw_value?: string
  raw_value_json?: string
  value_type?: string
  source_fields?: unknown
  order?: number | string
  primary?: boolean
  sensitive?: boolean
  redacted?: boolean
  children?: BackendEventSourceDescriptionSlot[]
}

interface BackendEventSourceDescription {
  schema_version?: string
  source_table?: string
  event_kind?: string
  category?: string
  action?: string
  title?: string
  pattern?: string
  summary?: string
  short_summary?: string
  slots?: BackendEventSourceDescriptionSlot[]
}

interface BackendBatchDescribeEventSourceItem {
  key?: BackendEventSourceDescriptionKey
  found?: boolean
  description?: BackendEventSourceDescription
  miss_reason?: string
  describe_status?: string
}

interface BackendBatchDescribeEventSourcesData {
  items?: BackendBatchDescribeEventSourceItem[]
}

interface BackendAttackTimelineCasesData {
  items?: BackendAttackCaseTimelineSummary[]
  page?: BackendAttackTimelinePageInfo
}

interface BackendUpdateAttackCaseFriendlyNameData {
  case?: BackendAttackCaseTimelineSummary
}

interface RuleWithHosts {
  rule: BackendAttackRuleStatsItem
  hosts: BackendAttackRuleHostStatsItem[]
}

export interface FetchAttackDashboardOptions {
  bucketType?: BucketType
  overview?: AttackOverview
  topLimit?: number
}

const DEFAULT_BUCKET_TYPE: BucketType = "fixed"
const DEFAULT_TOP_LIMIT = 10

function normalizeTaskTime(value: string) {
  const normalized = value.trim().replace("T", " ")
  if (!normalized) return normalized
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`
  }
  return normalized
}

function toDateTimeLocalValue(value: string) {
  const normalized = normalizeTaskTime(value)
  if (!normalized) return ""
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?)/)
  return match ? `${match[1]}T${match[2]}` : normalized.replace(" ", "T")
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeSnapshotId(value: unknown) {
  const normalized = stringValue(value)
  return normalized && normalized !== "0" ? normalized : ""
}

function normalizeArray(items: unknown): string[] {
  return Array.isArray(items) ? items.map((item) => stringValue(item)).filter(Boolean) : []
}

function buildEventSourceDescriptionKey(raw: BackendEventSourceDescriptionKey = {}): EventSourceDescriptionKey {
  return {
    event_type: numberValue(raw.event_type),
    event_name: stringValue(raw.event_name),
    source_unique_id: stringValue(raw.source_unique_id),
  }
}

function buildEventSourceDescriptionSlot(raw: BackendEventSourceDescriptionSlot = {}): EventSourceDescriptionSlot {
  return {
    slot_id: stringValue(raw.slot_id),
    role: stringValue(raw.role),
    entity_type: stringValue(raw.entity_type),
    label: stringValue(raw.label),
    display_value: stringValue(raw.display_value),
    raw_value: stringValue(raw.raw_value),
    raw_value_json: stringValue(raw.raw_value_json),
    value_type: stringValue(raw.value_type),
    source_fields: normalizeArray(raw.source_fields),
    order: numberValue(raw.order),
    primary: Boolean(raw.primary),
    sensitive: Boolean(raw.sensitive),
    redacted: Boolean(raw.redacted),
    children: Array.isArray(raw.children)
      ? raw.children.map(buildEventSourceDescriptionSlot)
      : [],
  }
}

function buildEventSourceDescription(raw: BackendEventSourceDescription = {}): EventSourceDescription {
  return {
    schema_version: stringValue(raw.schema_version),
    source_table: stringValue(raw.source_table),
    event_kind: stringValue(raw.event_kind),
    category: stringValue(raw.category),
    action: stringValue(raw.action),
    title: stringValue(raw.title),
    pattern: stringValue(raw.pattern),
    summary: stringValue(raw.summary),
    short_summary: stringValue(raw.short_summary),
    slots: Array.isArray(raw.slots)
      ? raw.slots.map(buildEventSourceDescriptionSlot)
      : [],
  }
}

function buildBatchDescribeEventSourceItem(raw: BackendBatchDescribeEventSourceItem = {}): BatchDescribeEventSourceItem {
  return {
    key: buildEventSourceDescriptionKey(raw.key),
    found: Boolean(raw.found),
    description: raw.description ? buildEventSourceDescription(raw.description) : null,
    miss_reason: stringValue(raw.miss_reason),
    describe_status: stringValue(raw.describe_status),
  }
}

function normalizeBucketType(value: unknown): BucketType {
  const normalized = stringValue(value).toLowerCase()
  if (normalized === "hour" || normalized === "day") return normalized
  return "fixed"
}

function normalizeGranularity(value: unknown): Granularity {
  const normalized = stringValue(value).toLowerCase()
  if (normalized === "hour" || normalized === "month") return normalized
  return "day"
}

function normalizeCoverageStatus(value: unknown): GetAttackEventTimelineDistributionData["coverage_status"] {
  const normalized = stringValue(value).toLowerCase()
  if (normalized === "covered" || normalized === "partial") return normalized
  return "unknown"
}

function buildAttackCaseTimelineSummary(raw: BackendAttackCaseTimelineSummary): AttackCaseTimelineSummary {
  return {
    case_id: stringValue(raw.case_id),
    tenant_id: stringValue(raw.tenant_id),
    title: stringValue(raw.title),
    summary: stringValue(raw.summary),
    severity: stringValue(raw.severity),
    primary_phase: stringValue(raw.primary_phase),
    phases: normalizeArray(raw.phases),
    start_time: stringValue(raw.start_time),
    end_time: stringValue(raw.end_time),
    rule_count: numberValue(raw.rule_count),
    group_count: numberValue(raw.group_count),
    instance_count: numberValue(raw.instance_count),
    evidence_count: numberValue(raw.evidence_count),
    host_count: numberValue(raw.host_count),
    rule_ids: normalizeArray(raw.rule_ids),
    tags: normalizeArray(raw.tags),
    agent_ids: normalizeArray(raw.agent_ids),
  }
}

function buildAttackIocEvidence(raw: BackendAttackIocEvidence): AttackIocEvidence {
  return {
    attack_mark: stringValue(raw.attack_mark),
    marker: stringValue(raw.marker),
    rule_id: stringValue(raw.rule_id),
    candidate_type: stringValue(raw.candidate_type),
    candidate_field: stringValue(raw.candidate_field),
    candidate_value: stringValue(raw.candidate_value),
    certificate: stringValue(raw.certificate),
    decision: stringValue(raw.decision),
    hit_source: stringValue(raw.hit_source),
    ioc_storage: stringValue(raw.ioc_storage),
    ioc_entry_id: stringValue(raw.ioc_entry_id),
    ioc_type: stringValue(raw.ioc_type),
    ioc_value_subtype: stringValue(raw.ioc_value_subtype),
    ioc_normalized_value: stringValue(raw.ioc_normalized_value),
    ioc_display_value: stringValue(raw.ioc_display_value),
    ioc_indicator_key: stringValue(raw.ioc_indicator_key),
    risk_score: numberValue(raw.risk_score),
    confidence: numberValue(raw.confidence),
    summary_json: stringValue(raw.summary_json),
  }
}

function buildAttackTimelineEvidenceItem(raw: BackendAttackTimelineEvidenceItem): AttackTimelineEvidenceItem {
  return {
    evidence_id: stringValue(raw.evidence_id),
    occurred_at: stringValue(raw.occurred_at),
    primary_phase: stringValue(raw.primary_phase),
    phases: normalizeArray(raw.phases),
    rule_id: stringValue(raw.rule_id),
    rule_title: stringValue(raw.rule_title),
    instance_id: stringValue(raw.instance_id),
    group_id: stringValue(raw.group_id),
    agent_id: stringValue(raw.agent_id),
    source_unique_id: stringValue(raw.source_unique_id),
    event_type: numberValue(raw.event_type),
    event_name: stringValue(raw.event_name),
    detection_name: stringValue(raw.detection_name),
    find_string: stringValue(raw.find_string),
    matched_attack_marks: normalizeArray(raw.matched_attack_marks),
    attack_techniques: normalizeArray(raw.attack_techniques),
    ioc_evidences: Array.isArray(raw.ioc_evidences)
      ? raw.ioc_evidences.map(buildAttackIocEvidence)
      : [],
  }
}

function buildAttackGroupTimelineSummary(raw: BackendAttackGroupTimelineSummary = {}): AttackGroupTimelineSummary {
  return {
    group_id: stringValue(raw.group_id),
    rule_id: stringValue(raw.rule_id),
    tenant_id: stringValue(raw.tenant_id),
    agent_id: stringValue(raw.agent_id),
    primary_phase: stringValue(raw.primary_phase),
    phases: normalizeArray(raw.phases),
    start_time: stringValue(raw.start_time),
    end_time: stringValue(raw.end_time),
    instance_count: numberValue(raw.instance_count),
    evidence_count: numberValue(raw.evidence_count),
  }
}

function buildAttackGroupTimelineInstance(raw: BackendAttackGroupTimelineInstance): AttackGroupTimelineInstance {
  const items = Array.isArray(raw.items) ? raw.items.map(buildAttackTimelineEvidenceItem) : []

  return {
    instance_id: stringValue(raw.instance_id),
    group_id: stringValue(raw.group_id),
    rule_id: stringValue(raw.rule_id),
    tenant_id: stringValue(raw.tenant_id),
    agent_id: stringValue(raw.agent_id),
    primary_phase: stringValue(raw.primary_phase),
    phases: normalizeArray(raw.phases),
    start_time: stringValue(raw.start_time),
    end_time: stringValue(raw.end_time),
    evidence_count: numberValue(raw.evidence_count),
    items,
  }
}

function buildAttackCaseTimelineGroup(raw: BackendAttackCaseTimelineGroup): AttackCaseTimelineGroup {
  return {
    group: buildAttackGroupTimelineSummary(raw.group),
    instances: Array.isArray(raw.instances)
      ? raw.instances.map(buildAttackGroupTimelineInstance).filter((item) => item.instance_id || item.items.length > 0)
      : [],
  }
}

function normalizePhase(phase: string) {
  const stage = resolveAttckStage(phase)
  if (stage) return stage.key
  return phase
    .trim()
    .toLowerCase()
    .replace(/^phase[.:_-]\s*/, "")
    .replace(/^phase\./, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
}

function phaseDefinition(phase: string) {
  const stage = resolveAttckStage(phase) ?? getAttckStageDefinition(phase)
  if (stage) {
    return {
      stageKey: stage.key,
      label: stage.key,
      description: "",
      icon: stage.icon,
    }
  }
  return {
    stageKey: undefined,
    label: phase || "unknown",
    description: "",
    icon: "Eye",
  }
}

function extractTechniqueId(meta?: BackendAttackRuleMeta) {
  for (const candidate of normalizeArray(meta?.tags)) {
    const match = candidate.match(/(?:attack[.:/_-])?(t\d{4}(?:\.\d{3})?)/i)
    if (match?.[1]) return match[1].toUpperCase()
  }
  return stringValue(meta?.rule_id).slice(0, 8).toUpperCase() || "UNKNOWN"
}

function normalizeSeverityByCounts(rule: BackendAttackRuleStatsItem): Severity {
  const hosts = numberValue(rule.total_hosts)
  const sources = numberValue(rule.total_sources)
  if (hosts >= 5 || sources >= 20) return "高"
  if (hosts >= 2 || sources >= 5) return "中"
  return "低"
}

function hostLabel(host: BackendAttackRuleHostStatsItem) {
  return stringValue(host.hostname) || stringValue(host.agent_id)
}

function hostRef(host: BackendAttackRuleHostStatsItem) {
  const agentId = stringValue(host.agent_id)
  const hostname = stringValue(host.hostname)
  if (!agentId && !hostname) return null
  return {
    agentId,
    hostname: hostname || agentId,
  }
}

function buildIndicators(rule: BackendAttackRuleStatsItem): AttckDetail["indicators"] {
  const meta = rule.meta
  const indicators = [
    meta?.description ? { type: "description" as const, value: meta.description } : null,
    { type: "groups" as const, value: numberValue(rule.total_groups) },
    { type: "instances" as const, value: numberValue(rule.total_instances) },
    { type: "sources" as const, value: numberValue(rule.total_sources) },
  ].filter((indicator): indicator is Exclude<typeof indicator, null> => Boolean(indicator))
  return indicators.length > 0 ? indicators : [{ type: "empty" }]
}

function buildOverview(raw?: BackendAttackStatsOverviewItem): AttackOverview {
  const bucket = raw?.bucket
  return {
    bucket: {
      bucket_type: normalizeBucketType(bucket?.bucket_type),
      bucket_start: stringValue(bucket?.bucket_start),
      bucket_end: stringValue(bucket?.bucket_end),
      trigger_source: stringValue(bucket?.trigger_source),
      last_request_id: stringValue(bucket?.last_request_id),
      snapshot_id: normalizeSnapshotId(bucket?.snapshot_id),
    },
    scope: "",
    total_rules: numberValue(raw?.total_rules),
    total_groups: numberValue(raw?.total_groups),
    total_instances: numberValue(raw?.total_instances),
    total_sources: numberValue(raw?.total_sources),
    total_hosts: numberValue(raw?.total_hosts),
    total_cases: numberValue(raw?.total_cases),
    critical_count: numberValue(raw?.critical_count),
    high_count: numberValue(raw?.high_count),
    medium_count: numberValue(raw?.medium_count),
    low_count: numberValue(raw?.low_count),
  }
}

function normalizePagination(
  pagination: BackendPaginationInfo | undefined,
  page: number,
  pageSize: number,
  itemCount: number,
): AttackSnapshotPagination {
  const totalCount = numberValue(pagination?.total_count ?? itemCount)
  const totalPages = numberValue(pagination?.total_pages ?? Math.ceil(totalCount / Math.max(pageSize, 1)))
  const currentPage = numberValue(pagination?.current_page ?? page) || page
  const normalizedPageSize = numberValue(pagination?.page_size ?? pageSize) || pageSize

  return {
    current_page: currentPage,
    page_size: normalizedPageSize,
    total_count: totalCount,
    total_pages: totalPages,
    has_previous: Boolean(pagination?.has_previous ?? currentPage > 1),
    has_next: Boolean(pagination?.has_next ?? currentPage < totalPages),
  }
}

function buildEmptyAttckData(overview: AttackOverview): AttckData {
  return {
    starttime: overview.bucket.bucket_start,
    endtime: overview.bucket.bucket_end,
    range: overview.bucket.bucket_type,
    "affected-hosts": overview.total_hosts,
    "attck-counts": overview.total_rules,
    "stage-counts": 0,
    severity: [
      { severity: "高", "affected-hosts": overview.critical_count + overview.high_count },
      { severity: "中", "affected-hosts": overview.medium_count },
      { severity: "低", "affected-hosts": overview.low_count },
    ],
    top10: [],
    stages: [],
  }
}

function adaptDashboardData(overview: AttackOverview, rulesWithHosts: RuleWithHosts[]): AttckData {
  const base = buildEmptyAttckData(overview)
  const stageMap = new Map<string, AttckStage>()
  const top10: Top10Item[] = []

  for (const item of rulesWithHosts) {
    const meta = item.rule.meta || {}
    const phases = normalizeArray(meta.phases)
    const normalizedPhases = phases.length > 0 ? phases : ["unknown"]
    const stageDefinitions = normalizedPhases.map(phaseDefinition)
    const stageKeys = stageDefinitions.map((definition) => definition.stageKey).filter(Boolean) as string[]
    const stageValues = stageDefinitions.map((definition) => definition.stageKey || definition.label)
    const hosts = item.hosts.map(hostLabel).filter(Boolean)
    const hostItems = item.hosts.map(hostRef).filter((host): host is NonNullable<ReturnType<typeof hostRef>> => Boolean(host))
    const severity = normalizeSeverityByCounts(item.rule)

    const techniqueId = extractTechniqueId(meta)
    const detail: AttckDetail = {
      attck: techniqueId,
      ruleid: stringValue(meta.rule_id),
      name: stringValue(meta.title) || techniqueId,
      stage: stageValues,
      indicators: buildIndicators(item.rule),
      hosts,
      hostItems,
      severity,
      ruleMeta: meta,
    }

    for (let index = 0; index < normalizedPhases.length; index += 1) {
      const rawPhase = normalizedPhases[index]
      const definition = stageDefinitions[index]
      const normalizedPhase = definition.stageKey || normalizePhase(rawPhase)
      const existing = stageMap.get(normalizedPhase)
      if (existing) {
        existing.count += 1
        existing.details = [...(existing.details || []), detail]
      } else {
        stageMap.set(normalizedPhase, {
          stage: definition.label,
          stageKey: definition.stageKey,
          description: definition.description,
          icon: definition.icon,
          count: 1,
          details: [detail],
        })
      }
    }

    top10.push({
      attck: techniqueId,
      name: stringValue(meta.title) || techniqueId,
      ruleid: stringValue(meta.rule_id),
      hosts,
      hostItems,
      "affected-hosts": numberValue(item.rule.total_hosts) || hosts.length,
      stage: stageValues[0] || "",
      stages: stageValues,
      stageKeys,
      ruleMeta: meta,
    })
  }

  top10.sort((a, b) => b["affected-hosts"] - a["affected-hosts"])

  return {
    ...base,
    "stage-counts": ATTCK_STAGE_DEFINITIONS.length,
    top10: top10.slice(0, DEFAULT_TOP_LIMIT),
    stages: ATTCK_STAGE_DEFINITIONS.map((definition) => {
      const existing = stageMap.get(definition.key)
      return (
        existing || {
          stage: definition.key,
          stageKey: definition.key,
          description: "",
          icon: definition.icon,
          count: 0,
          details: [],
        }
      )
    }),
  }
}

export async function fetchAttackOverview(bucketType: BucketType = DEFAULT_BUCKET_TYPE): Promise<AttackOverview> {
  const result = (await http.post("/sensor/analysis/stats/attack-overview", {
    request_id: createRequestId(),
    bucket_type: bucketType,
  })) as ApiResult<BackendAttackStatsOverviewData | null>

  return buildOverview(result.data?.overview)
}

export async function fetchAttackDashboardData({
  bucketType = DEFAULT_BUCKET_TYPE,
  overview: selectedOverview,
  topLimit = DEFAULT_TOP_LIMIT,
}: FetchAttackDashboardOptions = {}): Promise<{ overview: AttackOverview; data: AttckData }> {
  const overview = selectedOverview || await fetchAttackOverview(bucketType)
  const snapshotId = overview.bucket.snapshot_id

  if (!snapshotId) {
    return {
      overview,
      data: buildEmptyAttckData(overview),
    }
  }

  const topRulesResult = (await http.post("/sensor/analysis/stats/top-attack-rules", {
    request_id: createRequestId(),
    snapshot_id: snapshotId,
    limit: topLimit,
  })) as ApiResult<BackendTopAttackRulesData | null>

  const rules = Array.isArray(topRulesResult.data?.items) ? topRulesResult.data.items : []
  const detailResults = await Promise.all(
    rules.map(async (rule) => {
      const ruleId = stringValue(rule.meta?.rule_id)
      if (!ruleId) return { rule, hosts: [] }

      const detailResult = (await http.post("/sensor/analysis/stats/attack-rule-detail", {
        request_id: createRequestId(),
        snapshot_id: snapshotId,
        rule_id: ruleId,
        page: 1,
        page_size: 100,
      })) as ApiResult<BackendAttackRuleDetailData | null>

      return {
        rule: detailResult.data?.rule || rule,
        hosts: Array.isArray(detailResult.data?.items) ? detailResult.data.items : [],
      }
    }),
  )

  return {
    overview,
    data: adaptDashboardData(overview, detailResults),
  }
}

export async function fetchAttackSnapshots({
  bucketType,
  page = 1,
  pageSize = 50,
}: {
  bucketType?: BucketType
  page?: number
  pageSize?: number
} = {}): Promise<AttackSnapshotsResult> {
  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    page,
    page_size: pageSize,
  }

  if (bucketType) {
    payload.bucket_type = bucketType
  }

  const result = (await http.post("/sensor/analysis/stats/attack-snapshots", payload)) as ApiResult<BackendAttackStatsSnapshotsData | null>

  const items = Array.isArray(result.data?.items) ? result.data.items.map(buildOverview) : []

  return {
    items,
    pagination: normalizePagination(result.data?.pagination, page, pageSize, items.length),
  }
}

export async function fetchAttackSnapshotById(snapshotId: string): Promise<AttackOverview | null> {
  const normalizedSnapshotId = normalizeSnapshotId(snapshotId)
  if (!normalizedSnapshotId) return null

  let page = 1
  const pageSize = 100

  while (page <= 20) {
    const result = await fetchAttackSnapshots({ bucketType: "fixed", page, pageSize })
    const matched = result.items.find((item) => item.bucket.snapshot_id === normalizedSnapshotId)
    if (matched) return matched
    if (!result.pagination.has_next) break
    page += 1
  }

  return null
}

export async function fetchAttackStageHostDistribution(snapshotId: string): Promise<AttackStageHostDistributionItem[]> {
  const normalizedSnapshotId = normalizeSnapshotId(snapshotId)
  if (!normalizedSnapshotId) return []

  const result = (await http.post("/sensor/analysis/stats/attack-stage-host-distribution", {
    request_id: createRequestId(),
    snapshot_id: normalizedSnapshotId,
  })) as ApiResult<BackendAttackStageHostDistributionData | null>

  const items = Array.isArray(result.data?.items) ? result.data.items : []
  return items
    .map((item) => ({
      stage: stringValue(item.stage),
      stage_key: stringValue(item.stage_key) || stringValue(item.stageKey),
      host_count: numberValue(item.host_count ?? item.hostCount),
    }))
    .filter((item) => item.stage || item.stage_key)
}

export async function fetchAttackStageInstanceDistribution(snapshotId: string): Promise<AttackStageInstanceDistributionItem[]> {
  const normalizedSnapshotId = normalizeSnapshotId(snapshotId)
  if (!normalizedSnapshotId) return []

  const result = (await http.post("/sensor/analysis/stats/attack-stage-instance-distribution", {
    request_id: createRequestId(),
    snapshot_id: normalizedSnapshotId,
  })) as ApiResult<BackendAttackStageInstanceDistributionData | null>

  const items = Array.isArray(result.data?.items) ? result.data.items : []
  return items
    .map((item) => ({
      stage: stringValue(item.stage),
      stage_key: stringValue(item.stage_key) || stringValue(item.stageKey),
      instance_count: numberValue(item.instance_count ?? item.instanceCount),
    }))
    .filter((item) => item.stage || item.stage_key)
}

export function buildAttackStageCardsFromInstanceDistribution(
  items: AttackStageInstanceDistributionItem[],
): AttckStage[] {
  const countByStageKey = new Map<string, number>()

  for (const item of items) {
    const fallbackStage = stringValue(item.stage)
    const definition = getAttckStageDefinition(item.stage_key) ?? resolveAttckStage(item.stage_key) ?? resolveAttckStage(fallbackStage)
    if (!definition) continue
    countByStageKey.set(
      definition.key,
      (countByStageKey.get(definition.key) ?? 0) + numberValue(item.instance_count),
    )
  }

  return ATTCK_STAGE_DEFINITIONS.map((definition) => ({
    stage: definition.key,
    stageKey: definition.key,
    description: "",
    icon: definition.icon,
    count: countByStageKey.get(definition.key) ?? 0,
    details: [],
  }))
}

export async function fetchTopAttackHosts(snapshotId: string, limit = DEFAULT_TOP_LIMIT): Promise<AttackTopHostItem[]> {
  const normalizedSnapshotId = normalizeSnapshotId(snapshotId)
  if (!normalizedSnapshotId) return []

  const result = (await http.post("/sensor/analysis/stats/top-attack-hosts", {
    request_id: createRequestId(),
    snapshot_id: normalizedSnapshotId,
    limit,
  })) as ApiResult<BackendTopAttackHostsData | null>

  const items = Array.isArray(result.data?.items) ? result.data.items : []
  return items.map((item) => ({
    agent_id: stringValue(item.agent_id),
    hostname: stringValue(item.hostname),
    total_rules: numberValue(item.total_rules),
    total_groups: numberValue(item.total_groups),
    total_instances: numberValue(item.total_instances),
    total_sources: numberValue(item.total_sources),
    risk_score: numberValue(item.risk_score),
    total_cases: numberValue(item.total_cases),
  }))
}

export async function fetchAttackRuleDetail({
  snapshotId,
  ruleId,
}: {
  snapshotId: string
  ruleId: string
}): Promise<AttackRuleMeta | null> {
  const normalizedSnapshotId = normalizeSnapshotId(snapshotId)
  const normalizedRuleId = stringValue(ruleId)
  if (!normalizedSnapshotId || !normalizedRuleId) return null

  const result = (await http.post("/sensor/analysis/stats/attack-rule-detail", {
    request_id: createRequestId(),
    snapshot_id: normalizedSnapshotId,
    rule_id: normalizedRuleId,
    page: 1,
    page_size: 1,
  })) as ApiResult<BackendAttackRuleDetailData | null>

  return result.data?.rule?.meta || null
}

export async function fetchAttackTimelineCases({
  startTime,
  endTime,
  timezone = "Asia/Shanghai",
  pageSize = 20,
  pageToken = "",
}: {
  startTime?: string
  endTime?: string
  timezone?: string
  pageSize?: number
  pageToken?: string
} = {}): Promise<AttackTimelineCasesResult> {
  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    timezone,
    page_size: pageSize,
  }

  if (pageToken) {
    payload.page_token = pageToken
  }
  if (startTime && endTime) {
    payload.start_time = normalizeTaskTime(startTime)
    payload.end_time = normalizeTaskTime(endTime)
  }

  const result = (await http.post("/sensor/analysis/list/cases", payload)) as ApiResult<BackendAttackTimelineCasesData | null>
  const items = Array.isArray(result.data?.items) ? result.data.items : []
  const page = result.data?.page

  return {
    items: items.map(buildAttackCaseTimelineSummary).filter((item) => item.case_id),
    page: {
      next_page_token: stringValue(page?.next_page_token),
      has_more: Boolean(page?.has_more),
    },
  }
}

export async function fetchAttackCaseTimeline({
  caseId,
  timezone = "Asia/Shanghai",
}: {
  caseId: string
  timezone?: string
}): Promise<AttackCaseTimelineResult | null> {
  const normalizedCaseId = stringValue(caseId)
  if (!normalizedCaseId) return null

  const result = (await http.post("/sensor/analysis/timeline/case", {
    request_id: createRequestId(),
    case_id: normalizedCaseId,
    timezone,
  })) as ApiResult<BackendAttackCaseTimelineData | null>

  if (!result.data?.case) return null

  return {
    case: buildAttackCaseTimelineSummary(result.data.case),
    groups: Array.isArray(result.data.groups)
      ? result.data.groups.map(buildAttackCaseTimelineGroup)
      : [],
  }
}

export async function batchDescribeEventSourcesByKeys({
  keys,
  tenantId,
  language = "en-US",
  includeEventSource = false,
  includeAllFields = false,
}: {
  keys: EventSourceDescriptionKey[]
  tenantId?: string
  language?: string
  includeEventSource?: boolean
  includeAllFields?: boolean
}): Promise<BatchDescribeEventSourcesResult> {
  const normalizedKeys = keys
    .map((key) => ({
      event_type: numberValue(key.event_type),
      event_name: stringValue(key.event_name),
      source_unique_id: stringValue(key.source_unique_id),
    }))
    .filter((key) => key.event_type > 0 && key.source_unique_id)

  if (normalizedKeys.length === 0) {
    return { items: [] }
  }

  const items: BatchDescribeEventSourceItem[] = []
  const chunkSize = 1000

  for (let index = 0; index < normalizedKeys.length; index += chunkSize) {
    const chunk = normalizedKeys.slice(index, index + chunkSize)
    const payload: Record<string, unknown> = {
      request_id: createRequestId(),
      keys: chunk,
      language,
      include_event_source: includeEventSource,
      include_all_fields: includeAllFields,
    }

    const normalizedTenantId = stringValue(tenantId)
    if (normalizedTenantId) {
      payload.tenant_id = normalizedTenantId
    }

    const result = (await http.post(
      "/sensor/analysis/event-source/describe",
      payload,
    )) as ApiResult<BackendBatchDescribeEventSourcesData | null>

    if (Array.isArray(result.data?.items)) {
      items.push(...result.data.items.map(buildBatchDescribeEventSourceItem))
    }
  }

  return { items }
}

export async function updateAttackCaseFriendlyName({
  caseId,
  title,
  summary,
}: {
  caseId: string
  title?: string
  summary?: string
}): Promise<AttackCaseTimelineSummary | null> {
  const normalizedCaseId = stringValue(caseId)
  if (!normalizedCaseId) return null

  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    case_id: normalizedCaseId,
  }

  if (title !== undefined) {
    payload.title = title
  }
  if (summary !== undefined) {
    payload.summary = summary
  }

  const result = (await http.post(
    "/sensor/analysis/timeline/case/friendly-name",
    payload,
  )) as ApiResult<BackendUpdateAttackCaseFriendlyNameData | null>

  return result.data?.case ? buildAttackCaseTimelineSummary(result.data.case) : null
}

export async function fetchAttackStatsTrend({
  bucketType,
  startTime,
  endTime,
  timezone = "Asia/Shanghai",
}: AttackStatsTrendParams): Promise<AttackTrendPoint[]> {
  const result = (await http.post("/sensor/analysis/stats/attack-trend", {
    request_id: createRequestId(),
    bucket_type: bucketType,
    start_time: normalizeTaskTime(startTime),
    end_time: normalizeTaskTime(endTime),
    timezone,
  })) as ApiResult<BackendAttackStatsTrendData | null>

  const items = Array.isArray(result.data?.items) ? result.data.items : []
  return items.map(buildOverview)
}

export async function fetchAttackEventTimelineDistribution({
  granularity = "day",
  startTime,
  endTime,
  timezone = "Asia/Shanghai",
}: {
  granularity?: Granularity
  startTime?: string
  endTime?: string
  timezone?: string
} = {}): Promise<GetAttackEventTimelineDistributionData> {
  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    granularity,
    timezone,
  }

  if (startTime) payload.start_time = normalizeTaskTime(startTime)
  if (endTime) payload.end_time = normalizeTaskTime(endTime)

  const result = (await http.post(
    "/sensor/analysis/stats/attack-event-timeline",
    payload,
  )) as ApiResult<BackendAttackEventTimelineData | null>

  const data = result.data
  const items = Array.isArray(data?.items) ? data.items : []

  return {
    start_time: stringValue(data?.start_time),
    end_time: stringValue(data?.end_time),
    timezone: stringValue(data?.timezone) || timezone,
    granularity: normalizeGranularity(data?.granularity || granularity),
    coverage_status: normalizeCoverageStatus(data?.coverage_status),
    total_sources: numberValue(data?.total_sources),
    total_instances: numberValue(data?.total_instances),
    total_groups: numberValue(data?.total_groups),
    total_rules: numberValue(data?.total_rules),
    total_hosts: numberValue(data?.total_hosts),
    total_cases: numberValue(data?.total_cases),
    items: items.map((item) => ({
      bucket_start: stringValue(item.bucket_start),
      bucket_end: stringValue(item.bucket_end),
      total_sources: numberValue(item.total_sources),
      total_instances: numberValue(item.total_instances),
      total_groups: numberValue(item.total_groups),
      total_rules: numberValue(item.total_rules),
      total_hosts: numberValue(item.total_hosts),
      total_cases: numberValue(item.total_cases),
    })),
  }
}

export async function resolveAttackStatsRangeSnapshot({
  startTime,
  endTime,
  timezone = "Asia/Shanghai",
  autoTriggerDetection = false,
}: {
  startTime: string
  endTime: string
  timezone?: string
  autoTriggerDetection?: boolean
}): Promise<ResolveAttackStatsRangeSnapshotResult> {
  const result = (await http.post("/sensor/analysis/stats/attack-range-snapshot", {
    request_id: createRequestId(),
    start_time: normalizeTaskTime(startTime),
    end_time: normalizeTaskTime(endTime),
    timezone,
    auto_trigger_detection: autoTriggerDetection,
  })) as ApiResult<BackendResolveAttackStatsRangeSnapshotData | null>

  return {
    snapshot_id: normalizeSnapshotId(result.data?.snapshot_id),
    task_id: stringValue(result.data?.task_id),
    status: stringValue(result.data?.status),
    source: stringValue(result.data?.source),
    coverage_status: stringValue(result.data?.coverage_status),
  }
}

export async function triggerCheck(payload: TriggerCheckPayload): Promise<TriggerCheckResult> {
  const result = (await http.post("/sensor/analysis/task/trigger", {
    request_id: createRequestId(),
    start_time: normalizeTaskTime(payload.start_time),
    end_time: normalizeTaskTime(payload.end_time),
    bucket_type: payload.bucket_type,
    timezone: payload.timezone || "Asia/Shanghai",
  })) as ApiResult<BackendTriggerStatTaskData | null>

  return {
    task_id: stringValue(result.data?.task_id),
    status: stringValue(result.data?.status),
  }
}

export async function fetchAttackTriggerDefaultRange(
  timezone = "Asia/Shanghai",
): Promise<AttackTriggerDefaultRange> {
  const result = (await http.post("/sensor/analysis/stats/attack-trigger-default-range", {
    request_id: createRequestId(),
    timezone,
  })) as ApiResult<BackendAttackTriggerDefaultRangeData | null>

  const data = result.data
  return {
    start_time: toDateTimeLocalValue(stringValue(data?.start_time)),
    end_time: toDateTimeLocalValue(stringValue(data?.end_time)),
    timezone: stringValue(data?.timezone) || timezone,
    reserve_seconds: numberValue(data?.reserve_seconds),
    last_success_time: toDateTimeLocalValue(stringValue(data?.last_success_time)),
  }
}

export async function getTaskStatus(taskId: string): Promise<AttackTaskStatus> {
  const result = (await http.post("/sensor/analysis/task/status", {
    request_id: createRequestId(),
    task_id: taskId,
  })) as ApiResult<BackendTaskStatusData | null>

  return {
    task_id: stringValue(result.data?.task_id),
    status: stringValue(result.data?.status),
    error_message: stringValue(result.data?.error_message),
    snapshot_id: normalizeSnapshotId(result.data?.snapshot_id),
  }
}
