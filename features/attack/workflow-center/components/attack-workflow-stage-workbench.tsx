"use client";

import Link from "next/link";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
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
} from "lucide-react";

import type {
  AttackWorkflowActionItem,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types";
import {
  formatWorkflowTime,
  normalizeWorkflowStatus,
  workflowStatusIndex,
  workflowStatusTime,
} from "@/features/attack/workflow/utils";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

interface WorkflowNavigationHrefs {
  attackDetailHref: string;
  traceHref: string;
  aiHref: string;
}

interface AttackWorkflowStageWorkbenchProps {
  actions: AttackWorkflowActionItem[];
  allowedStatuses: AttackWorkflowStatus[];
  canOpenDetails: boolean;
  currentStatus: string;
  events: AttackWorkflowEventItem[];
  hrefs: WorkflowNavigationHrefs;
  loading?: boolean;
  onOpenStatusDialog: (status: AttackWorkflowStatus) => void;
  recommendedStatus: AttackWorkflowStatus | null;
  selectedStatus: AttackWorkflowStatus;
  updating?: boolean;
  workflow: AttackWorkflowItem | null;
}

interface StageConfig {
  purpose: string;
  whatToVerify: string[];
  completionCriteria: string[];
  riskNote: string;
  recommendedReason: string;
  transitionEffect: string;
}

interface StageTool {
  description: string;
  disabled?: boolean;
  href: string;
  iconName?: string;
  title: string;
}

interface StatusStyle {
  badge: string;
  currentBadge: string;
  dot: string;
  iconBg: string;
  iconText: string;
  label: string;
  primaryBtn: string;
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
};

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
};

const STAGE_CONFIG: Record<AttackWorkflowStatus, StageConfig> = {
  detected: {
    purpose:
      "Intake the alert signal, create workflow context, and define the first investigation scope before deeper analysis begins.",
    whatToVerify: [
      "Confirm the alert source, matched rule, affected asset, user, and first seen time.",
      "Check whether the signal is a duplicate of an existing workflow or belongs to a related case.",
      "Capture the initial business impact so the analyst knows where to start.",
    ],
    completionCriteria: [
      "The workflow has a concrete asset, time window, and alert reason.",
      "The signal is not an obvious duplicate or already covered by another active case.",
      "The case has enough context for triage to start.",
    ],
    riskNote:
      "Do not escalate before the signal is tied to a concrete case, asset, or time window.",
    recommendedReason:
      "Once the signal has enough context, the next useful action is analyst triage.",
    transitionEffect:
      "Moving to Investigating records triage start and shifts the workbench toward evidence review.",
  },
  investigating: {
    purpose:
      "Determine whether the alert represents real malicious activity or should be closed as benign or false positive.",
    whatToVerify: [
      "Review the AI report, trace graph, rule hits, and endpoint evidence together.",
      "Look for behavior that proves intent, execution, persistence, command activity, or lateral movement.",
      "Compare suspicious signals against known benign operations for the same host or user.",
    ],
    completionCriteria: [
      "Evidence is strong enough to confirm the attack or close it with a clear reason.",
      "Important trace nodes and supporting events have been reviewed.",
      "The analyst note explains the classification decision.",
    ],
    riskNote:
      "Do not confirm without evidence that links the observed behavior to an attack path.",
    recommendedReason:
      "When classification evidence is clear, the workflow should move from triage into a formal decision state.",
    transitionEffect:
      "Moving forward records the investigation decision and enables confirmation, forensics, or closure handling.",
  },
  confirmed: {
    purpose:
      "Record that the attack is verified, preserve the decision context, and prepare the case for evidence capture.",
    whatToVerify: [
      "Confirm the malicious behavior, affected assets, severity, and known attack path.",
      "Make sure the confirmation event references traceable evidence, not only a manual assertion.",
      "Check whether response urgency changes the amount of forensics that can be collected first.",
    ],
    completionCriteria: [
      "The attack classification is recorded and visible in the timeline.",
      "The main evidence supporting confirmation is available for review.",
      "The case is ready for forensics or an explicitly justified fast response path.",
    ],
    riskNote:
      "Avoid skipping evidence capture when response actions may destroy forensic context.",
    recommendedReason:
      "The attack has been verified, so the next step is to preserve evidence before response work changes the environment.",
    transitionEffect:
      "Moving to Forensics records the verification point and focuses the workbench on evidence capture.",
  },
  forensics: {
    purpose:
      "Capture and preserve the evidence needed to explain what happened before execution-oriented response begins.",
    whatToVerify: [
      "Collect the timeline, process tree, artifacts, affected host details, and user context.",
      "Confirm whether volatile evidence must be captured before isolation or cleanup.",
      "Identify the evidence that response operators need to choose safe actions.",
    ],
    completionCriteria: [
      "Critical artifacts and timeline evidence are preserved or explicitly marked as unavailable.",
      "The response team has enough context to act without destroying required evidence.",
      "The next response action can be audited against collected evidence.",
    ],
    riskNote:
      "Avoid destructive response before collecting the evidence needed for review, reporting, or root cause analysis.",
    recommendedReason:
      "After evidence is preserved, the workflow can move into response preparation and execution.",
    transitionEffect:
      "Moving to Responding opens the workflow for response action preview, execution, and result tracking.",
  },
  responding: {
    purpose:
      "Prepare, preview, execute, and sync response actions while keeping the operator decision auditable.",
    whatToVerify: [
      "Review the action preview, execution target, expected impact, and rollback considerations.",
      "Confirm that response tasks are aimed at the correct host, process, account, or network path.",
      "Check execution results and synchronize task status back into the workflow timeline.",
    ],
    completionCriteria: [
      "Response actions have been executed, skipped with reason, or queued with visible status.",
      "The operator note explains the selected action path and known impact.",
      "The workflow has enough result data to validate containment.",
    ],
    riskNote:
      "Review targets carefully before actions that isolate hosts, terminate processes, or block accounts.",
    recommendedReason:
      "Once response actions are complete or ready to validate, the case should move to containment validation.",
    transitionEffect:
      "Moving to Contained records active response completion and starts validation that the attack path is stopped.",
  },
  contained: {
    purpose:
      "Validate that the active attack path, spread channel, and control path are stopped before cleanup begins.",
    whatToVerify: [
      "Check isolation, block, termination, and access-control results against the affected scope.",
      "Look for remaining active connections, suspicious processes, callbacks, or lateral movement.",
      "Confirm monitoring signals show no continued execution inside the known attack path.",
    ],
    completionCriteria: [
      "Active spread and command paths are halted or explicitly accepted as residual risk.",
      "Containment evidence is recorded and visible in the timeline.",
      "Cleanup and recovery can start without allowing the active attack to continue.",
    ],
    riskNote:
      "Do not mark contained if active execution or lateral movement is still visible.",
    recommendedReason:
      "Validated containment means the team can move from stopping the attack to cleaning and recovering affected assets.",
    transitionEffect:
      "Moving to Remediated records containment completion and shifts the workbench to cleanup validation.",
  },
  remediated: {
    purpose:
      "Verify cleanup, recovery, and prevention controls before the workflow is closed.",
    whatToVerify: [
      "Confirm malicious artifacts are removed and affected systems or policies are restored.",
      "Review validation scans, monitoring signals, or analyst checks for recurrence.",
      "Make sure the final close reason is supported by the remediation evidence.",
    ],
    completionCriteria: [
      "Cleanup is complete and no active recurrence is visible.",
      "Recovery and prevention tasks have a recorded result.",
      "The case has a clear closure reason and enough audit evidence for review.",
    ],
    riskNote:
      "Do not close while recovery evidence, validation data, or the final close reason is missing.",
    recommendedReason:
      "When cleanup is validated, the workflow can be closed with a final reason and audit trail.",
    transitionEffect:
      "Moving to Closed records final resolution and locks the workflow into review mode.",
  },
  closed: {
    purpose:
      "Keep the final decision, close reason, timeline, and operator notes available for audit and review.",
    whatToVerify: [
      "Review the close reason, final operator note, and last workflow event.",
      "Confirm the timeline explains how the case moved from detection to closure.",
      "Check whether any follow-up task should be tracked outside this closed workflow.",
    ],
    completionCriteria: [
      "Closure is recorded with a clear reason.",
      "No further workflow action is required inside this case.",
      "The audit trail is complete enough for later review.",
    ],
    riskNote:
      "Closed workflows should be reopened only through an explicit follow-up process.",
    recommendedReason:
      "Closed workflows are review-only and should not receive automatic stage transitions.",
    transitionEffect:
      "No transition is executed from Closed in this workbench.",
  },
};

const STATUS_ICON_PATHS: Record<AttackWorkflowStatus, string> = {
  detected: "/icons/flow/detected.svg",
  investigating: "/icons/flow/investigating.svg",
  confirmed: "/icons/flow/confirmed.svg",
  forensics: "/icons/flow/forensics.svg",
  responding: "/icons/flow/responding.svg",
  contained: "/icons/flow/contained.svg",
  remediated: "/icons/flow/remediated.svg",
  closed: "/icons/flow/closed.svg",
};

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
};

function getStatusStyle(status: AttackWorkflowStatus): StatusStyle {
  return STATUS_STYLES[status];
}

function FlowStatusIcon({
  className,
  status,
}: {
  className?: string;
  status: AttackWorkflowStatus;
}) {
  const maskStyle: CSSProperties = {
    WebkitMask: `url(${STATUS_ICON_PATHS[status]}) center / contain no-repeat`,
    mask: `url(${STATUS_ICON_PATHS[status]}) center / contain no-repeat`,
  };

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={maskStyle}
    />
  );
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status);
  return normalized ? STATUS_LABELS[normalized] : status || "Unknown";
}

function getToolIcon(iconName?: string): ComponentType<{ className?: string }> {
  if (iconName && TOOL_ICONS[iconName]) return TOOL_ICONS[iconName];
  return Wrench;
}

function stageTools({
  canOpenDetails,
  hrefs,
  selectedStatus,
}: {
  canOpenDetails: boolean;
  hrefs: WorkflowNavigationHrefs;
  selectedStatus: AttackWorkflowStatus;
}): StageTool[] {
  switch (selectedStatus) {
    case "detected":
      return [
        {
          title: "Open Attack Detail",
          description:
            "Review the alert context, case story, and related evidence.",
          href: hrefs.attackDetailHref,
          iconName: "search",
          disabled: !canOpenDetails,
        },
      ];
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
      ];
    case "confirmed":
      return [
        {
          title: "Open Trace Details",
          description: "Recheck the evidence used to confirm the attack.",
          href: hrefs.traceHref,
          iconName: "route",
          disabled: !canOpenDetails,
        },
      ];
    case "forensics":
      return [
        {
          title: "Open Trace Details",
          description:
            "Use the trace timeline as the evidence collection anchor.",
          href: hrefs.traceHref,
          iconName: "route",
          disabled: !canOpenDetails,
        },
        {
          title: "Evidence Capture",
          description:
            "Forensic task writeback will appear in workflow actions.",
          href: hrefs.traceHref,
          iconName: "file",
          disabled: true,
        },
      ];
    case "responding":
      return [
        {
          title: "Prepare Response",
          description:
            "Open the response workspace for preview, execution, and control writeback.",
          href: "/frame/response/dac",
          iconName: "shield",
        },
      ];
    case "contained":
      return [
        {
          title: "Open Response Result",
          description:
            "Review containment action results and related execution references.",
          href: "/frame/response/dac",
          iconName: "lock",
        },
      ];
    case "remediated":
      return [
        {
          title: "Open Response Result",
          description: "Review remediation evidence before case closure.",
          href: "/frame/response/dac",
          iconName: "clipboard",
        },
      ];
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
      ];
  }
}

function readOnlyReason({
  currentStatus,
  selectedStatus,
  workflow,
}: {
  currentStatus: AttackWorkflowStatus | "";
  selectedStatus: AttackWorkflowStatus;
  workflow: AttackWorkflowItem | null;
}) {
  if (!workflow) return "Workflow is not loaded.";
  if (currentStatus === "closed") return "Closed workflow, review mode.";
  if (currentStatus !== selectedStatus) {
    return `Viewing ${statusLabel(selectedStatus)} while current stage is ${statusLabel(currentStatus)}.`;
  }
  return "";
}

function stageCompletionLabel({
  currentStatus,
  selectedStatus,
  workflow,
}: {
  currentStatus: AttackWorkflowStatus | "";
  selectedStatus: AttackWorkflowStatus;
  workflow: AttackWorkflowItem | null;
}) {
  if (!workflow || !currentStatus) return "Not loaded";
  const selectedIndex = workflowStatusIndex(selectedStatus);
  const currentIndex = workflowStatusIndex(currentStatus);
  const timestamp = workflowStatusTime(workflow, selectedStatus);
  if (selectedIndex < currentIndex) return "Completed";
  if (selectedIndex === currentIndex) {
    return currentStatus === "closed" ? "Closed" : "Current";
  }
  if (timestamp) return "Recorded";
  return "Pending";
}

function HeaderStat({
  icon: Icon,
  iconClassName = "text-slate-400",
  label,
  mono = false,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  label: string;
  mono?: boolean;
  value: string;
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
  );
}

function GuideTextBlock({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm leading-relaxed text-slate-800">{value}</span>
    </div>
  );
}

function GuideBulletList({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-sm leading-relaxed text-slate-700"
          >
            <CheckCircle2
              className="mt-0.5 size-3.5 shrink-0 text-emerald-500"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TransitionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{value}</p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      {children}
    </h3>
  );
}

function HeaderMetaField({
  current = false,
  label,
  value,
  valueClassName,
}: {
  current?: boolean;
  label: string;
  value: string;
  valueClassName: string;
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
  );
}

function ToolRow({
  canOpenDetails,
  primary,
  tool,
}: {
  canOpenDetails: boolean;
  primary: boolean;
  tool: StageTool;
}) {
  const Icon = getToolIcon(tool.iconName);
  const disabled = Boolean(tool.disabled) || !canOpenDetails;

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
  );
}

export function AttackWorkflowStageWorkbench({
  actions,
  allowedStatuses,
  canOpenDetails,
  currentStatus,
  hrefs,
  loading = false,
  onOpenStatusDialog,
  recommendedStatus,
  selectedStatus,
  updating = false,
  workflow,
}: AttackWorkflowStageWorkbenchProps) {
  const normalizedCurrentStatus = normalizeWorkflowStatus(currentStatus);
  const config = STAGE_CONFIG[selectedStatus];
  const tools = stageTools({ canOpenDetails, hrefs, selectedStatus });
  const selectedStyle = getStatusStyle(selectedStatus);
  const stageTime = workflow
    ? formatWorkflowTime(workflowStatusTime(workflow, selectedStatus))
    : "-";
  const completionLabel = stageCompletionLabel({
    currentStatus: normalizedCurrentStatus,
    selectedStatus,
    workflow,
  });
  const readOnlyText = readOnlyReason({
    currentStatus: normalizedCurrentStatus,
    selectedStatus,
    workflow,
  });
  const isReadOnly = Boolean(readOnlyText);
  const showRecommended =
    !isReadOnly &&
    recommendedStatus != null &&
    allowedStatuses.includes(recommendedStatus);
  const secondaryStatuses = allowedStatuses.filter(
    (status) => status !== recommendedStatus,
  );
  const isViewingCurrentStage = normalizedCurrentStatus === selectedStatus;

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
              <FlowStatusIcon status={selectedStatus} className="size-6" />
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
        <section className="flex flex-col gap-3 2xl:col-span-5">
          <SectionTitle icon={ScrollText}>Stage Guide</SectionTitle>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <GuideTextBlock label="Purpose" value={config.purpose} />
            <Separator className="bg-slate-200" />
            <GuideBulletList
              label="What to verify"
              items={config.whatToVerify}
            />
            <Separator className="bg-slate-200" />
            <GuideBulletList
              label="Completion criteria"
              items={config.completionCriteria}
            />
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
                Risk note
              </span>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                {config.riskNote}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 2xl:col-span-4">
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
          <SectionTitle icon={Activity}>Stage Control</SectionTitle>

          {isReadOnly ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Review mode
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {readOnlyText}
              </p>
              <div className="mt-3 rounded-lg bg-white px-2.5 py-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Control guidance
                </span>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {config.transitionEffect}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Recommended transition
              </span>

              {showRecommended ? (
                <>
                  <Button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      onOpenStatusDialog(
                        recommendedStatus as AttackWorkflowStatus,
                      )
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
                  <TransitionDetail
                    label="Why this step"
                    value={config.recommendedReason}
                  />
                  <TransitionDetail
                    label="What happens next"
                    value={config.transitionEffect}
                  />
                </>
              ) : (
                <>
                  <p className="rounded-lg border border-dashed border-slate-200 px-2.5 py-3 text-xs text-slate-400">
                    No recommended transition for this stage.
                  </p>
                  <TransitionDetail
                    label="Control guidance"
                    value="Keep this stage selected until the workflow state or evidence supports a clear transition."
                  />
                </>
              )}

              {secondaryStatuses.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Other available transitions
                  </span>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Use these only when the evidence supports a different
                    workflow branch.
                  </p>
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
        </section>
      </div>
    </Card>
  );
}
