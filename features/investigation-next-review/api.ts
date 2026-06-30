"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type {
  InvestigationBatchReview,
  InvestigationCasePlan,
  InvestigationQuestion,
  InvestigationRuleReview,
  InvestigationTemplate,
} from "@/features/investigation-next-review/types"

type ApiResult<T> = {
  data?: T | null
}

export type InvestigationExecutionContextInput = {
  tenant_id?: string
  plan_id: string
  agent_id?: string
  alert_time?: string
  time_window_start?: string
  time_window_end?: string
  source_table?: string
  unique_id?: string
  attack_mark?: string
  process_guid?: string
  file_name?: string
  file_md5?: string
  object_name?: string
  url?: string
  domain?: string
  destination_ip?: string
  target_user_name?: string
}

export type InvestigationQuestionExecutionData = {
  tenant_id: string
  plan_id: string
  question_index: number
  question_id: string
  query_id?: string
  execution_contract_json: string
  execution_result_json?: string
  conclusion?: InvestigationQueryConclusion | null
  conclusion_json?: string
}

export type InvestigationQueryEvidenceSourceCount = {
  source: string
  count: number
}

export type InvestigationQueryCollectionRecommendation = {
  method?: string
  priority?: string
  reason?: string
  artifacts?: string[]
  collect?: string[]
  expected_evidence?: string[]
}

export type InvestigationQueryConclusion = {
  status?: string
  confidence?: string
  evidence_count?: number
  evidence_by_source?: InvestigationQueryEvidenceSourceCount[] | Record<string, number>
  display_title?: string
  primary_findings?: string[]
  key_entities?: string[]
  remaining_gaps?: string[]
  recommended_collection?: InvestigationQueryCollectionRecommendation | null
}

export type CaseInvestigationQuestionItem = {
  question_index: number
  question_id: string
  category?: string
  priority?: number
  title?: string
  support?: string
  query_ids_json?: string
  tables_json?: string
  fields_json?: string
  supplemental_collection_json?: string
  collection_targets_json?: string
  question_snapshot?: string
  question_status?: string
  execution_contract_json?: string
}

export type CaseInvestigationPlanItem = {
  tenant_id?: string
  plan_id: string
  request_id?: string
  case_id: string
  workflow_id?: string
  language?: string
  source_type?: string
  plan_status?: string
  rule_refs_json?: string
  request_snapshot?: string
  plan_json?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  questions?: CaseInvestigationQuestionItem[]
}

function compactPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (typeof value === "string") return value.trim() !== ""
      return value !== undefined && value !== null
    }),
  )
}

function timeValue(value?: string) {
  const parsed = value ? Date.parse(value) : NaN
  return Number.isFinite(parsed) ? parsed : 0
}

export async function refreshInvestigationQuestionContract({
  context,
  questionIndex,
  questionId,
}: {
  context: InvestigationExecutionContextInput
  questionIndex: number
  questionId?: string
}) {
  const result = (await http.post(
    "/sensor/analysis/investigation/question/contract/refresh",
    compactPayload({
      request_id: createRequestId(),
      ...context,
      question_index: questionIndex,
      question_id: questionId,
    }),
  )) as ApiResult<InvestigationQuestionExecutionData>

  return result.data ?? null
}

export async function executeInvestigationQuestionQuery({
  context,
  questionIndex,
  questionId,
  queryId,
  limit = 100,
}: {
  context: InvestigationExecutionContextInput
  questionIndex: number
  questionId?: string
  queryId?: string
  limit?: number
}) {
  const result = (await http.post(
    "/sensor/analysis/investigation/question/query/execute",
    compactPayload({
      request_id: createRequestId(),
      ...context,
      question_index: questionIndex,
      question_id: questionId,
      query_id: queryId,
      limit,
    }),
  )) as ApiResult<InvestigationQuestionExecutionData>

  return result.data ?? null
}

export async function createCaseInvestigationPlanByCaseId({
  caseId,
  language = "zh-CN",
  planId,
}: {
  caseId: string
  language?: "zh-CN" | "en-US"
  planId?: string
}) {
  const result = (await http.post(
    "/sensor/analysis/investigation/plan/create",
    compactPayload({
      request_id: createRequestId(),
      case_id: caseId.trim(),
      language,
      source_type: "case",
      plan_id: planId,
    }),
    { timeout: 30000 },
  )) as ApiResult<CaseInvestigationPlanItem>

  return result.data ?? null
}

export function buildInvestigationReviewFromPlan(item: CaseInvestigationPlanItem): {
  batch: InvestigationBatchReview
  casePlan: InvestigationCasePlan
} {
  const plan = parsePlanJSON(item.plan_json)
  const questions = normalizePlanQuestions(item.questions, plan)
  const ruleRefs = parseJSONValue<Array<{ rule_id?: string; rule_file?: string; agent_id?: string; alert_time?: string }>>(
    item.rule_refs_json,
    [],
  )
  const sortedAlertTimes = ruleRefs
    .map((ref) => ref.alert_time)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => timeValue(a) - timeValue(b))
  const firstAlertTime = sortedAlertTimes[0] || plan?.alert_time || item.created_at || ""
  const lastAlertTime = sortedAlertTimes[sortedAlertTimes.length - 1] || firstAlertTime
  const isMergedCasePlan = ruleRefs.length > 1
  const mergedRuleFiles = ruleRefs.map((ref) => ref.rule_file || ref.rule_id).filter(Boolean)
  const template: InvestigationTemplate = {
    schema_version: "case-investigation-plan/v1",
    language: item.language || "zh-CN",
    review_status: item.plan_status || "draft",
    source_rule: {
      id: plan?.rule_id || ruleRefs[0]?.rule_id || "",
      file: plan?.rule_file || ruleRefs[0]?.rule_file || "",
      title: isMergedCasePlan ? "Case 合并调查计划" : plan?.source_rule?.title || plan?.attack_core?.core_question || item.case_id,
      description: isMergedCasePlan
        ? `该调查计划由 ${ruleRefs.length} 条命中规则合并生成：${mergedRuleFiles.join("、")}`
        : plan?.source_rule?.description || "",
    },
    match_context: {
      target_hint: plan?.match_context?.target_hint || "",
    },
    attack_core: plan?.attack_core || {
      type: "case_investigation",
      core_question: "当前 Case 的关键调查问题是什么？",
      why_this_core: [],
      key_evidence: [],
      accuracy_drivers: [],
      do_not_conclude_without: [],
    },
    inferred: plan?.inferred || {
      confidence: "medium",
      confidence_reason: "由后台根据 Case 命中的规则生成。",
    },
    question_plan: questions,
  }
  const rule: InvestigationRuleReview = {
    key: item.plan_id,
    baseName: item.plan_id,
    files: {},
    templates: {
      "zh-CN": template,
      en: template,
    },
    stats: {
      questionCount: questions.length,
      collectionTargetCount: questions.reduce((sum, question) => sum + (question.collection_targets?.length ?? 0), 0),
      duplicateTargetCount: 0,
      badEventLogPathCount: 0,
    },
    issues: [],
  }
  const casePlan: InvestigationCasePlan = {
    caseId: item.case_id,
    planId: item.plan_id,
    timeWindowStart: firstAlertTime,
    timeWindowEnd: lastAlertTime,
    timezone: "Asia/Shanghai",
    triggeredRules: ruleRefs.map((ref, index) => ({
      ruleKey: item.plan_id,
      ruleId: ref.rule_id,
      title: ref.rule_file || ref.rule_id || `rule-${index + 1}`,
      severity: "medium",
      triggerCount: 1,
      firstSeen: ref.alert_time || firstAlertTime,
      lastSeen: ref.alert_time || firstAlertTime,
      context: {
        tenantId: item.tenant_id,
        agentId: ref.agent_id,
      },
    })),
  }

  return {
    batch: {
      batchName: `case:${item.case_id}`,
      batchPath: "backend",
      availableBatches: [],
      rules: [rule],
    },
    casePlan,
  }
}

function parseJSONValue<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function parsePlanJSON(raw?: string): any {
  return parseJSONValue<any>(raw, null)
}

function normalizePlanQuestions(items: CaseInvestigationQuestionItem[] | undefined, plan: any): InvestigationQuestion[] {
  if (items?.length) {
    return [...items]
      .sort((a, b) => a.question_index - b.question_index)
      .map((item) => {
        const snapshot = parseJSONValue<any>(item.question_snapshot, null)
        return {
          id: item.question_id || snapshot?.id,
          category: item.category || snapshot?.category,
          title: item.title || snapshot?.title,
          objective: snapshot?.objective,
          support: item.support || snapshot?.capability?.support,
          query_ids: parseJSONValue(item.query_ids_json, snapshot?.capability?.query_ids ?? []),
          collection_targets: parseJSONValue(item.collection_targets_json, snapshot?.collection_targets ?? []),
          gap_when_missing: snapshot?.gap_when_missing,
          topic: snapshot?.topic,
        }
      })
  }
  return plan?.questions?.map((question: any) => ({
    id: question.id,
    category: question.category,
    title: question.title,
    objective: question.objective,
    support: question.capability?.support,
    query_ids: question.capability?.query_ids ?? [],
    collection_targets: question.collection_targets ?? [],
    gap_when_missing: question.gap_when_missing,
    topic: question.topic,
  })) ?? []
}
