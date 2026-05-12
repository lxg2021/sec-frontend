"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import SharedBaselineSelector, {
  type BaselineSelectorItem,
} from "@/shared/components/baseline-selector"

import type { BaselineOption } from "../api"

interface BaselineSelectorProps {
  options: BaselineOption[]
  value?: string
  onValueChange?: (value: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

const knownStandards = new Set(["cis", "dod", "msft", "tls", "intune", "custom"])
const knownProfiles = new Set(["machine", "user", "both"])

export function BaselineSelector({
  options,
  value,
  onValueChange,
  onRefresh,
  isRefreshing = false,
  className,
}: BaselineSelectorProps) {
  const t = useTranslations("pages.baseline.dashboard.selector")

  const items = useMemo<BaselineSelectorItem[]>(() => {
    return options.map((option) => {
      const standardKey = option.standard.toLowerCase()
      const profileKey = option.profile.toLowerCase()

      return {
        id: option.baseline_uuid,
        title: option.display_name || option.baseline_uuid,
        standardKey: knownStandards.has(standardKey) ? standardKey : "other",
        standardLabel:
          knownStandards.has(standardKey)
            ? t(`standard.${standardKey}`)
            : option.standard
              ? option.standard.toUpperCase()
              : t("unknown"),
        productLabel: option.product || t("unknown"),
        profileLabel: knownProfiles.has(profileKey)
          ? t(`profile.${profileKey}`)
          : option.profile || t("unknown"),
        osVersionLabel: option.os_version || undefined,
        lastCheckTime: option.latest_check_time || undefined,
        hostCount: option.host_count,
        itemCount: option.item_count,
        highCount: option.high_count,
        mediumCount: option.medium_count,
        lowCount: option.low_count,
      }
    })
  }, [options, t])

  return (
    <SharedBaselineSelector
      items={items}
      value={value}
      onValueChange={onValueChange}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      className={className}
      text={{
        current: t("current"),
        emptyPlaceholder: t("emptyPlaceholder"),
        hosts: (count) => t("hosts", { count }),
        checks: (count) => t("checks", { count }),
        lastChecked: t("lastChecked"),
        noCheck: t("noCheck"),
        noMatches: t("noMatches"),
        refresh: t("refresh"),
        searchPlaceholder: t("searchPlaceholder"),
        selectPlaceholder: t("selectPlaceholder"),
        unknown: t("unknown"),
      }}
    />
  )
}
