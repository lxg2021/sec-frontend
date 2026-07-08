import type { AttackWorkflowDisplayStage, AttackWorkflowStatus } from "./types"

export const ATTACK_WORKFLOW_STATUSES = [
  "detected",
  "investigating",
  "confirmed",
  "forensics",
  "responding",
  "contained",
  "remediated",
  "closed",
] as const satisfies readonly AttackWorkflowStatus[]

export const ATTACK_WORKFLOW_STATUS_INDEX = ATTACK_WORKFLOW_STATUSES.reduce(
  (acc, status, index) => {
    acc[status] = index
    return acc
  },
  {} as Record<AttackWorkflowStatus, number>,
)

export const ATTACK_WORKFLOW_DISPLAY_STAGES = [
  {
    stage: "discovery",
    representativeStatus: "detected",
    statuses: ["detected"],
  },
  {
    stage: "investigation",
    representativeStatus: "investigating",
    statuses: ["investigating", "confirmed"],
  },
  {
    stage: "forensics",
    representativeStatus: "forensics",
    statuses: ["forensics"],
  },
  {
    stage: "response",
    representativeStatus: "responding",
    statuses: ["responding", "contained", "remediated"],
  },
  {
    stage: "closed",
    representativeStatus: "closed",
    statuses: ["closed"],
  },
] as const satisfies readonly {
  stage: AttackWorkflowDisplayStage
  representativeStatus: AttackWorkflowStatus
  statuses: readonly AttackWorkflowStatus[]
}[]

export const ATTACK_WORKFLOW_DISPLAY_STAGE_INDEX =
  ATTACK_WORKFLOW_DISPLAY_STAGES.reduce(
    (acc, item, index) => {
      acc[item.stage] = index
      return acc
    },
    {} as Record<AttackWorkflowDisplayStage, number>,
  )

export const ATTACK_WORKFLOW_STATUS_DISPLAY_STAGE =
  ATTACK_WORKFLOW_DISPLAY_STAGES.reduce(
    (acc, item) => {
      item.statuses.forEach((status) => {
        acc[status] = item.stage
      })
      return acc
    },
    {} as Record<AttackWorkflowStatus, AttackWorkflowDisplayStage>,
  )

export const ATTACK_WORKFLOW_ALLOWED_TRANSITIONS: Record<
  AttackWorkflowStatus,
  AttackWorkflowStatus[]
> = {
  detected: ["investigating", "confirmed", "responding", "closed"],
  investigating: ["confirmed", "forensics", "responding", "closed"],
  confirmed: ["forensics", "responding", "closed"],
  forensics: ["responding", "closed"],
  responding: ["contained", "closed"],
  contained: ["remediated", "closed"],
  remediated: ["closed"],
  closed: [],
}

export const ATTACK_WORKFLOW_RECOMMENDED_NEXT_STATUS: Partial<
  Record<AttackWorkflowStatus, AttackWorkflowStatus>
> = {
  detected: "investigating",
  investigating: "confirmed",
  confirmed: "forensics",
  forensics: "responding",
  responding: "contained",
  contained: "remediated",
  remediated: "closed",
}

export const ATTACK_WORKFLOW_STATUS_TIME_FIELD: Record<
  AttackWorkflowStatus,
  string
> = {
  detected: "detected_at",
  investigating: "investigation_started_at",
  confirmed: "confirmed_at",
  forensics: "forensic_started_at",
  responding: "response_started_at",
  contained: "contained_at",
  remediated: "remediated_at",
  closed: "closed_at",
}

export const ATTACK_WORKFLOW_CLOSE_REASONS = [
  "resolved",
  "false_positive",
  "duplicate",
  "accepted_risk",
  "other",
] as const

export type AttackWorkflowCloseReason =
  (typeof ATTACK_WORKFLOW_CLOSE_REASONS)[number]
