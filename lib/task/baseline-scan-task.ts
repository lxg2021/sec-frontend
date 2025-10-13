// baseline-scan-task.ts

import { type ScanSchedule, type TaskStatus, validatePeriod } from "./task-base"

/** 基线策略类型 */
export type BaselinePolicyType = "SECURITY_CONFIG" | "PATCH_COMPLIANCE" | "ACCOUNT_POLICY" | "ATTCK_POLICY" | "SYSTEM_COMPLIANCE" | "PREEXECUTION_CHECK"

/* 基线扫描任务类型 */
export interface BaselineScanTask {
  /** 任务唯一 ID（推荐 UUID） */
  id: string

  /** 任务名称 */
  name: string

  /** 是否启用 */
  enabled: boolean

  /** 调度（周期） */
  schedule: ScanSchedule

  /** 目标主机 ID 列表 */
  targetHosts: string[]

  /** 使用的基线策略（支持多选） */
  policy: BaselinePolicyType[]

  /** 当前任务状态，前端创建时应为 "pending" */
  status: TaskStatus

  /** 创建时间 (ISO 字符串) */
  createdAt: string

  /** 更新时间 (ISO 字符串，可选) */
  updatedAt?: string
}

/* 校验函数 */
export function validateBaselineScanTask(t: Partial<BaselineScanTask>): { ok: true } | { ok: false; reason: string } {
  if (!t) return { ok: false, reason: "task is empty" }
  if (!t.id || typeof t.id !== "string") return { ok: false, reason: "missing or invalid id" }
  if (!t.name || typeof t.name !== "string") return { ok: false, reason: "missing or invalid name" }
  if (typeof t.enabled !== "boolean") return { ok: false, reason: "missing enabled flag" }
  if (!t.schedule || typeof t.schedule !== "object") return { ok: false, reason: "missing schedule" }

  const schedule = t.schedule as ScanSchedule
  if (!schedule || !validatePeriod(schedule.period)) return { ok: false, reason: "invalid schedule.period" }

  if (!Array.isArray(t.targetHosts) || t.targetHosts.length === 0)
    return { ok: false, reason: "missing or empty targetHosts" }

  if (!Array.isArray(t.policy) || t.policy.length === 0)
    return { ok: false, reason: "policy must be a non-empty array" }

  const validPolicies = ["SECURITY_CONFIG", "PATCH_COMPLIANCE", "CUSTOM_POLICY"]
  if (!t.policy.every((p) => validPolicies.includes(p))) return { ok: false, reason: "invalid policy type in array" }

  if (t.status && !["pending", "running", "completed", "failed"].includes(t.status))
    return { ok: false, reason: "invalid status" }

  return { ok: true }
}

/* 工厂函数 */
export function createBaselineScanTask(partial: Partial<BaselineScanTask>): BaselineScanTask {
  const v = validateBaselineScanTask(partial)
  if (!v.ok) throw new Error(`Invalid task: ${v.reason}`)

  const now = new Date().toISOString()

  return {
    id: partial.id as string,
    name: partial.name as string,
    enabled: partial.enabled ?? true,
    schedule: partial.schedule as ScanSchedule,
    targetHosts: partial.targetHosts ?? [],
    policy: partial.policy as BaselinePolicyType[],
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }
}

/* -----------------------------
   示例
----------------------------- */

export const hourlyBaselineScanExample: BaselineScanTask = createBaselineScanTask({
  id: "baseline-hourly-001",
  name: "Hourly Security Config Scan",
  enabled: true,
  schedule: { period: { value: 1, unit: "hours" }, timezone: "Asia/Singapore" },
  policy: ["SECURITY_CONFIG"],
  targetHosts: ["host-001", "host-002"],
})

export const dailyPatchComplianceScanExample: BaselineScanTask = createBaselineScanTask({
  id: "baseline-daily-001",
  name: "Daily Patch Compliance Scan",
  enabled: true,
  schedule: { period: { value: 1, unit: "days" }, timezone: "Asia/Singapore" },
  policy: ["PATCH_COMPLIANCE", "CUSTOM_POLICY"],
  targetHosts: ["group-001"],
})
