// user-audit.ts

export type UserActionType =
  // 身份与用户管理
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "PASSWORD_CHANGE"
  | "ROLE_CHANGE"
  | "ADD_USER"
  | "DELETE_USER"
  // 任务 / 策略 / 配置管理
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "DISPATCH_TASK"
  | "CREATE_CONFIG"
  | "UPDATE_CONFIG"
  | "DISPATCH_CONFIG"
  // 防御操作
  | "MANUAL_BLOCK"
  // 其他
  | "OTHER"

/**
 * 控制台用户行为审计（User Activity Audit）
 *
 * 用于记录管理员或安全人员在 EDR 管理平台上的关键操作，
 * 例如登录、下发任务、修改策略、执行防御动作等。
 */
export interface UserActivityAudit {
  /** 审计事件唯一ID */
  eventId: string

  /** 操作用户ID */
  userId: string

  /** 用户名 */
  username: string

  /** 操作时间（ISO 8601 格式） */
  timestamp: string

  /** 操作来源IP地址 */
  sourceIp?: string

  /** 操作类型 */
  actionType: UserActionType

  /** 操作结果 */
  result: "SUCCESS" | "FAILED"

  /** 操作对象标识（如任务ID、策略ID、规则ID等） */
  targetId?: string

  /** 操作对象类型 */
  targetType?: "TASK" | "POLICY" | "HOST" | "USER" | "SYSTEM" | "OTHER"

  /** 额外详情等 */
  details?: Record<string, any>
}
