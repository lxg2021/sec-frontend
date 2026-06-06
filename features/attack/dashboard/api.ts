"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import { ATTCK_STAGE_DEFINITIONS, getAttckStageDefinition, resolveAttckStage } from "@/features/attack/constants/attck-stages"
import type {
  AttackStageHostDistributionItem,
  AttackOverview,
  AttackTaskStatus,
  BucketType,
  TriggerCheckPayload,
  TriggerCheckResult,
} from "@/features/attack/dashboard/types"
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

interface BackendTaskStatusData {
  task_id?: string
  status?: string
  error_message?: string
  snapshot_id?: string
}

interface RuleWithHosts {
  rule: BackendAttackRuleStatsItem
  hosts: BackendAttackRuleHostStatsItem[]
}

export interface FetchAttackDashboardOptions {
  bucketType?: BucketType
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

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeArray(items: unknown): string[] {
  return Array.isArray(items) ? items.map((item) => stringValue(item)).filter(Boolean) : []
}

function normalizeBucketType(value: unknown): BucketType {
  const normalized = stringValue(value).toLowerCase()
  if (normalized === "hour" || normalized === "day") return normalized
  return "fixed"
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
      snapshot_id: stringValue(bucket?.snapshot_id),
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
  topLimit = DEFAULT_TOP_LIMIT,
}: FetchAttackDashboardOptions = {}): Promise<{ overview: AttackOverview; data: AttckData }> {
  const overview = await fetchAttackOverview(bucketType)
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

export async function fetchAttackStageHostDistribution(snapshotId: string): Promise<AttackStageHostDistributionItem[]> {
  const normalizedSnapshotId = stringValue(snapshotId)
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

export async function getTaskStatus(taskId: string): Promise<AttackTaskStatus> {
  const result = (await http.post("/sensor/analysis/task/status", {
    request_id: createRequestId(),
    task_id: taskId,
  })) as ApiResult<BackendTaskStatusData | null>

  return {
    task_id: stringValue(result.data?.task_id),
    status: stringValue(result.data?.status),
    error_message: stringValue(result.data?.error_message),
    snapshot_id: stringValue(result.data?.snapshot_id),
  }
}
