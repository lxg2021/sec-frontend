"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  AttackWorkflowActionItem,
  AttackWorkflowItem,
} from "@/features/attack/workflow/types"
import { formatWorkflowTime } from "@/features/attack/workflow/utils"
import { listForensicTasks } from "@/shared/lib/forensic/api"
import type { ForensicTaskItem } from "@/shared/lib/forensic/types"
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
  workflow?: AttackWorkflowItem | null
}

interface ReferenceField {
  label: string
  value: string
}

type WorkflowCenterT = ReturnType<typeof useTranslations>

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

function actionStatusLabel(t: WorkflowCenterT, status: string) {
  switch (status.trim().toLowerCase()) {
    case "success":
      return t("actions.status.success")
    case "running":
      return t("actions.status.running")
    case "failed":
      return t("actions.status.failed")
    case "skipped":
      return t("actions.status.skipped")
    case "pending":
      return t("actions.status.pending")
    default:
      return displayValue(status)
  }
}

function actionPhaseLabel(t: WorkflowCenterT, phase: string) {
  switch (phase.trim().toLowerCase()) {
    case "investigation":
      return t("actions.phase.investigation")
    case "forensics":
      return t("actions.phase.forensics")
    case "remediation":
      return t("actions.phase.remediation")
    default:
      return displayValue(phase)
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

function actionReferences(
  t: WorkflowCenterT,
  action: AttackWorkflowActionItem,
  forensicTasks: ForensicTaskItem[] = [],
): ReferenceField[] {
  const refs: ReferenceField[] = [
    { label: t("actions.refs.action"), value: action.workflow_action_id },
    { label: t("actions.refs.batch"), value: action.action_batch_id },
  ]

  if (action.investigation) {
    refs.push(
      {
        label: t("actions.refs.investigationJob"),
        value: action.investigation.investigation_job_id,
      },
      {
        label: t("actions.refs.investigationTrace"),
        value: action.investigation.investigation_trace_id,
      },
    )
  }

  forensicTasks.forEach((task) => {
    const flowRef = task.remote_flow_id ? `flow:${task.remote_flow_id}` : ""
    refs.push({
      label: t("actions.refs.forensicTask"),
      value: [task.task_id, task.status, flowRef].filter(Boolean).join(" / "),
    })
  })

  if (action.remediation) {
    refs.push(
      {
        label: t("actions.refs.preview"),
        value: action.remediation.preview_id,
      },
      {
        label: t("actions.refs.execution"),
        value: action.remediation.execution_id,
      },
      {
        label: t("actions.refs.executeTask"),
        value: action.remediation.execute_task_id,
      },
      {
        label: t("actions.refs.pmcTrace"),
        value: action.remediation.pmc_trace_id,
      },
      {
        label: t("actions.refs.controlRef"),
        value: action.remediation.control_ref_json,
      },
    )
  }

  return refs.filter((ref) => ref.value.trim())
}

function actionPayload(action: AttackWorkflowActionItem) {
  return (
    action.remediation?.payload_json ||
    action.investigation?.payload_json ||
    ""
  )
}

function EmptyState({ t }: { t: WorkflowCenterT }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {t("actions.empty")}
    </div>
  )
}

function LoadingState({ t }: { t: WorkflowCenterT }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      <Loader2 className="mr-2 size-4 animate-spin text-sky-500" />
      {t("actions.loading")}
    </div>
  )
}

function ReferenceList({
  refs,
  t,
}: {
  refs: ReferenceField[]
  t: WorkflowCenterT
}) {
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
          {t("actions.moreReferences", { count: refs.length - 6 })}
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

function ActionMobileCard({
  action,
  forensicTasks,
  t,
}: {
  action: AttackWorkflowActionItem
  forensicTasks: ForensicTaskItem[]
  t: WorkflowCenterT
}) {
  const refs = actionReferences(t, action, forensicTasks)
  const payload = actionPayload(action)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
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
          className={cn(
            "shrink-0 rounded-full",
            actionStatusTone(action.action_status),
          )}
        >
          {actionStatusLabel(t, action.action_status)}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className={cn("rounded-full", phaseTone(action.action_phase))}
        >
          {actionPhaseLabel(t, action.action_phase)}
        </Badge>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
          {displayValue(targetText(action))}
        </span>
      </div>
      <div className="mt-3">
        <ReferenceList refs={refs} t={t} />
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
  workflow = null,
}: AttackWorkflowActionsTableProps) {
  const t = useTranslations("pages.attack.workflowCenter")
  const [forensicTasksByAction, setForensicTasksByAction] = useState<
    Record<string, ForensicTaskItem[]>
  >({})
  const workflowId = useMemo(
    () =>
      workflow?.workflow_id ||
      actions.find((action) => action.workflow_id)?.workflow_id ||
      "",
    [actions, workflow?.workflow_id],
  )

  useEffect(() => {
    if (!workflowId) {
      setForensicTasksByAction({})
      return undefined
    }

    let cancelled = false
    listForensicTasks({ workflow_id: workflowId, page: 1, page_size: 100 })
      .then((data) => {
        if (cancelled) return
        const grouped: Record<string, ForensicTaskItem[]> = {}
        for (const task of data.items) {
          const actionId = task.workflow_action_id?.trim()
          if (!actionId) continue
          grouped[actionId] = [...(grouped[actionId] ?? []), task]
        }
        setForensicTasksByAction(grouped)
      })
      .catch(() => {
        if (!cancelled) setForensicTasksByAction({})
      })

    return () => {
      cancelled = true
    }
  }, [workflowId])

  if (loading) return <LoadingState t={t} />
  if (actions.length === 0) return <EmptyState t={t} />

  return (
    <div className="min-w-0">
      <div className="grid gap-3 md:hidden">
        {actions.map((action) => (
          <ActionMobileCard
            key={
              action.workflow_action_id ||
              `${action.action_batch_id}:${action.created_at}`
            }
            action={action}
            forensicTasks={
              forensicTasksByAction[action.workflow_action_id] ?? []
            }
            t={t}
          />
        ))}
      </div>

      <div className="hidden min-w-0 md:block">
        <Table className="min-w-[1120px]">
          <TableHeader className="sticky top-0 z-10 bg-slate-100">
            <TableRow className="hover:bg-slate-100">
              <TableHead className="h-11 w-[13rem] text-xs font-semibold text-slate-500">
                {t("actions.columns.time")}
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                {t("actions.columns.phaseAction")}
              </TableHead>
              <TableHead className="h-11 w-[18rem] text-xs font-semibold text-slate-500">
                {t("actions.columns.target")}
              </TableHead>
              <TableHead className="h-11 w-[10rem] text-xs font-semibold text-slate-500">
                {t("actions.columns.status")}
              </TableHead>
              <TableHead className="h-11 min-w-[26rem] text-xs font-semibold text-slate-500">
                {t("actions.columns.references")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => {
              const refs = actionReferences(
                t,
                action,
                forensicTasksByAction[action.workflow_action_id] ?? [],
              )
              const payload = actionPayload(action)

              return (
                <TableRow
                  key={
                    action.workflow_action_id ||
                    `${action.action_batch_id}:${action.created_at}`
                  }
                  className="hover:bg-slate-50/80"
                >
                  <TableCell className="whitespace-nowrap py-3 align-top font-mono text-xs text-slate-500">
                    {actionTime(action)}
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full",
                          phaseTone(action.action_phase),
                        )}
                      >
                        {actionPhaseLabel(t, action.action_phase)}
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
                        {t("actions.agent")} / {action.agent_id}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full",
                        actionStatusTone(action.action_status),
                      )}
                    >
                      {actionStatusLabel(t, action.action_status)}
                    </Badge>
                    <ActionError action={action} />
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <ReferenceList refs={refs} t={t} />
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
