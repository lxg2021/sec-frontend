import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

interface ApiResult<T> {
  data: T
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export interface BaselineTemplate {
  uuid: string
  baseline_uuid: string
  display_name: string
  original_filename: string
  standard: string
  product: string
  os_version: string
  baseline_version: string
  profile: string
  item_count: number
  low_count: number
  medium_count: number
  high_count: number
  baseline_type: string
  description: string
  latest_check_time: string
  host_count: number
}

export interface BaselineTemplateItem {
  template_uuid: string
  id: string
  category: string
  category_zh: string
  name: string
  name_zh: string
  severity: string
  method: string
  method_argument: string
  registry_path: string
  registry_item: string
  registry_path_intune: string
  registry_path_dcp: string
  registry_item_intune: string
  class_name: string
  namespace: string
  property: string
  default_value: string
  default_value_intune: string
  recommended_value: string
  recommended_value_intune: string
  operator: string
  operator_intune: string
  filter: string
  description: string
  description_en?: string
  references: string
}

export interface BaselineTemplateCategoryGroup {
  category: string
  category_zh: string
  item_count: number
  items: BaselineTemplateItem[]
}

export interface BaselineTemplateSeverityStat {
  severity: string
  count: number
  percentage: number
}

export interface BaselineTemplateItemsData {
  template_info: BaselineTemplate
  category_groups: BaselineTemplateCategoryGroup[]
  severity_statistics: BaselineTemplateSeverityStat[]
  total_count: number
}

export interface CreateCustomBaselineSelection {
  template_uuid: string
  item_ids: string[]
}

export interface CreateCustomBaselineRequest {
  display_name: string
  description: string
  standard: string
  product: string
  os_version: string
  baseline_version: string
  profile: string
  selected_items: CreateCustomBaselineSelection[]
}

export interface CreateCustomBaselineResult {
  baseline_uuid: string
  display_name: string
  description: string
  item_count: number
  template_count: number
  created_at: string
}

function normalizeTemplate(value: unknown): BaselineTemplate {
  const record = asRecord(value)
  const uuid = stringValue(record.uuid ?? record.baseline_uuid ?? record.template_uuid)

  return {
    uuid,
    baseline_uuid: uuid,
    display_name: stringValue(record.display_name ?? record.name ?? record.title, uuid),
    original_filename: stringValue(record.original_filename ?? record.filename),
    standard: stringValue(record.standard),
    product: stringValue(record.product),
    os_version: stringValue(record.os_version),
    baseline_version: stringValue(record.baseline_version),
    profile: stringValue(record.profile),
    item_count: numberValue(record.item_count ?? record.total_count),
    low_count: numberValue(record.low_count),
    medium_count: numberValue(record.medium_count),
    high_count: numberValue(record.high_count),
    baseline_type: stringValue(record.baseline_type ?? record.type),
    description: stringValue(record.description),
    latest_check_time: stringValue(record.latest_check_time ?? record.updated_at ?? record.created_at),
    host_count: numberValue(record.host_count),
  }
}

function normalizeItem(value: unknown): BaselineTemplateItem {
  const record = asRecord(value)
  const id = stringValue(record.id ?? record.item_id ?? record.template_item_id)

  return {
    template_uuid: stringValue(record.template_uuid ?? record.baseline_uuid),
    id,
    category: stringValue(record.category),
    category_zh: stringValue(record.category_zh ?? record.category_name ?? record.category),
    name: stringValue(record.name),
    name_zh: stringValue(record.name_zh ?? record.display_name ?? record.name, id),
    severity: stringValue(record.severity, "Low"),
    method: stringValue(record.method),
    method_argument: stringValue(record.method_argument),
    registry_path: stringValue(record.registry_path),
    registry_item: stringValue(record.registry_item),
    registry_path_intune: stringValue(record.registry_path_intune),
    registry_path_dcp: stringValue(record.registry_path_dcp),
    registry_item_intune: stringValue(record.registry_item_intune),
    class_name: stringValue(record.class_name),
    namespace: stringValue(record.namespace),
    property: stringValue(record.property),
    default_value: stringValue(record.default_value),
    default_value_intune: stringValue(record.default_value_intune),
    recommended_value: stringValue(record.recommended_value),
    recommended_value_intune: stringValue(record.recommended_value_intune),
    operator: stringValue(record.operator),
    operator_intune: stringValue(record.operator_intune),
    filter: stringValue(record.filter),
    description: stringValue(record.description),
    description_en: typeof record.description_en === "string" ? record.description_en : undefined,
    references: stringValue(record.references),
  }
}

function normalizeGroup(value: unknown): BaselineTemplateCategoryGroup {
  const record = asRecord(value)
  const items = normalizeArray<BaselineTemplateItem>(record.items ?? record.rules).map(normalizeItem)

  return {
    category: stringValue(record.category),
    category_zh: stringValue(record.category_zh ?? record.category_name ?? record.category),
    item_count: numberValue(record.item_count, items.length),
    items,
  }
}

function normalizeSeverityStat(value: unknown): BaselineTemplateSeverityStat {
  const record = asRecord(value)

  return {
    severity: stringValue(record.severity),
    count: numberValue(record.count),
    percentage: numberValue(record.percentage),
  }
}

function normalizeItemsData(value: unknown): BaselineTemplateItemsData {
  if (Array.isArray(value)) {
    const categoryGroups = value.map(normalizeGroup)

    return {
      template_info: normalizeTemplate({}),
      category_groups: categoryGroups,
      severity_statistics: [],
      total_count: categoryGroups.reduce((sum, group) => sum + group.item_count, 0),
    }
  }

  const record = asRecord(value)
  const categoryGroups = normalizeArray(record.category_groups ?? record.groups ?? record.categories).map(normalizeGroup)
  const severityStatistics = normalizeArray(record.severity_statistics ?? record.severity_stats).map(normalizeSeverityStat)
  const totalCount = numberValue(record.total_count ?? record.item_count, categoryGroups.reduce((sum, group) => sum + group.item_count, 0))

  return {
    template_info: normalizeTemplate(record.template_info ?? record.template ?? record.baseline_template ?? record.template_info_data ?? {}),
    category_groups: categoryGroups,
    severity_statistics: severityStatistics,
    total_count: totalCount,
  }
}

function normalizeCreateResult(value: unknown): CreateCustomBaselineResult {
  const record = asRecord(value)

  return {
    baseline_uuid: stringValue(record.baseline_uuid ?? record.uuid),
    display_name: stringValue(record.display_name ?? record.name),
    description: stringValue(record.description),
    item_count: numberValue(record.item_count),
    template_count: numberValue(record.template_count),
    created_at: stringValue(record.created_at ?? record.create_time ?? new Date().toISOString()),
  }
}

export async function getAllBaselineTemplates(): Promise<BaselineTemplate[]> {
  const result = (await http.post("getAllBaselineTemplates", {
    request_id: createRequestId(),
  })) as ApiResult<unknown>

  if (Array.isArray(result.data)) {
    return result.data.map(normalizeTemplate)
  }

  const record = asRecord(result.data)
  return normalizeArray<unknown>(record.templates ?? record.list ?? record.items).map(normalizeTemplate)
}

export async function getBaselineTemplateItems(templateUuid: string): Promise<BaselineTemplateItemsData | null> {
  const result = (await http.post("getBaselineTemplateItems", {
    request_id: createRequestId(),
    template_uuid: templateUuid,
    baseline_uuid: templateUuid,
  })) as ApiResult<unknown>

  if (!result.data) return null

  return normalizeItemsData(result.data)
}

export async function createCustomBaseline(payload: CreateCustomBaselineRequest): Promise<CreateCustomBaselineResult> {
  const result = (await http.post("createCustomBaseline", {
    request_id: createRequestId(),
    ...payload,
  })) as ApiResult<unknown>

  return normalizeCreateResult(result.data)
}
