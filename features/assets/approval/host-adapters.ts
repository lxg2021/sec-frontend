import type { Host, HostOwner, HostStatus, LogicGroup } from "@/features/assets/approval/types"

export function extractBackendLogicGroups(value: unknown): LogicGroup[] {
  if (Array.isArray(value)) {
    return value as LogicGroup[]
  }

  if (!value || typeof value !== "object") {
    return []
  }

  const record = value as Record<string, unknown>
  const candidates = [record.data, record.Data, record.logic_groups, record.logicGroups]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as LogicGroup[]
    }
  }

  return []
}

export interface BackendLogicGroup {
  id: string
  parent_id?: string | null
  tenant_id?: string | null
  name: string
  full_path: string
  full_path_ids?: string[] | null
  company_name: string
  department_name?: string | null
  description?: string | null
  created_by: string
  created_at: number | string
  updated_at: number | string
}

export interface BackendHostOwner {
  agent_id: string
  user_id: string
  username: string
  phone?: string | null
  email?: string | null
  role: string
  assigned_at: number | string
  expired_at?: number | string | null
}

export interface BackendHostDetail {
  agent_id: string
  hostname: string
  ip?: string[]
  os_type?: string
  os_name: string
  os_version: string
  product_id: string
  cpu_id: string
  harddisk_id?: string[]
  board_serial: string
  macs?: string[]
  group_id?: string | null
  status: string
  tenant_id?: string | null
  heartbeat_time: number | string
  group?: BackendLogicGroup | null
  owners?: BackendHostOwner[]
}

export interface BackendPaginatedHostsData {
  hosts?: BackendHostDetail[]
  pagination?: {
    current_page: number
    page_size: number
    total_count: number
    total_pages: number
    has_previous: boolean
    has_next: boolean
  }
}

export interface ApproveHostRequestBody {
  tenant_id: string
  agent_id: string
  group_id?: string
  owner?: {
    agent_id: string
    username: string
    phone?: string | null
    email?: string | null
    role: string
  }
}

function toIsoDateTime(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return new Date(0).toISOString()

  const numericValue = Number(value)
  const timestamp = Number.isFinite(numericValue)
    ? numericValue < 1_000_000_000_000
      ? numericValue * 1000
      : numericValue
    : Date.parse(String(value))

  return new Date(timestamp).toISOString()
}

function adaptStatus(status: string): HostStatus {
  return status === "online" ? "online" : "offline"
}

export function mapOwnerRoleToBackend(role?: string | null) {
  const value = String(role || "").trim().toLowerCase()
  if (value === "admin" || value.includes("admin") || value.includes("管理员")) return "admin"
  if (value === "auditor" || value.includes("audit") || value.includes("审计")) return "auditor"
  if (value === "operator" || value.includes("operate") || value.includes("维护") || value.includes("使用")) {
    return "operator"
  }
  return "operator"
}

export function adaptBackendLogicGroup(group: BackendLogicGroup): LogicGroup {
  return {
    id: group.id,
    parent_id: group.parent_id || null,
    tenant_id: group.tenant_id || null,
    name: group.name,
    full_path: group.full_path,
    full_path_ids: group.full_path_ids || null,
    company_name: group.company_name,
    department_name: group.department_name || null,
    description: group.description || null,
    created_by: group.created_by,
    created_at: toIsoDateTime(group.created_at),
    updated_at: toIsoDateTime(group.updated_at),
  }
}

function adaptBackendOwner(hostId: string, owner?: BackendHostOwner): HostOwner | null {
  if (!owner) return null

  return {
    host_id: hostId,
    user_id: owner.user_id,
    owner_name: owner.username,
    phone: owner.phone || null,
    email: owner.email || null,
    owner_role: mapOwnerRoleToBackend(owner.role),
    assigned_at: toIsoDateTime(owner.assigned_at),
    expired_at: owner.expired_at ? toIsoDateTime(owner.expired_at) : null,
  }
}

export function adaptBackendHost(host: BackendHostDetail): Host {
  return {
    host_id: host.agent_id,
    hostname: host.hostname,
    ip: host.ip || [],
    os_name: host.os_name,
    os_version: host.os_version,
    product_id: host.product_id,
    cpu_id: host.cpu_id,
    harddisk_id: host.harddisk_id || [],
    board_serial: host.board_serial,
    macs: host.macs || [],
    group: host.group ? adaptBackendLogicGroup(host.group) : null,
    owner: adaptBackendOwner(host.agent_id, host.owners?.[0]),
    heartbeat_time: toIsoDateTime(host.heartbeat_time),
    status: adaptStatus(host.status),
  }
}

export function buildApproveHostRequest(tenantId: string, host: Host): ApproveHostRequestBody {
  return {
    tenant_id: tenantId,
    agent_id: host.host_id,
    ...(host.group?.id ? { group_id: host.group.id } : {}),
    ...(host.owner
      ? {
          owner: {
            agent_id: host.host_id,
            username: host.owner.owner_name,
            phone: host.owner.phone,
            email: host.owner.email,
            role: mapOwnerRoleToBackend(host.owner.owner_role),
          },
        }
      : {}),
  }
}

function normalizedOwner(owner: Host["owner"]) {
  if (!owner) return null

  return {
    username: owner.owner_name || "",
    phone: owner.phone || "",
    email: owner.email || "",
    role: mapOwnerRoleToBackend(owner.owner_role),
  }
}

function hostApprovalSignature(host: Host) {
  return JSON.stringify({
    groupId: host.group?.id || "",
    owner: normalizedOwner(host.owner),
  })
}

export function findHostsNeedingApproval(originalHosts: Host[], updatedHosts: Host[]): Host[] {
  const originalById = new Map(originalHosts.map((host) => [host.host_id, host]))

  return updatedHosts.filter((host) => {
    const original = originalById.get(host.host_id)
    if (!original) return true

    return hostApprovalSignature(original) !== hostApprovalSignature(host)
  })
}
