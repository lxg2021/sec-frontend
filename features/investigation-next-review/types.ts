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

export type InvestigationTopicSourceRule = {
  rule_id?: string
  rule_file?: string
  title?: string
}

export type InvestigationTopicSourceQuestion = {
  question_id?: string
  title?: string
  category?: string
  priority?: number
  rule_id?: string
  rule_file?: string
  query_ids?: string[]
  collection_target_ids?: string[]
  support?: string
}

export type InvestigationQuestionTopic = {
  topic_id?: string
  stage?: string
  source_rule_ids?: string[]
  source_rule_files?: string[]
  source_rules?: InvestigationTopicSourceRule[]
  source_question_ids?: string[]
  source_questions?: InvestigationTopicSourceQuestion[]
  query_ids?: string[]
  collection_target_ids?: string[]
  merged_question_count?: number
}

export type InvestigationQuestion = {
  id?: string
  category?: string
  title?: string
  objective?: string
  support?: string
  query_ids?: string[]
  collection_targets?: InvestigationCollectionTarget[]
  gap_when_missing?: InvestigationGap
  topic?: InvestigationQuestionTopic
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

export type InvestigationCaseTriggeredRule = {
  ruleKey: string
  ruleId?: string
  title?: string
  severity?: "critical" | "high" | "medium" | "low"
  triggerCount: number
  firstSeen: string
  lastSeen: string
  context: {
    tenantId?: string
    agentId?: string
    sourceTable?: string
    uniqueId?: string
    attackMark?: string
    processGuid?: string
    fileName?: string
    fileMd5?: string
    objectName?: string
    url?: string
    domain?: string
    destinationIp?: string
  }
}

export type InvestigationCasePlan = {
  caseId: string
  planId: string
  timeWindowStart: string
  timeWindowEnd: string
  timezone: string
  triggeredRules: InvestigationCaseTriggeredRule[]
}
