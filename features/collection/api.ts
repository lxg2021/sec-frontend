import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type { BackendLogicGroupCreateData, RegisterAgentPayload, UiAssetData } from "@/features/collection/types"

export async function replaceLogicTree(tenantId: string, groups: BackendLogicGroupCreateData[]) {
  return http.post("replaceLogicTree", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    groups,
  })
}

export async function importHosts(tenantId: string, hosts: RegisterAgentPayload[]) {
  return http.post("importHosts", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    hosts,
  })
}

export async function approveHost(tenantId: string, host: UiAssetData) {
  return http.post("approveHost", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    agent_id: host.agent_id,
    group_id: host.group_id,
    owner: host.owner
      ? {
          agent_id: host.agent_id,
          username: host.owner.username,
          phone: host.owner.phone,
          email: host.owner.email,
          role: host.owner.role,
        }
      : undefined,
  })
}

export async function getLogicGroups(tenantId: string) {
  return http.post("getLogicGroups", {
    request_id: createRequestId(),
    tenant_id: tenantId,
  })
}
