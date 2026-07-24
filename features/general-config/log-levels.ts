export const GENERAL_CONFIG_LOG_LEVEL_OPTIONS = [
  { value: 0, label: "Trace（全部）" },
  { value: 1, label: "Debug（调试）" },
  { value: 2, label: "Info（信息）" },
  { value: 3, label: "Warn（警告）" },
  { value: 4, label: "Error（错误）" },
  { value: 5, label: "Alarm（告警）" },
  { value: 6, label: "Fatal（致命）" },
] as const

export type GeneralConfigLogLevel =
  (typeof GENERAL_CONFIG_LOG_LEVEL_OPTIONS)[number]["value"]

export function isGeneralConfigLogLevel(
  value: number,
): value is GeneralConfigLogLevel {
  return GENERAL_CONFIG_LOG_LEVEL_OPTIONS.some((option) => option.value === value)
}
