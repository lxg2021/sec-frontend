export type Severity = "critical" | "high" | "medium" | "low" | "info"

export type IocType =
  | "ip"
  | "url"
  | "hash"
  | "md5"
  | "sha1"
  | "sha256"
  | "file"
  | "process"
  | "domain"
  | "registry"

export interface AttackStoryStep {
  step: number
  title: string
  detail: string
  severity: Severity
  confidence: number
  evidence_refs: string[]
  rule_refs: string[]
}

export interface KeyFinding {
  title: string
  severity: Severity
  reason: string
  confidence: number
  evidence_refs: string[]
  rule_refs: string[]
}

export interface Ioc {
  type: IocType
  value: string
  source: string
  evidence_refs: string[]
}

export interface AffectedAsset {
  asset_type: string
  agent_id: string
  impact: string
  evidence_refs: string[]
}

export interface RecommendedAction {
  priority: number
  title: string
  detail: string
  evidence_refs: string[]
}

export interface Hypothesis {
  title: string
  detail: string
  confidence: number
  evidence_refs: string[]
}

export interface AttackAIReport {
  schema_version?: string
  context_version?: string
  case_id?: string
  context_hash?: string
  risk_level?: Severity
  confidence?: number
  executive_summary?: string
  attack_story: AttackStoryStep[]
  key_findings: KeyFinding[]
  iocs: Ioc[]
  affected_assets: AffectedAsset[]
  recommended_actions: RecommendedAction[]
  hypotheses: Hypothesis[]
  limitations: string[]
}

export interface ReportValidationIssue {
  code?: string
  field?: string
  message?: string
  value?: string
}

export interface ReportValidation {
  schema_version?: string
  status?: string
  valid?: boolean
  errors?: ReportValidationIssue[]
  warnings?: ReportValidationIssue[]
  checked_refs?: {
    evidence_refs?: number
    rule_refs?: number
    agent_ids?: number
    observables?: number
  }
  context_hash?: string
}

export interface AttackAIReportTask {
  task_id: string
  case_id: string
  tenant_id: string
  status: string
  context_hash: string
  report_json: string
  validation_json: string
  provider_name?: string
  model_name?: string
  latency_ms?: number
  error_message?: string
  created_at?: string
  updated_at?: string
  started_at?: string
  finished_at?: string
  canonical_locale?: string
  localized_locale?: string
  localized_status?: string
  localized_report_json?: string
  localized_validation_json?: string
  localized_error_message?: string
  localized_provider_name?: string
  localized_model_name?: string
  localized_latency_ms?: number
  report?: AttackAIReport | null
  validation?: ReportValidation | null
  localized_report?: AttackAIReport | null
  localized_validation?: ReportValidation | null
}
