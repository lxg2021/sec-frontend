import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import enMessages from "@/messages/en.json"
import zhMessages from "@/messages/zh-CN.json"
import { defaultLocale, getPreferredLocale, isAppLocale } from "@/shared/i18n/locales"

const LOCALE_COOKIE = "watchpoint-locale"

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value
  const headerLocale = headers().get("accept-language")

  const locale = isAppLocale(cookieLocale)
    ? cookieLocale
    : getPreferredLocale(headerLocale)

  const messages = locale === "en" ? enMessages : zhMessages

  return {
    locale: locale || defaultLocale,
    messages,
  }
})
