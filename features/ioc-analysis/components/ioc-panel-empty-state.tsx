"use client"

import type { ReactNode } from "react"
import { Box } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export function IocPanelEmptyState({
  className,
  description,
  icon,
  title,
}: {
  className?: string
  description?: string
  icon?: ReactNode
  title: string
}) {
  return (
    <div className={cn("flex h-full min-h-0 items-center justify-center px-6 py-8 text-center", className)}>
      <div className="max-w-[560px]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center text-slate-400">
          {icon || <Box className="h-11 w-11 stroke-[1.7]" aria-hidden="true" />}
        </div>
        <div className="text-sm font-medium text-slate-600">{title}</div>
        {description ? (
          <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
