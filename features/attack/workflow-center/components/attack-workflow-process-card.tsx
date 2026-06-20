"use client"

import { AttackWorkflowActivityPanel } from "./attack-workflow-activity-panel"
import { AttackWorkflowSpine } from "./attack-workflow-spine"
import type {
  AttackWorkflowActionItem,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import {
  formatWorkflowTime,
  normalizeWorkflowStatus,
} from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Card } from "@/shared/ui/card"

interface AttackWorkflowProcessCardProps {
  actions: AttackWorkflowActionItem[]
  events: AttackWorkflowEventItem[]
  loading?: boolean
  recommendedStatus: AttackWorkflowStatus | null
  workflow: AttackWorkflowItem | null
}

interface FactItem {
  label: string
  value: string
  mono?: boolean
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

function displayValue(value?: string) {
  return value?.trim() || "-"
}

function compactList(values: string[], limit = 2) {
  const visible = values.map((value) => value.trim()).filter(Boolean)
  if (visible.length === 0) return "-"

  const head = visible.slice(0, limit)
  const hidden = visible.length - head.length
  return hidden > 0 ? `${head.join(", ")} +${hidden}` : head.join(", ")
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

function workflowFacts(workflow: AttackWorkflowItem | null): FactItem[] {
  return [
    {
      label: "Tenant",
      value: workflow?.tenant_id || "-",
      mono: true,
    },
    {
      label: "Root",
      value: workflow
        ? `${displayValue(workflow.root_type)} / ${displayValue(workflow.root_id)}`
        : "-",
      mono: true,
    },
    {
      label: "Primary agent",
      value: workflow?.primary_agent_id || "-",
      mono: true,
    },
    {
      label: "Updated",
      value: workflow ? formatWorkflowTime(workflow.updated_at) : "-",
      mono: true,
    },
    {
      label: "Agents",
      value: workflow ? compactList(workflow.agent_ids) : "-",
      mono: true,
    },
    {
      label: "Rules",
      value: workflow ? compactList(workflow.rule_ids) : "-",
      mono: true,
    },
    {
      label: "Instances",
      value: workflow ? compactList(workflow.instance_ids) : "-",
      mono: true,
    },
    {
      label: "Groups",
      value: workflow ? compactList(workflow.group_ids) : "-",
      mono: true,
    },
  ]
}

function FactsStrip({
  loading,
  workflow,
}: {
  loading: boolean
  workflow: AttackWorkflowItem | null
}) {
  const facts = workflowFacts(workflow)

  return (
    <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-x-8 gap-y-4 px-4 py-4">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-400">
            {fact.label}
          </div>
          <div
            className={cn(
              "mt-1 line-clamp-2 break-all text-sm font-semibold text-slate-800",
              fact.mono && "font-mono text-xs",
              loading && !workflow && "text-slate-400",
            )}
            title={fact.value}
          >
            {loading && !workflow ? "Loading..." : fact.value}
          </div>
        </div>
      ))}
    </div>
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
      <FactsStrip loading={loading} workflow={workflow} />

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
