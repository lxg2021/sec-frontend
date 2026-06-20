"use client"

import { FileText, History } from "lucide-react"

import { AttackWorkflowActionsTable } from "./attack-workflow-actions-table"
import { AttackWorkflowEventsTable } from "./attack-workflow-events-table"
import type {
  AttackWorkflowActionItem,
  AttackWorkflowEventItem,
} from "@/features/attack/workflow/types"
import { Card, CardContent } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

interface AttackWorkflowActivityPanelProps {
  actions: AttackWorkflowActionItem[]
  events: AttackWorkflowEventItem[]
  loading?: boolean
}

export function AttackWorkflowActivityPanel({
  actions,
  events,
  loading = false,
}: AttackWorkflowActivityPanelProps) {
  return (
    <Card className="min-h-0 w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <Tabs defaultValue="events" className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <TabsList className="h-9 rounded-lg bg-slate-100 p-1">
            <TabsTrigger
              value="events"
              className="gap-1.5 rounded-md px-3 text-sm data-[state=active]:bg-white"
            >
              <History className="size-4" />
              Events ({events.length})
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="gap-1.5 rounded-md px-3 text-sm data-[state=active]:bg-white"
            >
              <FileText className="size-4" />
              Actions ({actions.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="max-h-[clamp(18rem,45dvh,38rem)] min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
          <TabsContent value="events" className="m-0 min-w-0">
            <AttackWorkflowEventsTable events={events} loading={loading} />
          </TabsContent>
          <TabsContent value="actions" className="m-0 min-w-0">
            <AttackWorkflowActionsTable actions={actions} loading={loading} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
