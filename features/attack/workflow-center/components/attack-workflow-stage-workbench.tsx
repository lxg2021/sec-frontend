"use client"

import Link from "next/link"
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileClock,
  FileSearch,
  GitBranch,
  LockKeyhole,
  Route,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import type {
  AttackWorkflowActionItem,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import {
  formatWorkflowTime,
  normalizeWorkflowStatus,
  workflowEventComment,
  workflowEventTime,
  workflowStatusIndex,
  workflowStatusTime,
} from "@/features/attack/workflow/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

interface WorkflowNavigationHrefs {
  attackDetailHref: string
  traceHref: string
  aiHref: string
}

interface AttackWorkflowStageWorkbenchProps {
  actions: AttackWorkflowActionItem[]
  allowedStatuses: AttackWorkflowStatus[]
  canOpenDetails: boolean
  currentStatus: string
  events: AttackWorkflowEventItem[]
  hrefs: WorkflowNavigationHrefs
  loading?: boolean
  onOpenStatusDialog: (status: AttackWorkflowStatus) => void
  recommendedStatus: AttackWorkflowStatus | null
  selectedStatus: AttackWorkflowStatus
  updating?: boolean
  workflow: AttackWorkflowItem | null
}

interface StageConfig {
  title: string
  purpose: string
  input: string
  decision: string
}

interface StageTool {
  description: string
  disabled?: boolean
  href: string
  icon: typeof Bot
  title: string
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

const STAGE_CONFIG: Record<AttackWorkflowStatus, StageConfig> = {
  detected: {
    title: "Signal intake",
    purpose: "Create the investigation context and confirm the case scope.",
    input: "Alert source, matched rule, endpoint, first seen time",
    decision: "Start investigation",
  },
  investigating: {
    title: "Investigation",
    purpose: "Validate whether this alert is a real attack.",
    input: "AI report, trace graph, rule hits, host evidence",
    decision: "Confirm attack or close as false positive",
  },
  confirmed: {
    title: "Confirmation",
    purpose: "Record that the attack is verified and ready for evidence capture.",
    input: "Confirmed evidence, analyst note, accepted severity",
    decision: "Start forensics",
  },
  forensics: {
    title: "Forensics",
    purpose: "Capture and preserve evidence before execution-oriented response.",
    input: "Timeline, affected host, process tree, artifacts",
    decision: "Start response",
  },
  responding: {
    title: "Response",
    purpose: "Prepare, preview, execute, and sync response actions.",
    input: "Response preview, execution task, control writeback",
    decision: "Mark contained",
  },
  contained: {
    title: "Containment",
    purpose: "Validate that spread and active control paths are stopped.",
    input: "Isolation result, blocked connection, terminated process",
    decision: "Mark remediated",
  },
  remediated: {
    title: "Remediation",
    purpose: "Verify cleanup and recovery before closure.",
    input: "Cleanup evidence, restored policy, validation signal",
    decision: "Close case",
  },
  closed: {
    title: "Closure",
    purpose: "Keep the final decision, close reason, and audit trail visible.",
    input: "Close reason, operator note, event timeline",
    decision: "Review only",
  },
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : status || "Unknown"
}

function statusBadgeTone(status: AttackWorkflowStatus | "") {
  switch (status) {
    case "detected":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "investigating":
      return "border-cyan-200 bg-cyan-50 text-cyan-700"
    case "confirmed":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "forensics":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "responding":
      return "border-teal-200 bg-teal-50 text-teal-700"
    case "contained":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "remediated":
      return "border-green-200 bg-green-50 text-green-700"
    case "closed":
      return "border-green-200 bg-green-50 text-green-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function latestEventComment(events: AttackWorkflowEventItem[]) {
  for (const event of [...events].reverse()) {
    const comment = workflowEventComment(event)
    if (comment) return comment
  }
  return ""
}

function latestStageEvent(
  events: AttackWorkflowEventItem[],
  status: AttackWorkflowStatus,
) {
  return [...events]
    .reverse()
    .find((event) => normalizeWorkflowStatus(event.new_status) === status)
}

function latestActionTime(actions: AttackWorkflowActionItem[]) {
  const latest = [...actions]
    .map((action) => action.updated_at || action.executed_at || action.requested_at || action.created_at)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0]
  return latest ? formatWorkflowTime(latest) : "-"
}

function stageTools({
  canOpenDetails,
  hrefs,
  selectedStatus,
}: {
  canOpenDetails: boolean
  hrefs: WorkflowNavigationHrefs
  selectedStatus: AttackWorkflowStatus
}): StageTool[] {
  switch (selectedStatus) {
    case "detected":
      return [
        {
          title: "Open Attack Detail",
          description: "Review the alert context, case story, and related evidence.",
          href: hrefs.attackDetailHref,
          icon: FileSearch,
          disabled: !canOpenDetails,
        },
      ]
    case "investigating":
      return [
        {
          title: "Open Threat Analysis",
          description: "Read AI conclusions, evidence references, hypotheses, and response suggestions.",
          href: hrefs.aiHref,
          icon: Bot,
          disabled: !canOpenDetails,
        },
        {
          title: "Open Trace Details",
          description: "Inspect the attack story, trace graph, source fields, and node drilldown.",
          href: hrefs.traceHref,
          icon: Route,
          disabled: !canOpenDetails,
        },
      ]
    case "confirmed":
      return [
        {
          title: "Open Trace Details",
          description: "Recheck the evidence used to confirm the attack.",
          href: hrefs.traceHref,
          icon: Route,
          disabled: !canOpenDetails,
        },
      ]
    case "forensics":
      return [
        {
          title: "Open Trace Details",
          description: "Use the trace timeline as the evidence collection anchor.",
          href: hrefs.traceHref,
          icon: Route,
          disabled: !canOpenDetails,
        },
        {
          title: "Evidence Capture",
          description: "Forensic task writeback will appear in workflow actions.",
          href: hrefs.traceHref,
          icon: FileClock,
          disabled: true,
        },
      ]
    case "responding":
      return [
        {
          title: "Prepare Response",
          description: "Open the response workspace for preview, execution, and control writeback.",
          href: "/frame/response/dac",
          icon: ShieldAlert,
        },
      ]
    case "contained":
      return [
        {
          title: "Open Response Result",
          description: "Review containment action results and related execution references.",
          href: "/frame/response/dac",
          icon: LockKeyhole,
        },
      ]
    case "remediated":
      return [
        {
          title: "Open Response Result",
          description: "Review remediation evidence before case closure.",
          href: "/frame/response/dac",
          icon: ClipboardCheck,
        },
      ]
    case "closed":
    default:
      return [
        {
          title: "Open Attack Detail",
          description: "Review the closed case story and evidence context.",
          href: hrefs.attackDetailHref,
          icon: FileSearch,
          disabled: !canOpenDetails,
        },
        {
          title: "Open Trace Details",
          description: "Review historical trace evidence for audit.",
          href: hrefs.traceHref,
          icon: Route,
          disabled: !canOpenDetails,
        },
      ]
  }
}

function readOnlyReason({
  currentStatus,
  selectedStatus,
  workflow,
}: {
  currentStatus: AttackWorkflowStatus | ""
  selectedStatus: AttackWorkflowStatus
  workflow: AttackWorkflowItem | null
}) {
  if (!workflow) return "Workflow is not loaded."
  if (currentStatus === "closed") return "Closed workflow, review mode."
  if (currentStatus !== selectedStatus) {
    return `Viewing ${statusLabel(selectedStatus)} while current stage is ${statusLabel(currentStatus)}.`
  }
  return ""
}

function stageCompletionLabel({
  currentStatus,
  selectedStatus,
  workflow,
}: {
  currentStatus: AttackWorkflowStatus | ""
  selectedStatus: AttackWorkflowStatus
  workflow: AttackWorkflowItem | null
}) {
  if (!workflow || !currentStatus) return "Not loaded"
  const selectedIndex = workflowStatusIndex(selectedStatus)
  const currentIndex = workflowStatusIndex(currentStatus)
  const timestamp = workflowStatusTime(workflow, selectedStatus)
  if (selectedIndex < currentIndex) return "Completed"
  if (selectedIndex === currentIndex) return currentStatus === "closed" ? "Closed" : "Current"
  if (timestamp) return "Recorded"
  return "Pending"
}

function StageToolCard({ tool }: { tool: StageTool }) {
  const Icon = tool.icon

  return (
    <div className="flex min-h-[8.5rem] min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-blue-100">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 text-sm font-semibold leading-5 text-slate-950">
            {tool.title}
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">{tool.description}</p>
      </div>

      {tool.disabled ? (
        <Button variant="outline" size="sm" className="mt-3 w-fit" disabled>
          Open
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href={tool.href}>
            Open
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      )}
    </div>
  )
}

function StageGate({
  allowedStatuses,
  currentStatus,
  onOpenStatusDialog,
  readOnly,
  readOnlyText,
  recommendedStatus,
  selectedStatus,
  updating,
}: {
  allowedStatuses: AttackWorkflowStatus[]
  currentStatus: AttackWorkflowStatus | ""
  onOpenStatusDialog: (status: AttackWorkflowStatus) => void
  readOnly: boolean
  readOnlyText: string
  recommendedStatus: AttackWorkflowStatus | null
  selectedStatus: AttackWorkflowStatus
  updating?: boolean
}) {
  const transitions = readOnly
    ? []
    : [
        ...(recommendedStatus ? [recommendedStatus] : []),
        ...allowedStatuses.filter((status) => status !== recommendedStatus),
      ]

  if (readOnly || transitions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CheckCircle2 className="size-4 text-emerald-600" />
          {readOnly ? "Review mode" : "No stage transition"}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {readOnlyText || `${statusLabel(selectedStatus)} does not expose a transition from ${statusLabel(currentStatus)}.`}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
      <div className="text-sm font-semibold text-slate-900">Stage decision</div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {transitions.map((status) => (
          <Button
            key={status}
            type="button"
            variant={status === recommendedStatus ? "default" : "outline"}
            onClick={() => onOpenStatusDialog(status)}
            disabled={updating}
            className="justify-center whitespace-nowrap"
          >
            {status === recommendedStatus ? (
              <ArrowRight className="size-4" />
            ) : status === "closed" ? (
              <ShieldCheck className="size-4" />
            ) : (
              <GitBranch className="size-4" />
            )}
            {status === recommendedStatus ? `Accept to ${statusLabel(status)}` : statusLabel(status)}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function AttackWorkflowStageWorkbench({
  actions,
  allowedStatuses,
  canOpenDetails,
  currentStatus,
  events,
  hrefs,
  loading = false,
  onOpenStatusDialog,
  recommendedStatus,
  selectedStatus,
  updating = false,
  workflow,
}: AttackWorkflowStageWorkbenchProps) {
  const normalizedCurrentStatus = normalizeWorkflowStatus(currentStatus)
  const config = STAGE_CONFIG[selectedStatus]
  const tools = stageTools({ canOpenDetails, hrefs, selectedStatus })
  const stageEvent = latestStageEvent(events, selectedStatus)
  const operatorNote = latestEventComment(events)
  const stageTime = workflow
    ? formatWorkflowTime(workflowStatusTime(workflow, selectedStatus))
    : "-"
  const completionLabel = stageCompletionLabel({
    currentStatus: normalizedCurrentStatus,
    selectedStatus,
    workflow,
  })
  const readOnlyText = readOnlyReason({
    currentStatus: normalizedCurrentStatus,
    selectedStatus,
    workflow,
  })
  const isReadOnly = Boolean(readOnlyText)
  const closeReason = workflow?.close_reason?.trim() || "-"

  return (
    <Card className="w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">Stage Workbench</CardTitle>
              <Badge
                variant="outline"
                className={statusBadgeTone(selectedStatus)}
              >
                Selected: {statusLabel(selectedStatus)}
              </Badge>
              {normalizedCurrentStatus ? (
                <Badge
                  variant="outline"
                  className={statusBadgeTone(normalizedCurrentStatus)}
                >
                  Current: {statusLabel(normalizedCurrentStatus)}
                </Badge>
              ) : null}
              {isReadOnly ? (
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                  Review mode
                </Badge>
              ) : null}
            </div>
            <CardDescription className="mt-1 max-w-[90rem] leading-5">
              {config.purpose}
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[28rem]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-500">Stage</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{config.title}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-500">Result</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{completionLabel}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-500">Time</div>
              <div className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-700">{stageTime}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-500">Actions</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{actions.length}</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid min-w-0 grid-cols-1 gap-4 px-5 py-4 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(22rem,1.2fr)_minmax(20rem,0.95fr)]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4">
          <div className="text-sm font-semibold text-slate-950">Stage summary</div>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Input</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-700">{config.input}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Decision</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-700">{config.decision}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">Latest stage event</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-700">
                {stageEvent ? (
                  <>
                    <span className="font-medium">{stageEvent.operator_name || stageEvent.operator_id || stageEvent.operator_type || "operator"}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="font-mono text-xs">{workflowEventTime(stageEvent)}</span>
                  </>
                ) : (
                  "No event recorded for this stage."
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-950">Stage tools</div>
            {loading ? (
              <span className="text-xs font-medium text-slate-400">Loading</span>
            ) : null}
          </div>
          <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3">
            {tools.map((tool) => (
              <StageToolCard key={tool.title} tool={tool} />
            ))}
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <StageGate
            allowedStatuses={allowedStatuses}
            currentStatus={normalizedCurrentStatus}
            onOpenStatusDialog={onOpenStatusDialog}
            readOnly={isReadOnly}
            readOnlyText={readOnlyText}
            recommendedStatus={recommendedStatus}
            selectedStatus={selectedStatus}
            updating={updating}
          />

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <div className="text-sm font-semibold text-slate-950">
              {selectedStatus === "closed" ? "Closure" : "Operator note"}
            </div>
            {selectedStatus === "closed" ? (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Close reason: {closeReason}
              </div>
            ) : null}
            <div className="mt-3 min-h-[4.5rem] break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
              {operatorNote || "No operator note has been recorded yet."}
            </div>
            <div className="mt-3 text-xs leading-5 text-slate-500">
              Latest action time: {latestActionTime(actions)}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
