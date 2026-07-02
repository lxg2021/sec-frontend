// 取证接口封装。真实环境必须暴露后端错误；只有显式开启
// NEXT_PUBLIC_FORENSIC_ENABLE_MOCK=true 时才允许回退到 mock 数据。

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import {
  mockArtifacts,
  mockEndpoints,
  mockEvidence,
  mockTasks,
} from "./mock"
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

const ENABLE_MOCK_FALLBACK =
  process.env.NEXT_PUBLIC_FORENSIC_ENABLE_MOCK === "true"

export class ForensicApiError extends Error {
  code?: string
  status?: number
  usedMock?: boolean
  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message)
    this.name = "ForensicApiError"
    this.code = opts?.code
    this.status = opts?.status
  }
}

export interface WithMockFlag {
  __usedMock?: boolean
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

async function withFallback<T extends object>(
  real: () => Promise<T>,
  fallback: () => T,
): Promise<T & WithMockFlag> {
  try {
    return await real()
  } catch (error) {
    if (!ENABLE_MOCK_FALLBACK) {
      throw error
    }
    return { ...fallback(), __usedMock: true }
  }
}

function paginate<T>(items: T[], page = 1, pageSize = 10): ListResponse<T> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    pagination: { page, page_size: pageSize, total_count: items.length },
  }
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
  return withFallback<ListResponse<ForensicEndpointItem>>(
    () =>
      post("listForensicEndpoints", {
        page,
        page_size,
        status: params.status,
        agent_id: params.agent_id,
        endpoint_id: params.endpoint_id,
      }),
    () => {
      let items = mockEndpoints
      if (params.status) items = items.filter((e) => e.status === params.status)
      if (params.agent_id)
        items = items.filter((e) => e.agent_id === params.agent_id)
      if (params.endpoint_id)
        items = items.filter((e) => e.endpoint_id === params.endpoint_id)
      return paginate(items, page, page_size)
    },
  )
}

export function syncForensicEndpoints() {
  return withFallback<SyncEndpointsResponse>(
    () => post("syncForensicEndpoints"),
    () => ({ synced_count: mockEndpoints.length }),
  )
}

export interface ListArtifactsParams {
  enabled?: boolean
  category?: string
  platform?: string
}

export function listForensicArtifacts(params: ListArtifactsParams = {}) {
  return withFallback<ListResponse<ForensicArtifactDefinitionItem>>(
    async () =>
      normalizeArtifactList(
        await post<{ items?: ForensicArtifactDefinitionItem[] }>(
          "listForensicArtifacts",
          params as Record<string, unknown>,
        ),
      ),
    () => {
      let items = mockArtifacts
      if (params.enabled !== undefined)
        items = items.filter((a) => a.enabled === params.enabled)
      if (params.category)
        items = items.filter((a) => a.category === params.category)
      if (params.platform)
        items = items.filter((a) => a.platform === params.platform)
      return paginate(items, 1, items.length)
    },
  )
}

export function getForensicArtifactDefinition(artifact_key: string) {
  return withFallback<ForensicArtifactDefinitionItem>(
    async () => {
      const data = await post<{ artifact?: ForensicArtifactDefinitionItem }>(
        "getForensicArtifactDefinition",
        { artifact_key },
      )
      if (!data.artifact) throw new ForensicApiError("工件定义为空")
      return data.artifact
    },
    () => {
      const found = mockArtifacts.find((a) => a.artifact_key === artifact_key)
      if (!found) throw new ForensicApiError("工件不存在")
      return found
    },
  )
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
  return withFallback<ListResponse<ForensicTaskItem>>(
    () => post("listForensicTasks", { ...params, page, page_size }),
    () => {
      let items = mockTasks
      if (params.status) items = items.filter((t) => t.status === params.status)
      if (params.case_id) items = items.filter((t) => t.case_id === params.case_id)
      if (params.workflow_id)
        items = items.filter((t) => t.workflow_id === params.workflow_id)
      if (params.workflow_action_id)
        items = items.filter((t) => t.workflow_action_id === params.workflow_action_id)
      if (params.endpoint_id)
        items = items.filter((t) => t.endpoint_id === params.endpoint_id)
      return paginate(items, page, page_size)
    },
  )
}

export function syncForensicTaskResult(task_id: string) {
  return withFallback<{ task: ForensicTaskItem }>(
    () => post("syncForensicTaskResult", { task_id }),
    () => {
      const found = mockTasks.find((t) => t.task_id === task_id)
      if (!found) throw new ForensicApiError("任务不存在")
      const task: ForensicTaskItem =
        found.status === "pending" || found.status === "running"
          ? {
              ...found,
              status: "success",
              finished_at: Math.floor(Date.now() / 1000),
              last_sync_at: Math.floor(Date.now() / 1000),
              remote_flow_id: found.remote_flow_id ?? "F.CQ0000SYNC",
            }
          : { ...found, last_sync_at: Math.floor(Date.now() / 1000) }
      return { task }
    },
  )
}

export function createForensicTask(req: CreateForensicTaskRequest) {
  return withFallback<CreateForensicTaskResponse>(
    () => post("createForensicTask", req as unknown as Record<string, unknown>),
    () => {
      const artifact = mockArtifacts.find(
        (a) => a.artifact_key === req.artifact_key,
      )
      const taskType =
        req.artifact_key === "windows.registry.collect"
          ? "collect_registry"
          : req.artifact_key === "windows.eventlog.collect"
            ? "collect_eventlog"
            : "collect_file"
      const task: ForensicTaskItem = {
        task_id: `task-${Math.random().toString(16).slice(2, 6)}`,
        endpoint_id: req.endpoint_id,
        agent_id: req.agent_id,
        velociraptor_client_id: req.velociraptor_client_id,
        artifact_key: req.artifact_key,
        artifact_name: artifact?.name ?? req.artifact_key,
        task_type: taskType,
        params_json: req.params_json,
        status: "pending",
        remote_flow_id: "",
        created_by: req.created_by,
        case_id: req.case_id,
        workflow_id: req.workflow_id,
        workflow_action_id: req.workflow_action_id,
        created_at: Math.floor(Date.now() / 1000),
      }
      mockTasks.unshift(task)
      return { task_id: task.task_id, status: task.status, task }
    },
  )
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
  return withFallback<ListResponse<ForensicEvidenceItem>>(
    () => post("listForensicEvidence", { ...params, page, page_size }),
    () => {
      let items = mockEvidence
      if (params.case_id) items = items.filter((e) => e.case_id === params.case_id)
      if (params.task_id) items = items.filter((e) => e.task_id === params.task_id)
      if (params.endpoint_id)
        items = items.filter((e) => e.endpoint_id === params.endpoint_id)
      return paginate(items, page, page_size)
    },
  )
}
