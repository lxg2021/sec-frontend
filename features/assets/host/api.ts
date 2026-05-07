import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import { AgentStatus, SystemType } from "./types/system-info"
import type { HostSummary } from "./types/host-summary"
import type { AgentInfo } from "./types/system-info"

interface BackendHostSummary {
  total?: number
  online?: number
  offline?: number
  osTypeCount?: Record<string, number>
  os_type_count?: Record<string, number>
}

interface BackendLogicGroup {
  name?: string
  full_path?: string
  company_name?: string
  department_name?: string | null
}

interface BackendHostDetail {
  agent_id?: string
  hostname?: string
  os_type?: string
  os_name?: string
  os_version?: string
  product_id?: string
  status?: string
  heartbeat_time?: number | string
  group?: BackendLogicGroup | null
}

interface BackendPaginatedHostsData {
  hosts?: BackendHostDetail[]
  pagination?: Partial<HostPagination>
}

export interface HostPagination {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous: boolean
  has_next: boolean
}

export interface HostListResult {
  hosts: AgentInfo[]
  pagination: HostPagination
}

function normalizeOsType(value: string): SystemType {
  const normalized = value.trim().toLowerCase()

  if (normalized.includes("win")) return SystemType.WINDOWS
  if (normalized.includes("mac") || normalized.includes("darwin")) return SystemType.MACOS
  if (normalized.includes("linux")) return SystemType.LINUX

  return normalized as SystemType
}

function normalizeOsTypeCount(data?: Record<string, number>): Partial<Record<SystemType, number>> {
  const result: Partial<Record<SystemType, number>> = {}

  for (const [key, value] of Object.entries(data || {})) {
    const osType = normalizeOsType(key)
    const count = Number(value) || 0

    if (String(osType) === "unknown" || count <= 0) {
      continue
    }

    result[osType] = count
  }

  return result
}

function toDisplayDate(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return ""

  const numericValue = Number(value)
  const timestamp = Number.isFinite(numericValue)
    ? numericValue < 1_000_000_000_000
      ? numericValue * 1000
      : numericValue
    : Date.parse(String(value))

  if (!Number.isFinite(timestamp)) return ""

  return new Date(timestamp).toISOString().slice(0, 10)
}

function adaptBackendHost(host: BackendHostDetail): AgentInfo {
  const groupPath = (host.group?.full_path || "").split("/").filter(Boolean)

  return {
    hostId: host.agent_id || "",
    hostname: host.hostname || "-",
    osType: normalizeOsType(host.os_type || ""),
    status: host.status === AgentStatus.Online ? AgentStatus.Online : AgentStatus.Offline,
    company: host.group?.company_name || groupPath[0] || "-",
    department: host.group?.department_name || groupPath[1] || "-",
    group: host.group?.name || groupPath[groupPath.length - 1] || "-",
    osName: host.os_name || "-",
    osVersion: host.os_version || "-",
    productId: host.product_id || "",
    architecture: "-",
    installDate: toDisplayDate(host.heartbeat_time),
    manufacturer: "-",
    model: "-",
  }
}

function normalizePagination(
  pagination: Partial<HostPagination> | undefined,
  page: number,
  pageSize: number,
  hostCount: number,
): HostPagination {
  const totalCount = Number(pagination?.total_count ?? hostCount) || 0
  const totalPages = Number(pagination?.total_pages ?? Math.ceil(totalCount / pageSize)) || 0

  return {
    current_page: Number(pagination?.current_page ?? page) || page,
    page_size: Number(pagination?.page_size ?? pageSize) || pageSize,
    total_count: totalCount,
    total_pages: totalPages,
    has_previous: Boolean(pagination?.has_previous ?? page > 1),
    has_next: Boolean(pagination?.has_next ?? page < totalPages),
  }
}

export async function getHostSummary(tenantId = "public"): Promise<HostSummary> {
  const result = await http.post("getHostSummary", {
    request_id: createRequestId(),
    tenant_id: tenantId,
  })

  const data = (result.data || {}) as BackendHostSummary
  const total = Number(data.total) || 0
  const online = Number(data.online) || 0
  const offline = Math.max(total - online, 0)

  return {
    total,
    online,
    offline,
    osTypeCount: normalizeOsTypeCount(data.osTypeCount || data.os_type_count),
    companyCount: {},
  }
}

export async function getHostsPagination({
  tenantId = "public",
  page,
  pageSize,
  groupId,
}: {
  tenantId?: string
  page: number
  pageSize: number
  groupId?: string
}): Promise<HostListResult> {
  const result = await http.post("getAllHostsPagination", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    page,
    page_size: pageSize,
    ...(groupId ? { group_id: groupId } : {}),
  })

  const data = (result.data || {}) as BackendPaginatedHostsData
  const hosts = (data.hosts || []).map(adaptBackendHost)

  return {
    hosts,
    pagination: normalizePagination(data.pagination, page, pageSize, hosts.length),
  }
}
