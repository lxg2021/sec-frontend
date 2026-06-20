"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Activity,
  Bot,
  ExternalLink,
  FileSearch,
  Loader2,
  Route,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react"

import { AttackWorkflowActivityPanel } from "./attack-workflow-activity-panel"
import { AttackWorkflowPageHeader } from "./attack-workflow-page-header"
import { AttackWorkflowProcessCard } from "./attack-workflow-process-card"
import { AttackWorkflowStageWorkbench } from "./attack-workflow-stage-workbench"
import {
  getAttackWorkflow,
  getAttackWorkflowByCaseId,
  updateAttackWorkflowStatus,
} from "@/features/attack/workflow/api"
import {
  ATTACK_WORKFLOW_CLOSE_REASONS,
  type AttackWorkflowCloseReason,
} from "@/features/attack/workflow/constants"
import type {
  AttackWorkflowActionItem,
  AttackWorkflowDetail,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import {
  formatWorkflowTime,
  getAllowedWorkflowTransitions,
  getRecommendedNextWorkflowStatus,
  normalizeWorkflowStatus,
} from "@/features/attack/workflow/utils"
import {
  buildAIAnalysisHref,
  buildAttackDetailHref,
  buildTraceHref,
} from "@/features/attack/detail/utils/attack-case-format"
import { cn } from "@/shared/lib/utils"
import { useToast } from "@/shared/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"

interface AttackWorkflowControlCenterProps {
  caseId?: string
  snapshotId?: string
  workflowId?: string
  tenantId?: string
}

interface PhaseSummary {
  status: "ready" | "running" | "pending" | "failed" | "empty"
  label: string
  description: string
}

interface WorkflowNavigationHrefs {
  attackDetailHref: string
  traceHref: string
  aiHref: string
}

type OpenStatusDialog = (status: AttackWorkflowStatus) => void

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

const CLOSE_REASON_LABELS: Record<AttackWorkflowCloseReason, string> = {
  resolved: "Resolved",
  false_positive: "False positive",
  duplicate: "Duplicate",
  accepted_risk: "Accepted risk",
  other: "Other",
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : status || "Unknown"
}

function summaryTone(status: PhaseSummary["status"]) {
  switch (status) {
    case "ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "running":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function actionStatusRank(status: string) {
  switch (status.trim().toLowerCase()) {
    case "failed":
      return 5
    case "running":
      return 4
    case "pending":
      return 3
    case "success":
      return 2
    case "skipped":
      return 1
    default:
      return 0
  }
}

function latestAction(actions: AttackWorkflowActionItem[]) {
  return [...actions].sort((a, b) => {
    const aTime = a.updated_at || a.executed_at || a.requested_at || a.created_at
    const bTime = b.updated_at || b.executed_at || b.requested_at || b.created_at
    return bTime.localeCompare(aTime)
  })[0]
}

function summarizeActions(
  actions: AttackWorkflowActionItem[],
  predicate: (action: AttackWorkflowActionItem) => boolean,
  emptyDescription: string,
): PhaseSummary {
  const matched = actions.filter(predicate)
  if (matched.length === 0) {
    return {
      status: "empty",
      label: "Not recorded",
      description: emptyDescription,
    }
  }

  const ranked = [...matched].sort((a, b) =>
    actionStatusRank(b.action_status) - actionStatusRank(a.action_status),
  )
  const strongest = ranked[0]
  const newest = latestAction(matched) ?? strongest
  const actionStatus = strongest.action_status.trim().toLowerCase()
  const status: PhaseSummary["status"] =
    actionStatus === "success"
      ? "ready"
      : actionStatus === "running"
        ? "running"
        : actionStatus === "failed"
          ? "failed"
          : "pending"

  return {
    status,
    label: strongest.action_status || "Recorded",
    description: [
      newest.action_type || "workflow action",
      newest.workflow_action_id ? `id ${newest.workflow_action_id}` : "",
      formatWorkflowTime(newest.updated_at || newest.executed_at || newest.requested_at),
    ].filter(Boolean).join(" / "),
  }
}

function hasTraceEvent(events: AttackWorkflowEventItem[]) {
  return events.some((event) => {
    const value = `${event.event_key} ${event.event_type} ${event.payload_json}`.toLowerCase()
    return value.includes("trace") || value.includes("graph")
  })
}

function buildStatusPayload(comment: string, source: string) {
  const normalized = comment.trim()
  if (!normalized) return ""
  return JSON.stringify({
    comment: normalized,
    source,
  })
}

export function AttackWorkflowControlCenter({
  caseId = "",
  snapshotId = "",
  workflowId = "",
  tenantId = "",
}: AttackWorkflowControlCenterProps) {
  const { toast } = useToast()
  const [detail, setDetail] = useState<AttackWorkflowDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<AttackWorkflowStatus | "">("")
  const [selectedWorkbenchStatus, setSelectedWorkbenchStatus] =
    useState<AttackWorkflowStatus>("detected")
  const [comment, setComment] = useState("")
  const [closeReason, setCloseReason] = useState<AttackWorkflowCloseReason>("resolved")
  const [updating, setUpdating] = useState(false)
  const loadSeqRef = useRef(0)

  const normalizedCaseId = caseId.trim()
  const normalizedWorkflowId = workflowId.trim()

  const loadWorkflow = useCallback(async () => {
    const nextSeq = loadSeqRef.current + 1
    loadSeqRef.current = nextSeq

    if (!normalizedCaseId && !normalizedWorkflowId) {
      setDetail(null)
      setError("")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const nextDetail = normalizedWorkflowId
        ? await getAttackWorkflow({
            tenantId,
            workflowId: normalizedWorkflowId,
            includeActions: true,
            includeEvents: true,
          })
        : await getAttackWorkflowByCaseId({
            tenantId,
            caseId: normalizedCaseId,
            includeActions: true,
            includeEvents: true,
          })

      if (loadSeqRef.current !== nextSeq) return
      setDetail(nextDetail)
    } catch (err) {
      if (loadSeqRef.current !== nextSeq) return
      setError(err instanceof Error ? err.message : "Failed to load AttackWorkflow.")
      setDetail(null)
    } finally {
      if (loadSeqRef.current === nextSeq) {
        setLoading(false)
      }
    }
  }, [normalizedCaseId, normalizedWorkflowId, tenantId])

  useEffect(() => {
    void loadWorkflow()
  }, [loadWorkflow])

  const workflow = detail?.workflow ?? null
  const actions = detail?.actions ?? []
  const events = detail?.events ?? []
  const activeCaseId = workflow?.case_id || normalizedCaseId
  const activeWorkflowId = workflow?.workflow_id || normalizedWorkflowId
  const currentStatus = workflow?.status ?? ""
  const normalizedStatus = normalizeWorkflowStatus(currentStatus)
  const recommendedStatus = getRecommendedNextWorkflowStatus(currentStatus)
  const allowedStatuses = getAllowedWorkflowTransitions(currentStatus)
  const canOpenDetails = Boolean(activeCaseId)
  const detailOptions = {
    workflowId: activeWorkflowId,
    returnToWorkflow: true,
  }
  const attackDetailHref = buildAttackDetailHref(activeCaseId, snapshotId)
  const traceHref = canOpenDetails
    ? buildTraceHref(activeCaseId, snapshotId, detailOptions)
    : "/frame/attack/drill"
  const aiHref = canOpenDetails
    ? buildAIAnalysisHref(activeCaseId, snapshotId, detailOptions)
    : "/frame/ai-ops/threat-analysis"
  const navigationHrefs: WorkflowNavigationHrefs = {
    attackDetailHref,
    traceHref,
    aiHref,
  }

  useEffect(() => {
    setSelectedWorkbenchStatus(normalizedStatus || "detected")
  }, [workflow?.workflow_id, normalizedStatus])

  const summaries = useMemo(() => {
    const ai = summarizeActions(
      actions,
      (action) => {
        const text = `${action.action_phase} ${action.action_type}`.toLowerCase()
        return text.includes("investigation") || text.includes("ai")
      },
      "No investigation action is recorded in this workflow. Open Threat Analysis to inspect or start the AI task.",
    )
    const forensic = summarizeActions(
      actions,
      (action) => action.action_phase.toLowerCase() === "forensics" || Boolean(action.forensic),
      "No forensic collection action is recorded yet.",
    )
    const remediation = summarizeActions(
      actions,
      (action) => action.action_phase.toLowerCase() === "remediation" || Boolean(action.remediation),
      "No remediation preview or execution action is recorded yet.",
    )
    const trace: PhaseSummary = hasTraceEvent(events)
      ? {
          status: "ready",
          label: "Recorded",
          description: "Trace or graph event exists in workflow timeline.",
        }
      : {
          status: "empty",
          label: "Open detail",
          description: "Trace state is owned by the Trace Details page.",
        }

    return { ai, trace, forensic, remediation }
  }, [actions, events])

  function openStatusDialog(status: AttackWorkflowStatus) {
    setSelectedStatus(status)
    setComment("")
    setCloseReason((workflow?.close_reason as AttackWorkflowCloseReason) || "resolved")
  }

  async function submitStatusUpdate() {
    if (!workflow || !selectedStatus || updating) return
    if (selectedStatus === "closed" && !closeReason.trim()) return

    setUpdating(true)
    try {
      const updated = await updateAttackWorkflowStatus({
        tenantId,
        workflowId: workflow.workflow_id,
        status: selectedStatus,
        closeReason: selectedStatus === "closed" ? closeReason : undefined,
        payloadJson: buildStatusPayload(comment, "attack_workflow_control_center"),
      })

      if (updated) {
        setDetail((current) => current ? { ...current, workflow: updated } : current)
      }
      setSelectedStatus("")
      toast({ title: `Workflow status updated to ${statusLabel(selectedStatus)}.` })
      await loadWorkflow()
    } catch (err) {
      toast({
        title: "Failed to update workflow status",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (!normalizedCaseId && !normalizedWorkflowId) {
    return <WorkflowEmptyState />
  }

  return (
    <main className="flex min-h-[calc(100dvh-3rem)] w-full overflow-x-hidden bg-gray-50 p-3 sm:p-4 xl:p-5">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
        <AttackWorkflowPageHeader
          activeCaseId={activeCaseId}
          activeWorkflowId={activeWorkflowId}
          canOpenDetails={canOpenDetails}
          currentStatus={currentStatus}
          error={error}
          hrefs={navigationHrefs}
          loading={loading}
          onRefresh={loadWorkflow}
          updating={updating}
          workflow={workflow}
        />

        <WorkflowSummaryGrid
          canOpenDetails={canOpenDetails}
          hrefs={navigationHrefs}
          summaries={summaries}
        />

        <WorkflowMainGrid
          actions={actions}
          allowedStatuses={allowedStatuses}
          canOpenDetails={canOpenDetails}
          currentStatus={currentStatus}
          events={events}
          hrefs={navigationHrefs}
          loading={loading}
          onOpenStatusDialog={openStatusDialog}
          onWorkbenchStatusSelect={setSelectedWorkbenchStatus}
          recommendedStatus={recommendedStatus}
          selectedWorkbenchStatus={selectedWorkbenchStatus}
          updating={updating}
          workflow={workflow}
        />
      </div>

      <StatusDialog
        closeReason={closeReason}
        comment={comment}
        currentStatus={currentStatus}
        onCloseReasonChange={setCloseReason}
        onCommentChange={setComment}
        onOpenChange={(open) => {
          if (!updating && !open) setSelectedStatus("")
        }}
        onSubmit={() => void submitStatusUpdate()}
        open={Boolean(selectedStatus)}
        selectedStatus={selectedStatus}
        updating={updating}
      />
    </main>
  )
}

function WorkflowEmptyState() {
  return (
    <main className="flex min-h-[calc(100dvh-3rem)] w-full overflow-x-hidden bg-gray-50 p-3 sm:p-4 xl:p-5">
      <Card className="w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
              <ShieldQuestion className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-xl font-semibold text-slate-950">
                AttackWorkflow Control Center
              </CardTitle>
              <CardDescription className="mt-1">
                Open this page with a caseId or workflowId to manage the response workflow.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-end px-5 py-4">
          <Button asChild>
            <Link href="/frame/attack/detail">Open Attack Cases</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

function WorkflowSummaryGrid({
  canOpenDetails,
  hrefs,
  summaries,
}: {
  canOpenDetails: boolean
  hrefs: WorkflowNavigationHrefs
  summaries: {
    ai: PhaseSummary
    trace: PhaseSummary
    forensic: PhaseSummary
    remediation: PhaseSummary
  }
}) {
  return (
    <section className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-3">
      <SummaryCard
        title="AI analysis"
        icon={Bot}
        summary={summaries.ai}
        actionHref={hrefs.aiHref}
        actionLabel="Open AI detail"
        disabled={!canOpenDetails}
      />
      <SummaryCard
        title="Trace evidence"
        icon={Route}
        summary={summaries.trace}
        actionHref={hrefs.traceHref}
        actionLabel="Open Drill"
        disabled={!canOpenDetails}
      />
      <SummaryCard
        title="Forensics"
        icon={FileSearch}
        summary={summaries.forensic}
        actionLabel="Pending action"
        disabled
      />
      <SummaryCard
        title="Remediation"
        icon={ShieldCheck}
        summary={summaries.remediation}
        actionHref="/frame/response/dac"
        actionLabel="Open Response"
      />
    </section>
  )
}

function WorkflowMainGrid({
  actions,
  allowedStatuses,
  canOpenDetails,
  currentStatus,
  events,
  hrefs,
  loading,
  onOpenStatusDialog,
  onWorkbenchStatusSelect,
  recommendedStatus,
  selectedWorkbenchStatus,
  updating,
  workflow,
}: {
  actions: AttackWorkflowActionItem[]
  allowedStatuses: AttackWorkflowStatus[]
  canOpenDetails: boolean
  currentStatus: string
  events: AttackWorkflowEventItem[]
  hrefs: WorkflowNavigationHrefs
  loading: boolean
  onOpenStatusDialog: OpenStatusDialog
  onWorkbenchStatusSelect: (status: AttackWorkflowStatus) => void
  recommendedStatus: AttackWorkflowStatus | null
  selectedWorkbenchStatus: AttackWorkflowStatus
  updating: boolean
  workflow: AttackWorkflowItem | null
}) {
  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <AttackWorkflowProcessCard
        loading={loading}
        onStatusSelect={onWorkbenchStatusSelect}
        recommendedStatus={recommendedStatus}
        selectedStatus={selectedWorkbenchStatus}
        workflow={workflow}
      />

      <AttackWorkflowStageWorkbench
        actions={actions}
        allowedStatuses={allowedStatuses}
        canOpenDetails={canOpenDetails}
        currentStatus={currentStatus}
        events={events}
        hrefs={hrefs}
        loading={loading}
        onOpenStatusDialog={onOpenStatusDialog}
        recommendedStatus={recommendedStatus}
        selectedStatus={selectedWorkbenchStatus}
        updating={updating}
        workflow={workflow}
      />

      <AttackWorkflowActivityPanel
        actions={actions}
        events={events}
        loading={loading}
        variant="card"
        workflow={workflow}
      />
    </section>
  )
}

function SummaryCard({
  actionHref,
  actionLabel,
  disabled,
  icon: Icon,
  summary,
  title,
}: {
  actionHref?: string
  actionLabel: string
  disabled?: boolean
  icon: typeof Bot
  summary: PhaseSummary
  title: string
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex min-h-[clamp(9rem,18dvh,11rem)] flex-col justify-between gap-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{title}</div>
            <div className="mt-1 truncate text-lg font-semibold text-slate-950">{summary.label}</div>
          </div>
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", summaryTone(summary.status))}>
            <Icon className="size-4" />
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-5 text-slate-500">{summary.description}</p>
        {actionHref && !disabled ? (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href={actionHref}>
              {actionLabel}
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-fit" disabled>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function StatusDialog({
  closeReason,
  comment,
  currentStatus,
  onCloseReasonChange,
  onCommentChange,
  onOpenChange,
  onSubmit,
  open,
  selectedStatus,
  updating,
}: {
  closeReason: AttackWorkflowCloseReason
  comment: string
  currentStatus: string
  onCloseReasonChange: (value: AttackWorkflowCloseReason) => void
  onCommentChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  open: boolean
  selectedStatus: AttackWorkflowStatus | ""
  updating: boolean
}) {
  const canSubmit =
    Boolean(selectedStatus) &&
    !updating &&
    (selectedStatus !== "closed" || Boolean(closeReason.trim()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-slate-200 p-0 shadow-xl">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Activity className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-950">
                Update workflow status
              </DialogTitle>
              <DialogDescription className="mt-1">
                {statusLabel(currentStatus)} -&gt; {selectedStatus ? statusLabel(selectedStatus) : "-"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          {selectedStatus === "closed" ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="attack-workflow-center-close-reason">
                Close reason
              </label>
              <Select value={closeReason} onValueChange={(value) => onCloseReasonChange(value as AttackWorkflowCloseReason)}>
                <SelectTrigger id="attack-workflow-center-close-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTACK_WORKFLOW_CLOSE_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {CLOSE_REASON_LABELS[reason]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="attack-workflow-center-comment">
              Operator note
            </label>
            <Textarea
              id="attack-workflow-center-comment"
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder="Record the decision basis, accepted evidence, or manual override reason."
              className="min-h-28 resize-y rounded-xl border-slate-200 text-sm leading-6"
            />
            <p className="text-xs leading-5 text-slate-500">
              This note is written to payload_json and will be visible in the workflow timeline.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-slate-100 px-5 py-4 sm:space-x-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={updating}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onSubmit} disabled={!canSubmit}>
            {updating ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
