import type {
  BaselineTemplate,
  BaselineTemplateCategoryGroup,
  BaselineTemplateItem,
} from "../api"

const BASELINE_CATEGORY_ICON_MAP: Record<string, string> = {
  "account policies": "account-policies",
  "账户策略": "account-policies",
  "administrative templates: control panel": "control-panel",
  "管理模板：控制面板": "control-panel",
  "administrative templates: network": "network",
  "管理模板：网络": "network",
  "administrative templates: powershellcore": "powershell",
  "管理模板：windows powershell": "powershell",
  "administrative templates: printers": "printers",
  "管理模板：打印机": "printers",
  "administrative templates: start menu and taskbar": "start-menu",
  "管理模板：开始菜单和任务栏": "start-menu",
  "administrative templates: system": "system",
  "管理模板：系统": "system",
  "administrative templates: windows components": "windows-components",
  "管理模板：windows 组件": "windows-components",
  "管理模板：windows组件": "windows-components",
  "advanced audit policy configuration": "audit-policy",
  "高级审核策略配置": "audit-policy",
  features: "features",
  "功能": "features",
  "microsoft defender exploit guard": "defender",
  "ms security guide": "security-guide",
  "ms安全指南": "security-guide",
  "ms 安全指南": "security-guide",
  "mss (legacy)": "mss-legacy",
  "mss(旧版)": "mss-legacy",
  "mss（旧版）": "mss-legacy",
  "scheduled task": "scheduled-task",
  "计划任务": "scheduled-task",
  "security options": "security-options",
  "安全选项": "security-options",
  "system services": "system-services",
  "系统服务": "system-services",
  "user rights assignment": "user-rights",
  "用户权限分配": "user-rights",
  "windows firewall": "firewall",
  "windows防火墙": "firewall",
  "windows 防火墙": "firewall",
}

const VALID_CATEGORY_ICON_NAMES = new Set([...Object.values(BASELINE_CATEGORY_ICON_MAP), "default"])

export function isZhLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh")
}

export function getTemplateLabel(template: BaselineTemplate) {
  return template.display_name || template.original_filename || template.uuid || ""
}

export function getCategoryLabel(group: BaselineTemplateCategoryGroup, useZh: boolean) {
  return (useZh ? group.category_zh : group.category) || group.category || group.category_zh || "Unknown"
}

function normalizeCategoryKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
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

export function getCategoryIconName(group: Pick<BaselineTemplateCategoryGroup, "category" | "category_zh">) {
  const normalizedCategory = normalizeCategoryKey(group.category || "")
  const normalizedCategoryZh = normalizeCategoryKey(group.category_zh || "")
  const iconName =
    BASELINE_CATEGORY_ICON_MAP[normalizedCategory] ?? BASELINE_CATEGORY_ICON_MAP[normalizedCategoryZh] ?? "default"

  return VALID_CATEGORY_ICON_NAMES.has(iconName) ? iconName : "default"
}

export function getSeverityLabel(severity: string, useZh: boolean) {
  const normalized = severity.toLowerCase()

  if (normalized === "high") return useZh ? "高" : "High"
  if (normalized === "medium") return useZh ? "中" : "Medium"
  return useZh ? "低" : "Low"
}
