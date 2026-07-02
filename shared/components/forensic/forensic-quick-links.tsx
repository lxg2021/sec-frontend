"use client"

import Link from "next/link"
import { ChevronRight, Hexagon, ListChecks, Plus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import { ForensicIconBadge, type ForensicIconTone } from "./forensic-panel-chrome"

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

export function ForensicQuickLinks() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="grid gap-2">
          {LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex min-h-16 items-center gap-3 rounded-lg border px-3 py-3 transition-colors",
                  link.primary
                    ? "border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/15"
                    : "border-border bg-background/40 hover:bg-accent"
                )}
              >
                <ForensicIconBadge icon={Icon} tone={link.tone} className="size-10" />
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
