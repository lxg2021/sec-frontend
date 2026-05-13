"use client"

import type { ScanSchedule } from "@/shared/components/scan-schedule"
import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

interface ApiResult<T> {
  data: T
}

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

function normalizeScanSchedule(scanSchedule: ScanSchedule): ScanSchedule {
  return {
    ...scanSchedule,
    specific_time: scanSchedule.specific_time?.trim() || undefined,
  }
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
