export type InvestigationCollectionTarget = {
  id?: string
  type?: string
  path?: string
  recursive?: boolean
  purpose?: string
}

export type InvestigationGap = {
  artifact?: string
  message?: string
}

export type InvestigationQuestion = {
  id?: string
  category?: string
  title?: string
  objective?: string
  collection_targets?: InvestigationCollectionTarget[]
  gap_when_missing?: InvestigationGap
}

export type InvestigationTemplate = {
  schema_version?: string
  source_template?: string
  language?: string
  translated_at?: string
  review_status?: string
  source_rule?: {
    file?: string
    id?: string
    title?: string
    description?: string
  }
  match_context?: {
    target_hint?: string
  }
  attack_core?: {
    type?: string
    core_question?: string
    why_this_core?: string[]
    key_evidence?: string[]
    accuracy_drivers?: string[]
    do_not_conclude_without?: string[]
  }
  inferred?: {
    confidence?: string
    confidence_reason?: string
  }
  question_plan?: InvestigationQuestion[]
}

export type InvestigationLanguage = "en" | "zh-CN"

export type InvestigationReviewIssue = {
  severity: "warning" | "error"
  message: string
}

export type InvestigationRuleReview = {
  key: string
  baseName: string
  files: {
    en?: string
    zhCN?: string
  }
  templates: Partial<Record<InvestigationLanguage, InvestigationTemplate>>
  stats: {
    questionCount: number
    collectionTargetCount: number
    duplicateTargetCount: number
    badEventLogPathCount: number
  }
  issues: InvestigationReviewIssue[]
}

export type InvestigationBatchReview = {
  batchName: string
  batchPath: string
  availableBatches: string[]
  rules: InvestigationRuleReview[]
}
