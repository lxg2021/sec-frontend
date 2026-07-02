"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type {
  AIInvestigationPreviewData,
  AIInvestigationResult,
  AIInvestigationValidation,
  InvestigationAssistantLanguage,
} from "@/features/investigation-assistant/types"

type ApiResult<T> = {
  data?: T | null
}

export interface PreviewAIInvestigationParams {
  caseId: string
  language?: InvestigationAssistantLanguage
  focusNodeIds?: string[]
  forceRefresh?: boolean
  includePrompt?: boolean
  maxDepth?: number
  signal?: AbortSignal
}

function compactPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (typeof value === "string") return value.trim() !== ""
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null
    }),
  )
}

function parseMaybeJson<T>(raw: unknown): T | null {
  if (!raw) return null
  if (typeof raw === "object") return raw as T
  if (typeof raw !== "string") return null

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function normalizePreviewData(
  data: AIInvestigationPreviewData | null | undefined,
  language: InvestigationAssistantLanguage,
): AIInvestigationPreviewData | null {
  if (!data) return null
  const localizedResults =
    data.localized_results ??
    parseMaybeJson<Partial<Record<InvestigationAssistantLanguage, AIInvestigationResult>>>(
      data.localized_results_json,
    )
  const localizedAssistantResult = localizedResults?.[language] ?? null

  return {
    ...data,
    localized_results: localizedResults,
    assistant_result:
      localizedAssistantResult ??
      data.assistant_result ??
      parseMaybeJson<AIInvestigationResult>(data.assistant_result_json),
    validation:
      data.validation ??
      parseMaybeJson<AIInvestigationValidation>(data.validation_json),
  }
}

export async function previewAIInvestigation({
  caseId,
  language = "zh-CN",
  focusNodeIds,
  forceRefresh = false,
  includePrompt = false,
  maxDepth = 3,
  signal,
}: PreviewAIInvestigationParams): Promise<AIInvestigationPreviewData | null> {
  const normalizedCaseId = caseId.trim()
  if (!normalizedCaseId) return null

  const result = (await http.post(
    "/sensor/analysis/ai/investigation/preview",
    compactPayload({
      request_id: createRequestId(),
      case_id: normalizedCaseId,
      language,
      include_prompt: includePrompt,
      force_refresh: forceRefresh,
      max_depth: maxDepth,
      focus_node_ids: focusNodeIds?.map((item) => item.trim()).filter(Boolean),
    }),
    {
      signal,
      timeout: 120000,
    },
  )) as ApiResult<AIInvestigationPreviewData | null>

  return normalizePreviewData(result.data, language)
}

