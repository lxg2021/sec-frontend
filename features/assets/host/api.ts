import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import { SystemType } from "./types/system-info"
import type { HostSummary } from "./types/host-summary"

interface BackendHostSummary {
  total?: number
  online?: number
  offline?: number
  osTypeCount?: Record<string, number>
  os_type_count?: Record<string, number>
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
