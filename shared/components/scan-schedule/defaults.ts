import type { ScanSchedule } from "./types"

export const MIN_INTERVAL_HOURS = 1
export const MAX_INTERVAL_HOURS = 24
export const MIN_RANDOM_DELAY_MINUTES = 0
export const MAX_RANDOM_DELAY_MINUTES = 20

export const DEFAULT_SCAN_SCHEDULE: ScanSchedule = {
  mode: "interval",
  interval_hours: MAX_INTERVAL_HOURS,
  specific_time: "12:00",
  random_delay_minutes: 5,
  retry_limit: 3,
  retry_interval_minutes: 5,
  scan_on_startup: false,
}

export function mergeScanScheduleDefaults(value?: Partial<ScanSchedule>): ScanSchedule {
  return {
    ...DEFAULT_SCAN_SCHEDULE,
    ...value,
  }
}

export function sanitizeScanSchedule(value?: Partial<ScanSchedule>): ScanSchedule {
  const schedule = mergeScanScheduleDefaults(value)

  return {
    ...schedule,
    interval_hours: Math.min(
      MAX_INTERVAL_HOURS,
      Math.max(MIN_INTERVAL_HOURS, schedule.interval_hours ?? DEFAULT_SCAN_SCHEDULE.interval_hours),
    ),
    random_delay_minutes: Math.min(
      MAX_RANDOM_DELAY_MINUTES,
      Math.max(
        MIN_RANDOM_DELAY_MINUTES,
        schedule.random_delay_minutes ?? DEFAULT_SCAN_SCHEDULE.random_delay_minutes ?? 0,
      ),
    ),
    retry_interval_minutes: Math.max(1, schedule.retry_interval_minutes ?? DEFAULT_SCAN_SCHEDULE.retry_interval_minutes ?? 1),
  }
}
