"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { isAppLocale, type AppLocale } from "@/shared/i18n/locales"

const LOCALE_COOKIE = "watchpoint-locale"

export function useLocaleSwitch() {
  const router = useRouter()
  const locale = useLocale()
  const currentLocale: AppLocale = isAppLocale(locale) ? locale : "zh-CN"

  const setLocale = (nextLocale: AppLocale) => {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = nextLocale
    router.refresh()
  }

  return {
    locale: currentLocale,
    setLocale,
    toggleLocale: () => setLocale(currentLocale === "zh-CN" ? "en" : "zh-CN"),
  }
}
