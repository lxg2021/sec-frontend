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
  targetSummary: string
  agentSummary: string
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
}export const dispatchTypeLabels: Record<DispatchType, string> = {
  all: "全部下发",
  policy: "策略下发",
  command: "命令下发",
  config: "配置下发",
}

export const auditResultLabels: Record<AuditResult, string> = {
  all: "全部状态",
  success: "成功",
  failed: "失败",
  pending: "执行中",
  timeout: "超时",
}

export const dispatchTimeRangeLabels: Record<DispatchTimeRange, string> = {
  "24h": "最近 24 小时",
  "7d": "最近 7 天",
  "30d": "最近 30 天",
  "90d": "最近 90 天",
  custom: "自定义",
}
