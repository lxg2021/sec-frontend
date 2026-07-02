"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type {
  ForensicAvailabilityLevel,
  ForensicNoticeLevel,
  ForensicOverviewContext,
  ForensicOverviewViewModel,
  ListForensicTasksData,
  ListForensicTasksRequest,
} from "./types"

const AVAILABILITY_LEVELS = new Set<ForensicAvailabilityLevel>([
  "available",
  "partial",
  "unavailable",
])

const NOTICE_LEVELS = new Set<ForensicNoticeLevel>(["info", "warning", "error"])

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

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
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

export async function syncForensicEndpoints(): Promise<{ synced_count: number }> {
  const result = await http.post("syncForensicEndpoints", {
    request_id: createRequestId(),
  })
  const data = result.data as { synced_count?: number } | null
  return { synced_count: numberValue(data?.synced_count) }
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
    pagination: {
      page: numberValue(data?.pagination?.page) || page,
      page_size: numberValue(data?.pagination?.page_size) || pageSize,
      total_count: numberValue(data?.pagination?.total_count),
    },
  }
}
