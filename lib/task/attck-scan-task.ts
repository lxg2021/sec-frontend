// attck-scan-task.ts
import { type ScanSchedule, type TaskStatus, validatePeriod } from "./task-base"

/** 后端可用的数据源类型，目前只有 EDR_EVENTS */
export type DataSourceType = "EDR_EVENTS"

/** ATT&CK 扫描任务（以周期方式在服务端对数据源进行扫描）*/
export interface AttckScanTask {
  /** 任务唯一 ID（推荐 UUID） */
  id: string

  /** 任务名称 */
  name: string

  /** 是否启用 */
  enabled: boolean

  /** 调度（周期） */
  schedule: ScanSchedule

  /** 使用的数据源, 默认 EDR_EVENTS */
  dataSources: DataSourceType

  /** 当前任务状态，前端创建时应为 "pending" */
  status: TaskStatus

  /** 创建时间 (ISO 字符串) */
  createdAt: string

  /** 更新时间 (ISO 字符串，可选) */
  updatedAt?: string

  /** 最后一次运行时间，由后台更新 */
  lastRunAt?: string
}

/** 校验 AttckScanTask 基本合法性 */
export function validateAttckScanTask(t: Partial<AttckScanTask>): { ok: true } | { ok: false; reason: string } {
  if (!t) return { ok: false, reason: "task is empty" }
  if (!t.id || typeof t.id !== "string") return { ok: false, reason: "missing or invalid id" }
  if (!t.name || typeof t.name !== "string") return { ok: false, reason: "missing or invalid name" }
  if (!t.schedule || typeof t.schedule !== "object") return { ok: false, reason: "missing schedule" }
  if (!validatePeriod((t.schedule as ScanSchedule).period)) return { ok: false, reason: "invalid schedule.period" }
  if (t.status && !["pending", "running", "completed", "failed"].includes(t.status))
    return { ok: false, reason: "invalid status" }
  return { ok: true }
}

/**
 * 创建一个新的 AttckScanTask（工厂）
 * - 自动设置 createdAt 与 status = "pending"
 * - dataSources 默认 EDR_EVENTS
 */
export function createAttckScanTask(partial: Partial<AttckScanTask>): AttckScanTask {
  const v = validateAttckScanTask(partial)
  if (!v.ok) throw new Error(`Invalid task: ${v.reason}`)
  const now = new Date().toISOString()

  return {
    id: partial.id as string,
    name: partial.name as string,
    enabled: partial.enabled ?? true, // 默认启用
    schedule: partial.schedule as ScanSchedule,
    dataSources: "EDR_EVENTS", // 默认数据源
    status: "pending", // 创建时固定状态
    createdAt: now,
    updatedAt: now,
    lastRunAt: undefined,
  }
}

/* -----------------------------
   示例
----------------------------- */

/** 每小时执行一次示例 */
export const hourlyAttckScanTaskExample: AttckScanTask = createAttckScanTask({
  id: "attck-hourly-001",
  name: "Hourly ATT&CK Detection",
  enabled: true,
  schedule: { period: { value: 1, unit: "hours" }, timezone: "Asia/Singapore" },
})

/** 每周执行一次示例 */
export const weeklyAttckScanTaskExample: AttckScanTask = createAttckScanTask({
  id: "attck-weekly-001",
  name: "Weekly ATT&CK Coverage Scan",
  enabled: true,
  schedule: { period: { value: 7, unit: "days" }, timezone: "Asia/Singapore" },
})
