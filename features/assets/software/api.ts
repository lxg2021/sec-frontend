import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type { InstallState, SoftItem, SoftwareInstallation } from "@/features/assets/software/types/software-aggregate"

export interface SoftwarePagination {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous: boolean
  has_next: boolean
}

export interface SoftwareDistributionResult {
  software: SoftItem[]
  pagination: SoftwarePagination
}

export interface SoftwareSummary {
  software_count: number
  installation_count: number
  host_count: number
  vendor_count: number
  missing_website_count: number
}

interface BackendSoftwareSummary {
  software_count?: number
  softwareCount?: number
  installation_count?: number
  installationCount?: number
  host_count?: number
  hostCount?: number
  vendor_count?: number
  vendorCount?: number
  missing_website_count?: number
  missingWebsiteCount?: number
}

interface BackendSoftwareInstallation {
  agent_id?: string
  agentId?: string
  hostname?: string
  install_date?: string
  installDate?: string
  install_location?: string
  installLocation?: string
  install_state?: number
  installState?: number
  package_cache?: string
  packageCache?: string
  uninstall_string?: string
  uninstallString?: string
  quiet_uninstall_string?: string
  quietUninstallString?: string
}

interface BackendSoftItem {
  display_name?: string
  displayName?: string
  description?: string
  identifying_number?: string
  identifyingNumber?: string
  name?: string
  sku_number?: string
  skuNumber?: string
  vendor?: string
  version?: string
  url_info_about?: string
  urlInfoAbout?: string
  software_hash?: string
  softwareHash?: string
  installations?: BackendSoftwareInstallation[]
}

interface BackendSoftwareDistributionData {
  software_list?: BackendSoftItem[]
  softwareList?: BackendSoftItem[]
  pagination?: Partial<SoftwarePagination> & {
    currentPage?: number
    pageSize?: number
    totalCount?: number
    totalPages?: number
    hasPrevious?: boolean
    hasNext?: boolean
  }
}

function compactOptional(value?: string | null): string | undefined {
  const text = value?.trim() || ""
  return text ? text : undefined
}

function normalizeInstallState(value?: number): InstallState {
  switch (Number(value)) {
    case 2:
      return "NotInstalled"
    case 3:
      return "PartiallyInstalled"
    case 4:
      return "Failed"
    case 1:
    case 5:
    default:
      return "Installed"
  }
}

function adaptInstallation(item: BackendSoftwareInstallation): SoftwareInstallation {
  return {
    hostId: item.agent_id || item.agentId || "",
    hostname: item.hostname || "-",
    installDate: compactOptional(item.install_date || item.installDate),
    installLocation: compactOptional(item.install_location || item.installLocation),
    installState: normalizeInstallState(item.install_state ?? item.installState),
    packageCache: compactOptional(item.package_cache || item.packageCache),
    uninstallString: compactOptional(item.uninstall_string || item.uninstallString),
    quietUninstallString: compactOptional(item.quiet_uninstall_string || item.quietUninstallString),
  }
}

function adaptSoftItem(item: BackendSoftItem): SoftItem {
  const hash = item.software_hash || item.softwareHash || ""
  const displayName = item.display_name || item.displayName || item.name || "-"

  return {
    displayName,
    description: compactOptional(item.description),
    identifyingNumber: item.identifying_number || item.identifyingNumber || hash,
    name: item.name || displayName,
    skuNumber: compactOptional(item.sku_number || item.skuNumber),
    vendor: item.vendor || "-",
    version: item.version || "-",
    urlInfoAbout: compactOptional(item.url_info_about || item.urlInfoAbout),
    hash,
    installations: (item.installations || []).map(adaptInstallation),
  }
}

function normalizePagination(
  pagination: BackendSoftwareDistributionData["pagination"],
  page: number,
  pageSize: number,
  count: number,
): SoftwarePagination {
  const totalCount = Number(pagination?.total_count ?? pagination?.totalCount ?? count) || 0
  const totalPages = Number(pagination?.total_pages ?? pagination?.totalPages ?? Math.ceil(totalCount / pageSize)) || 0

  return {
    current_page: Number(pagination?.current_page ?? pagination?.currentPage ?? page) || page,
    page_size: Number(pagination?.page_size ?? pagination?.pageSize ?? pageSize) || pageSize,
    total_count: totalCount,
    total_pages: totalPages,
    has_previous: Boolean(pagination?.has_previous ?? pagination?.hasPrevious ?? page > 1),
    has_next: Boolean(pagination?.has_next ?? pagination?.hasNext ?? page < totalPages),
  }
}

function normalizeCount(value: unknown): number {
  return Number(value) || 0
}

function adaptSoftwareSummary(data: BackendSoftwareSummary): SoftwareSummary {
  return {
    software_count: normalizeCount(data.software_count ?? data.softwareCount),
    installation_count: normalizeCount(data.installation_count ?? data.installationCount),
    host_count: normalizeCount(data.host_count ?? data.hostCount),
    vendor_count: normalizeCount(data.vendor_count ?? data.vendorCount),
    missing_website_count: normalizeCount(data.missing_website_count ?? data.missingWebsiteCount),
  }
}

export async function getSoftwareDistributionPagination({
  tenantId = "public",
  page,
  pageSize,
  name,
  vendor,
  version,
}: {
  tenantId?: string
  page: number
  pageSize: number
  name?: string
  vendor?: string
  version?: string
}): Promise<SoftwareDistributionResult> {
  const result = await http.post("getSoftwareDistributionPagination", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    page,
    page_size: pageSize,
    ...(compactOptional(name) ? { name: compactOptional(name) } : {}),
    ...(compactOptional(vendor) ? { vendor: compactOptional(vendor) } : {}),
    ...(compactOptional(version) ? { version: compactOptional(version) } : {}),
  })

  const data = (result.data || {}) as BackendSoftwareDistributionData
  const software = (data.software_list || data.softwareList || []).map(adaptSoftItem)

  return {
    software,
    pagination: normalizePagination(data.pagination, page, pageSize, software.length),
  }
}

export async function getSoftwareSummary({
  tenantId = "public",
}: {
  tenantId?: string
} = {}): Promise<SoftwareSummary> {
  const result = await http.post("getSoftwareSummary", {
    request_id: createRequestId(),
    tenant_id: tenantId,
  })

  return adaptSoftwareSummary((result.data || {}) as BackendSoftwareSummary)
}
