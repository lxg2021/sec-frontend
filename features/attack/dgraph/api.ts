"use client";

import { http } from "@/shared/lib/http/client";
import { createRequestId } from "@/shared/lib/utils";

import type { GraphCaseResponseDto } from "./model/attack-graph-data";

interface ApiResult<T> {
  data: T;
}

export interface FetchGraphCaseParams {
  caseId: string;
  includeScopeDrill?: boolean;
  tenantId?: string;
}

export async function fetchGraphCase({
  caseId,
  includeScopeDrill = false,
  tenantId,
}: FetchGraphCaseParams): Promise<GraphCaseResponseDto | null> {
  const normalizedCaseId = caseId.trim();
  if (!normalizedCaseId) return null;

  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    case_id: normalizedCaseId,
    include_scope_drill: includeScopeDrill,
  };

  const normalizedTenantId = tenantId?.trim();
  if (normalizedTenantId) {
    payload.tenant_id = normalizedTenantId;
  }

  const result = (await http.post(
    "/sensor/graph/case",
    payload,
  )) as ApiResult<GraphCaseResponseDto | null>;

  return result.data ?? null;
}
