import type { ReactNode } from "react"

export interface ScanSchedule {
  mode: "interval"
  interval_hours?: number
  specific_time?: string
  random_delay_minutes?: number
  retry_limit?: number
  retry_interval_minutes?: number
  scan_on_startup: boolean
}

export interface ScanScheduleFormProps {
  value?: Partial<ScanSchedule>
  onChange?: (schedule: ScanSchedule) => void
  title?: ReactNode
  description?: ReactNode
  className?: string
  disabled?: boolean
  showStartup?: boolean
}
