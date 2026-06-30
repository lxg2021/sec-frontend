export type InvestigationAssistantLanguage = "zh-CN" | "en"

export type InvestigationAssistantConfidence =
  | "high"
  | "medium"
  | "low"
  | "unknown"
  | string

export interface InvestigationConfirmedFact {
  text: string
  evidence_refs?: string[]
}

export interface InvestigationAttackObjective {
  name: string
  confidence: InvestigationAssistantConfidence
  reason: string
  evidence_refs?: string[]
}

export interface InvestigationMissingEvidence {
  text: string
  reason?: string
}

export interface InvestigationNextAction {
  action_id: string
  label: string
  reason: string
  target_node_ids?: string[]
  evidence_refs?: string[]
}

export interface AIInvestigationResult {
  schema_version?: string
  context_version?: string
  case_id?: string
  context_hash?: string
  current_assessment?: string
  confidence?: InvestigationAssistantConfidence
  confirmed_facts?: InvestigationConfirmedFact[]
  attack_objectives?: InvestigationAttackObjective[]
  missing_evidence?: InvestigationMissingEvidence[]
  next_actions?: InvestigationNextAction[]
  can_finalize?: boolean
  finalize_reason?: string
}

export interface AIInvestigationValidationIssue {
  code?: string
  field?: string
  message?: string
}

export interface AIInvestigationValidation {
  status?: string
  valid?: boolean
  errors?: AIInvestigationValidationIssue[]
  warnings?: AIInvestigationValidationIssue[]
  context_hash?: string
}

export interface AIInvestigationPreviewData {
  assistant_result_json?: string
  validation_json?: string
  context_hash?: string
  provider_name?: string
  model_name?: string
  latency_ms?: number
  assistant_result?: AIInvestigationResult | null
  validation?: AIInvestigationValidation | null
}
