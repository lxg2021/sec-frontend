"use client"

import type { HTMLAttributes, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardDescription, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

export type ForensicIconTone =
  | "cyan"
  | "sky"
  | "teal"
  | "indigo"
  | "emerald"
  | "amber"
  | "red"
  | "slate"

const ICON_TONE_CLASS: Record<ForensicIconTone, string> = {
  cyan: "bg-cyan-500/10 text-cyan-600 ring-cyan-500/20 dark:text-cyan-300 dark:ring-cyan-400/15",
  sky: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300 dark:ring-sky-400/15",
  teal: "bg-teal-500/10 text-teal-600 ring-teal-500/20 dark:text-teal-300 dark:ring-teal-400/15",
  indigo: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-400/15",
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/15",
  amber: "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300 dark:ring-amber-400/20",
  red: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-300 dark:ring-red-400/15",
  slate: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300 dark:ring-slate-400/15",
}

interface ForensicSummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export function ForensicSummaryCard({
  className,
  children,
  ...props
}: ForensicSummaryCardProps) {
  return (
    <Card
      className={cn(
        "relative h-full min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition-shadow duration-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:bg-slate-950",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

interface ForensicIconBadgeProps {
  icon: LucideIcon
  tone?: ForensicIconTone
  className?: string
  iconClassName?: string
}

export function ForensicIconBadge({
  icon: Icon,
  tone = "cyan",
  className,
  iconClassName,
}: ForensicIconBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
        ICON_TONE_CLASS[tone],
        className
      )}
    >
      <Icon aria-hidden className={cn("size-5 stroke-[2]", iconClassName)} />
    </span>
  )
}

interface ForensicPanelHeaderProps {
  icon: LucideIcon
  tone?: ForensicIconTone
  iconColor?: string
  title: string
  description?: string
  action?: ReactNode
}

export function ForensicPanelHeader({
  icon,
  tone = "cyan",
  iconColor,
  title,
  description,
  action,
}: ForensicPanelHeaderProps) {
  const Icon = icon

  if (iconColor) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", iconColor)}>
            <Icon className="size-5 text-white" aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <CardTitle className="text-base font-medium leading-6 text-slate-950 dark:text-slate-100">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {action}
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <ForensicIconBadge icon={icon} tone={tone} />
        <div className="min-w-0 pt-0.5">
          <CardTitle className="text-base font-medium leading-6 text-foreground">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}
