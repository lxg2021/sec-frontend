"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Bot,
  ExternalLink,
  FileSearch,
  GitBranch,
  Loader2,
  Route,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react"

import { AttackWorkflowActivityPanel } from "./attack-workflow-activity-panel"
import { AttackWorkflowPageHeader } from "./attack-workflow-page-header"
import { AttackWorkflowSpine } from "./attack-workflow-spine"
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
  workflowEventComment,
} from "@/features/attack/workflow/utils"
import {
  buildAIAnalysisHref,
  buildAttackDetailHref,
  buildTraceHref,
} from "@/features/attack/detail/utils/attack-case-format"
import { cn } from "@/shared/lib/utils"
import { useToast } from "@/shared/hooks/use-toast"
import { Badge } from "@/shared/ui/badge"
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

const STATUS_OBJECTIVE: Partial<Record<AttackWorkflowStatus, string>> = {
  detected:
    "Create the investigation context, confirm the case scope, and decide whether to start AI analysis or trace review.",
  investigating:
    "Review AI conclusions and attack evidence. Open the detailed pages when deep reading is required, then return here for stage acceptance.",
  confirmed:
    "The attack has been confirmed. Prepare forensic collection or response preview before moving into execution-oriented stages.",
  forensics:
    "Collect host evidence and wait for control-side execution references to be written back into the workflow.",
  responding:
    "Generate and review response preview, then confirm execution when the operator accepts the impact.",
  contained:
    "Validate that containment actions are effective before starting remediation.",
  remediated:
    "Verify cleanup and remediation evidence, then close the case with a clear reason.",
  closed:
    "The workflow is closed. Use the timeline for audit and review.",
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : status || "Unknown"
}

function displayValue(value?: string) {
  return value?.trim() || "-"
}

function compactList(values: string[], limit = 3) {
  const visible = values.map((value) => value.trim()).filter(Boolean)
  if (visible.length === 0) return "-"
  const head = visible.slice(0, limit)
  const hidden = visible.length - head.length
  return hidden > 0 ? `${head.join(", ")} +${hidden}` : head.join(", ")
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
  const statusObjective =
    (normalizedStatus && STATUS_OBJECTIVE[normalizedStatus]) ||
    "Load an AttackWorkflow to see stage objectives and available transitions."
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
          recommendedStatus={recommendedStatus}
          statusObjective={statusObjective}
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

function latestEventComment(events: AttackWorkflowEventItem[]) {
  for (const event of [...events].reverse()) {
    const comment = workflowEventComment(event)
    if (comment) return comment
  }
  return ""
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
  recommendedStatus,
  statusObjective,
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
  recommendedStatus: AttackWorkflowStatus | null
  statusObjective: string
  updating: boolean
  workflow: AttackWorkflowItem | null
}) {
  return (
    <section className="grid min-h-0 w-full flex-1 grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]">
      <div className="flex min-w-0 flex-col gap-4">
        <WorkflowLifecycleSection
          loading={loading}
          recommendedStatus={recommendedStatus}
          workflow={workflow}
        />
        <AttackWorkflowActivityPanel
          actions={actions}
          events={events}
          loading={loading}
        />
        <WorkflowCurrentStageSection
          allowedStatuses={allowedStatuses}
          canOpenDetails={canOpenDetails}
          currentStatus={currentStatus}
          hrefs={hrefs}
          onOpenStatusDialog={onOpenStatusDialog}
          recommendedStatus={recommendedStatus}
          statusObjective={statusObjective}
          updating={updating}
        />
      </div>

      <WorkflowContextPanel events={events} workflow={workflow} />
    </section>
  )
}

function WorkflowLifecycleSection({
  loading,
  recommendedStatus,
  workflow,
}: {
  loading: boolean
  recommendedStatus: AttackWorkflowStatus | null
  workflow: AttackWorkflowItem | null
}) {
  return (
    <AttackWorkflowSpine
      workflow={workflow}
      loading={loading}
      recommendedStatus={recommendedStatus}
      density="dense"
      layout="auto"
    />
  )
}

function WorkflowCurrentStageSection({
  allowedStatuses,
  canOpenDetails,
  currentStatus,
  hrefs,
  onOpenStatusDialog,
  recommendedStatus,
  statusObjective,
  updating,
}: {
  allowedStatuses: AttackWorkflowStatus[]
  canOpenDetails: boolean
  currentStatus: string
  hrefs: WorkflowNavigationHrefs
  onOpenStatusDialog: OpenStatusDialog
  recommendedStatus: AttackWorkflowStatus | null
  statusObjective: string
  updating: boolean
}) {
  return (
    <Card className="w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">
              Current stage: {statusLabel(currentStatus)}
            </CardTitle>
            <CardDescription className="mt-1 max-w-[90rem] leading-5">
              {statusObjective}
            </CardDescription>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[18rem] xl:flex xl:flex-wrap xl:justify-end">
            {recommendedStatus ? (
              <Button
                type="button"
                onClick={() => onOpenStatusDialog(recommendedStatus)}
                disabled={updating}
                className="justify-center whitespace-nowrap"
              >
                <ArrowRight className="size-4" />
                Accept to {statusLabel(recommendedStatus)}
              </Button>
            ) : null}
            {allowedStatuses
              .filter((status) => status !== recommendedStatus)
              .map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  onClick={() => onOpenStatusDialog(status)}
                  disabled={updating}
                  className="justify-center whitespace-nowrap"
                >
                  {status === "closed" ? <ShieldCheck className="size-4" /> : <GitBranch className="size-4" />}
                  {statusLabel(status)}
                </Button>
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3 px-5 py-4">
        <StageActionCard
          title="Open Threat Analysis"
          description="Read the full AI report, evidence references, hypotheses, and recommended response actions."
          icon={Bot}
          href={hrefs.aiHref}
          disabled={!canOpenDetails}
        />
        <StageActionCard
          title="Open Trace Details"
          description="Review the attack story, trace graph, source fields, and node drilldown without compressing the detail page."
          icon={Route}
          href={hrefs.traceHref}
          disabled={!canOpenDetails}
        />
        <StageActionCard
          title="Prepare Response"
          description="After confirmation, use workflow actions and response pages for forensic collection, preview, execution, and writeback."
          icon={ShieldAlert}
          href="/frame/response/dac"
        />
      </CardContent>
    </Card>
  )
}

function WorkflowContextPanel({
  events,
  workflow,
}: {
  events: AttackWorkflowEventItem[]
  workflow: AttackWorkflowItem | null
}) {
  return (
    <aside className="grid min-w-0 gap-4 xl:grid-cols-2 2xl:flex 2xl:flex-col">
      <WorkflowFactsCard workflow={workflow} />
      <WorkflowOperatorNoteCard events={events} />
    </aside>
  )
}

function WorkflowFactsCard({ workflow }: { workflow: AttackWorkflowItem | null }) {
  return (
    <Card className="w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <CardTitle className="text-base">Case facts</CardTitle>
        <CardDescription>Fixed context for every linked detail page.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3 px-5 py-4 2xl:grid-cols-1">
        <Fact label="Root" value={workflow ? `${workflow.root_type || "-"} / ${workflow.root_id || "-"}` : "-"} mono />
        <Fact label="Primary agent" value={workflow?.primary_agent_id || "-"} mono />
        <Fact label="Agents" value={workflow ? compactList(workflow.agent_ids) : "-"} mono />
        <Fact label="Rules" value={workflow ? compactList(workflow.rule_ids) : "-"} mono />
        <Fact label="Instances" value={workflow ? compactList(workflow.instance_ids) : "-"} mono />
        <Fact label="Groups" value={workflow ? compactList(workflow.group_ids) : "-"} mono />
      </CardContent>
    </Card>
  )
}

function WorkflowOperatorNoteCard({ events }: { events: AttackWorkflowEventItem[] }) {
  return (
    <Card className="w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <CardTitle className="text-base">Operator note</CardTitle>
        <CardDescription>Latest status comment from workflow events.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="min-h-[5rem] break-words rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
          {latestEventComment(events) || "No operator note has been recorded yet."}
        </div>
      </CardContent>
    </Card>
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

function StageActionCard({
  description,
  disabled,
  href,
  icon: Icon,
  title,
}: {
  description: string
  disabled?: boolean
  href: string
  icon: typeof Bot
  title: string
}) {
  return (
    <div className="flex min-h-[clamp(10rem,22dvh,12rem)] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-blue-100">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 text-sm font-semibold leading-5 text-slate-950">{title}</div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {disabled ? (
        <Button variant="outline" size="sm" className="mt-3 w-fit" disabled>
          Open
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href={href}>
            Open
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  )
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className={cn("mt-1 break-all text-sm font-semibold text-slate-800", mono && "font-mono text-xs")} title={value}>
        {displayValue(value)}
      </div>
    </div>
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
