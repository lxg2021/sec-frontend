"use client"

import { http } from "@/shared/lib/http/client"
import { getAuthHeaders } from "@/shared/lib/http/auth"
import { getApiConfig, resolveApiUrl } from "@/shared/lib/http/config"
import { createRequestId } from "@/shared/lib/utils"
import type {
  CancelForensicTaskData,
  CancelForensicTaskRequest,
  CreateForensicTaskData,
  CreateForensicTaskRequest,
  DeleteForensicTaskData,
  DeleteForensicTaskRequest,
  ForensicBackendHealthStatus,
  ForensicBackendStatusData,
  ForensicArtifactDefinitionItem,
  ForensicAvailabilityLevel,
  ForensicDownloadData,
  ForensicEndpointItem,
  ForensicNoticeLevel,
  ForensicTaskItem,
  GetForensicTaskData,
  GetForensicTaskFlowDetailData,
  GetForensicTaskFlowDetailRequest,
  ListForensicArtifactsData,
  ListForensicArtifactsRequest,
  ListForensicEndpointsData,
  ListForensicEndpointsRequest,
  ForensicOverviewContext,
  ForensicOverviewViewModel,
  ListForensicTasksData,
  ListForensicTasksRequest,
  SyncForensicTaskResultData,
} from "./types"

const AVAILABILITY_LEVELS = new Set<ForensicAvailabilityLevel>([
  "available",
  "partial",
  "unavailable",
])

const NOTICE_LEVELS = new Set<ForensicNoticeLevel>(["info", "warning", "error"])

const BACKEND_STATUS_LEVELS = new Set<ForensicBackendHealthStatus>([
  "healthy",
  "degraded",
  "unavailable",
])

const emptyOverview: ForensicOverviewViewModel = {
  availability: {
    level: "unavailable",
    title: "取证能力不可用",
    summary: "暂时无法获取取证概览数据。",
    can_create_task: false,
    target_agent_count: 0,
    available_endpoint_count: 0,
    unbound_endpoint_count: 0,
    offline_endpoint_count: 0,
    blocked_endpoint_count: 0,
    enabled_artifact_count: 0,
    running_task_count: 0,
    failed_task_count: 0,
    blocking_reasons: [],
  },
  metrics: {
    endpoint_total: 0,
    endpoint_online: 0,
    endpoint_unbound: 0,
    artifact_enabled: 0,
    task_running: 0,
    task_failed: 0,
    evidence_total: 0,
  },
  endpoint_summary: {
    total: 0,
    online: 0,
    offline: 0,
    unknown: 0,
    unbound: 0,
    latest_seen_at: 0,
  },
  task_summary: {
    pending: 0,
    running: 0,
    success: 0,
    failed: 0,
    timeout: 0,
    canceled: 0,
  },
  artifact_summary: {
    total_enabled: 0,
    by_category: {},
    high_risk_count: 0,
  },
  evidence_summary: {
    total: 0,
    latest_created_at: 0,
  },
  recent_tasks: [],
  notices: [],
  last_refresh_at: 0,
}

const emptyBackendStatus: ForensicBackendStatusData = {
  velociraptor: {
    status: "unavailable",
    cpu_percent: 0,
    memory_bytes: 0,
    total_frontends: 0,
    current_connections: 0,
    last_seen_at: 0,
  },
  storage: {
    type: "velociraptor_datastore",
    container_path: "",
    filesystem: "",
    total: "",
    used: "",
    available: "",
    used_percent: 0,
  },
  endpoints: {
    registered: 0,
    connected: 0,
  },
  last_refresh_at: 0,
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function paginationValue(
  value: Partial<{ page: number; page_size: number; total_count: number }> | undefined,
  page: number,
  pageSize: number,
) {
  return {
    page: numberValue(value?.page) || page,
    page_size: numberValue(value?.page_size) || pageSize,
    total_count: numberValue(value?.total_count),
  }
}

function fileNameFromDisposition(value: string | null): string {
  if (!value) return ""
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }
  const plainMatch = value.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1] ?? ""
}

async function downloadForensicFile(
  endpoint: string,
  payload: Record<string, unknown>,
  fallbackFileName: string,
): Promise<ForensicDownloadData> {
  const apiConfig = await getApiConfig()
  const controller = apiConfig.timeout ? new AbortController() : null
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), apiConfig.timeout)
    : null

  try {
    const headers: Record<string, string> = {
      Accept: "*/*",
      "Content-Type": "application/json",
    }
    Object.assign(headers, getAuthHeaders())

    const response = await fetch(await resolveApiUrl(endpoint), {
      method: "POST",
      headers,
      body: JSON.stringify({
        request_id: createRequestId(),
        ...payload,
      }),
      signal: controller?.signal,
    })

    if (!response.ok) {
      let message = `download failed: ${response.status}`
      try {
        const data = await response.json()
        message = data?.msg || data?.message || message
      } catch {
        // Binary endpoints may not return JSON on error.
      }
      throw new Error(message)
    }

    const blob = await response.blob()
    const fileName =
      fileNameFromDisposition(response.headers.get("content-disposition")) ||
      fallbackFileName
    return {
      blob,
      fileName,
      contentType: response.headers.get("content-type") || blob.type || "application/octet-stream",
    }
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
  }
}

function normalizeBackendStatus(raw: Partial<ForensicBackendStatusData> | null | undefined): ForensicBackendStatusData {
  if (!raw) {
    throw new Error("forensic backend status data is empty")
  }

  const status = raw.velociraptor?.status

  return {
    velociraptor: {
      ...emptyBackendStatus.velociraptor,
      ...raw.velociraptor,
      status: status && BACKEND_STATUS_LEVELS.has(status) ? status : "unavailable",
      cpu_percent: numberValue(raw.velociraptor?.cpu_percent),
      memory_bytes: numberValue(raw.velociraptor?.memory_bytes),
      total_frontends: numberValue(raw.velociraptor?.total_frontends),
      current_connections: numberValue(raw.velociraptor?.current_connections),
      last_seen_at: numberValue(raw.velociraptor?.last_seen_at),
    },
    storage: {
      ...emptyBackendStatus.storage,
      ...raw.storage,
      type: stringValue(raw.storage?.type) || emptyBackendStatus.storage.type,
      container_path: stringValue(raw.storage?.container_path),
      filesystem: stringValue(raw.storage?.filesystem),
      total: stringValue(raw.storage?.total),
      used: stringValue(raw.storage?.used),
      available: stringValue(raw.storage?.available),
      used_percent: numberValue(raw.storage?.used_percent),
    },
    endpoints: {
      registered: numberValue(raw.endpoints?.registered),
      connected: numberValue(raw.endpoints?.connected),
    },
    last_refresh_at: numberValue(raw.last_refresh_at) || Math.floor(Date.now() / 1000),
  }
}

function normalizeOverview(raw: Partial<ForensicOverviewViewModel> | null | undefined): ForensicOverviewViewModel {
  if (!raw || !raw.availability) {
    throw new Error("取证概览数据为空")
  }

  const availability = {
    ...emptyOverview.availability,
    ...raw.availability,
    level: AVAILABILITY_LEVELS.has(raw.availability.level)
      ? raw.availability.level
      : emptyOverview.availability.level,
    blocking_reasons: Array.isArray(raw.availability.blocking_reasons)
      ? raw.availability.blocking_reasons.map((reason) => ({
          type: stringValue(reason.type),
          level: NOTICE_LEVELS.has(reason.level) ? reason.level : "info",
          text: stringValue(reason.text),
          action_label: reason.action_label,
          action_href: reason.action_href,
        }))
      : [],
  }

  const notices = Array.isArray(raw.notices)
    ? raw.notices.map((notice) => ({
        id: stringValue(notice.id) || stringValue(notice.title),
        level: NOTICE_LEVELS.has(notice.level) ? notice.level : "info",
        title: stringValue(notice.title),
        description: notice.description,
        action_label: notice.action_label,
        action_href: notice.action_href,
      }))
    : availability.blocking_reasons.map((reason) => ({
        id: reason.type,
        level: reason.level,
        title: reason.text,
        action_label: reason.action_label,
        action_href: reason.action_href,
      }))

  return {
    ...emptyOverview,
    ...raw,
    availability,
    metrics: {
      ...emptyOverview.metrics,
      ...raw.metrics,
    },
    endpoint_summary: {
      ...emptyOverview.endpoint_summary,
      ...raw.endpoint_summary,
    },
    task_summary: {
      ...emptyOverview.task_summary,
      ...raw.task_summary,
    },
    artifact_summary: {
      ...emptyOverview.artifact_summary,
      ...raw.artifact_summary,
      by_category: raw.artifact_summary?.by_category ?? {},
    },
    evidence_summary: {
      ...emptyOverview.evidence_summary,
      ...raw.evidence_summary,
    },
    recent_tasks: Array.isArray(raw.recent_tasks) ? raw.recent_tasks : [],
    notices,
    last_refresh_at: numberValue(raw.last_refresh_at) || Math.floor(Date.now() / 1000),
  }
}

export async function getForensicOverview(
  context: Pick<ForensicOverviewContext, "case_id"> = {},
): Promise<ForensicOverviewViewModel> {
  const caseId = context.case_id?.trim()
  const result = await http.post("getForensicOverview", {
    request_id: createRequestId(),
    ...(caseId ? { case_id: caseId } : {}),
  })
  return normalizeOverview(result.data as Partial<ForensicOverviewViewModel>)
}

export async function getForensicBackendStatus(): Promise<ForensicBackendStatusData> {
  const result = await http.post("getForensicBackendStatus", {
    request_id: createRequestId(),
  })
  return normalizeBackendStatus(result.data as Partial<ForensicBackendStatusData>)
}

export async function syncForensicEndpoints(): Promise<{ synced_count: number }> {
  const result = await http.post("syncForensicEndpoints", {
    request_id: createRequestId(),
  })
  const data = result.data as { synced_count?: number } | null
  return { synced_count: numberValue(data?.synced_count) }
}

export async function listForensicEndpoints(
  params: ListForensicEndpointsRequest = {},
): Promise<ListForensicEndpointsData> {
  const page = params.page || 1
  const pageSize = params.page_size || 100
  const result = await http.post("listForensicEndpoints", {
    request_id: createRequestId(),
    ...params,
    page,
    page_size: pageSize,
  })
  const data = result.data as Partial<ListForensicEndpointsData> | null
  return {
    items: Array.isArray(data?.items) ? (data.items as ForensicEndpointItem[]) : [],
    pagination: paginationValue(data?.pagination, page, pageSize),
  }
}

export async function listForensicArtifacts(
  params: ListForensicArtifactsRequest = {},
): Promise<ListForensicArtifactsData> {
  const result = await http.post(
    "listForensicArtifacts",
    {
      request_id: createRequestId(),
      ...params,
    },
    { timeout: 60000 },
  )
  const data = result.data as Partial<ListForensicArtifactsData> | null
  return {
    items: Array.isArray(data?.items) ? data.items : [],
  }
}

export async function getForensicArtifactDefinition(
  artifactKey: string,
): Promise<ForensicArtifactDefinitionItem> {
  const result = await http.post(
    "getForensicArtifactDefinition",
    {
      request_id: createRequestId(),
      artifact_key: artifactKey,
    },
    { timeout: 60000 },
  )
  const data = result.data as { artifact?: ForensicArtifactDefinitionItem } | null
  if (!data?.artifact) {
    throw new Error("forensic artifact definition is empty")
  }
  return data.artifact
}

export async function listForensicTasks(
  params: ListForensicTasksRequest = {},
): Promise<ListForensicTasksData> {
  const page = params.page || 1
  const pageSize = params.page_size || 20
  const result = await http.post("listForensicTasks", {
    request_id: createRequestId(),
    ...params,
    page,
    page_size: pageSize,
  })
  const data = result.data as Partial<ListForensicTasksData> | null
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: paginationValue(data?.pagination, page, pageSize),
  }
}

export async function createForensicTask(
  payload: CreateForensicTaskRequest,
): Promise<CreateForensicTaskData> {
  const result = await http.post("createForensicTask", {
    request_id: payload.request_id || createRequestId(),
    ...payload,
  })
  const data = result.data as Partial<CreateForensicTaskData> | null
  if (!data?.task_id || !data?.task) {
    throw new Error("forensic task create response is empty")
  }
  return data as CreateForensicTaskData
}

export async function getForensicTask(taskId: string): Promise<ForensicTaskItem> {
  const result = await http.post("getForensicTask", {
    request_id: createRequestId(),
    task_id: taskId,
  })
  const data = result.data as Partial<GetForensicTaskData> | null
  if (!data?.task) {
    throw new Error("forensic task detail is empty")
  }
  return data.task
}

export async function getForensicTaskFlowDetail(
  params: GetForensicTaskFlowDetailRequest,
): Promise<GetForensicTaskFlowDetailData> {
  const resultPage = params.result_page || 1
  const resultPageSize = params.result_page_size || 50
  const logPage = params.log_page || 1
  const logPageSize = params.log_page_size || 100
  const result = await http.post(
    "getForensicTaskFlowDetail",
    {
      request_id: createRequestId(),
      ...params,
      result_page: resultPage,
      result_page_size: resultPageSize,
      log_page: logPage,
      log_page_size: logPageSize,
    },
    { timeout: 60000 },
  )
  const data = result.data as Partial<GetForensicTaskFlowDetailData> | null
  if (!data?.task) {
    throw new Error("forensic task flow detail is empty")
  }
  return {
    task: data.task,
    artifact_collection: data.artifact_collection ?? null,
    results: data.results ?? {
      columns: [],
      rows_json: "[]",
      raw_json: "[]",
      row_count: 0,
      pagination: paginationValue(undefined, resultPage, resultPageSize),
    },
    uploaded_files: data.uploaded_files ?? {
      columns: [],
      rows_json: "[]",
      raw_json: "[]",
      row_count: 0,
      pagination: paginationValue(undefined, 1, 0),
    },
    requests: data.requests ?? null,
    logs: data.logs ?? {
      columns: [],
      rows_json: "[]",
      raw_json: "[]",
      row_count: 0,
      pagination: paginationValue(undefined, logPage, logPageSize),
    },
  }
}

export async function syncForensicTaskResult(taskId: string): Promise<ForensicTaskItem> {
  const result = await http.post("syncForensicTaskResult", {
    request_id: createRequestId(),
    task_id: taskId,
  })
  const data = result.data as Partial<SyncForensicTaskResultData> | null
  if (!data?.task) {
    throw new Error("forensic task sync result is empty")
  }
  return data.task
}

export async function cancelForensicTask(
  payload: CancelForensicTaskRequest,
): Promise<ForensicTaskItem> {
  const result = await http.post("cancelForensicTask", {
    request_id: createRequestId(),
    ...payload,
  })
  const data = result.data as Partial<CancelForensicTaskData> | null
  if (!data?.task) {
    throw new Error("forensic task cancel response is empty")
  }
  return data.task
}

export async function deleteForensicTask(
  payload: DeleteForensicTaskRequest,
): Promise<DeleteForensicTaskData> {
  const result = await http.post("deleteForensicTask", {
    request_id: createRequestId(),
    delete_mode: "remote_sync",
    ...payload,
  })
  return result.data as DeleteForensicTaskData
}

export function downloadForensicTaskFlowZip(taskId: string): Promise<ForensicDownloadData> {
  return downloadForensicFile(
    "downloadForensicTaskFlowZip",
    { task_id: taskId },
    `${taskId || "forensic-flow"}.zip`,
  )
}
