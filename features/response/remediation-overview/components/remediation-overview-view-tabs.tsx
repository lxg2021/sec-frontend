"use client"

import { ListChecks, Monitor } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"

export type RemediationOverviewViewMode = "order" | "host"

export function RemediationOverviewViewTabs({
  mode,
  onChange,
}: {
  mode: RemediationOverviewViewMode
  onChange: (mode: RemediationOverviewViewMode) => void
}) {
  const t = useTranslations("pages.response.overview")

  return (
    <div
      role="tablist"
      aria-label={t("viewMode")}
      className="inline-flex shrink-0 rounded-xl bg-slate-100 p-1"
    >
      {([
        { value: "order" as const, label: t("byOrder"), icon: ListChecks },
        { value: "host" as const, label: t("byHost"), icon: Monitor },
      ]).map(({ value, label, icon: Icon }) => {
        const selected = mode === value
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex h-8 min-w-[96px] cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              selected
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
            )}
          >
            <Icon className={cn("size-3.5", selected && "text-blue-600")} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
