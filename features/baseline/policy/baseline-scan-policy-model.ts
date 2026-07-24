import type { ScanSchedule } from "@/shared/components/scan-schedule"

export const BASELINE_SCAN_POLICY_BASE_VERSION = "1.0.0"
export const BASELINE_SCAN_POLICY_DEFAULT_NEW_VERSION = "1.1.0"
export const DEFAULT_BASELINE_SCAN_POLICY_NAME = "默认基线扫描策略"

export const DEFAULT_BASELINE_SCAN_SCHEDULE: ScanSchedule = {
  mode: "interval",
  interval_hours: 24,
  specific_time: "01:00",
  random_delay_minutes: 60,
  retry_limit: 3,
  retry_interval_minutes: 30,
  scan_on_startup: true,
}

export interface BaselineScanPolicyFormValue {
  name: string
  version: string
  scanSchedule: ScanSchedule
}

export type BaselineScanPolicyValidationField =
  | "name"
  | "version"
  | "mode"
  | "interval_hours"
  | "specific_time"
  | "random_delay_minutes"
  | "retry_limit"
  | "retry_interval_minutes"

export interface BaselineScanPolicyValidationIssue {
  field: BaselineScanPolicyValidationField
  message: string
}

const SEMANTIC_VERSION_PATTERN = /^\d+\.\d+\.\d+$/
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export function createDefaultBaselineScanPolicyForm(): BaselineScanPolicyFormValue {
  return {
    name: DEFAULT_BASELINE_SCAN_POLICY_NAME,
    version: BASELINE_SCAN_POLICY_DEFAULT_NEW_VERSION,
    scanSchedule: { ...DEFAULT_BASELINE_SCAN_SCHEDULE },
  }
}

function isIntegerInRange(value: number | undefined, min: number, max?: number) {
  return (
    Number.isSafeInteger(value) &&
    value !== undefined &&
    value >= min &&
    (max === undefined || value <= max)
  )
}

export function validateBaselineScanPolicyForm(
  value: BaselineScanPolicyFormValue,
): BaselineScanPolicyValidationIssue | null {
  if (!value.name.trim()) {
    return { field: "name", message: "策略名称不能为空" }
  }
  if (!SEMANTIC_VERSION_PATTERN.test(value.version.trim())) {
    return { field: "version", message: "新版本必须使用 x.y.z 格式，例如 1.1.0" }
  }

  const schedule = value.scanSchedule
  if (schedule.mode !== "interval") {
    return { field: "mode", message: "当前仅支持固定间隔调度" }
  }
  if (!isIntegerInRange(schedule.interval_hours, 1, 24)) {
    return { field: "interval_hours", message: "执行间隔必须是 1–24 小时的整数" }
  }
  if (schedule.specific_time && !TIME_PATTERN.test(schedule.specific_time.trim())) {
    return { field: "specific_time", message: "固定执行时间必须使用 HH:mm 格式" }
  }
  if (!isIntegerInRange(schedule.random_delay_minutes, 0, 120)) {
    return { field: "random_delay_minutes", message: "随机延迟必须是 0–120 分钟的整数" }
  }
  if (!isIntegerInRange(schedule.retry_limit, 0, 10)) {
    return { field: "retry_limit", message: "重试次数必须是 0–10 的整数" }
  }
  if (!isIntegerInRange(schedule.retry_interval_minutes, 1)) {
    return { field: "retry_interval_minutes", message: "重试间隔必须是大于等于 1 的整数" }
  }

  return null
}

function normalizedSignatureValue(value: BaselineScanPolicyFormValue) {
  return {
    name: value.name.trim(),
    version: value.version.trim(),
    scanSchedule: {
      mode: value.scanSchedule.mode,
      interval_hours: value.scanSchedule.interval_hours,
      specific_time: value.scanSchedule.specific_time?.trim() || "",
      random_delay_minutes: value.scanSchedule.random_delay_minutes,
      retry_limit: value.scanSchedule.retry_limit,
      retry_interval_minutes: value.scanSchedule.retry_interval_minutes,
      scan_on_startup: value.scanSchedule.scan_on_startup,
    },
  }
}

export function createBaselineScanPolicySignature(value: BaselineScanPolicyFormValue) {
  return JSON.stringify(normalizedSignatureValue(value))
}

export function countModifiedBaselineScanPolicyFields(value: BaselineScanPolicyFormValue) {
  const current = normalizedSignatureValue(value)
  const defaults = normalizedSignatureValue(createDefaultBaselineScanPolicyForm())
  let modified = 0

  if (current.name !== defaults.name) modified += 1
  if (current.version !== defaults.version) modified += 1

  const scheduleFields = Object.keys(defaults.scanSchedule) as Array<
    keyof typeof defaults.scanSchedule
  >
  for (const field of scheduleFields) {
    if (current.scanSchedule[field] !== defaults.scanSchedule[field]) modified += 1
  }

  return modified
}
