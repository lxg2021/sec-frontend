"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type {
  CreateForensicTaskRequest,
  CreateForensicTaskResponse,
  ForensicArtifactDefinitionItem,
  ForensicEndpointItem,
  ForensicEvidenceItem,
  ForensicTaskItem,
  ListResponse,
  SyncEndpointsResponse,
  TaskStatus,
} from "./types"

export const FORENSIC_ENDPOINTS = {
  syncForensicEndpoints: "/sensor/analysis/forensic/endpoints/sync",
  listForensicEndpoints: "/sensor/analysis/forensic/endpoints/list",
  getForensicEndpoint: "/sensor/analysis/forensic/endpoints/get",
  bindForensicEndpoint: "/sensor/analysis/forensic/endpoints/bind",
  reportForensicEndpointIdentity: "/sensor/analysis/forensic/endpoints/report-identity",
  listForensicArtifacts: "/sensor/analysis/forensic/artifacts/list",
  getForensicArtifactDefinition: "/sensor/analysis/forensic/artifacts/get",
  createForensicTask: "/sensor/analysis/forensic/tasks/create",
  createCollectFileTask: "/sensor/analysis/forensic/tasks/collect-file",
  getForensicTask: "/sensor/analysis/forensic/tasks/get",
  syncForensicTaskResult: "/sensor/analysis/forensic/tasks/sync-result",
  listForensicTasks: "/sensor/analysis/forensic/tasks/list",
  cancelForensicTask: "/sensor/analysis/forensic/tasks/cancel",
  listForensicEvidence: "/sensor/analysis/forensic/evidence/list",
  getForensicEvidence: "/sensor/analysis/forensic/evidence/get",
  listForensicTaskEvents: "/sensor/analysis/forensic/task-events/list",
} as const

export class ForensicApiError extends Error {
  code?: string
  status?: number

  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message)
    this.name = "ForensicApiError"
    this.code = opts?.code
    this.status = opts?.status
  }
}

type ForensicEndpointName = keyof typeof FORENSIC_ENDPOINTS

async function post<T>(
  endpoint: ForensicEndpointName,
  body: Record<string, unknown> = {},
): Promise<T> {
  const result = await http.post(endpoint, {
    request_id: createRequestId(),
    ...body,
  })
  return result.data as T
}

function normalizeArtifactList(
  data: { items?: ForensicArtifactDefinitionItem[] } | ListResponse<ForensicArtifactDefinitionItem>,
): ListResponse<ForensicArtifactDefinitionItem> {
  if ("pagination" in data) return data
  const items = data.items ?? []
  return {
    items,
    pagination: { page: 1, page_size: items.length, total_count: items.length },
  }
}

export interface ListEndpointsParams {
  page?: number
  page_size?: number
  status?: string
  agent_id?: string
  endpoint_id?: string
}

export function listForensicEndpoints(params: ListEndpointsParams = {}) {
  const { page = 1, page_size = 100 } = params
  return post<ListResponse<ForensicEndpointItem>>("listForensicEndpoints", {
    page,
    page_size,
    status: params.status,
    agent_id: params.agent_id,
    endpoint_id: params.endpoint_id,
  })
}

export function syncForensicEndpoints() {
  return post<SyncEndpointsResponse>("syncForensicEndpoints")
}

export interface ListArtifactsParams {
  enabled?: boolean
  category?: string
  platform?: string
}

export async function listForensicArtifacts(params: ListArtifactsParams = {}) {
  const data = await post<{ items?: ForensicArtifactDefinitionItem[] } | ListResponse<ForensicArtifactDefinitionItem>>(
    "listForensicArtifacts",
    params as Record<string, unknown>,
  )
  return normalizeArtifactList(data)
}

export async function getForensicArtifactDefinition(artifact_key: string) {
  const data = await post<{ artifact?: ForensicArtifactDefinitionItem }>(
    "getForensicArtifactDefinition",
    { artifact_key },
  )
  if (!data.artifact) throw new ForensicApiError("artifact definition is empty")
  return data.artifact
}

export interface ListTasksParams {
  page?: number
  page_size?: number
  status?: TaskStatus
  case_id?: string
  workflow_id?: string
  workflow_action_id?: string
  endpoint_id?: string
  velociraptor_client_id?: string
  artifact_key?: string
}

export function listForensicTasks(params: ListTasksParams = {}) {
  const { page = 1, page_size = 10 } = params
  return post<ListResponse<ForensicTaskItem>>("listForensicTasks", { ...params, page, page_size })
}

export function syncForensicTaskResult(task_id: string) {
  return post<{ task: ForensicTaskItem }>("syncForensicTaskResult", { task_id })
}

export function createForensicTask(req: CreateForensicTaskRequest) {
  return post<CreateForensicTaskResponse>("createForensicTask", req as unknown as Record<string, unknown>)
}

export interface ListEvidenceParams {
  page?: number
  page_size?: number
  case_id?: string
  task_id?: string
  endpoint_id?: string
}

export function listForensicEvidence(params: ListEvidenceParams = {}) {
  const { page = 1, page_size = 10 } = params
  return post<ListResponse<ForensicEvidenceItem>>("listForensicEvidence", { ...params, page, page_size })
}
