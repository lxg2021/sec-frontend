"use client";

import { http } from "@/shared/lib/http/client";
import { createRequestId } from "@/shared/lib/utils";

import type {
  GraphCaseEdgeDto,
  GraphCaseNodeDto,
  GraphCaseResponseDto,
} from "./model/attack-graph-data";

interface ApiResult<T> {
  data: T;
}

export interface FetchGraphCaseParams {
  caseId: string;
  includeScopeDrill?: boolean;
  tenantId?: string;
}

export interface GraphDrillResponseDto {
  request_id?: string;
  scope_type?: string;
  scope_id?: string;
  node_key?: string;
  from_cache?: boolean;
  nodes?: GraphCaseNodeDto[];
  edges?: GraphCaseEdgeDto[];
  diagnostics?: {
    source_key_count?: number;
    source_hit_count?: number;
    resolved_event_count?: number;
    returned_node_count?: number;
    returned_edge_count?: number;
  };
}

export interface FetchGraphDrillParams {
  scopeType: "case" | "positioning";
  scopeId: string;
  nodeKey: string;
  nodeType?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  tenantId?: string;
  forceRefresh?: boolean;
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

export async function fetchGraphDrill({
  scopeType,
  scopeId,
  nodeKey,
  nodeType,
  startTime,
  endTime,
  timezone,
  tenantId,
  forceRefresh = false,
}: FetchGraphDrillParams): Promise<GraphDrillResponseDto | null> {
  const payload: Record<string, unknown> = {
    request_id: createRequestId(),
    scope_type: scopeType,
    scope_id: scopeId.trim(),
    node_key: nodeKey.trim(),
    start_time: startTime.trim(),
    end_time: endTime.trim(),
    force_refresh: forceRefresh,
  };

  const normalizedNodeType = nodeType?.trim();
  if (normalizedNodeType) {
    payload.node_type = normalizedNodeType;
  }

  const normalizedTimezone = timezone?.trim();
  if (normalizedTimezone) {
    payload.timezone = normalizedTimezone;
  }

  const normalizedTenantId = tenantId?.trim();
  if (normalizedTenantId) {
    payload.tenant_id = normalizedTenantId;
  }

  const result = (await http.post(
    "/sensor/graph/drill",
    payload,
  )) as ApiResult<GraphDrillResponseDto | null>;

  return result.data ?? null;
}
