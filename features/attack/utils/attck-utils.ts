export type Severity = "高" | "中" | "低"

export interface AttackRuleMeta {
  rule_id?: string
  title?: string
  description?: string
  status?: string
  author?: string
  rule_date?: string
  modified?: string
  references?: string[]
  tags?: string[]
  phases?: string[]
  rule_file?: string
  is_invalid?: boolean
}

export interface AttckDetail {
  attck: string
  ruleid: string
  name?: string
  stage: string[]
  indicators: AttackIndicator[]
  hosts: string[]
  severity: Severity
  ruleMeta?: AttackRuleMeta
}

export type AttackIndicator =
  | { type: "description"; value: string }
  | { type: "groups"; value: number }
  | { type: "instances"; value: number }
  | { type: "sources"; value: number }
  | { type: "empty" }

export interface AttckStage {
  stageKey?: string
  stage: string
  description: string
  count: number
  icon: string
  details?: AttckDetail[]
}

export interface SeverityEntry {
  severity: Severity
  "affected-hosts": number
}

export interface Top10Item {
  attck: string
  name: string
  ruleid: string
  hosts: string[]
  "affected-hosts": number
  stage: string
  stages?: string[]
  stageKeys?: string[]
  ruleMeta?: AttackRuleMeta
}

export interface AttckData {
  starttime: string
  endtime: string
  range: string
  "affected-hosts": number
  "attck-counts": number
  "stage-counts": number
  severity?: SeverityEntry[]
  top10?: Top10Item[]
  stages: AttckStage[]
}

export function parseDateSafe(input: string): Date | null {
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

export function formatDateRange(start: string, end: string): string {
  const s = parseDateSafe(start)
  const e = parseDateSafe(end)
  if (!s || !e) {
    return `${start} — ${end}`
  }
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }
  return `${s.toLocaleString(undefined, opts)} — ${e.toLocaleString(undefined, opts)}`
}

export function slugifyStageName(name: string): string {
  const parenMatch = name.match(/$$([^)]+)$$/)
  const base = parenMatch ? parenMatch[1] : name
  return base
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}

export function severityColorClasses(sev: Severity): string {
  switch (sev) {
    case "高":
      return "bg-red-100 text-red-700 border-red-200"
    case "中":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "低":
      return "bg-green-100 text-green-700 border-green-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export function badgeSeverityTextColor(sev: Severity): string {
  switch (sev) {
    case "高":
      return "bg-red-500 text-white"
    case "中":
      return "bg-amber-500 text-white"
    case "低":
      return "bg-green-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export function allSeverities(): Severity[] {
  return ["高", "中", "低"]
}

export function filterStages(
  stages: AttckStage[],
  selectedSeverities: Set<Severity>,
  selectedStageNames: Set<string>,
): AttckStage[] {
  const stageFiltered = stages.filter((s) => (selectedStageNames.size ? selectedStageNames.has(s.stage) : true))
  return stageFiltered.map((s) => {
    if (!s.details || s.details.length === 0) return s
    const filteredDetails = s.details.filter((d) => selectedSeverities.has(d.severity))
    return {
      ...s,
      count: filteredDetails.length || s.count,
      details: filteredDetails,
    }
  })
}

export function computeSeverityCounts(stages: AttckStage[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { 高: 0, 中: 0, 低: 0 }
  for (const s of stages) {
    if (!s.details) continue
    for (const d of s.details) {
      if (d.severity in counts) counts[d.severity as Severity] += 1
    }
  }
  return counts
}

export function countsFromSeverityEntries(entries?: SeverityEntry[]): Record<Severity, number> {
  const base: Record<Severity, number> = { 高: 0, 中: 0, 低: 0 }
  if (!entries) return base
  for (const e of entries) {
    base[e.severity] = e["affected-hosts"]
  }
  return base
}
