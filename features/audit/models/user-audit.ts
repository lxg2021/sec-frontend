// user-audit.ts

export type UserActionType =
  // Identity and user management
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "PASSWORD_CHANGE"
  | "ROLE_CHANGE"
  | "ADD_USER"
  | "UPDATE_USER"
  | "STATUS_CHANGE"
  | "DELETE_USER"
  // Task, policy, and configuration management
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "DISPATCH_TASK"
  | "CREATE_CONFIG"
  | "UPDATE_CONFIG"
  | "DISPATCH_CONFIG"
  // Defense operations
  | "MANUAL_BLOCK"
  // Other
  | "OTHER"

export type UserAuditDateRange = "1d" | "7d" | "30d" | "90d" | "custom"

/**
 * User activity audit records shown in the management console.
 */
export interface UserActivityAudit {
  /** Unique audit event ID. */
  eventId: string

  /** ID of the user that performed the action. */
  userId: string

  /** Display name of the user that performed the action. */
  username: string

  /** Event time in ISO 8601 format. */
  timestamp: string

  /** Optional source IP address. */
  sourceIp?: string

  /** Normalized action type. */
  actionType: UserActionType

  /** Action result. */
  result: "SUCCESS" | "FAILED"

  /** Target object identity. */
  targetId?: string
  targetName?: string

  /** Target object type. */
  targetType?: "TASK" | "POLICY" | "HOST" | "USER" | "SYSTEM" | "OTHER"

  /** Backend-specific audit details. */
  details?: Record<string, unknown>
}
