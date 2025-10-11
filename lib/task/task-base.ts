// task-base.ts

/** 周期单位 */
export type PeriodUnit = "minutes" | "hours" | "days" | "weeks" | "months"

/** 周期定义 (value 必须 >= 1) */
export interface Period {
  /** 周期数值 (>= 1) */
  value: number
  /** 周期单位 */
  unit: PeriodUnit
}

/** 扫描任务的周期调度（仅周期，后台按窗口周期扫描）*/
export interface ScanSchedule {
  /** 扫描周期 */
  period: Period
  /** 可选：IANA 时区字符串 (例如 "Asia/Singapore")，用于显示/记录 */
  timezone?: string
}

/** 任务运行状态 */
export type TaskStatus = "pending" | "running" | "completed" | "failed"

/**
 * 调度模式
 * - `IMMEDIATE`: 立即执行
 * - `SCHEDULED`: 定时执行（指定时间 + 周期）
 */
export type ScheduleMode = "IMMEDIATE" | "SCHEDULED"

/**
 * 任务调度配置（两种方式之一）
 * - IMMEDIATE: 立即执行
 * - SCHEDULED: 定时执行
 */
export type ScheduledConfig =
  | {
      /** 立即执行模式 */
      mode: "IMMEDIATE"
    }
  | {
      /** 定时执行模式 */
      mode: "SCHEDULED"

      /** 开始时间（ISO 8601 格式） */
      startTime: string // e.g. "2025-10-11T14:30:00+08:00"

      /** 执行周期（每多少单位执行一次） */
      period: Period

      /** 可选：时区（IANA 格式，如 "Asia/Singapore"） */
      timezone?: string
    }

/*
 * 校验 Period 合法性（value >= 1，unit 为允许值
 */
export function validatePeriod(p: Period | unknown): p is Period {
  if (!p || typeof p !== "object") return false
  const pp = p as Period
  if (typeof pp.value !== "number" || !Number.isFinite(pp.value) || pp.value < 1) return false
  const units: PeriodUnit[] = ["minutes", "hours", "days", "weeks", "months"]
  return units.includes(pp.unit)
}
