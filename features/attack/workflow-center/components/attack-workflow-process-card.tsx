"use client"

import { ShieldAlert } from "lucide-react"

import { AttackWorkflowActivityPanel } from "./attack-workflow-activity-panel"
import { AttackWorkflowSpine } from "./attack-workflow-spine"
import type {
  AttackWorkflowActionItem,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import { normalizeWorkflowStatus } from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Card } from "@/shared/ui/card"

interface AttackWorkflowProcessCardProps {
  actions: AttackWorkflowActionItem[]
  events: AttackWorkflowEventItem[]
  loading?: boolean
  recommendedStatus: AttackWorkflowStatus | null
  workflow: AttackWorkflowItem | null
}

const STATUS_LABELS: Record<AttackWorkflowStatus, string> = {
  detected: "Detected",
  investigating: "Investigating",
  confirmed: "Confirmed",
  forensics: "Forensics",
  responding: "Responding",
  contained: "Contained",
  remediated: "Remediated",
  closed: "Closed",
}

function displayHeaderValue(value?: string) {
  return value?.trim() || "-"
}

function displayWorkflowTitle(value?: string) {
  const normalized = value?.trim().replace(/^攻击链[:：]\s*/i, "")
  return normalized || "-"
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : status || "Unknown"
}

function processNotice(workflow: AttackWorkflowItem | null) {
  if (!workflow) return ""

  const normalized = normalizeWorkflowStatus(workflow.status)
  const closeReason = workflow.close_reason.trim()
  if (normalized === "closed") {
    return closeReason
      ? `This attack workflow is closed. Close reason: ${closeReason}.`
      : "This attack workflow is closed."
  }
  if (normalized) {
    return `This attack workflow is currently in ${STATUS_LABELS[normalized]}.`
  }
  return "This attack workflow has an unknown lifecycle status."
}

function processNoticeTone(workflow: AttackWorkflowItem | null) {
  const normalized = normalizeWorkflowStatus(workflow?.status ?? "")
  switch (normalized) {
    case "closed":
    case "remediated":
    case "contained":
      return "border-emerald-100 bg-emerald-50/70 text-emerald-700"
    case "responding":
    case "forensics":
      return "border-blue-100 bg-blue-50/70 text-blue-700"
    case "confirmed":
      return "border-amber-100 bg-amber-50/70 text-amber-700"
    case "investigating":
      return "border-cyan-100 bg-cyan-50/70 text-cyan-700"
    case "detected":
      return "border-rose-100 bg-rose-50/70 text-rose-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function WorkflowHeader({
  loading,
  workflow,
}: {
  loading: boolean
  workflow: AttackWorkflowItem | null
}) {
  const title =
    loading && !workflow
      ? "Title loading..."
      : displayWorkflowTitle(workflow?.title)
  const caseId =
    loading && !workflow ? "Loading..." : displayHeaderValue(workflow?.case_id)

  return (
    <header className="flex min-w-0 items-center gap-3 px-6 py-5">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            "line-clamp-2 break-words text-lg font-semibold leading-6 text-slate-950",
            loading && !workflow && "text-slate-400",
          )}
          title={title}
        >
          {title}
        </h2>

        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="font-medium">Case ID</span>
          <span
            className={cn(
              "min-w-0 max-w-full rounded-md bg-slate-100 px-3 py-1 font-mono text-xs font-semibold leading-5 text-slate-700",
              loading && !workflow && "text-slate-400",
            )}
            title={caseId}
          >
            <span className="line-clamp-2 break-all">{caseId}</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export function AttackWorkflowProcessCard({
  actions,
  events,
  loading = false,
  recommendedStatus,
  workflow,
}: AttackWorkflowProcessCardProps) {
  const notice = processNotice(workflow)

  return (
    <Card className="min-h-0 w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <WorkflowHeader loading={loading} workflow={workflow} />

      <div className="border-t border-slate-100">
        <AttackWorkflowSpine
          workflow={workflow}
          loading={loading}
          recommendedStatus={recommendedStatus}
          density="dense"
          layout="auto"
          variant="embedded"
          showFootnotes={false}
        />
      </div>

      {notice ? (
        <div className="border-t border-slate-100 px-4 py-3">
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium",
              processNoticeTone(workflow),
            )}
          >
            {notice}
          </div>
        </div>
      ) : null}

      <div className="border-t border-slate-100">
        <AttackWorkflowActivityPanel
          actions={actions}
          events={events}
          loading={loading}
          variant="embedded"
          workflow={workflow}
        />
      </div>
    </Card>
  )
}
