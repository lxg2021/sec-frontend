"use client"

import { FileText, History, Network } from "lucide-react"

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
  const content = (
    <Tabs defaultValue="events" className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-3 lg:inline-flex lg:w-auto">
          <TabsTrigger
            value="events"
            className="min-h-8 gap-1.5 rounded-md px-3 text-sm data-[state=active]:bg-white"
          >
            <History className="size-4" />
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="min-h-8 gap-1.5 rounded-md px-3 text-sm data-[state=active]:bg-white"
          >
            <FileText className="size-4" />
            Actions ({actions.length})
          </TabsTrigger>
          <TabsTrigger
            value="impact"
            disabled
            className="min-h-8 gap-1.5 rounded-md px-3 text-sm data-[state=active]:bg-white"
          >
            <Network className="size-4" />
            Impact Surface
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="max-h-[clamp(18rem,45dvh,38rem)] min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
        <TabsContent value="impact" className="m-0 min-w-0">
          <AttackWorkflowImpactSurface workflow={workflow} loading={loading} />
        </TabsContent>
        <TabsContent value="events" className="m-0 min-w-0">
          <AttackWorkflowEventsTable events={events} loading={loading} />
        </TabsContent>
        <TabsContent value="actions" className="m-0 min-w-0">
          <AttackWorkflowActionsTable actions={actions} loading={loading} />
        </TabsContent>
      </div>
    </Tabs>
  )

  if (variant === "embedded") {
    return (
      <section
        className={cn("min-h-0 w-full min-w-0 overflow-hidden", className)}
      >
        {content}
      </section>
    )
  }

  return (
    <Card
      className={cn(
        "min-h-0 w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {content}
    </Card>
  )
}
