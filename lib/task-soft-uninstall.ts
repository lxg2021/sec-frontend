/**
 * 卸载目标对象
 */
export interface UninstallTarget {
  /** 主机 ID（唯一标识主机） */
  hostId: string

  /** 主机名（方便日志记录与前端展示） */
  hostName: string

  /** 要执行的卸载命令（普通卸载或静默卸载） */
  command: string
}


/**
 * 安装任务的执行模式
 */
export type TaskSchedule =
  | { type: "IMMEDIATE" } // 立即执行
  | { type: "SCHEDULED"; executeAt: string } // 定时执行（ISO 时间戳）
	
	
/**
 * 卸载(批量卸载)创建请求
 */
export interface CreateUninstallTaskRequest {
  /** 任务类型：普通卸载 | 静默卸载 */
  type: 'uninstall' | 'quietUninstall'

  /** 任务id */
  taskId: string

  /** 任务名称 */
  taskName: string
  
  /** 创建时间 */
  createdAt: string
  
  /** 失败时的最大重试次数 */
  retryCount: number
  
  /** 执行计划（立即 / 定时） */
  schedule: TaskSchedule
  
  /** 需要卸载的软件条目 */
  hash: string
	
 /** 软件名称 */
  name?: string 
  
  /** 软件版本 */
  version?: string
  
  /** 软件厂商 */
  vendor?: string

  /** 卸载目标 */
  targets: UninstallTarget[]
}

/**
 * 批量卸载任务创建响应
 */
export interface CreateUninstallTaskResponse {
  /** 后台生成的任务唯一 ID */
  taskId: string
  
  /** 任务创建是否成功 */
  status: "SUCCESS" | "FAILED"
  
  /** 如果创建失败，返回错误信息（可选） */
  errorMessage?: string
}
