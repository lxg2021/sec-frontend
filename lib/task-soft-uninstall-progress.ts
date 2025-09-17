import type { TaskSchedule } from "./task-soft-uninstall"


interface HostUninstallStatus {
  hostId: string
  hostName: string
   /** 卸载完成时间，用 ISO8601 格式表示；未完成可为 undefined */
  uninstalledAt?: string
  status: "SUCCESS" | "FAILED" | "PENDING"
  errorMessage?: string
}

/** 单个软件的卸载进度（按主机分类） */
export interface SoftwareUninstallProgress {
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
  
  /** 整体进度百分比（0-100） */
  overallProgress: number

  /** 总共涉及的主机数 */
  totalHosts: number

  /** 已卸载成功的主机数 */
  successCount: number

  /** 卸载失败的主机数 */
  failedCount: number

  /** 待卸载的主机数 */
  pendingCount: number

  /** 成功卸载的主机详情 */
  successHosts: HostUninstallStatus[]

  /** 卸载失败的主机详情 */
  failedHosts: HostUninstallStatus[]

  /** 待卸载的主机详情 */
  pendingHosts: HostUninstallStatus[]
}
