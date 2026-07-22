export type { ActionStatus, BaseAudit, ExecutionSource } from "./models/base-audit"
export type { DefenseActionType, DefenseAudit, DefenseAuditType } from "./models/defense-audit"
export type { DispositionActionType, DispositionAudit, DispositionAuditType } from "./models/disposition-audit"
export type { HostDispatchStatus, TaskDispatchReport } from "./models/task-dispatch-report"
export type { UserActionType, UserActivityAudit } from "./models/user-audit"

export type AuditCategory = "dispatch" | "user" | "change"
export type DispatchType = "all" | "policy" | "command" | "config"
export type AuditResult = "all" | "success" | "failed" | "pending" | "timeout"

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

export const dispatchTypeLabels: Record<DispatchType, string> = {
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
