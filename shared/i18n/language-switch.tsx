"use client"

import { Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/shared/ui/button"
import { useLocaleSwitch } from "@/shared/i18n/use-locale-switch"

interface LanguageSwitchProps {
  className?: string
}

export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const t = useTranslations("language")
  const { toggleLocale } = useLocaleSwitch()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleLocale}
      className={className}
      aria-label={t("switchTo")}
      title={t("switchTo")}
    >
      <Globe className="w-4 h-4" />
    </Button>
  )
}
