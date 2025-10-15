/**
 * 审计记录基类
 * 包含防御动作和处置动作共有的字段
 */
export interface BaseAudit {
  /** 主机ID */
  id: string

  /** 主机名称 */
  name: string

  /** 动作触发时间 */
  triggeredAt: string

  /** 动作完成或处置完成时间，可选 */
  resolvedAt?: string

  /** 事件严重等级 */
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

  /** 动作执行结果 */
  status: "SUCCESS" | "FAILED"

  /** 触发的策略或规则ID */
  ruleId: string

  /** 策略或规则名称 */
  ruleName: string

  /** 备注或错误信息，可选 */
  message?: string

  /** 标签，用于筛选或分类，可选 */
  tags?: string[]

  /** 动作详情，例如文件、进程、网络连接等，可选 */
  details?: Record<string, any>
}

/**
 * 执行来源
 * - ENDPOINT: 终端防护触发
 * - FIREWALL: 防火墙触发
 * - HIDS: 主机入侵检测系统触发
 */
export type ExecutionSource = "ENDPOINT" | "FIREWALL" | "HIDS"

/**
 * 动作执行结果
 */
export type ActionStatus = "SUCCESS" | "FAILED"
