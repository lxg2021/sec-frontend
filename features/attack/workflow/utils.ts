import {
  ATTACK_WORKFLOW_ALLOWED_TRANSITIONS,
  ATTACK_WORKFLOW_RECOMMENDED_NEXT_STATUS,
  ATTACK_WORKFLOW_STATUS_INDEX,
  ATTACK_WORKFLOW_STATUS_TIME_FIELD,
  ATTACK_WORKFLOW_STATUSES,
} from "./constants"
import type {
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "./types"

export function isAttackWorkflowStatus(value: string): value is AttackWorkflowStatus {
  return ATTACK_WORKFLOW_STATUSES.includes(value as AttackWorkflowStatus)
}

export function normalizeWorkflowStatus(value: string): AttackWorkflowStatus | "" {
  const normalized = value.trim().toLowerCase()
  return isAttackWorkflowStatus(normalized) ? normalized : ""
}

export function getAllowedWorkflowTransitions(status: string): AttackWorkflowStatus[] {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? ATTACK_WORKFLOW_ALLOWED_TRANSITIONS[normalized] : []
}

export function getRecommendedNextWorkflowStatus(status: string): AttackWorkflowStatus | null {
  const normalized = normalizeWorkflowStatus(status)
  if (!normalized) return null

  const recommended = ATTACK_WORKFLOW_RECOMMENDED_NEXT_STATUS[normalized]
  if (!recommended) return null

  return ATTACK_WORKFLOW_ALLOWED_TRANSITIONS[normalized].includes(recommended)
    ? recommended
    : null
}

export function workflowStatusIndex(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? ATTACK_WORKFLOW_STATUS_INDEX[normalized] : -1
}

export function workflowStatusTime(workflow: AttackWorkflowItem, status: AttackWorkflowStatus) {
  const field = ATTACK_WORKFLOW_STATUS_TIME_FIELD[status] as keyof AttackWorkflowItem
  const value = String(workflow[field] ?? "").trim()
  if (!value || value.startsWith("0001-01-01")) return ""
  return value
}

export function formatWorkflowTime(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized.startsWith("0001-01-01")) return "-"

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/)
  if (match) return `${match[1]} ${match[2]}`

  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return normalized

  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function buildWorkflowStatusPayloadJson(comment: string) {
  const normalizedComment = comment.trim()
  if (!normalizedComment) return ""

  return JSON.stringify({
    comment: normalizedComment,
    source: "attack_workflow_closure_panel",
  })
}

export function parseWorkflowPayloadJson(value: string) {
  const normalized = value.trim()
  if (!normalized) return null

  try {
    const parsed = JSON.parse(normalized)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

export function workflowEventComment(event: AttackWorkflowEventItem) {
  const payload = parseWorkflowPayloadJson(event.payload_json)
  const comment = payload?.comment
  return typeof comment === "string" ? comment.trim() : ""
}

export function workflowEventTime(event: AttackWorkflowEventItem) {
  return formatWorkflowTime(event.occurred_at || event.created_at)
}
