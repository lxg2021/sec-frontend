import type { CategoryGroup } from "../api"

export const FALLBACK_ITEM_PAGE_SIZE = 15
export const TABLE_ROW_HEIGHT = 46

export const PROGRESS_TONE_META = {
  emerald: {
    color: "#10b981",
    trackClass: "bg-emerald-100",
    fillClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  },
  teal: {
    color: "#14b8a6",
    trackClass: "bg-teal-100",
    fillClass: "bg-teal-500",
    textClass: "text-teal-600",
  },
  yellow: {
    color: "#eab308",
    trackClass: "bg-yellow-100",
    fillClass: "bg-yellow-500",
    textClass: "text-yellow-600",
  },
  orange: {
    color: "#f97316",
    trackClass: "bg-orange-100",
    fillClass: "bg-orange-500",
    textClass: "text-orange-600",
  },
  rose: {
    color: "#f43f5e",
    trackClass: "bg-rose-100",
    fillClass: "bg-rose-500",
    textClass: "text-rose-600",
  },
} as const

export type CategoryProgressTone = keyof typeof PROGRESS_TONE_META

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

export function getCategoryLabel(category: CategoryGroup, locale: string) {
  const useZh = isZhLocale(locale)
  return (useZh ? category.category_zh : category.category) || category.category || category.category_zh || "Unknown"
}

export function getItemLabel(item: CategoryGroup["items"][number], locale: string) {
  const useZh = isZhLocale(locale)
  return (useZh ? item.name_zh : item.name) || item.name || item.name_zh || item.item_id
}

export function getItemSearchText(item: CategoryGroup["items"][number]) {
  return [item.name, item.name_zh, item.item_id].filter(Boolean).join(" ").toLowerCase()
}

export function getAveragePassRate(category: CategoryGroup) {
  if (!category.items.length) return 0
  const total = category.items.reduce((sum, item) => sum + Number(item.passed_rate || 0), 0)
  return Math.round(total / category.items.length)
}

function normalizeCategoryKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function getCategorySeverityMix(category: CategoryGroup) {
  return category.items.reduce(
    (acc, item) => {
      acc.total += 1
      const severity = (item.severity || "").trim().toLowerCase()
      if (severity === "high") acc.high += 1
      else if (severity === "medium") acc.medium += 1
      else acc.low += 1
      return acc
    },
    { total: 0, high: 0, medium: 0, low: 0 },
  )
}

export function severityClass(severity: string) {
  const normalized = severity.toLowerCase()
  if (normalized === "high") {
    return {
      container: "border-red-200/70 bg-red-50/60 text-red-700",
      strip: "bg-red-500",
    }
  }
  if (normalized === "medium") {
    return {
      container: "border-amber-200/70 bg-amber-50/60 text-amber-700",
      strip: "bg-amber-500",
    }
  }
  return {
    container: "border-emerald-200/70 bg-emerald-50/60 text-emerald-700",
    strip: "bg-emerald-500",
  }
}

export function getCategoryIconName(category: CategoryGroup) {
  const normalizedCategory = normalizeCategoryKey(category.category || "")
  const normalizedCategoryZh = normalizeCategoryKey(category.category_zh || "")
  const iconName =
    BASELINE_CATEGORY_ICON_MAP[normalizedCategory] ?? BASELINE_CATEGORY_ICON_MAP[normalizedCategoryZh] ?? "default"

  return VALID_CATEGORY_ICON_NAMES.has(iconName) ? iconName : "default"
}

export function getCategoryRiskScore(category: CategoryGroup, maxItemCount: number) {
  const rate = getAveragePassRate(category)
  const mix = getCategorySeverityMix(category)
  const total = Math.max(mix.total, 1)
  const safeMaxItemCount = Math.max(maxItemCount, 1)
  const failedRateIndex = 1 - Math.max(0, Math.min(100, rate)) / 100
  const severityIndex = (mix.high * 3 + mix.medium * 2 + mix.low) / (total * 3)
  const countIndex = Math.log1p(total) / Math.log1p(safeMaxItemCount)

  return failedRateIndex * 0.55 + severityIndex * 0.3 + countIndex * 0.15
}

export function getCategoryProgressMeta(category: CategoryGroup, tone: CategoryProgressTone) {
  const rate = getAveragePassRate(category)
  const toneMeta = PROGRESS_TONE_META[tone]
  return {
    rate,
    tone,
    trackClass: toneMeta.trackClass,
    fillClass: toneMeta.fillClass,
    textClass: toneMeta.textClass,
    color: toneMeta.color,
  }
}

export function getTotalPages(itemCount: number, pageSize: number) {
  return Math.max(Math.ceil(itemCount / Math.max(pageSize, 1)), 1)
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), totalPages)
}

export function calculateAlignedItemPagination({
  shouldAlignWithLeftPagination,
  tableContainerTop,
  tableBodyTop,
  limitTop,
  rowHeight,
  itemCount,
  fallbackPageSize = FALLBACK_ITEM_PAGE_SIZE,
}: {
  shouldAlignWithLeftPagination: boolean
  tableContainerTop: number
  tableBodyTop: number
  limitTop: number
  rowHeight: number
  itemCount: number
  fallbackPageSize?: number
}) {
  if (
    !shouldAlignWithLeftPagination ||
    !tableContainerTop ||
    !tableBodyTop ||
    !limitTop ||
    limitTop <= tableContainerTop ||
    itemCount <= 0
  ) {
    return {
      tableHeight: null,
      pageSize: fallbackPageSize,
    }
  }

  const safeRowHeight = Math.max(rowHeight || TABLE_ROW_HEIGHT, 1)
  const tableHeight = Math.max(Math.floor(limitTop - tableContainerTop), 0)
  const availableRowsHeight = Math.max(limitTop - tableBodyTop - 1, 0)
  const rowsUntilLeftPagination = Math.max(1, Math.floor(availableRowsHeight / safeRowHeight))

  return {
    tableHeight,
    pageSize: Math.min(itemCount, rowsUntilLeftPagination),
  }
}
