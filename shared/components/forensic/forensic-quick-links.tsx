"use client"

import Link from "next/link"
import { ChevronRight, Hexagon, ListChecks, Plus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicIconTone } from "./forensic-panel-chrome"

interface QuickLink {
  name: string
  description: string
  href: string
  icon: LucideIcon
  tone: ForensicIconTone
  primary?: boolean
}

const LINKS: QuickLink[] = [
  {
    name: "新建任务",
    description: "选择终端与工件下发取证",
    href: "/frame/investigation/tasks?action=create",
    icon: Plus,
    tone: "cyan",
    primary: true,
  },
  {
    name: "任务中心",
    description: "查看任务详情与远端 flow",
    href: "/frame/investigation/tasks",
    icon: ListChecks,
    tone: "slate",
  },
  {
    name: "工件配置",
    description: "管理启用的取证工件",
    href: "/frame/investigation/artifacts",
    icon: Hexagon,
    tone: "slate",
  },
]

const ICON_CAPSULE_CLASS: Record<ForensicIconTone, string> = {
  cyan: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200",
  sky: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200",
  teal: "bg-teal-500/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
  amber: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
  red: "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-200",
  slate: "bg-slate-500/10 text-slate-600 dark:bg-slate-400/10 dark:text-slate-200",
}

export function ForensicQuickLinks() {
  return (
    <Card className="border-0">
      <CardContent className="p-5">
        <div className="grid gap-2">
          {LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex min-h-16 items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                  link.primary
                    ? "bg-cyan-500/10 hover:bg-cyan-500/15"
                    : "bg-background/40 hover:bg-accent"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-full",
                    ICON_CAPSULE_CLASS[link.tone]
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{link.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{link.description}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
