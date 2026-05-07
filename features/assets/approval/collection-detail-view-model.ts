import type { UiAssetData } from "@/features/assets/approval/collection-types"

export interface CollectionOwnerRow {
  key: string
  username: string
  role: string
  phone: string
  email: string
  hostname: string
  agentId: string
  department: string
}

export function buildCollectionOwnerRows(hosts: UiAssetData[]): CollectionOwnerRow[] {
  return hosts
    .filter((host) => Boolean(host.owner))
    .map((host) => ({
      key: `${host.agent_id}:${host.owner?.username || "-"}`,
      username: host.owner?.username || "-",
      role: host.owner?.role || "-",
      phone: host.owner?.phone || "-",
      email: host.owner?.email || "-",
      hostname: host.hostname || "-",
      agentId: host.agent_id || "-",
      department: host.department_path || host.group_id || "-",
    }))
}
