export const locales = ["zh-CN", "en"] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = "zh-CN"

export const localeLabels: Record<AppLocale, string> = {
  "zh-CN": "中",
  en: "EN",
}

export function isAppLocale(locale: string | null | undefined): locale is AppLocale {
  return locales.includes(locale as AppLocale)
}

export function getPreferredLocale(language?: string | null): AppLocale {
  if (!language) return defaultLocale
  return language.toLowerCase().startsWith("zh") ? "zh-CN" : "en"
}
