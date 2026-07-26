export const GENERAL_CONFIG_LOG_LEVEL_OPTIONS = [
  { value: 0, labelKey: "generalConfig.logLevels.trace" },
  { value: 1, labelKey: "generalConfig.logLevels.debug" },
  { value: 2, labelKey: "generalConfig.logLevels.info" },
  { value: 3, labelKey: "generalConfig.logLevels.warn" },
  { value: 4, labelKey: "generalConfig.logLevels.error" },
  { value: 5, labelKey: "generalConfig.logLevels.alarm" },
  { value: 6, labelKey: "generalConfig.logLevels.fatal" },
] as const

export type GeneralConfigLogLevel =
  (typeof GENERAL_CONFIG_LOG_LEVEL_OPTIONS)[number]["value"]

export function isGeneralConfigLogLevel(
  value: number,
): value is GeneralConfigLogLevel {
  return GENERAL_CONFIG_LOG_LEVEL_OPTIONS.some((option) => option.value === value)
}
