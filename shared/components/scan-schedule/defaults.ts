import type { ScanSchedule } from "./types"

export const DEFAULT_SCAN_SCHEDULE: ScanSchedule = {
  mode: "interval",
  interval_hours: 24,
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
