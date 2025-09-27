/**
 * Token 表示进程或操作对象的安全 Token 信息
 */
export interface Token {
  /** 账户名 */
  AccountName: string;

  /** 模拟级别 */
  ImpersonationLevel: string;

  /** 完整性级别 */
  IntegrityLevel: string;

  /** 权限 */
  Privilege: string;

  /** 会话 ID */
  SessionID: number;

  /** 安全标识符 (SID) */
  SID: string;

  /** Token 类型 */
  TokenType: string;
}
