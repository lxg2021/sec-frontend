import type { ComponentType } from "react"

export type HardwareCategory = "cpu" | "disk" | "mainboard" | "memory" | "gpu" | "network"

export interface HardwarePagination {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous: boolean
  has_next: boolean
}

export interface HardwareCategorySummary {
  category: HardwareCategory
  model_count: number
  device_count: number
  record_count: number
  host_count: number
  latest_collected_at: number
}

export interface HardwareSummary {
  model_count: number
  device_count: number
  record_count: number
  covered_host_count: number
  latest_collected_at: number
  categories: HardwareCategorySummary[]
}

export interface HardwareHostReference {
  agent_id: string
  tenant_id: string
  hostname: string
  os_type: string
  os_name: string
  os_version: string
  status: string
  instance_hash: string
  collected_at: number
}

export interface HardwareAssetItem {
  id: string
  category: HardwareCategory
  model_hash: string
  title: string
  subtitle: string
  vendor: string
  device_count: number
  host_count: number
  collected_at: number
  hosts: HardwareHostReference[]
  specs: Array<{
    label: string
    value: string
  }>
}

export interface HardwareAssetResult {
  assets: HardwareAssetItem[]
  pagination: HardwarePagination
}

export interface HardwareCategoryMeta {
  value: HardwareCategory
  label: string
  icon: ComponentType<{ className?: string }>
  color: string
  softClassName: string
}
