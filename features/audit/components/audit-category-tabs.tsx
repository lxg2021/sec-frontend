"use client"

import { FileOutput, ShieldCheck, UserRound } from "lucide-react"
import type { AuditCategory } from "@/features/audit/types"
import { cn } from "@/shared/lib/utils"

interface AuditCategoryTabsProps {
  value: AuditCategory
  onChange: (value: AuditCategory) => void
}

const categories = [
  { value: "dispatch" as const, label: "下发审计", icon: FileOutput },
  { value: "user" as const, label: "用户审计", icon: UserRound },
  { value: "change" as const, label: "变更审计", icon: ShieldCheck },
]

export function AuditCategoryTabs({ value, onChange }: AuditCategoryTabsProps) {
  return (
    <div className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner shadow-slate-200/20" role="tablist" aria-label="审计分类">
      {categories.map(({ value: category, label, icon: Icon }) => {
        const active = value === category
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(category)}
            className={cn(
              "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm 2xl:px-4 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              active ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-slate-500 hover:bg-white/80 hover:text-slate-800",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}




