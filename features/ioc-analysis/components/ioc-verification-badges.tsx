"use client"

import { useTranslations } from "next-intl"

import type {
  IocVerificationItem,
  IocVerificationType,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"

import {
  allowlistClass,
  isAllowlisted,
  typeClass,
  verdictClass,
  verdictFromItem,
} from "./ioc-verification-display-utils"

export function TypeBadge({ type }: { type: IocVerificationType }) {
  const t = useTranslations("pages.iocAnalysis.verification")

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2 py-1 font-mono text-[11px] uppercase", typeClass(type))}
    >
      {t(`types.${type}`)}
    </Badge>
  )
}

export function VerdictBadge({
  item,
  lowercase = false,
}: {
  item: IocVerificationItem
  lowercase?: boolean
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const verdict = verdictFromItem(item)
  const label = t(`verdict.${verdict}`)

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", verdictClass(verdict))}
    >
      {lowercase ? label.toLocaleLowerCase() : label}
    </Badge>
  )
}

export function AllowlistBadge({
  item,
  lowercase = false,
}: {
  item: IocVerificationItem
  lowercase?: boolean
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const label =
    item.status === "checking"
      ? t("allowlist.checking")
      : isAllowlisted(item)
        ? t("allowlist.hit")
      : item.status === "idle"
        ? t("allowlist.pending")
        : t("allowlist.miss")

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", allowlistClass(item))}
    >
      {lowercase ? label.toLocaleLowerCase() : label}
    </Badge>
  )
}
