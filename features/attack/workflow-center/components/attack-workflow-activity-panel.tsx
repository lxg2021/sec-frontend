"use client"

import { FileText, History, Network } from "lucide-react"
import { useTranslations } from "next-intl"

import { AttackWorkflowActionsTable } from "./attack-workflow-actions-table"
import { AttackWorkflowEventsTable } from "./attack-workflow-events-table"
import { AttackWorkflowImpactSurface } from "./attack-workflow-impact-surface"
import type {
  AttackWorkflowActionItem,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
} from "@/features/attack/workflow/types"
import { cn } from "@/shared/lib/utils"
import { Card } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

interface AttackWorkflowActivityPanelProps {
  actions: AttackWorkflowActionItem[]
  events: AttackWorkflowEventItem[]
  workflow?: AttackWorkflowItem | null
  loading?: boolean
  variant?: "card" | "embedded"
  className?: string
}

export function AttackWorkflowActivityPanel({
  actions,
  events,
  workflow = null,
  loading = false,
  variant = "card",
  className,
}: AttackWorkflowActivityPanelProps) {
  const t = useTranslations("pages.attack.workflowCenter")
  const content = (
    <Tabs defaultValue="events" className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-full bg-slate-100 p-1 sm:grid-cols-3 lg:inline-flex lg:w-auto">
          <TabsTrigger
            value="events"
            className="min-h-8 gap-1.5 rounded-full px-3 text-sm data-[state=active]:bg-white"
          >
            <History className="size-4" />
            {t("activity.events", { count: events.length })}
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="min-h-8 gap-1.5 rounded-full px-3 text-sm data-[state=active]:bg-white"
          >
            <FileText className="size-4" />
            {t("activity.actions", { count: actions.length })}
          </TabsTrigger>
          <TabsTrigger
            value="impact"
            disabled
            className="min-h-8 gap-1.5 rounded-full px-3 text-sm data-[state=active]:bg-white"
          >
            <Network className="size-4" />
            {t("activity.impactSurface")}
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
        <TabsContent value="impact" className="m-0 min-w-0">
          <AttackWorkflowImpactSurface workflow={workflow} loading={loading} />
        </TabsContent>
        <TabsContent value="events" className="m-0 min-w-0">
          <AttackWorkflowEventsTable events={events} loading={loading} />
        </TabsContent>
        <TabsContent value="actions" className="m-0 min-w-0">
          <AttackWorkflowActionsTable
            actions={actions}
            loading={loading}
            workflow={workflow}
          />
        </TabsContent>
      </div>
    </Tabs>
  )

  if (variant === "embedded") {
    return (
      <section
        className={cn(
          "flex min-h-0 w-full min-w-0 flex-col overflow-hidden",
          className,
        )}
      >
        {content}
      </section>
    )
  }

  return (
    <Card
      className={cn(
        "flex min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[24px] border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      {content}
    </Card>
  )
}
