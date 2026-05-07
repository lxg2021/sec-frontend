import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import { AgentStatus, SystemType } from "./types/system-info"
import type { AgentHardwareInfo } from "./types/hardware"
import type { HostSummary } from "./types/host-summary"
import type { AgentSoftInfo, Software } from "./types/software"
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

interface BackendHardwareInfo {
  agent_id?: string
  cpus?: Array<{
    socket_id?: string
    name?: string
    vendor?: string
    physical_cores?: number
    logical_cores?: number
    max_frequency_mhz?: number
    current_frequency_mhz?: number
    l2_cache_size_bytes?: number
    l3_cache_size_bytes?: number
  }>
  disks?: Array<{
    device_id?: string
    caption?: string
    model?: string
    manufacturer?: string
    serial_number?: string
    size_bytes?: number
  }>
  mainboard?: {
    manufacturer?: string
    product?: string
    version?: string
    serial_number?: string
  }
  memory?: Array<{
    manufacturer?: string
    part_number?: string
    serial_number?: string
    capacity_bytes?: number
    speed_mhz?: number
    device_locator?: string
  }>
  gpus?: Array<{
    device_id?: string
    name?: string
    vendor?: string
    driver_version?: string
    memory_bytes?: number
  }>
  network_interfaces?: Array<{
    interface_index?: number
    description?: string
    mac_address?: string
    ip_address?: string[]
    ip_enabled?: boolean
  }>
}

interface BackendSoftwareInfo {
  display_name?: string
  description?: string
  identifying_number?: string
  install_date?: string
  install_location?: string
  install_state?: number
  name?: string
  package_cache?: string
  sku_number?: string
  vendor?: string
  version?: string
  uninstall_string?: string
  quiet_uninstall_string?: string
  url_info_about?: string
}

interface BackendPaginatedSoftwareData {
  software_list?: BackendSoftwareInfo[]
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

export interface HostSoftwarePaginationResult {
  software: AgentSoftInfo
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

function bytesToMiB(value?: number) {
  return Math.round((Number(value) || 0) / 1024 / 1024)
}

function adaptHardwareInfo(data: BackendHardwareInfo, host?: AgentInfo | null): AgentHardwareInfo {
  return {
    hostId: data.agent_id || host?.hostId || "",
    hostname: host?.hostname || data.agent_id || "-",
    cpu: {
      sockets: (data.cpus || []).map((cpu, index) => ({
        socketId: cpu.socket_id || `CPU ${index + 1}`,
        vendor: cpu.vendor || "-",
        model: cpu.name || "-",
        physicalCores: Number(cpu.physical_cores) || 0,
        logicalCores: Number(cpu.logical_cores) || 0,
        maxFrequencyMHz: Number(cpu.max_frequency_mhz) || 0,
        regularFrequencyMHz: 0,
        minFrequencyMHz: 0,
        currentFrequencyMHz: Number(cpu.current_frequency_mhz) || 0,
        cacheSizeBytes: Number(cpu.l3_cache_size_bytes || cpu.l2_cache_size_bytes) || 0,
      })),
    },
    disks: {
      disks: (data.disks || []).map((disk) => ({
        vendor: disk.manufacturer || "-",
        model: disk.model || disk.caption || "-",
        serialNumber: disk.serial_number || disk.device_id || "-",
        size: Number(disk.size_bytes) || 0,
      })),
    },
    gpus: {
      gpus: (data.gpus || []).map((gpu, index) => ({
        id: gpu.device_id || `GPU ${index + 1}`,
        vendor: gpu.vendor || "-",
        model: gpu.name || "-",
        driverVersion: gpu.driver_version || "-",
        memoryMiB: bytesToMiB(gpu.memory_bytes),
        minFrequencyMHz: 0,
        currentFrequencyMHz: 0,
        maxFrequencyMHz: 0,
      })),
    },
    mainBoard: {
      vendor: data.mainboard?.manufacturer || "-",
      name: data.mainboard?.product || "-",
      version: data.mainboard?.version || "-",
      serialNumber: data.mainboard?.serial_number || "-",
    },
    rams: (data.memory || []).map((memory, index) => ({
      vendor: memory.manufacturer || "-",
      model: memory.part_number || "-",
      name: memory.device_locator || `Memory ${index + 1}`,
      serialNumber: memory.serial_number || "-",
      sizeMiB: bytesToMiB(memory.capacity_bytes),
      usedMiB: 0,
      availableMiB: bytesToMiB(memory.capacity_bytes),
    })),
    networkInterfaces: {
      interfaces: (data.network_interfaces || []).map((network, index) => ({
        id: String(network.interface_index ?? index),
        name: network.description || `Interface ${index + 1}`,
        vendor: "-",
        macAddress: network.mac_address || "-",
        ipv4Addresses: network.ip_address || [],
        ipv6Addresses: [],
        enabled: Boolean(network.ip_enabled),
        speedMbps: 0,
      })),
    },
  }
}

function hasBackendHardwareInfo(data: BackendHardwareInfo): boolean {
  return Boolean(
    data.cpus?.length ||
      data.disks?.length ||
      data.memory?.length ||
      data.gpus?.length ||
      data.network_interfaces?.length ||
      data.mainboard?.manufacturer ||
      data.mainboard?.product ||
      data.mainboard?.version ||
      data.mainboard?.serial_number
  )
}

function adaptSoftwareInfo(item: BackendSoftwareInfo): Software {
  return {
    displayName: item.display_name || item.name || "-",
    description: item.description || "",
    identifyingNumber: item.identifying_number || "",
    installDate: item.install_date || "",
    installLocation: item.install_location || "",
    installState: Number(item.install_state) || 0,
    name: item.name || item.display_name || "-",
    packageCache: item.package_cache || "",
    skuNumber: item.sku_number || "",
    vendor: item.vendor || "",
    version: item.version || "",
    uninstallString: item.uninstall_string || "",
    quietUninstallString: item.quiet_uninstall_string || "",
    urlInfoAbout: item.url_info_about || "",
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

export async function getHardwareInfo({
  tenantId = "public",
  agentId,
  host,
}: {
  tenantId?: string
  agentId: string
  host?: AgentInfo | null
}): Promise<AgentHardwareInfo | null> {
  try {
    const result = await http.post("getHardwareInfo", {
      request_id: createRequestId(),
      tenant_id: tenantId,
      agent_id: agentId,
    })

    const data = (result.data || {}) as BackendHardwareInfo

    if (!hasBackendHardwareInfo(data)) {
      return null
    }

    return adaptHardwareInfo(data, host)
  } catch (error) {
    const status = Number((error as { status?: unknown })?.status)
    const code = Number((error as { code?: unknown })?.code)

    if (status === 404 || code === 404) {
      return null
    }

    throw error
  }
}

export async function getHostSoftwareInfoPagination({
  tenantId = "public",
  agentId,
  hostname,
  page,
  pageSize,
}: {
  tenantId?: string
  agentId: string
  hostname?: string
  page: number
  pageSize: number
}): Promise<HostSoftwarePaginationResult> {
  const result = await http.post("getHostSoftwareInfoPagination", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    agent_id: agentId,
    page,
    page_size: pageSize,
  })

  const data = (result.data || {}) as BackendPaginatedSoftwareData
  const softwareList = (data.software_list || []).map(adaptSoftwareInfo)

  return {
    software: {
      hostId: agentId,
      hostname: hostname || agentId,
      softwareList,
    },
    pagination: normalizePagination(data.pagination, page, pageSize, softwareList.length),
  }
}
