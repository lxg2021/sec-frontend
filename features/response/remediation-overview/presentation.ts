import {
  RemediationSourceType,
  type ProtoEnum,
  type UInt64,
} from "@/features/attack/remediation-order"

export const ORDER_STATUS_FILTERS = [
  "draft",
  "prepared",
  "running",
  "completed",
  "canceled",
  "expired",
] as const

export type OrderStatusFilter = "all" | (typeof ORDER_STATUS_FILTERS)[number]
export type SourceTypeFilter = "all" | RemediationSourceType

export function countNumber(value: UInt64 | number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function formatCount(value: UInt64 | number, locale: string) {
  try {
    return new Intl.NumberFormat(locale).format(BigInt(value))
  } catch {
    return new Intl.NumberFormat(locale).format(countNumber(value))
  }
}

export function formatTimestamp(value: string, locale: string) {
  if (!value.trim()) return "-"
  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(parsed)
    : value
}

export function formatTrendDate(value: string, locale: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(parsed)
    : value
}

export function shortId(value: string, left = 8, right = 4) {
  const normalized = value.trim()
  if (!normalized) return "-"
  if (normalized.length <= left + right + 3) return normalized
  return `${normalized.slice(0, left)}...${normalized.slice(-right)}`
}

export function remediationSourceType(value: ProtoEnum): RemediationSourceType | null {
  const normalized = String(value).trim().toLowerCase()
  if (normalized === "1" || normalized.endsWith("case_graph")) return RemediationSourceType.CaseGraph
  if (normalized === "2" || normalized.endsWith("drill_graph")) return RemediationSourceType.DrillGraph
  if (normalized === "3" || normalized.endsWith("locate_graph")) return RemediationSourceType.LocateGraph
  return null
}

export function sourceTranslationKey(value: ProtoEnum) {
  switch (remediationSourceType(value)) {
    case RemediationSourceType.CaseGraph:
      return "caseGraph" as const
    case RemediationSourceType.DrillGraph:
      return "drillGraph" as const
    case RemediationSourceType.LocateGraph:
      return "locateGraph" as const
    default:
      return "unknown" as const
  }
}

export function sourceReference(source: {
  source_ref_id: string
  case_id: string
  workflow_id: string
}) {
  return source.case_id.trim() || source.source_ref_id.trim() || source.workflow_id.trim() || "-"
}

export function humanizeIdentifier(value: string) {
  return value
    .trim()
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}
