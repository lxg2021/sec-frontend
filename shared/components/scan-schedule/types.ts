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

export interface ScanScheduleFormText {
  loading?: string
  title?: ReactNode
  description?: ReactNode
  modeLabel: string
  modePlaceholder: string
  modeInterval: string
  intervalLabel: string
  intervalValue: (hours: number) => string
  fixedTimeLabel: string
  randomDelayLabel: string
  randomDelayValue: (minutes: number) => string
  retryCountLabel: string
  retryIntervalLabel: string
  retryNone: string
  retryTimes: (count: number) => string
  minutesUnit: string
  startupTitle: string
  startupDescription: string
  startupInlineLabel?: string
}

export interface ScanScheduleFormField {
  id: string
  label: ReactNode
  value: string
  error?: ReactNode
  icon?: ReactNode
  inputClassName?: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

export interface ScanScheduleFormProps {
  value?: Partial<ScanSchedule>
  onChange?: (schedule: ScanSchedule) => void
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  disabled?: boolean
  fields?: ScanScheduleFormField[]
  showStartup?: boolean
  text?: ScanScheduleFormText
}
