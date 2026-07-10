import { resolveAttckStage } from "@/features/attack/constants/attck-stages"
import type { AttackIocEvidence, AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"

export const SEVERITY_MAP: Record<
  string,
  {
    labelKey: string
    dot: string
    badge: string
    selected: string
    selectedMarker: string
  }
> = {
  critical: {
    labelKey: "critical",
    dot: "bg-severity-critical",
    badge:
      "border-severity-critical/30 bg-severity-critical/10 text-severity-critical",
    selected:
      "border-severity-critical bg-white ring-1 ring-severity-critical/25 shadow-[0_16px_32px_rgba(220,38,38,0.12)] focus-visible:ring-severity-critical/35",
    selectedMarker: "bg-severity-critical",
  },
  high: {
    labelKey: "high",
    dot: "bg-severity-high",
    badge: "border-severity-high/30 bg-severity-high/10 text-severity-high",
    selected:
      "border-severity-high bg-white ring-1 ring-severity-high/25 shadow-[0_16px_32px_rgba(239,68,68,0.12)] focus-visible:ring-severity-high/35",
    selectedMarker: "bg-severity-high",
  },
  medium: {
    labelKey: "medium",
    dot: "bg-severity-medium",
    badge:
      "border-severity-medium/30 bg-severity-medium/10 text-severity-medium",
    selected:
      "border-severity-medium bg-white ring-1 ring-severity-medium/25 shadow-[0_16px_32px_rgba(245,158,11,0.12)] focus-visible:ring-severity-medium/35",
    selectedMarker: "bg-severity-medium",
  },
  low: {
    labelKey: "low",
    dot: "bg-severity-low",
    badge: "border-severity-low/30 bg-severity-low/10 text-severity-low",
    selected:
      "border-severity-low bg-white ring-1 ring-severity-low/25 shadow-[0_16px_32px_rgba(34,197,94,0.12)] focus-visible:ring-severity-low/35",
    selectedMarker: "bg-severity-low",
  },
}

export function getSeverity(severity: string) {
  return (
    SEVERITY_MAP[severity?.toLowerCase()] ?? {
      labelKey: "unknown",
      dot: "bg-muted-foreground",
      badge: "border-border bg-muted text-muted-foreground",
      selected:
        "border-muted-foreground bg-white ring-1 ring-muted-foreground/20 shadow-[0_16px_32px_rgba(15,23,42,0.10)] focus-visible:ring-muted-foreground/30",
      selectedMarker: "bg-muted-foreground",
    }
  )
}

export function formatFullTime(value: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export interface AttackWorkflowRouteOptions {
  candidateIds?: readonly string[]
  workflowId?: string
  returnToGraph?: boolean
  returnToWorkflow?: boolean
  queuePage?: number
  tenantId?: string
}

function appendOptionalWorkflowParams(
  params: URLSearchParams,
  options?: AttackWorkflowRouteOptions,
) {
  const workflowId = options?.workflowId?.trim()
  if (workflowId) params.set("workflowId", workflowId)
  if (options?.returnToGraph) params.set("returnTo", "graph")
  else if (options?.returnToWorkflow) params.set("returnTo", "workflow")
  if (options?.tenantId?.trim()) params.set("tenantId", options.tenantId.trim())
  if (options?.queuePage && options.queuePage > 0) {
    params.set("queuePage", String(Math.trunc(options.queuePage)))
  }
}

export function buildAttackWorkflowHref(
  caseId: string,
  snapshotId?: string,
  workflowId?: string,
  options?: { focusQueue?: boolean; queuePage?: number; tenantId?: string },
) {
  const params = new URLSearchParams()
  const normalizedCaseId = caseId.trim()
  if (normalizedCaseId) params.set("caseId", normalizedCaseId)
  if (snapshotId?.trim()) params.set("snapshotId", snapshotId.trim())
  if (workflowId?.trim()) params.set("workflowId", workflowId.trim())
  if (options?.tenantId?.trim()) params.set("tenantId", options.tenantId.trim())
  if (options?.focusQueue) params.set("focusQueue", "1")
  if (options?.queuePage && options.queuePage > 0) {
    params.set("queuePage", String(Math.trunc(options.queuePage)))
  }
  const query = params.toString()
  return `/frame/attack/workflow${query ? `?${query}` : ""}`
}

export function buildTraceHref(
  caseId: string,
  snapshotId?: string,
  options?: AttackWorkflowRouteOptions,
) {
  const params = new URLSearchParams()
  params.set("caseId", caseId)
  if (snapshotId?.trim()) params.set("snapshotId", snapshotId.trim())
  appendOptionalWorkflowParams(params, options)
  return `/frame/attack/drill?${params.toString()}`
}

export function buildAIAnalysisHref(
  caseId: string,
  snapshotId?: string,
  options?: AttackWorkflowRouteOptions,
) {
  const params = new URLSearchParams()
  params.set("caseId", caseId)
  if (snapshotId?.trim()) params.set("snapshotId", snapshotId.trim())
  appendOptionalWorkflowParams(params, options)
  return `/frame/ai-ops/threat-analysis?${params.toString()}`
}

export function buildIOCVerificationHref(
  caseId: string,
  snapshotId?: string,
  options?: AttackWorkflowRouteOptions,
) {
  const params = new URLSearchParams()
  params.set("caseId", caseId)
  if (snapshotId?.trim()) params.set("snapshotId", snapshotId.trim())
  appendOptionalWorkflowParams(params, options)
  const candidateIds = Array.from(
    new Set(options?.candidateIds?.map((item) => item.trim()).filter(Boolean)),
  )
  if (candidateIds.length) params.set("candidate_ids", candidateIds.join(","))
  return `/frame/ioc-analysis/ioc-verification?${params.toString()}`
}

export function shortenId(value: string, head = 8, tail = 4) {
  if (!value) return "-"
  if (value.length <= head + tail + 3) return value
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

export function extractTechniques(values: string[]) {
  const techniques: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const match = value.match(/T\d{4}(?:[./]\d{3})?/i)
    if (match?.[0]) {
      const technique = match[0].replace("/", ".").toUpperCase()
      if (!seen.has(technique)) {
        seen.add(technique)
        techniques.push(technique)
      }
    }
  }

  return techniques
}

export function normalizeUnknownPhase(phase: string) {
  return phase
    .trim()
    .replace(/^phase[.:_-]\s*/i, "")
    .replace(/^phase\./i, "")
    .replace(/^[.:_-]+/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
}

export function buildOrderedPhases(item: AttackCaseTimelineSummary) {
  const phases = [
    item.primary_phase,
    ...item.phases.filter((phase) => phase !== item.primary_phase),
  ].filter(Boolean)

  const seen = new Set<string>()
  return phases
    .map((phase) => {
      const stage = resolveAttckStage(phase)
      const key = stage?.key || normalizeUnknownPhase(phase).toLowerCase()
      return {
        key,
        stageKey: stage?.key,
        fallbackLabel: normalizeUnknownPhase(phase),
      }
    })
    .filter((phase) => {
      if (!phase.key || seen.has(phase.key)) return false
      seen.add(phase.key)
      return true
    })
}

export function matchAutoSummary(summary: string) {
  const acrossMatch = summary.match(
    /^Auto aggregated from (\d+) instance\(s\) across (\d+) group\(s\)\.?$/i,
  )
  if (acrossMatch) {
    return {
      instances: Number(acrossMatch[1]),
      groups: Number(acrossMatch[2]),
      rules: null,
    }
  }

  const multiMatch = summary.match(
    /^Auto aggregated from (\d+) instance\(s\), (\d+) group\(s\), (\d+) rule\(s\)\.?$/i,
  )
  if (multiMatch) {
    return {
      instances: Number(multiMatch[1]),
      groups: Number(multiMatch[2]),
      rules: Number(multiMatch[3]),
    }
  }

  return null
}

export function isNestedInteractiveTarget(target: EventTarget | null, currentTarget: HTMLElement) {
  if (!(target instanceof HTMLElement)) return false

  const interactiveTarget = target.closest(
    "a,button,input,textarea,select,[contenteditable='true']",
  )
  return Boolean(interactiveTarget && interactiveTarget !== currentTarget)
}

export function formatCaseTitle(title: string) {
  const normalized = title.trim()
  return normalized.replace(/^攻击链[:：]\s*/i, "") || normalized
}

export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

export function firstFilled(...values: string[]) {
  return values.find((value) => value.trim())?.trim() ?? ""
}

export function formatBehavior(value: string) {
  return value.trim().replace(/_/g, " ").replace(/\s+/g, " ")
}

export function formatOccurredAt(value: string) {
  if (!value) return "-"
  const normalized = value.trim()
  const timeMatch = normalized.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/)
  if (timeMatch) return `${timeMatch[1]} ${timeMatch[2]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized
  return normalized
}

export function splitOccurredAt(value: string) {
  const label = formatOccurredAt(value)
  const match = label.match(/^(\d{4}-\d{2}-\d{2})\s+(.+)$/)
  if (!match) return { date: "", time: label }
  return { date: match[1], time: match[2] }
}

export function formatRange(startTime: string, endTime: string) {
  if (!startTime && !endTime) return "-"
  if (!startTime) return endTime
  if (!endTime) return startTime
  return `${startTime} - ${endTime}`
}

export function formatStorySummary(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export function techniqueHref(technique: string) {
  return `https://attack.mitre.org/techniques/${technique.replace(".", "/")}/`
}

export function formatIocLine(ioc: AttackIocEvidence, fallbackText = "IOC evidence matched") {
  const value = firstFilled(ioc.ioc_display_value, ioc.ioc_normalized_value, ioc.candidate_value, ioc.marker)
  const type = firstFilled(ioc.ioc_type, ioc.candidate_type, ioc.hit_source)
  if (type && value) return `${type}: ${value}`
  return value || type || fallbackText
}

export function buildAttackDetailHref(caseId: string, snapshotId: string) {
  const params = new URLSearchParams()
  params.set("caseId", caseId)
  if (snapshotId.trim()) params.set("snapshotId", snapshotId.trim())
  return `/frame/attack/detail?${params.toString()}`
}
