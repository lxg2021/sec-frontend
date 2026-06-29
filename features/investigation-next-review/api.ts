"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

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

function compactPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (typeof value === "string") return value.trim() !== ""
      return value !== undefined && value !== null
    }),
  )
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
