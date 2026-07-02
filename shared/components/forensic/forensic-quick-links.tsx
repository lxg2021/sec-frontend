"use client"

import Link from "next/link"
import { Hexagon, ListChecks, Plus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { buttonVariants } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

interface QuickLink {
  name: string
  href: string
  icon: LucideIcon
  variant: "default" | "outline"
}

const LINKS: QuickLink[] = [
  {
    name: "新建任务",
    href: "/frame/investigation/tasks?action=create",
    icon: Plus,
    variant: "default",
  },
  {
    name: "任务中心",
    href: "/frame/investigation/tasks",
    icon: ListChecks,
    variant: "outline",
  },
  {
    name: "工件配置",
    href: "/frame/investigation/artifacts",
    icon: Hexagon,
    variant: "outline",
  },
]

export function ForensicQuickLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">快捷入口</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href} className={cn(buttonVariants({ variant: link.variant, size: "sm" }))}>
                <Icon />
                {link.name}
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

