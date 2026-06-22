export type IocVerificationType =
  | "auto"
  | "hash"
  | "md5"
  | "sha1"
  | "sha256"
  | "url"
  | "domain"
  | "hostname"
  | "ip"
  | "email"
  | "certificate"

export type IocVerificationStatus =
  | "idle"
  | "checking"
  | "hit"
  | "miss"
  | "allowlisted"
  | "suppressed"
  | "error"

export interface IocQueryEntry {
  id: string
  ioc_type: string
  normalized_value: string
  display_value: string
  status: string
  risk_score: number
  confidence: number
  tags: string[]
  extra_json: string
  first_seen: string
  last_seen: string
}

export interface IocQueryObservation {
  source_name: string
  source_record_id: string
  source_url: string
  confidence: number
  first_seen: string
  last_seen: string
  raw_json: string
}

export interface IocQueryRelation {
  relation_type: string
  direction: string
  source_name: string
  source_record_id: string
  first_seen: string
  last_seen: string
  raw_json: string
  peer_entry: IocQueryEntry | null
}

export interface IocQueryPagination {
  total: number
  returned: number
  offset: number
  limit: number
  has_more: boolean
  next_offset: number
  raw_json_trimmed: boolean
}

export interface IocQueryResult {
  request_id: string
  hit: boolean
  detected_type: IocVerificationType | string
  detected_type_code: number
  entry: IocQueryEntry | null
  observations: IocQueryObservation[]
  relations: IocQueryRelation[]
  hit_source: string
  hit_source_code: number
  truncation: {
    observations: IocQueryPagination | null
    relations: IocQueryPagination | null
  } | null
}

export interface IocCandidate {
  id: string
  type: IocVerificationType
  value: string
  source: string
  evidence_refs: string[]
  origin: "case" | "manual"
  candidate_id?: string
  tenant_id?: string
  case_id?: string
  query_type?: string
  normalized_value?: string
  source_ref_id?: string
  source_field?: string
  evidence_id?: string
  event_name?: string
  source_unique_id?: string
  occurred_at?: string
  agent_id?: string
  runtime_hit?: boolean
  runtime_ioc_entry_id?: string
  candidate_status?: string
  last_seen_at?: string
  verification?: AttackCaseIOCVerificationItem | null
}

export interface IocVerificationItem extends IocCandidate {
  status: IocVerificationStatus
  result: IocQueryResult | null
  error: string
}

export interface AttackCaseIOCExtractTask {
  task_id: number
  tenant_id: string
  case_id: string
  request_id: string
  trigger_source: string
  status: string
  attempt_count: number
  evidence_count: number
  candidate_count: number
  error_message: string
  created_at: string
  started_at: string
  finished_at: string
  updated_at: string
}

export interface AttackCaseIOCVerifyTask {
  task_id: number
  status: string
  scope: string
  remote: boolean
  total_count: number
  done_count: number
  failed_count: number
  error_message: string
  started_at: string
  finished_at: string
  updated_at: string
}

export interface AttackCaseIOCCandidateSummary {
  total: number
  active_count: number
  ignored_count: number
  stale_count: number
  deleted_count: number
  md5_count: number
  sha1_count: number
  sha256_count: number
  ip_count: number
  domain_count: number
  url_count: number
  certificate_count: number
  runtime_hit_count: number
}

export interface AttackCaseIOCAllowlistHit {
  action: string
  allow_level: string
  entry_key: string
  ioc_type: string
  match_type: string
  normalized_value: string
  reason: string
  source_name: string
  source_version: string
  tenant_id: string
  updated_at: string
}

export interface AttackCaseIOCVerificationItem {
  verification_id: string
  candidate_id: string
  tenant_id: string
  case_id: string
  local_decision: string
  whitelist_status: string
  local_status: string
  local_hit_source: string
  local_ioc_storage: string
  local_ioc_entry_id: string
  remote_status: string
  remote_provider: string
  remote_hit_source: string
  final_status: string
  final_verdict: string
  risk_score: number
  confidence: number
  checked_at: string
  error_message: string
  created_at: string
  updated_at: string
  raw_local_json: string
  raw_remote_json: string
  allowlist_hit: AttackCaseIOCAllowlistHit | null
}

export interface AttackCaseIOCCandidateListData {
  extract_task: AttackCaseIOCExtractTask | null
  extract_task_exists: boolean
  items: IocVerificationItem[]
  summary: AttackCaseIOCCandidateSummary
}

export interface AttackCaseIOCVerificationDetail {
  item: AttackCaseIOCVerificationItem | null
  raw_local_json: string
  raw_remote_json: string
  allowlist_hit: AttackCaseIOCAllowlistHit | null
}
