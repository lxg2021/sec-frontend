import { buildApproveHostRequest, adaptBackendHost, adaptBackendLogicGroup } from "@/features/assets/approval/host-adapters"
import type {
  BackendHostDetail,
  BackendLogicGroup,
  BackendPaginatedHostsData,
} from "@/features/assets/approval/host-adapters"
import type { Host, LogicGroup } from "@/features/assets/approval/types"
import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

export interface HostPagination {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous: boolean
  has_next: boolean
}

export interface ListHostsResult {
  hosts: Host[]
  pagination: HostPagination
}

export async function getApprovalLogicGroups(tenantId: string): Promise<LogicGroup[]> {
  const result = await http.post("getLogicGroups", {
    request_id: createRequestId(),
    tenant_id: tenantId,
  })

  return ((result.data || []) as BackendLogicGroup[]).map(adaptBackendLogicGroup)
}

export async function getApprovalHosts({
  tenantId,
  page,
  pageSize,
  groupId,
}: {
  tenantId: string
  page: number
  pageSize: number
  groupId?: string
}): Promise<ListHostsResult> {
  const result = await http.post("getAllHostsPagination", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    page,
    page_size: pageSize,
    ...(groupId ? { group_id: groupId } : {}),
  })

  const data = (result.data || {}) as BackendPaginatedHostsData
  const hosts = ((data.hosts || []) as BackendHostDetail[]).map(adaptBackendHost)

  return {
    hosts,
    pagination: data.pagination || {
      current_page: page,
      page_size: pageSize,
      total_count: hosts.length,
      total_pages: Math.max(1, Math.ceil(hosts.length / pageSize)),
      has_previous: page > 1,
      has_next: false,
    },
  }
}

export async function approveHost(tenantId: string, host: Host) {
  return http.post("approveHost", {
    request_id: createRequestId(),
    ...buildApproveHostRequest(tenantId, host),
  })
}
