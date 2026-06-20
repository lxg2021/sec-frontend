"use client"

import Link from "next/link"
import type { ComponentType, CSSProperties, ReactNode } from "react"
import {
  Activity,
  ArrowRight,
  Bot,
  ClipboardCheck,
  ExternalLink,
  FileSearch,
  Gauge,
  Lock,
  ScrollText,
  Shield,
  Target,
  Timer,
  Wrench,
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
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"

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
  iconName?: string
  title: string
}

interface StageEvent {
  description?: string
  operator?: string
  time?: string
  title: string
}

interface StatusStyle {
  badge: string
  currentBadge: string
  dot: string
  iconBg: string
  iconText: string
  label: string
  primaryBtn: string
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

const STATUS_STYLES: Record<AttackWorkflowStatus, StatusStyle> = {
  detected: {
    label: "Detected",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    currentBadge: "border-transparent bg-amber-500 text-white",
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
    dot: "bg-amber-500",
    primaryBtn:
      "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-400",
  },
  investigating: {
    label: "Investigating",
    badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
    currentBadge: "border-transparent bg-cyan-500 text-white",
    iconBg: "bg-cyan-100",
    iconText: "text-cyan-700",
    dot: "bg-cyan-500",
    primaryBtn:
      "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-400",
  },
  confirmed: {
    label: "Confirmed",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    currentBadge: "border-transparent bg-blue-500 text-white",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    dot: "bg-blue-500",
    primaryBtn:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400",
  },
  forensics: {
    label: "Forensics",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    currentBadge: "border-transparent bg-violet-500 text-white",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
    dot: "bg-violet-500",
    primaryBtn:
      "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-400",
  },
  responding: {
    label: "Responding",
    badge: "border-teal-200 bg-teal-50 text-teal-700",
    currentBadge: "border-transparent bg-teal-500 text-white",
    iconBg: "bg-teal-100",
    iconText: "text-teal-700",
    dot: "bg-teal-500",
    primaryBtn:
      "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-400",
  },
  contained: {
    label: "Contained",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    currentBadge: "border-transparent bg-emerald-500 text-white",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    dot: "bg-emerald-500",
    primaryBtn:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400",
  },
  remediated: {
    label: "Remediated",
    badge: "border-green-200 bg-green-50 text-green-700",
    currentBadge: "border-transparent bg-green-500 text-white",
    iconBg: "bg-green-100",
    iconText: "text-green-700",
    dot: "bg-green-500",
    primaryBtn:
      "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-400",
  },
  closed: {
    label: "Closed",
    badge: "border-green-300 bg-green-100 text-green-800",
    currentBadge: "border-transparent bg-green-600 text-white",
    iconBg: "bg-green-200",
    iconText: "text-green-800",
    dot: "bg-green-600",
    primaryBtn:
      "bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-500",
  },
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

const STATUS_ICON_PATHS: Record<AttackWorkflowStatus, string> = {
  detected: "/icons/flow/detected.svg",
  investigating: "/icons/flow/investigating.svg",
  confirmed: "/icons/flow/confirmed.svg",
  forensics: "/icons/flow/forensics.svg",
  responding: "/icons/flow/responding.svg",
  contained: "/icons/flow/contained.svg",
  remediated: "/icons/flow/remediated.svg",
  closed: "/icons/flow/closed.svg",
}

const TOOL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  activity: Activity,
  bot: Bot,
  clipboard: ClipboardCheck,
  file: FileSearch,
  lock: Lock,
  route: Target,
  scroll: ScrollText,
  search: FileSearch,
  shield: Shield,
  target: Target,
  wrench: Wrench,
}

function getStatusStyle(status: AttackWorkflowStatus): StatusStyle {
  return STATUS_STYLES[status]
}

function FlowStatusIcon({
  className,
  status,
}: {
  className?: string
  status: AttackWorkflowStatus
}) {
  const maskStyle: CSSProperties = {
    WebkitMask: `url(${STATUS_ICON_PATHS[status]}) center / contain no-repeat`,
    mask: `url(${STATUS_ICON_PATHS[status]}) center / contain no-repeat`,
  }

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={maskStyle}
    />
  )
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : status || "Unknown"
}

function getToolIcon(iconName?: string): ComponentType<{ className?: string }> {
  if (iconName && TOOL_ICONS[iconName]) return TOOL_ICONS[iconName]
  return Wrench
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
): AttackWorkflowEventItem | null {
  return (
    [...events]
      .reverse()
      .find((event) => normalizeWorkflowStatus(event.new_status) === status) ??
    null
  )
}

function latestActionTime(actions: AttackWorkflowActionItem[]) {
  const latest = [...actions]
    .map(
      (action) =>
        action.updated_at ||
        action.executed_at ||
        action.requested_at ||
        action.created_at,
    )
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0]
  return latest ? formatWorkflowTime(latest) : "-"
}

function eventToStageEvent(
  event: AttackWorkflowEventItem | null,
): StageEvent | null {
  if (!event) return null
  const operator =
    event.operator_name || event.operator_id || event.operator_type || "operator"
  const time = workflowEventTime(event)
  const comment = workflowEventComment(event)

  return {
    title: `${operator} recorded ${statusLabel(event.new_status)}`,
    description: comment || event.event_type || undefined,
    time,
    operator,
  }
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
          iconName: "search",
          disabled: !canOpenDetails,
        },
      ]
    case "investigating":
      return [
        {
          title: "Open Threat Analysis",
          description:
            "Read AI conclusions, evidence references, hypotheses, and response suggestions.",
          href: hrefs.aiHref,
          iconName: "bot",
          disabled: !canOpenDetails,
        },
        {
          title: "Open Trace Details",
          description:
            "Inspect the attack story, trace graph, source fields, and node drilldown.",
          href: hrefs.traceHref,
          iconName: "route",
          disabled: !canOpenDetails,
        },
      ]
    case "confirmed":
      return [
        {
          title: "Open Trace Details",
          description: "Recheck the evidence used to confirm the attack.",
          href: hrefs.traceHref,
          iconName: "route",
          disabled: !canOpenDetails,
        },
      ]
    case "forensics":
      return [
        {
          title: "Open Trace Details",
          description: "Use the trace timeline as the evidence collection anchor.",
          href: hrefs.traceHref,
          iconName: "route",
          disabled: !canOpenDetails,
        },
        {
          title: "Evidence Capture",
          description: "Forensic task writeback will appear in workflow actions.",
          href: hrefs.traceHref,
          iconName: "file",
          disabled: true,
        },
      ]
    case "responding":
      return [
        {
          title: "Prepare Response",
          description:
            "Open the response workspace for preview, execution, and control writeback.",
          href: "/frame/response/dac",
          iconName: "shield",
        },
      ]
    case "contained":
      return [
        {
          title: "Open Response Result",
          description:
            "Review containment action results and related execution references.",
          href: "/frame/response/dac",
          iconName: "lock",
        },
      ]
    case "remediated":
      return [
        {
          title: "Open Response Result",
          description: "Review remediation evidence before case closure.",
          href: "/frame/response/dac",
          iconName: "clipboard",
        },
      ]
    case "closed":
    default:
      return [
        {
          title: "Open Attack Detail",
          description: "Review the closed case story and evidence context.",
          href: hrefs.attackDetailHref,
          iconName: "search",
          disabled: !canOpenDetails,
        },
        {
          title: "Open Trace Details",
          description: "Review historical trace evidence for audit.",
          href: hrefs.traceHref,
          iconName: "route",
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
  if (selectedIndex === currentIndex) {
    return currentStatus === "closed" ? "Closed" : "Current"
  }
  if (timestamp) return "Recorded"
  return "Pending"
}

function HeaderStat({
  icon: Icon,
  iconClassName = "text-slate-400",
  label,
  mono = false,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  label: string
  mono?: boolean
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className={cn("size-3.5", iconClassName)} aria-hidden="true" />
        <span>{label}</span>
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-sm font-semibold text-slate-900",
          mono && "font-mono text-xs tabular-nums",
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

function LabelValueRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm leading-relaxed text-slate-800">{value}</span>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      {children}
    </h3>
  )
}

function HeaderMetaField({
  current = false,
  label,
  value,
  valueClassName,
}: {
  current?: boolean
  label: string
  value: string
  valueClassName: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-sm font-medium text-slate-600">
        {label}
      </span>
      <Badge
        variant="outline"
        className={cn(
          "h-6 min-w-0 max-w-full gap-1.5 rounded-full px-2.5 py-0 leading-none",
          valueClassName,
        )}
        title={value}
      >
        {current ? (
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 motion-safe:animate-ping motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
          </span>
        ) : null}
        <span className="truncate">{value}</span>
      </Badge>
    </div>
  )
}

function ToolRow({
  canOpenDetails,
  primary,
  tool,
}: {
  canOpenDetails: boolean
  primary: boolean
  tool: StageTool
}) {
  const Icon = getToolIcon(tool.iconName)
  const disabled = Boolean(tool.disabled) || !canOpenDetails

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        disabled
          ? "border-slate-200 bg-slate-50/50 opacity-70"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          disabled
            ? "bg-slate-100 text-slate-400"
            : "bg-slate-100 text-slate-600",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {tool.title}
        </p>
        <p className="truncate text-xs leading-relaxed text-slate-500">
          {tool.description}
        </p>
      </div>
      {disabled ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled
          className="shrink-0"
          aria-label={`${tool.title} unavailable`}
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Locked</span>
        </Button>
      ) : (
        <Link
          href={tool.href}
          aria-label={`Open ${tool.title}`}
          className={cn(
            buttonVariants({
              size: "sm",
              variant: primary ? "default" : "outline",
            }),
            "shrink-0",
          )}
        >
          <span>Open</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
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
  const selectedStyle = getStatusStyle(selectedStatus)
  const stageEvent = eventToStageEvent(latestStageEvent(events, selectedStatus))
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
  const showRecommended =
    !isReadOnly &&
    recommendedStatus != null &&
    allowedStatuses.includes(recommendedStatus)
  const secondaryStatuses = allowedStatuses.filter(
    (status) => status !== recommendedStatus,
  )
  const isViewingCurrentStage = normalizedCurrentStatus === selectedStatus

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-14 w-12 shrink-0 items-center">
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-xl",
                selectedStyle.iconBg,
                selectedStyle.iconText,
              )}
            >
              <FlowStatusIcon
                status={selectedStatus}
                className="size-6"
              />
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold leading-6 text-slate-900">
                Stage Workbench
              </h2>
              {loading ? (
                <span className="text-xs font-medium text-slate-400">
                  Loading
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              {isViewingCurrentStage ? (
                <HeaderMetaField
                  current
                  label="Stage"
                  value={statusLabel(selectedStatus)}
                  valueClassName={selectedStyle.currentBadge}
                />
              ) : (
                <>
                  <HeaderMetaField
                    label="Selected"
                    value={statusLabel(selectedStatus)}
                    valueClassName={selectedStyle.currentBadge}
                  />
                  {normalizedCurrentStatus ? (
                    <HeaderMetaField
                      current
                      label="Current"
                      value={statusLabel(normalizedCurrentStatus)}
                      valueClassName={
                        getStatusStyle(normalizedCurrentStatus).currentBadge
                      }
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 2xl:w-auto 2xl:max-w-xl">
          <HeaderStat
            icon={Gauge}
            iconClassName={selectedStyle.iconText}
            label="Result"
            value={completionLabel}
          />
          <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" />
          <HeaderStat
            icon={Timer}
            iconClassName="text-cyan-500"
            label="Time"
            value={stageTime}
            mono
          />
          <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" />
          <HeaderStat
            icon={Activity}
            iconClassName="text-violet-500"
            label="Actions"
            value={String(actions.length)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 2xl:grid-cols-12 2xl:gap-5">
        <section className="flex flex-col gap-3 2xl:col-span-4">
          <SectionTitle icon={ScrollText}>Stage Brief</SectionTitle>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <LabelValueRow label="Input" value={config.input} />
            <Separator className="bg-slate-200" />
            <LabelValueRow label="Decision" value={config.decision} />
            <Separator className="bg-slate-200" />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Latest stage event
              </span>
              {stageEvent ? (
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <p className="text-sm font-medium text-slate-900">
                    {stageEvent.title}
                  </p>
                  {stageEvent.description ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {stageEvent.description}
                    </p>
                  ) : null}
                  {(stageEvent.time || stageEvent.operator) && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                      {stageEvent.time ? <span>{stageEvent.time}</span> : null}
                      {stageEvent.time && stageEvent.operator ? (
                        <span aria-hidden="true">&middot;</span>
                      ) : null}
                      {stageEvent.operator ? (
                        <span>{stageEvent.operator}</span>
                      ) : null}
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 bg-white px-2.5 py-3 text-xs text-slate-400">
                  No event recorded for this stage.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 2xl:col-span-5">
          <SectionTitle icon={Wrench}>Tools &amp; Evidence</SectionTitle>
          <div className="flex flex-col gap-2">
            {tools.length > 0 ? (
              tools.map((tool, index) => (
                <ToolRow
                  key={`${tool.title}-${index}`}
                  canOpenDetails={canOpenDetails}
                  primary={index === 0}
                  tool={tool}
                />
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-xs text-slate-400">
                No tools are available for this stage.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 2xl:col-span-3">
          <SectionTitle icon={Activity}>Control</SectionTitle>

          {isReadOnly ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Review mode
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {readOnlyText}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Recommended next step
              </span>

              {showRecommended ? (
                <Button
                  type="button"
                  disabled={updating}
                  onClick={() =>
                    onOpenStatusDialog(recommendedStatus as AttackWorkflowStatus)
                  }
                  className={cn(
                    "w-full justify-between focus-visible:ring-2 focus-visible:ring-offset-2",
                    getStatusStyle(recommendedStatus as AttackWorkflowStatus)
                      .primaryBtn,
                  )}
                >
                  <span>
                    {updating
                      ? "Updating..."
                      : `Move to ${statusLabel(
                          recommendedStatus as AttackWorkflowStatus,
                        )}`}
                  </span>
                  {!updating ? (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                </Button>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 px-2.5 py-3 text-xs text-slate-400">
                  No recommended transition for this stage.
                </p>
              )}

              {secondaryStatuses.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Other transitions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {secondaryStatuses.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updating}
                        onClick={() => onOpenStatusDialog(status)}
                        className="h-7 text-xs"
                      >
                        <span
                          className={cn(
                            "mr-1 h-1.5 w-1.5 rounded-full",
                            getStatusStyle(status).dot,
                          )}
                          aria-hidden="true"
                        />
                        {statusLabel(status)}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {selectedStatus === "closed" ? "Closure" : "Operator note"}
            </span>
            {selectedStatus === "closed" ? (
              <p className="mt-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700">
                Close reason: {closeReason}
              </p>
            ) : null}
            {operatorNote ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {operatorNote}
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                No operator note has been recorded yet.
              </p>
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              Last action: {latestActionTime(actions)}
            </p>
          </div>
        </section>
      </div>
    </Card>
  )
}
