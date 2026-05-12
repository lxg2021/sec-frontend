import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type { HostSelectorGroupNode, HostSelectorHostNode, HostSelectorTreeNode } from "./types"

const DEFAULT_TENANT_ID = "public"
const DEFAULT_PAGE_SIZE = 200
const UNGROUPED_GROUP_ID = "__ungrouped__"

interface BackendLogicGroup {
  id?: string
  parent_id?: string | null
  name?: string
  full_path?: string
  full_path_ids?: string[]
  department_name?: string | null
  direct_host_count?: number
  descendant_host_count?: number
  is_pseudo?: boolean
}

interface BackendLogicGroupHostItem {
  agent_id?: string
  hostname?: string
  ip?: string[]
  status?: string
  os_type?: string
  group_id?: string | null
  heartbeat_time?: number
}

interface BackendPagination {
  current_page?: number
  page_size?: number
  total_count?: number
  total_pages?: number
  has_previous?: boolean
  has_next?: boolean
}

interface BackendLogicGroupHostsData {
  hosts?: BackendLogicGroupHostItem[]
  pagination?: BackendPagination
}

function inferNodeType(group: BackendLogicGroup): HostSelectorGroupNode["type"] {
  if (group.is_pseudo) return "group"

  const depth = Array.isArray(group.full_path_ids) ? group.full_path_ids.length : 0
  if (depth <= 1) return "company"
  if (depth === 2 && group.department_name) return "department"
  return "group"
}

function normalizeOs(value?: string) {
  if (!value) return "-"

  const normalized = value.toLowerCase()
  if (normalized.includes("win")) return "Windows"
  if (normalized.includes("linux")) return "Linux"
  if (normalized.includes("mac") || normalized.includes("darwin")) return "macOS"
  return value
}

function normalizeStatus(value?: string) {
  if (!value) return "offline"
  return value.toLowerCase()
}

function createGroupNode(group: BackendLogicGroup): HostSelectorGroupNode | null {
  if (!group.id || !group.name) return null

  return {
    id: group.id,
    name: group.name,
    type: inferNodeType(group),
    parentId: group.parent_id || undefined,
    children: [],
    hostCount: Number(group.descendant_host_count) || 0,
    directHostCount: Number(group.direct_host_count) || 0,
    descendantHostCount: Number(group.descendant_host_count) || 0,
    isPseudo: Boolean(group.is_pseudo),
    fullPath: group.full_path || group.name,
  }
}

function createHostNode(host: BackendLogicGroupHostItem, parentId: string): HostSelectorHostNode | null {
  const agentId = host.agent_id || ""
  if (!agentId) return null

  const hostname = host.hostname || agentId
  const ipList = Array.isArray(host.ip) ? host.ip.filter(Boolean) : []

  return {
    id: `host:${agentId}`,
    name: hostname,
    type: "host",
    parentId,
    hostname,
    hostId: agentId,
    ip: ipList.join(", ") || "-",
    os: normalizeOs(host.os_type),
    mac: "-",
    status: normalizeStatus(host.status),
    cpu: "-",
    memory: "-",
    disk: "-",
    groupId: host.group_id || undefined,
    heartbeatTime: Number(host.heartbeat_time) || 0,
  }
}

async function getLogicGroups(tenantId: string): Promise<BackendLogicGroup[]> {
  const result = await http.post("getLogicGroups", {
    request_id: createRequestId(),
    tenant_id: tenantId,
  })

  return Array.isArray(result.data) ? (result.data as BackendLogicGroup[]) : []
}

async function getLogicGroupHostsPage({
  tenantId,
  groupId,
  page,
  pageSize,
}: {
  tenantId: string
  groupId: string
  page: number
  pageSize: number
}): Promise<BackendLogicGroupHostsData> {
  const result = await http.post("getLogicGroupHosts", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    group_id: groupId,
    page,
    page_size: pageSize,
  })

  return (result.data || {}) as BackendLogicGroupHostsData
}

async function getAllLogicGroupHosts({
  tenantId,
  groupId,
  pageSize,
}: {
  tenantId: string
  groupId: string
  pageSize: number
}): Promise<BackendLogicGroupHostItem[]> {
  const hosts: BackendLogicGroupHostItem[] = []
  let page = 1

  while (true) {
    const data = await getLogicGroupHostsPage({ tenantId, groupId, page, pageSize })
    const pageHosts = Array.isArray(data.hosts) ? data.hosts : []
    hosts.push(...pageHosts)

    if (!data.pagination?.has_next) {
      break
    }

    page += 1
  }

  return hosts
}

export async function getHostSelectorTree({
  tenantId = DEFAULT_TENANT_ID,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  tenantId?: string
  pageSize?: number
} = {}): Promise<HostSelectorTreeNode[]> {
  const groups = await getLogicGroups(tenantId)
  const groupNodeMap = new Map<string, HostSelectorGroupNode>()
  const roots: HostSelectorGroupNode[] = []

  for (const group of groups) {
    const node = createGroupNode(group)
    if (!node) continue
    groupNodeMap.set(node.id, node)
  }

  for (const node of groupNodeMap.values()) {
    if (node.parentId && groupNodeMap.has(node.parentId)) {
      groupNodeMap.get(node.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  await Promise.all(
    roots
      .filter((root) => (root.hostCount || 0) > 0)
      .map(async (root) => {
        const hosts = await getAllLogicGroupHosts({
          tenantId,
          groupId: root.id,
          pageSize,
        })

        for (const host of hosts) {
          const targetGroupId =
            root.id === UNGROUPED_GROUP_ID ? UNGROUPED_GROUP_ID : host.group_id || root.id
          const targetNode = groupNodeMap.get(targetGroupId) || root
          const hostNode = createHostNode(host, targetNode.id)

          if (hostNode) {
            targetNode.children.push(hostNode)
          }
        }
      }),
  )

  return roots
}
