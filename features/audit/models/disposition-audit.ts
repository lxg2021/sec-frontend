import type { BaseAudit, ExecutionSource } from "./base-audit"

/**
 * 处置动作类型
 * - ISOLATE: 隔离文件
 * - TERMINATE: 结束进程
 * - DISCONNECT: 阻断网络连接
 * - QUARANTINE: 阻止文件落盘
 */
export type DispositionActionType = "ISOLATE" | "TERMINATE" | "DISCONNECT" | "QUARANTINE"

/**
 * 处置审计类型
 * - DISPOSITION: 系统或人工执行的处置动作
 */
export type DispositionAuditType = "DISPOSITION"

/**
 * 处置动作审计
 * 用于记录 EDR 系统或人工执行的处置行为
 * /extends BaseAudit
 */
export interface DispositionAudit extends BaseAudit {
  /** 审计分类 */
  auditType: DispositionAuditType

  /** 处置动作类型 */
  actionType: DispositionActionType

  /** 执行来源，可选 */
  executionSource?: ExecutionSource

  /** 处理人ID，可选，记录人工确认或干预 */
  handledBy?: string
}
