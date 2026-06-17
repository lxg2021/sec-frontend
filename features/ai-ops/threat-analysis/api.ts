"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type { AttackAIReportTask } from "@/features/ai-ops/threat-analysis/report-types"

type ApiResult<T> = {
  data: T
  raw?: unknown
}

export type CreateAttackAIReportTaskParams = {
  caseId: string
  tenantId?: string
  timezone?: string
  providerMode?: string
  locale?: string
}

export type GetAttackAIReportTaskParams = {
  taskId: string
  tenantId?: string
  locale?: string
}

const DEFAULT_TENANT_ID = "public"

export async function createAttackAIReportTask({
  caseId,
  tenantId = DEFAULT_TENANT_ID,
  timezone = "Asia/Shanghai",
  providerMode,
  locale,
}: CreateAttackAIReportTaskParams): Promise<AttackAIReportTask> {
  const response = await http.post("sensor/analysis/ai/report/task/create", {
    request_id: createRequestId(),
    case_id: caseId,
    timezone,
    tenant_id: tenantId,
    provider_mode: providerMode,
    locale,
  }) as ApiResult<AttackAIReportTask>

  return response.data
}

export async function getAttackAIReportTask({
  taskId,
  tenantId = DEFAULT_TENANT_ID,
  locale,
}: GetAttackAIReportTaskParams): Promise<AttackAIReportTask> {
  const response = await http.post("sensor/analysis/ai/report/task/get", {
    request_id: createRequestId(),
    task_id: taskId,
    tenant_id: tenantId,
    locale,
  }) as ApiResult<AttackAIReportTask>

  return response.data
}
