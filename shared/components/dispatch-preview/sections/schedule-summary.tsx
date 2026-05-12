"use client"

import { Calendar, Clock, Timer, Zap } from "lucide-react"

import { Badge } from "@/shared/ui/badge"

import type { DispatchSchedule } from "../types"

export function ScheduleSummary({
  schedule,
}: {
  schedule: DispatchSchedule
}) {
  const isImmediate = schedule.mode === "immediate"

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="size-4" />
        <span>执行计划</span>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-full p-2 ${
              isImmediate ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {isImmediate ? <Zap className="size-5" /> : <Timer className="size-5" />}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {isImmediate ? "立即执行" : "按计划执行"}
              </span>
              <Badge variant={isImmediate ? "default" : "secondary"} className="text-xs">
                {isImmediate ? "即时任务" : "计划任务"}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">{schedule.summary}</p>

            {!isImmediate ? (
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                {schedule.executeAt ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>{schedule.executeAt}</span>
                  </div>
                ) : null}
                {schedule.timezone ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>{schedule.timezone}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {schedule.cronText ? (
              <div className="mt-2 border-t pt-2">
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  {schedule.cronText}
                </code>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
