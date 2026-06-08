"use client"

import { BarChart } from "lucide-react"
import { useTranslations } from "next-intl"

import type { AttackDashboardHeaderProps } from "@/features/attack/dashboard/components/attack-dashboard-header"
import { AttackDashboardHeader } from "@/features/attack/dashboard/components/attack-dashboard-header"

export function AttackDetailHeader(props: AttackDashboardHeaderProps) {
  const t = useTranslations("navigation")

  return (
    <AttackDashboardHeader
      {...props}
      title={t("attdetail")}
      icon={<BarChart className="h-5 w-5" strokeWidth={2.1} />}
      iconContainerClassName="bg-[#EEF4FF] text-[#77A8FF] shadow-none"
      showCheckAction={false}
    />
  )
}
