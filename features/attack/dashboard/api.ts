"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type {
  AttackOverview,
  AttackTaskStatus,
  BucketType,
  TriggerCheckPayload,
  TriggerCheckResult,
} from "@/features/attack/dashboard/types"
import type { AttckData, AttckDetail, AttckStage, Severity, Top10Item } from "@/features/attack/utils/attck-utils"

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

interface BackendAttackRuleMeta {
  rule_id?: string
  title?: string
  description?: string
  status?: string
  author?: string
  rule_date?: string
  modified?: string
  references?: string[]
  tags?: string[]
  phases?: string[]
  rule_file?: string
  is_invalid?: boolean
}

interface BackendAttackStatsOverviewItem {
  bucket?: BackendAttackStatsBucket
  total_rules?: number | string
  total_groups?: number | string
  total_instances?: number | string
  total_sources?: number | string
  total_hosts?: number | string
  total_cases?: number | string
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

const PHASE_DEFINITIONS: Record<string, { label: string; description: string; icon: string }> = {
  reconnaissance: {
    label: "侦察 (Reconnaissance)",
    description: "攻击者收集目标组织、资产、身份或网络信息，为后续攻击活动做准备。",
    icon: "Binoculars",
  },
  "resource development": {
    label: "资源开发 (Resource Development)",
    description: "攻击者创建、购买或控制基础设施、账号和能力，用于支撑后续攻击。",
    icon: "Wrench",
  },
  "initial access": {
    label: "初始访问 (Initial Access)",
    description: "攻击者尝试进入目标环境，建立进入系统或网络的入口。",
    icon: "DoorOpen",
  },
  execution: {
    label: "执行 (Execution)",
    description: "攻击者在本地或远程系统上运行恶意代码或命令。",
    icon: "Terminal",
  },
  persistence: {
    label: "持久化 (Persistence)",
    description: "攻击者维持对系统的访问能力，避免重启或凭据变化后失去控制。",
    icon: "Anchor",
  },
  "privilege escalation": {
    label: "权限提升 (Privilege Escalation)",
    description: "攻击者通过漏洞、配置缺陷或凭据滥用获取更高权限。",
    icon: "ArrowUp",
  },
  "defense evasion": {
    label: "防御规避 (Defense Evasion)",
    description: "攻击者隐藏行为、绕过检测或削弱安全防护能力。",
    icon: "ShieldOff",
  },
  "credential access": {
    label: "凭据访问 (Credential Access)",
    description: "攻击者尝试窃取账号、密码、令牌或其他身份凭据。",
    icon: "Key",
  },
  discovery: {
    label: "发现 (Discovery)",
    description: "攻击者枚举系统、网络、账号和安全配置，了解目标环境。",
    icon: "Search",
  },
  "lateral movement": {
    label: "横向移动 (Lateral Movement)",
    description: "攻击者在环境内部移动，访问更多系统或关键资产。",
    icon: "ArrowRightLeft",
  },
  collection: {
    label: "收集 (Collection)",
    description: "攻击者收集目标环境中的文件、凭据、屏幕或业务数据。",
    icon: "Download",
  },
  "command and control": {
    label: "命令与控制 (Command and Control)",
    description: "攻击者建立远程控制通道，与受控系统通信。",
    icon: "Cast",
  },
  exfiltration: {
    label: "数据外传 (Exfiltration)",
    description: "攻击者通过网络、介质或控制通道将数据带出目标环境。",
    icon: "Upload",
  },
  impact: {
    label: "影响 (Impact)",
    description: "攻击者破坏数据、业务流程或系统可用性，造成直接影响。",
    icon: "Zap",
  },
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
  return phase
    .trim()
    .toLowerCase()
    .replace(/^phase[.:_-]\s*/, "")
    .replace(/^phase\./, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
}

function phaseDefinition(phase: string) {
  const normalized = normalizePhase(phase)
  return (
    PHASE_DEFINITIONS[normalized] || {
      label: phase || "未知阶段",
      description: "该阶段来自分析规则元数据，当前没有配置详细说明。",
      icon: "Eye",
    }
  )
}

function extractTechniqueId(meta?: BackendAttackRuleMeta) {
  const candidates = [...normalizeArray(meta?.tags), ...normalizeArray(meta?.references), stringValue(meta?.title)]
  for (const candidate of candidates) {
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

function buildIndicators(rule: BackendAttackRuleStatsItem) {
  const meta = rule.meta
  const indicators = [
    meta?.description ? `规则描述：${meta.description}` : "",
    `命中分组：${numberValue(rule.total_groups)}`,
    `命中实例：${numberValue(rule.total_instances)}`,
    `证据数：${numberValue(rule.total_sources)}`,
  ].filter(Boolean)
  return indicators.length > 0 ? indicators : ["暂无指标摘要"]
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
    scope: "全部主机",
    total_rules: numberValue(raw?.total_rules),
    total_groups: numberValue(raw?.total_groups),
    total_instances: numberValue(raw?.total_instances),
    total_sources: numberValue(raw?.total_sources),
    total_hosts: numberValue(raw?.total_hosts),
    total_cases: numberValue(raw?.total_cases),
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
      { severity: "高", "affected-hosts": 0 },
      { severity: "中", "affected-hosts": 0 },
      { severity: "低", "affected-hosts": 0 },
    ],
    top10: [],
    stages: [],
  }
}

function adaptDashboardData(overview: AttackOverview, rulesWithHosts: RuleWithHosts[]): AttckData {
  const base = buildEmptyAttckData(overview)
  const stageMap = new Map<string, AttckStage>()
  const severityCounts: Record<Severity, number> = { 高: 0, 中: 0, 低: 0 }
  const top10: Top10Item[] = []

  for (const item of rulesWithHosts) {
    const meta = item.rule.meta || {}
    const phases = normalizeArray(meta.phases)
    const normalizedPhases = phases.length > 0 ? phases : ["unknown"]
    const hosts = item.hosts.map(hostLabel).filter(Boolean)
    const severity = normalizeSeverityByCounts(item.rule)
    severityCounts[severity] += 1

    const techniqueId = extractTechniqueId(meta)
    const detail: AttckDetail = {
      attck: techniqueId,
      ruleid: stringValue(meta.rule_id),
      name: stringValue(meta.title) || techniqueId,
      stage: normalizedPhases.map(normalizePhase),
      indicators: buildIndicators(item.rule),
      hosts,
      severity,
    }

    for (const rawPhase of normalizedPhases) {
      const normalizedPhase = normalizePhase(rawPhase)
      const definition = phaseDefinition(rawPhase)
      const existing = stageMap.get(normalizedPhase)
      if (existing) {
        existing.count += 1
        existing.details = [...(existing.details || []), detail]
      } else {
        stageMap.set(normalizedPhase, {
          stage: definition.label,
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
      "affected-hosts": numberValue(item.rule.total_hosts) || hosts.length,
      stage: normalizePhase(normalizedPhases[0] || ""),
    })
  }

  top10.sort((a, b) => b["affected-hosts"] - a["affected-hosts"])

  return {
    ...base,
    "stage-counts": stageMap.size,
    severity: [
      { severity: "高", "affected-hosts": severityCounts["高"] },
      { severity: "中", "affected-hosts": severityCounts["中"] },
      { severity: "低", "affected-hosts": severityCounts["低"] },
    ],
    top10: top10.slice(0, DEFAULT_TOP_LIMIT),
    stages: Array.from(stageMap.values()),
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
