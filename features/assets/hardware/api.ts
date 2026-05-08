import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type {
  HardwareAssetItem,
  HardwareAssetResult,
  HardwareCategory,
  HardwareCategorySummary,
  HardwareHostReference,
  HardwarePagination,
  HardwareSummary,
} from "@/features/assets/hardware/types"

const CATEGORY_ENDPOINTS: Record<HardwareCategory, string> = {
  cpu: "getCPUAssetPagination",
  disk: "getDiskAssetPagination",
  mainboard: "getMainboardAssetPagination",
  memory: "getMemoryAssetPagination",
  gpu: "getGPUAssetPagination",
  network: "getNetworkAssetPagination",
}

const CATEGORY_LIST_KEYS: Record<HardwareCategory, [string, string]> = {
  cpu: ["cpu_list", "cpuList"],
  disk: ["disk_list", "diskList"],
  mainboard: ["mainboard_list", "mainboardList"],
  memory: ["memory_list", "memoryList"],
  gpu: ["gpu_list", "gpuList"],
  network: ["network_list", "networkList"],
}

interface BackendPagination {
  current_page?: number
  currentPage?: number
  page_size?: number
  pageSize?: number
  total_count?: number
  totalCount?: number
  total_pages?: number
  totalPages?: number
  has_previous?: boolean
  hasPrevious?: boolean
  has_next?: boolean
  hasNext?: boolean
}

interface BackendHardwareCategorySummary {
  category?: string
  model_count?: number
  modelCount?: number
  device_count?: number
  deviceCount?: number
  record_count?: number
  recordCount?: number
  host_count?: number
  hostCount?: number
  latest_collected_at?: number
  latestCollectedAt?: number
}

interface BackendHardwareSummary {
  model_count?: number
  modelCount?: number
  device_count?: number
  deviceCount?: number
  record_count?: number
  recordCount?: number
  covered_host_count?: number
  coveredHostCount?: number
  latest_collected_at?: number
  latestCollectedAt?: number
  categories?: BackendHardwareCategorySummary[]
}

interface BackendHardwareHostReference {
  agent_id?: string
  agentId?: string
  tenant_id?: string
  tenantId?: string
  hostname?: string
  os_type?: string
  osType?: string
  os_name?: string
  osName?: string
  os_version?: string
  osVersion?: string
  status?: string
  instance_hash?: string
  instanceHash?: string
  collected_at?: number
  collectedAt?: number
}

interface BackendAssetItem {
  agent_id?: string
  agentId?: string
  tenant_id?: string
  tenantId?: string
  hostname?: string
  os_type?: string
  osType?: string
  os_name?: string
  osName?: string
  os_version?: string
  osVersion?: string
  status?: string
  collected_at?: number
  collectedAt?: number
  model_hash?: string
  modelHash?: string
  host_count?: number
  hostCount?: number
  instance_count?: number
  instanceCount?: number
  hosts?: BackendHardwareHostReference[]
  cpu?: Record<string, unknown>
  disk?: Record<string, unknown>
  mainboard?: Record<string, unknown>
  memory?: Record<string, unknown>
  gpu?: Record<string, unknown>
  network?: Record<string, unknown>
}

interface BackendAssetData {
  pagination?: BackendPagination
  cpu_list?: BackendAssetItem[]
  cpuList?: BackendAssetItem[]
  disk_list?: BackendAssetItem[]
  diskList?: BackendAssetItem[]
  mainboard_list?: BackendAssetItem[]
  mainboardList?: BackendAssetItem[]
  memory_list?: BackendAssetItem[]
  memoryList?: BackendAssetItem[]
  gpu_list?: BackendAssetItem[]
  gpuList?: BackendAssetItem[]
  network_list?: BackendAssetItem[]
  networkList?: BackendAssetItem[]
}

function numberValue(value: unknown): number {
  return Number(value) || 0
}

function textValue(value: unknown, fallback = "-"): string {
  const text = typeof value === "string" || typeof value === "number" ? String(value).trim() : ""
  return text || fallback
}

function getField<T = unknown>(data: Record<string, unknown> | undefined, ...keys: string[]): T | undefined {
  if (!data) return undefined
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return data[key] as T
  }
  return undefined
}

function normalizeCategory(value?: string): HardwareCategory {
  const category = String(value || "").toLowerCase()
  if (category === "disk" || category === "mainboard" || category === "memory" || category === "gpu" || category === "network") {
    return category
  }
  return "cpu"
}

function normalizePagination(
  pagination: BackendPagination | undefined,
  page: number,
  pageSize: number,
  count: number,
): HardwarePagination {
  const totalCount = numberValue(pagination?.total_count ?? pagination?.totalCount ?? count)
  const totalPages = numberValue(pagination?.total_pages ?? pagination?.totalPages ?? Math.ceil(totalCount / pageSize))

  return {
    current_page: numberValue(pagination?.current_page ?? pagination?.currentPage ?? page) || page,
    page_size: numberValue(pagination?.page_size ?? pagination?.pageSize ?? pageSize) || pageSize,
    total_count: totalCount,
    total_pages: totalPages,
    has_previous: Boolean(pagination?.has_previous ?? pagination?.hasPrevious ?? page > 1),
    has_next: Boolean(pagination?.has_next ?? pagination?.hasNext ?? page < totalPages),
  }
}

function compactSpecs(specs: Array<[string, unknown, string?]>): Array<{ label: string; value: string }> {
  return specs
    .map(([label, value, suffix]) => ({
      label,
      value: value === undefined || value === null || value === "" ? "" : `${value}${suffix || ""}`,
    }))
    .filter((item) => item.value !== "" && item.value !== "0")
    .slice(0, 4)
}

function formatBytes(value: unknown): string {
  const bytes = numberValue(value)
  if (bytes <= 0) return ""
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size >= 10 || index === 0 ? Math.round(size) : size.toFixed(1)} ${units[index]}`
}

function adaptHost(host: BackendHardwareHostReference): HardwareHostReference {
  return {
    agent_id: host.agent_id || host.agentId || "",
    tenant_id: host.tenant_id || host.tenantId || "public",
    hostname: host.hostname || host.agent_id || host.agentId || "-",
    os_type: host.os_type || host.osType || "-",
    os_name: host.os_name || host.osName || "-",
    os_version: host.os_version || host.osVersion || "",
    status: host.status || "offline",
    instance_hash: host.instance_hash || host.instanceHash || "",
    collected_at: numberValue(host.collected_at ?? host.collectedAt),
  }
}

function adaptAssetItem(category: HardwareCategory, item: BackendAssetItem): HardwareAssetItem {
  const detail = (item[category] || {}) as Record<string, unknown>
  const modelHash = item.model_hash || item.modelHash || ""
  const collectedAt = numberValue(item.collected_at ?? item.collectedAt)
  const common = {
    id: `${category}-${modelHash || item.agent_id || item.agentId || collectedAt || "unknown"}`,
    category,
    model_hash: modelHash,
    device_count: numberValue(item.instance_count ?? item.instanceCount),
    host_count: numberValue(item.host_count ?? item.hostCount),
    collected_at: collectedAt,
    hosts: (item.hosts || []).map(adaptHost),
  }

  if (category === "cpu") {
    const title = textValue(getField(detail, "name"), "未知 CPU")
    const vendor = textValue(getField(detail, "vendor"), "-")
    return {
      ...common,
      title,
      vendor,
      subtitle: [vendor, `${numberValue(getField(detail, "physical_cores", "physicalCores"))} 核`, `${numberValue(getField(detail, "logical_cores", "logicalCores"))} 线程`].filter(Boolean).join(" · "),
      specs: compactSpecs([
        ["主频", getField(detail, "max_frequency_mhz", "maxFrequencyMhz"), " MHz"],
        ["插槽", getField(detail, "socket_id", "socketId")],
        ["处理器ID", getField(detail, "processor_id", "processorId")],
      ]),
    }
  }

  if (category === "disk") {
    const title = textValue(getField(detail, "model", "caption"), "未知磁盘")
    const vendor = textValue(getField(detail, "manufacturer"), "-")
    return {
      ...common,
      title,
      vendor,
      subtitle: [vendor, textValue(getField(detail, "interface_type", "interfaceType"), ""), textValue(getField(detail, "media_type", "mediaType"), ""), formatBytes(getField(detail, "size_bytes", "sizeBytes"))].filter(Boolean).join(" · "),
      specs: compactSpecs([
        ["容量", formatBytes(getField(detail, "size_bytes", "sizeBytes"))],
        ["接口", getField(detail, "interface_type", "interfaceType")],
        ["介质", getField(detail, "media_type", "mediaType")],
        ["序列号", getField(detail, "serial_number", "serialNumber")],
      ]),
    }
  }

  if (category === "mainboard") {
    const title = textValue(getField(detail, "product"), "未知主板")
    const vendor = textValue(getField(detail, "manufacturer"), "-")
    return {
      ...common,
      title,
      vendor,
      subtitle: [vendor, textValue(getField(detail, "version"), "")].filter(Boolean).join(" · "),
      specs: compactSpecs([
        ["版本", getField(detail, "version")],
        ["序列号", getField(detail, "serial_number", "serialNumber")],
      ]),
    }
  }

  if (category === "memory") {
    const title = textValue(getField(detail, "part_number", "partNumber"), "未知内存")
    const vendor = textValue(getField(detail, "manufacturer"), "-")
    return {
      ...common,
      title,
      vendor,
      subtitle: [vendor, formatBytes(getField(detail, "capacity_bytes", "capacityBytes")), `${numberValue(getField(detail, "speed_mhz", "speedMhz"))} MHz`].filter(Boolean).join(" · "),
      specs: compactSpecs([
        ["容量", formatBytes(getField(detail, "capacity_bytes", "capacityBytes"))],
        ["频率", getField(detail, "speed_mhz", "speedMhz"), " MHz"],
        ["槽位", getField(detail, "device_locator", "deviceLocator")],
        ["序列号", getField(detail, "serial_number", "serialNumber")],
      ]),
    }
  }

  if (category === "gpu") {
    const title = textValue(getField(detail, "name"), "未知显卡")
    const vendor = textValue(getField(detail, "vendor"), "-")
    return {
      ...common,
      title,
      vendor,
      subtitle: [vendor, formatBytes(getField(detail, "memory_bytes", "memoryBytes")), textValue(getField(detail, "driver_version", "driverVersion"), "")].filter(Boolean).join(" · "),
      specs: compactSpecs([
        ["显存", formatBytes(getField(detail, "memory_bytes", "memoryBytes"))],
        ["驱动", getField(detail, "driver_version", "driverVersion")],
        ["处理器", getField(detail, "video_processor", "videoProcessor")],
      ]),
    }
  }

  const title = textValue(getField(detail, "description"), "未知网卡")
  const vendor = textValue(getField(detail, "mac_address", "macAddress"), "-")
  return {
    ...common,
    title,
    vendor,
    subtitle: [textValue(getField(detail, "mac_address", "macAddress"), ""), getField(detail, "ip_enabled", "ipEnabled") ? "已启用" : "未启用"].filter(Boolean).join(" · "),
    specs: compactSpecs([
      ["MAC", getField(detail, "mac_address", "macAddress")],
      ["DNS", getField(detail, "dns_domain", "dnsDomain")],
      ["DHCP", getField(detail, "dhcp_server", "dhcpServer")],
    ]),
  }
}

function adaptSummary(data: BackendHardwareSummary): HardwareSummary {
  return {
    model_count: numberValue(data.model_count ?? data.modelCount),
    device_count: numberValue(data.device_count ?? data.deviceCount),
    record_count: numberValue(data.record_count ?? data.recordCount),
    covered_host_count: numberValue(data.covered_host_count ?? data.coveredHostCount),
    latest_collected_at: numberValue(data.latest_collected_at ?? data.latestCollectedAt),
    categories: (data.categories || []).map((item): HardwareCategorySummary => ({
      category: normalizeCategory(item.category),
      model_count: numberValue(item.model_count ?? item.modelCount),
      device_count: numberValue(item.device_count ?? item.deviceCount),
      record_count: numberValue(item.record_count ?? item.recordCount),
      host_count: numberValue(item.host_count ?? item.hostCount),
      latest_collected_at: numberValue(item.latest_collected_at ?? item.latestCollectedAt),
    })),
  }
}

export async function getHardwareSummary({ tenantId = "public" }: { tenantId?: string } = {}): Promise<HardwareSummary> {
  const result = await http.post("getHardwareSummary", {
    request_id: createRequestId(),
    tenant_id: tenantId,
  })

  return adaptSummary((result.data || {}) as BackendHardwareSummary)
}

export async function getHardwareAssetPagination({
  tenantId = "public",
  category,
  keyword,
  page,
  pageSize,
}: {
  tenantId?: string
  category: HardwareCategory
  keyword?: string
  page: number
  pageSize: number
}): Promise<HardwareAssetResult> {
  const result = await http.post(CATEGORY_ENDPOINTS[category], {
    request_id: createRequestId(),
    tenant_id: tenantId,
    page,
    page_size: pageSize,
    ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
  })

  const data = (result.data || {}) as BackendAssetData
  const [snakeKey, camelKey] = CATEGORY_LIST_KEYS[category]
  const list = ((data[snakeKey as keyof BackendAssetData] || data[camelKey as keyof BackendAssetData] || []) as BackendAssetItem[])
    .map((item) => adaptAssetItem(category, item))

  return {
    assets: list,
    pagination: normalizePagination(data.pagination, page, pageSize, list.length),
  }
}
