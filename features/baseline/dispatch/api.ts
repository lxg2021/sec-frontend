"use client"

import type { ScanSchedule } from "@/shared/components/scan-schedule"
import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

interface ApiResult<T> {
  data: T
}

const CONTROL_TYPE_POLICY = 1
const CONTROL_STATE_START = 1

interface CreateBaselineScanPolicyResponseData {
  id?: string
  name?: string
  version?: string | null
}

export interface CreateBaselineScanPolicyPayload {
  name: string
  version: string
  baselineUUID: string
  baselineFileName: string
  scanSchedule: ScanSchedule
}

export interface CreatedBaselineScanPolicy {
  id: string
  name: string
  version: string
}

export interface ApplyBaselineScanPolicyPayload {
  policyId: string
  version: string
  agentIds: string[]
}

function normalizeScanSchedule(scanSchedule: ScanSchedule): ScanSchedule {
  return {
    ...scanSchedule,
    specific_time: scanSchedule.specific_time?.trim() || undefined,
  }
}

function normalizeAgentIds(agentIds: string[]) {
  return Array.from(
    new Set(
      agentIds
        .map((agentId) => agentId.trim())
        .filter(Boolean),
    ),
  )
}

export async function createBaselineScanPolicy({
  name,
  version,
  baselineUUID,
  baselineFileName,
  scanSchedule,
}: CreateBaselineScanPolicyPayload): Promise<CreatedBaselineScanPolicy> {
  const result = (await http.post("baselineScanPolicy", {
    request_id: createRequestId(),
    name,
    version,
    baseline_info: {
      uuid: baselineUUID,
      name: baselineFileName,
    },
    scan_schedule: normalizeScanSchedule(scanSchedule),
  })) as ApiResult<CreateBaselineScanPolicyResponseData | null>

  if (!result.data?.id) {
    throw new Error("missing baseline scan policy id in response")
  }

  return {
    id: result.data.id,
    name: result.data.name?.trim() || name,
    version: result.data.version?.trim() || version,
  }
}

export async function applyBaselineScanPolicy({
  policyId,
  version,
  agentIds,
}: ApplyBaselineScanPolicyPayload) {
  const normalizedAgentIds = normalizeAgentIds(agentIds)

  if (!policyId.trim()) {
    throw new Error("baseline scan policy id is required")
  }

  if (!version.trim()) {
    throw new Error("baseline scan policy version is required")
  }

  if (normalizedAgentIds.length === 0) {
    throw new Error("at least one target agent is required")
  }

  return http.post("applyPMCObject", {
    request_id: createRequestId(),
    type: CONTROL_TYPE_POLICY,
    id: policyId.trim(),
    version: version.trim(),
    agent_ids: normalizedAgentIds,
    control_state: CONTROL_STATE_START,
  })
}
