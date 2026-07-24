export type { ActionStatus, BaseAudit, ExecutionSource } from "./models/base-audit"
export type { DefenseActionType, DefenseAudit, DefenseAuditType } from "./models/defense-audit"
export type { DispositionActionType, DispositionAudit, DispositionAuditType } from "./models/disposition-audit"
export type { HostDispatchStatus, TaskDispatchReport } from "./models/task-dispatch-report"
export type { UserActionType, UserActivityAudit, UserAuditDateRange } from "./models/user-audit"

export type AuditCategory = "dispatch" | "user" | "change"
export type DispatchType = "all" | "policy" | "command" | "config"
export type AuditResult = "all" | "success" | "failed" | "pending" | "timeout"
export type DispatchTimeRange = "24h" | "7d" | "30d" | "90d" | "custom"
export type DispatchExecutionStatus = "pending" | "accepted" | "running" | "success" | "failed" | "skipped" | "canceled" | "unknown"
export type ChangeAuditAction =
  | "created"
  | "reused"
  | "updated"
  | "deleteAccepted"
  | "deleteCompleted"
  | "deleteAborted"
  | "legacyCommand"

export interface DispatchAuditEvent {
  id: string
  occurredAt: string
  dispatchType: Exclude<DispatchType, "all">
  eventType: string
  objectName: string
  objectVersion?: string
  taskId: string
  operationId: string
  actorName: string
  actorId: string
  targetSummary?: string
  agentSummary?: string
  result: Exclude<AuditResult, "all">
  successCount: number
  failedCount: number
  pendingCount: number
  totalCount: number
  reason?: string
  payload: Record<string, string | number | boolean | null>
}

export interface ChangeAuditEvent {
  id: string
  occurredAt: string
  eventType: string
  action: ChangeAuditAction
  objectType: Exclude<DispatchType, "all">
  objectId: string
  objectName: string
  objectVersion?: string
  previousVersion?: string
  newVersion?: string
  actorType: string
  actorId: string
  requestedBy?: string
  outcome?: string
  reason?: string
  operationId?: string
  requestId?: string
  payload: Record<string, unknown>
}


export interface DispatchExecutionResult {
  id: string
  operationId: string
  dispatchId: string
  agentId: string
  publishStatus: string
  executionStatus: DispatchExecutionStatus
  failureCertainty: "definitive" | "uncertain" | "unknown"
  taskVisibility: "fresh" | "unknown" | string
  reasonCode?: string
  reasonMessage?: string
  errorCode?: string
  errorMessage?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  startedAt?: string
  lastReportAt?: string
  finishedAt?: string
}
