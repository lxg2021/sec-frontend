import type { AttackAIReport, Severity } from "@/features/ai-ops/threat-analysis/report-types"

export const severityStyles: Record<Severity, { badge: string; dot: string; text: string }> = {
  critical: {
    badge: "bg-destructive/15 text-destructive border-destructive/40",
    dot: "bg-destructive",
    text: "text-destructive",
  },
  high: {
    badge: "bg-chart-2/15 text-chart-2 border-chart-2/40",
    dot: "bg-chart-2",
    text: "text-chart-2",
  },
  medium: {
    badge: "bg-chart-3/15 text-chart-3 border-chart-3/40",
    dot: "bg-chart-3",
    text: "text-chart-3",
  },
  low: {
    badge: "bg-chart-4/15 text-chart-4 border-chart-4/40",
    dot: "bg-chart-4",
    text: "text-chart-4",
  },
  info: {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
}

export function confidencePct(value?: number | null) {
  const normalized = typeof value === "number" && Number.isFinite(value) ? value : 0

  return Math.min(100, Math.max(0, Math.round(normalized * 100)))
}

export function normalizeSeverity(value?: string | null): Severity {
  return value === "critical" || value === "high" || value === "medium" || value === "low" || value === "info"
    ? value
    : "info"
}

export function parseMaybeJson<T>(value?: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function ensureArray<T>(value?: T[] | null) {
  return Array.isArray(value) ? value : []
}

export function normalizeAttackReport(report: Partial<AttackAIReport>): AttackAIReport {
  return {
    ...report,
    risk_level: normalizeSeverity(report.risk_level),
    confidence: typeof report.confidence === "number" && Number.isFinite(report.confidence) ? report.confidence : undefined,
    attack_story: ensureArray(report.attack_story),
    key_findings: ensureArray(report.key_findings),
    iocs: ensureArray(report.iocs),
    affected_assets: ensureArray(report.affected_assets),
    recommended_actions: ensureArray(report.recommended_actions),
    hypotheses: ensureArray(report.hypotheses),
    limitations: ensureArray(report.limitations),
  }
}
