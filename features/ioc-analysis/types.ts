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

export type IocVerificationStatus =
  | "idle"
  | "checking"
  | "hit"
  | "miss"
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
}

export interface IocVerificationItem extends IocCandidate {
  status: IocVerificationStatus
  result: IocQueryResult | null
  error: string
}
