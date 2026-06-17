import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export function Section({
  id,
  title,
  icon: Icon,
  count,
  description,
  children,
  className,
}: {
  id?: string
  title: string
  icon: LucideIcon
  count?: number
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {typeof count === "number" ? (
            <span className="font-mono text-sm text-muted-foreground tabular-nums">{count}</span>
          ) : null}
        </div>
      </div>
      {description ? <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {children}
    </section>
  )
}

export function SectionEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
