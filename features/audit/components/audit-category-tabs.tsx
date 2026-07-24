"use client"

import { History, SendHorizontal, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"
import type { AuditCategory } from "@/features/audit/types"
import { cn } from "@/shared/lib/utils"

interface AuditCategoryTabsProps {
  value: AuditCategory
  onChange: (value: AuditCategory) => void
}

const categories = [
  { value: "dispatch" as const, labelKey: "dispatch", icon: SendHorizontal },
  { value: "user" as const, labelKey: "user", icon: UserRound },
  { value: "change" as const, labelKey: "change", icon: History },
]

export function AuditCategoryTabs({ value, onChange }: AuditCategoryTabsProps) {
  const t = useTranslations("pages.reports.categories")

  return (
    <div
      className="inline-flex max-w-full shrink-0 gap-0.5 overflow-x-auto rounded-full border border-slate-200 bg-slate-100/80 p-1"
      role="tablist"
      aria-label={t("label")}
    >
      {categories.map(({ value: category, labelKey, icon: Icon }) => {
        const active = value === category
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(category)}
            className={cn(
              "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1",
              active
                ? "bg-white text-cyan-600 shadow-sm ring-1 ring-cyan-100"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-cyan-500" : "text-slate-400")}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <span>{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}


