import type {
  BaselineTemplate,
  BaselineTemplateCategoryGroup,
  BaselineTemplateItem,
} from "../api"

export function isZhLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh")
}

export function getTemplateLabel(template: BaselineTemplate) {
  return template.display_name || template.original_filename || template.uuid || ""
}

export function getCategoryLabel(group: BaselineTemplateCategoryGroup, useZh: boolean) {
  return (useZh ? group.category_zh : group.category) || group.category || group.category_zh || "Unknown"
}

export function getItemLabel(item: BaselineTemplateItem, useZh: boolean) {
  return (useZh ? item.name_zh : item.name) || item.name || item.name_zh || item.id
}

export function getItemDescription(item: BaselineTemplateItem, useZh: boolean) {
  return useZh ? item.description || item.description_en || item.name : item.description_en || item.description || item.name
}

export function getRecommendedValue(item: BaselineTemplateItem) {
  return item.recommended_value || item.recommended_value_intune || ""
}

export function getSeverityLabel(severity: string, useZh: boolean) {
  const normalized = severity.toLowerCase()

  if (normalized === "high") return useZh ? "高" : "High"
  if (normalized === "medium") return useZh ? "中" : "Medium"
  return useZh ? "低" : "Low"
}

