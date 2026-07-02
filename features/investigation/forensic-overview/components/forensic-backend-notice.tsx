"use client"

import { Info, TriangleAlert, CircleX } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { BackendNotice, NoticeLevel } from "../types"

interface Props {
  notices: BackendNotice[]
}

const levelStyles: Record<
  NoticeLevel,
  { wrap: string; icon: string; title: string }
> = {
  info: {
    wrap: "border-sky-200 bg-sky-50",
    icon: "text-sky-600",
    title: "text-foreground",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    title: "text-amber-900",
  },
  error: {
    wrap: "border-destructive/30 bg-destructive/10",
    icon: "text-destructive",
    title: "text-destructive",
  },
}

const levelIcon: Record<NoticeLevel, typeof Info> = {
  info: Info,
  warning: TriangleAlert,
  error: CircleX,
}

export function ForensicBackendNotice({ notices }: Props) {
  if (notices.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {notices.map((notice) => {
        const styles = levelStyles[notice.level]
        const Icon = levelIcon[notice.level]
        return (
          <div
            key={notice.id}
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3",
              styles.wrap,
            )}
          >
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", styles.icon)}
              aria-hidden="true"
            />
            <div className="text-sm">
              <p className={cn("font-medium", styles.title)}>{notice.title}</p>
              {notice.description ? (
                <p className="mt-0.5 leading-relaxed text-muted-foreground">
                  {notice.description}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

