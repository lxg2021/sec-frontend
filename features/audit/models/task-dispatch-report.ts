// task-audit.ts

/**
 * 表示单台主机的任务执行状态
 * 1. 后台通过Redis下发TASK\CONFIG\POLICY
 * 2. 终端收到后发送收到回执
 * 3. 后台收到回执后，加入统计表中
 * 4. 如果后台下发后，终端没有发送收到回执，则记录下发失败，或者 再次下发
 */
export interface HostDispatchStatus {
  /** 主机ID */
  hostId: string

  /** 主机名称 */
  hostName: string

  /** 下发时间 */
  dispatchAt?: string

  /** 执行时间 */
  executeAt?: string

  /** 执行状态：SUCCESS 成功 | FAILED 失败 | PENDING 待执行 */
  status: "SUCCESS" | "FAILED" | "PENDING"

  /** 执行失败时的错误信息 */
  errorMessage?: string
}

/**
 * 表示任务审计信息，包括任务整体信息和各主机执行状态
 */
export interface TaskDispatchReport {
  /** 类型，例如 'TASK', 'CONFIG', 'POLICY' */
  taskType: string

  /** Task/Config/Policy 唯一ID */
  id: string

  /** Task/Config/Policy 名称 */
  name: string

  /** 级别可选项 */
  level?: number

  /** Task/Config/Policy 创建时间 */
  createdAt: string

  /** 用户名，操作者 可选 */
  dispatchedBy?: string

  /** 下发的开始时间 */
  startedAt?: string

  /** 下发的结束时间 */
  endedAt?: string

  /** 整体进度百分比，0-100 */
  overallProgress: number

  /** 总目标主机数 */
  totalHosts: number

  /** 下发成功的主机数 */
  successCount: number

  /** 下发失败的主机数 */
  failedCount: number

  /** 待下发的主机数 */
  pendingCount: number

  /** 下发成功主机详情 */
  successHosts: HostDispatchStatus[]

  /** 下发失败主机详情 */
  failedHosts: HostDispatchStatus[]

  /** 待下发主机详情 */
  pendingHosts: HostDispatchStatus[]

  /** 任务优先级，可选：HIGH | MEDIUM | LOW */
  priority?: "HIGH" | "MEDIUM" | "LOW"

  /** 标签，例如 ["紧急", "周末"]，用于搜索和筛选 */
  tags?: string[]

  /** 'TASK', 'CONFIG', 'POLICY' 详情，例如命令内容、策略参数等 */
  details?: Record<string, any>
}
