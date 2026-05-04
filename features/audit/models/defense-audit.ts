import type { BaseAudit, ExecutionSource } from "./base-audit"

/**
 * 防御动作类型
 * - ALERT: 告警
 * - BLOCK: 阻断
 * - PROMPT: 提示用户
 */
export type DefenseActionType = "ALERT" | "BLOCK" | "PROMPT"

/**
 * 防御审计类型
 * - DEFENSE: 系统自动防御动作
 */
export type DefenseAuditType = "DEFENSE"

/**
 * 防御动作审计
 * 用于记录 EDR 系统中自动触发的防御行为
 * /extends BaseAudit
 */
export interface DefenseAudit extends BaseAudit {
  /** 审计分类 */
  auditType: DefenseAuditType

  /** 执行来源 */
  executionSource: ExecutionSource

  /** 防御动作类型 */
  actionType: DefenseActionType
}
