"use client"

import { AlertTriangle, Loader2 } from "lucide-react"

import type { AttackWorkflowActionItem } from "@/features/attack/workflow/types"
import { formatWorkflowTime } from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

interface AttackWorkflowActionsTableProps {
  actions: AttackWorkflowActionItem[]
  loading?: boolean
}

interface ReferenceField {
  label: string
  value: string
}

function displayValue(value?: string | number) {
  const normalized = String(value ?? "").trim()
  return normalized || "-"
}

function actionStatusTone(status: string) {
  switch (status.trim().toLowerCase()) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "running":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "skipped":
      return "border-slate-200 bg-slate-50 text-slate-500"
    case "pending":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700"
  }
}

function phaseTone(phase: string) {
  switch (phase.trim().toLowerCase()) {
    case "investigation":
      return "border-cyan-200 bg-cyan-50 text-cyan-700"
    case "forensics":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "remediation":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function actionTime(action: AttackWorkflowActionItem) {
  return formatWorkflowTime(
    action.updated_at ||
      action.executed_at ||
      action.requested_at ||
      action.created_at,
  )
}

function targetText(action: AttackWorkflowActionItem) {
  const target = [action.target_type, action.target_key]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(": ")
  return target || action.agent_id || action.case_id || "-"
}

function actionReferences(action: AttackWorkflowActionItem): ReferenceField[] {
  const refs: ReferenceField[] = [
    { label: "Action", value: action.workflow_action_id },
    { label: "Batch", value: action.action_batch_id },
  ]

  if (action.investigation) {
    refs.push(
      { label: "Investigation job", value: action.investigation.investigation_job_id },
      { label: "Investigation trace", value: action.investigation.investigation_trace_id },
    )
  }

  if (action.forensic) {
    refs.push(
      { label: "Forensic plan", value: action.forensic.forensic_plan_id },
      { label: "Forensic execution", value: action.forensic.forensic_execution_id },
      { label: "Forensic task", value: action.forensic.forensic_task_id },
      { label: "Forensic trace", value: action.forensic.forensic_trace_id },
      { label: "Artifact", value: action.forensic.artifact_uri },
    )
  }

  if (action.remediation) {
    refs.push(
      { label: "Preview", value: action.remediation.preview_id },
      { label: "Execution", value: action.remediation.execution_id },
      { label: "Execute task", value: action.remediation.execute_task_id },
      { label: "PMC trace", value: action.remediation.pmc_trace_id },
      { label: "Control ref", value: action.remediation.control_ref_json },
    )
  }

  return refs.filter((ref) => ref.value.trim())
}

function actionPayload(action: AttackWorkflowActionItem) {
  return (
    action.remediation?.payload_json ||
    action.forensic?.payload_json ||
    action.investigation?.payload_json ||
    ""
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      No workflow action has been recorded yet.
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      <Loader2 className="mr-2 size-4 animate-spin text-sky-500" />
      Loading workflow actions...
    </div>
  )
}

function ReferenceList({ refs }: { refs: ReferenceField[] }) {
  if (refs.length === 0) {
    return <span className="text-xs text-slate-400">-</span>
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      {refs.slice(0, 6).map((ref) => (
        <div key={`${ref.label}:${ref.value}`} className="min-w-0 text-xs">
          <span className="font-medium text-slate-400">{ref.label}: </span>
          <span
            className="break-all font-mono text-slate-600"
            title={ref.value}
          >
            {ref.value}
          </span>
        </div>
      ))}
      {refs.length > 6 ? (
        <span className="text-xs font-medium text-slate-400">
          +{refs.length - 6} more references
        </span>
      ) : null}
    </div>
  )
}

function ActionError({ action }: { action: AttackWorkflowActionItem }) {
  if (!action.error_code && !action.error_msg) return null

  return (
    <div className="mt-2 flex min-w-0 items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0 break-all">
        {displayValue(action.error_code)} / {displayValue(action.error_msg)}
      </span>
    </div>
  )
}

function ActionMobileCard({ action }: { action: AttackWorkflowActionItem }) {
  const refs = actionReferences(action)
  const payload = actionPayload(action)

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-slate-500">
            {actionTime(action)}
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-950">
            {displayValue(action.action_type)}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 rounded-full", actionStatusTone(action.action_status))}
        >
          {displayValue(action.action_status)}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className={cn("rounded-full", phaseTone(action.action_phase))}
        >
          {displayValue(action.action_phase)}
        </Badge>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
          {displayValue(targetText(action))}
        </span>
      </div>
      <div className="mt-3">
        <ReferenceList refs={refs} />
      </div>
      {payload ? (
        <div
          className="mt-3 line-clamp-2 break-all font-mono text-xs leading-5 text-slate-500"
          title={payload}
        >
          {payload}
        </div>
      ) : null}
      <ActionError action={action} />
    </article>
  )
}

export function AttackWorkflowActionsTable({
  actions,
  loading = false,
}: AttackWorkflowActionsTableProps) {
  if (loading) return <LoadingState />
  if (actions.length === 0) return <EmptyState />

  return (
    <div className="min-w-0">
      <div className="grid gap-3 md:hidden">
        {actions.map((action) => (
          <ActionMobileCard
            key={action.workflow_action_id || `${action.action_batch_id}:${action.created_at}`}
            action={action}
          />
        ))}
      </div>

      <div className="hidden min-w-0 rounded-xl border border-slate-200 md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50">
            <TableRow className="hover:bg-slate-50">
              <TableHead className="h-11 w-[13rem] text-xs font-semibold text-slate-500">
                Time
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                Phase / action
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                Target
              </TableHead>
              <TableHead className="h-11 w-[10rem] text-xs font-semibold text-slate-500">
                Status
              </TableHead>
              <TableHead className="h-11 min-w-[26rem] text-xs font-semibold text-slate-500">
                References
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => {
              const refs = actionReferences(action)
              const payload = actionPayload(action)

              return (
                <TableRow
                  key={action.workflow_action_id || `${action.action_batch_id}:${action.created_at}`}
                  className="hover:bg-slate-50/80"
                >
                  <TableCell className="whitespace-nowrap py-3 align-top font-mono text-xs text-slate-500">
                    {actionTime(action)}
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className={cn("rounded-full", phaseTone(action.action_phase))}
                      >
                        {displayValue(action.action_phase)}
                      </Badge>
                      <div
                        className="mt-2 truncate text-sm font-semibold text-slate-950"
                        title={action.action_type}
                      >
                        {displayValue(action.action_type)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <div
                      className="max-w-[18rem] break-all font-mono text-xs leading-5 text-slate-600"
                      title={targetText(action)}
                    >
                      {targetText(action)}
                    </div>
                    {action.agent_id ? (
                      <div
                        className="mt-1 truncate font-mono text-[11px] text-slate-400"
                        title={action.agent_id}
                      >
                        agent / {action.agent_id}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <Badge
                      variant="outline"
                      className={cn("rounded-full", actionStatusTone(action.action_status))}
                    >
                      {displayValue(action.action_status)}
                    </Badge>
                    <ActionError action={action} />
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <ReferenceList refs={refs} />
                    {payload ? (
                      <div
                        className="mt-2 line-clamp-2 break-all font-mono text-xs leading-5 text-slate-500"
                        title={payload}
                      >
                        {payload}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
