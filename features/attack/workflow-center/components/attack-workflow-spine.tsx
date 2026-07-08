"use client"

import {
  AlertTriangle,
  Loader2,
  ShieldQuestion,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { CSSProperties } from "react"

import { ATTACK_WORKFLOW_DISPLAY_STAGES } from "@/features/attack/workflow/constants"
import type { AttackWorkflowDisplayStage } from "@/features/attack/workflow/types"
import {
  workflowDisplayStageForStatus,
  workflowDisplayStageIndex,
  workflowDisplayStageRepresentativeForWorkflow,
  workflowDisplayStageTime,
} from "@/features/attack/workflow/utils"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AttackWorkflowStatus =
  | "detected"
  | "investigating"
  | "confirmed"
  | "forensics"
  | "responding"
  | "contained"
  | "remediated"
  | "closed"

export interface AttackWorkflowItem {
  workflow_id: string
  tenant_id: string
  root_type: string
  root_id: string
  case_id: string
  status: AttackWorkflowStatus | string
  severity: string
  title: string
  primary_agent_id: string
  agent_ids: string[]
  rule_ids: string[]
  detected_at: string
  investigation_started_at: string
  confirmed_at: string
  forensic_started_at: string
  response_started_at: string
  contained_at: string
  remediated_at: string
  closed_at: string
  close_reason: string
  created_by: string
  created_at: string
  updated_at: string
  instance_ids: string[]
  group_ids: string[]
}

export interface AttackWorkflowSpineProps {
  workflow: AttackWorkflowItem | null
  loading?: boolean
  recommendedStatus?: AttackWorkflowStatus | null
  density?: "dense" | "comfortable" | "compact"
  layout?: "auto" | "horizontal" | "vertical"
  variant?: "card" | "embedded"
  interactive?: boolean
  showFootnotes?: boolean
  selectedStatus?: AttackWorkflowStatus | null
  className?: string
  onStatusSelect?: (status: AttackWorkflowStatus) => void
  onStatusClick?: (status: AttackWorkflowStatus) => void
}

type SpineNodeState =
  | "current"
  | "completed"
  | "recorded"
  | "pending"
  | "recommended"
  | "inconsistent"
  | "unknown"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const ATTACK_WORKFLOW_STATUSES: AttackWorkflowStatus[] = [
  "detected",
  "investigating",
  "confirmed",
  "forensics",
  "responding",
  "contained",
  "remediated",
  "closed",
]

const STATUS_LABEL_KEYS: Record<AttackWorkflowStatus, string> = {
  detected: "statuses.detected",
  investigating: "statuses.investigating",
  confirmed: "statuses.confirmed",
  forensics: "statuses.forensics",
  responding: "statuses.responding",
  contained: "statuses.contained",
  remediated: "statuses.remediated",
  closed: "statuses.closed",
}

const DISPLAY_STAGE_LABEL_KEYS: Record<AttackWorkflowDisplayStage, string> = {
  discovery: "displayStages.discovery",
  investigation: "displayStages.investigation",
  forensics: "displayStages.forensics",
  response: "displayStages.response",
  closed: "displayStages.closed",
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

/* -------------------------------------------------------------------------- */
/* Local cn helper (avoid hard dependency on project alias)                   */
/* -------------------------------------------------------------------------- */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
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

/* -------------------------------------------------------------------------- */
/* Helpers (logic preserved from original interface)                          */
/* -------------------------------------------------------------------------- */

function normalizeWorkflowStatus(value: string): AttackWorkflowStatus | "" {
  const normalized = (value ?? "").trim().toLowerCase()
  return (ATTACK_WORKFLOW_STATUSES as string[]).includes(normalized)
    ? (normalized as AttackWorkflowStatus)
    : ""
}

function workflowStatusIndex(status: string): number {
  const normalized = (status ?? "").trim().toLowerCase()
  return (ATTACK_WORKFLOW_STATUSES as string[]).indexOf(normalized)
}

function workflowStatusTime(
  workflow: AttackWorkflowItem,
  status: AttackWorkflowStatus,
): string {
  switch (status) {
    case "detected":
      return workflow.detected_at
    case "investigating":
      return workflow.investigation_started_at
    case "confirmed":
      return workflow.confirmed_at
    case "forensics":
      return workflow.forensic_started_at
    case "responding":
      return workflow.response_started_at
    case "contained":
      return workflow.contained_at
    case "remediated":
      return workflow.remediated_at
    case "closed":
      return workflow.closed_at
    default:
      return ""
  }
}

type WorkflowCenterT = ReturnType<typeof useTranslations>

function isChineseLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh")
}

/**
 * Stable, locale-independent timestamp formatter.
 * Accepts "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss".
 */
function formatWorkflowTime(value: string): string {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("0001-01-01")) return ""

  const fullMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/)
  if (fullMatch) {
    return `${fullMatch[1]} ${fullMatch[2]}`
  }

  const shortMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/)
  if (shortMatch) {
    return `${shortMatch[1]} ${shortMatch[2]}`
  }

  return trimmed
}

function isRecorded(value: string): boolean {
  const trimmed = (value ?? "").trim()
  return Boolean(trimmed) && !trimmed.startsWith("0001-01-01")
}

interface NodeStateParams {
  status: AttackWorkflowStatus
  currentIndex: number
  nodeIndex: number
  hasTimestamp: boolean
  isKnownStatus: boolean
}

function getNodeState({
  currentIndex,
  nodeIndex,
  hasTimestamp,
  isKnownStatus,
}: NodeStateParams): SpineNodeState {
  if (!isKnownStatus) {
    return hasTimestamp ? "recorded" : "pending"
  }

  if (nodeIndex === currentIndex) return "current"

  if (nodeIndex < currentIndex) {
    return "completed"
  }

  if (hasTimestamp) {
    return "inconsistent"
  }
  return "pending"
}

/**
 * Detects out-of-order or missing-record inconsistencies.
 */
function detectTimestampInconsistency(workflow: AttackWorkflowItem): boolean {
  const status = normalizeWorkflowStatus(workflow.status)
  if (!status) return false

  const currentIndex = workflowStatusIndex(status)

  for (let i = 0; i < ATTACK_WORKFLOW_STATUSES.length; i++) {
    const recorded = isRecorded(
      workflowStatusTime(workflow, ATTACK_WORKFLOW_STATUSES[i]),
    )
    if (i > currentIndex && recorded) return true
  }

  if (
    status === "closed" &&
    !isRecorded(workflowStatusTime(workflow, "closed"))
  ) {
    return true
  }

  return false
}

/* -------------------------------------------------------------------------- */
/* Visual tokens                                                              */
/* -------------------------------------------------------------------------- */

interface NodeTone {
  /** Circular marker fill + border + icon color */
  marker: string
  /** Label color */
  label: string
  /** Ring used around the marker for emphasis */
  halo: string
}

interface WorkflowStatusTone {
  markerCurrent: string
  markerReached: string
  markerRecommended: string
  accent: string
  halo: string
  currentHalo: string
  rail: string
  progressBar: string
  statusBadge: string
}

const WORKFLOW_STATUS_TONES: Record<AttackWorkflowStatus, WorkflowStatusTone> =
  {
    detected: {
      markerCurrent:
        "border-amber-500 bg-gradient-to-br from-white via-amber-50 to-amber-100 text-amber-700 shadow-lg shadow-amber-300/50",
      markerReached: "border-amber-500 bg-amber-500 text-white",
      markerRecommended: "border-amber-300 bg-amber-50 text-amber-600",
      accent: "text-amber-600",
      halo: "ring-4 ring-amber-100",
      currentHalo: "bg-amber-300/40",
      rail: "bg-amber-400",
      progressBar: "bg-amber-500",
      statusBadge: "border-amber-200 bg-amber-50 text-amber-700",
    },
    investigating: {
      markerCurrent:
        "border-cyan-500 bg-gradient-to-br from-white via-cyan-50 to-cyan-100 text-cyan-700 shadow-lg shadow-cyan-300/50",
      markerReached: "border-cyan-500 bg-cyan-500 text-white",
      markerRecommended: "border-cyan-300 bg-cyan-50 text-cyan-600",
      accent: "text-cyan-600",
      halo: "ring-4 ring-cyan-100",
      currentHalo: "bg-cyan-300/40",
      rail: "bg-cyan-400",
      progressBar: "bg-cyan-500",
      statusBadge: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    confirmed: {
      markerCurrent:
        "border-blue-500 bg-gradient-to-br from-white via-blue-50 to-blue-100 text-blue-700 shadow-lg shadow-blue-300/50",
      markerReached: "border-blue-500 bg-blue-500 text-white",
      markerRecommended: "border-blue-300 bg-blue-50 text-blue-600",
      accent: "text-blue-600",
      halo: "ring-4 ring-blue-100",
      currentHalo: "bg-blue-300/40",
      rail: "bg-blue-400",
      progressBar: "bg-blue-500",
      statusBadge: "border-blue-200 bg-blue-50 text-blue-700",
    },
    forensics: {
      markerCurrent:
        "border-violet-500 bg-gradient-to-br from-white via-violet-50 to-violet-100 text-violet-700 shadow-lg shadow-violet-300/50",
      markerReached: "border-violet-500 bg-violet-500 text-white",
      markerRecommended: "border-violet-300 bg-violet-50 text-violet-600",
      accent: "text-violet-600",
      halo: "ring-4 ring-violet-100",
      currentHalo: "bg-violet-300/40",
      rail: "bg-violet-400",
      progressBar: "bg-violet-500",
      statusBadge: "border-violet-200 bg-violet-50 text-violet-700",
    },
    responding: {
      markerCurrent:
        "border-teal-500 bg-gradient-to-br from-white via-teal-50 to-teal-100 text-teal-700 shadow-lg shadow-teal-300/50",
      markerReached: "border-teal-500 bg-teal-500 text-white",
      markerRecommended: "border-teal-300 bg-teal-50 text-teal-600",
      accent: "text-teal-600",
      halo: "ring-4 ring-teal-100",
      currentHalo: "bg-teal-300/40",
      rail: "bg-teal-400",
      progressBar: "bg-teal-500",
      statusBadge: "border-teal-200 bg-teal-50 text-teal-700",
    },
    contained: {
      markerCurrent:
        "border-emerald-500 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 text-emerald-700 shadow-lg shadow-emerald-300/50",
      markerReached: "border-emerald-500 bg-emerald-500 text-white",
      markerRecommended: "border-emerald-300 bg-emerald-50 text-emerald-600",
      accent: "text-emerald-600",
      halo: "ring-4 ring-emerald-100",
      currentHalo: "bg-emerald-300/40",
      rail: "bg-emerald-400",
      progressBar: "bg-emerald-500",
      statusBadge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    remediated: {
      markerCurrent:
        "border-green-500 bg-gradient-to-br from-white via-green-50 to-green-100 text-green-700 shadow-lg shadow-green-300/50",
      markerReached: "border-green-500 bg-green-500 text-white",
      markerRecommended: "border-green-300 bg-green-50 text-green-600",
      accent: "text-green-600",
      halo: "ring-4 ring-green-100",
      currentHalo: "bg-green-300/40",
      rail: "bg-green-400",
      progressBar: "bg-green-500",
      statusBadge: "border-green-200 bg-green-50 text-green-700",
    },
    closed: {
      markerCurrent:
        "border-green-600 bg-gradient-to-br from-white via-green-50 to-green-100 text-green-800 shadow-lg shadow-green-300/50",
      markerReached: "border-green-600 bg-green-600 text-white",
      markerRecommended: "border-green-300 bg-green-50 text-green-700",
      accent: "text-green-700",
      halo: "ring-4 ring-green-100",
      currentHalo: "bg-green-400/40",
      rail: "bg-green-500",
      progressBar: "bg-green-600",
      statusBadge: "border-green-200 bg-green-50 text-green-700",
    },
  }

function getWorkflowStatusTone(
  status: AttackWorkflowStatus,
): WorkflowStatusTone {
  return WORKFLOW_STATUS_TONES[status]
}

function getNodeTone(
  status: AttackWorkflowStatus,
  state: SpineNodeState,
): NodeTone {
  const statusTone = getWorkflowStatusTone(status)

  switch (state) {
    case "current":
      return {
        marker: statusTone.markerCurrent,
        label: "text-slate-900",
        halo: statusTone.halo,
      }
    case "completed":
    case "recorded":
      return {
        marker: statusTone.markerReached,
        label: "text-slate-700",
        halo: "ring-0",
      }
    case "recommended":
      return {
        marker: statusTone.markerRecommended,
        label: statusTone.accent,
        halo: statusTone.halo,
      }
    case "inconsistent":
      return {
        marker: "border-amber-500 bg-amber-500 text-white",
        label: "text-amber-700",
        halo: "ring-4 ring-amber-100",
      }
    case "unknown":
      return {
        marker: "border-rose-500 bg-rose-500 text-white",
        label: "text-rose-700",
        halo: "ring-4 ring-rose-100",
      }
    case "pending":
    default:
      return {
        marker: "border-slate-200 bg-white text-slate-300",
        label: "text-slate-400",
        halo: "ring-0",
      }
  }
}

/** Color of the rail segment that connects into this node from the previous. */
function getConnectorTone(
  status: AttackWorkflowStatus,
  nodeIndex: number,
  currentIndex: number,
  isKnownStatus: boolean,
): string {
  if (isKnownStatus && nodeIndex <= currentIndex) {
    return getWorkflowStatusTone(status).rail
  }
  return "bg-slate-200"
}

/* -------------------------------------------------------------------------- */
/* Density                                                                    */
/* -------------------------------------------------------------------------- */

interface DensityClasses {
  marker: string
  icon: string
  label: string
  time: string
  gapY: string
}

function getDensityClasses(
  density: NonNullable<AttackWorkflowSpineProps["density"]>,
  isChinese: boolean,
): DensityClasses {
  if (isChinese) {
    switch (density) {
      case "comfortable":
        return {
          marker: "size-12",
          icon: "size-7",
          label: "text-sm font-medium",
          time: "text-[11px] font-mono",
          gapY: "gap-1",
        }
      case "compact":
        return {
          marker: "size-9",
          icon: "size-5",
          label: "text-[11px] font-medium",
          time: "text-[10px] font-mono",
          gapY: "gap-0.5",
        }
      case "dense":
      default:
        return {
          marker: "size-10",
          icon: "size-6",
          label: "text-xs font-medium",
          time: "text-[10px] font-mono",
          gapY: "gap-0.5",
        }
    }
  }

  switch (density) {
    case "comfortable":
      return {
        marker: "size-12",
        icon: "size-7",
        label: "text-sm font-semibold",
        time: "text-[11px] font-mono",
        gapY: "gap-1",
      }
    case "compact":
      return {
        marker: "size-9",
        icon: "size-5",
        label: "text-[11px] font-semibold",
        time: "text-[10px] font-mono",
        gapY: "gap-0.5",
      }
    case "dense":
    default:
      return {
        marker: "size-10",
        icon: "size-6",
        label: "text-xs font-semibold",
        time: "text-[10px] font-mono",
        gapY: "gap-0.5",
      }
  }
}

/* -------------------------------------------------------------------------- */
/* Severity styling                                                           */
/* -------------------------------------------------------------------------- */

function getSeverityTone(severity: string): string {
  switch ((severity ?? "").trim().toLowerCase()) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700"
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

/* -------------------------------------------------------------------------- */
/* Placeholder states                                                         */
/* -------------------------------------------------------------------------- */

function AttackWorkflowSpineLoading({ t }: { t: WorkflowCenterT }) {
  return (
    <div className="flex min-h-32 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
      <Loader2 className="mr-2 size-4 animate-spin text-sky-500" />
      {t("spine.loading")}
    </div>
  )
}

function AttackWorkflowSpineEmpty({ t }: { t: WorkflowCenterT }) {
  return (
    <div className="flex min-h-32 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
      <ShieldQuestion className="size-6 text-slate-400" />
      <p className="text-sm font-medium text-slate-600">
        {t("spine.emptyTitle")}
      </p>
      <p className="text-xs text-slate-400">{t("spine.emptyDescription")}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Node renderers                                                             */
/* -------------------------------------------------------------------------- */

interface SpineNodeData {
  stage: AttackWorkflowDisplayStage
  status: AttackWorkflowStatus
  label: string
  state: SpineNodeState
  timeDisplay: string
  isCurrent: boolean
  showNext: boolean
  connectorIn: string
  isFirst: boolean
  isLast: boolean
  isSelected: boolean
}

function WorkflowNodeMarker({
  density,
  node,
  tone,
}: {
  density: DensityClasses
  node: SpineNodeData
  tone: NodeTone
}) {
  const statusTone = getWorkflowStatusTone(node.status)

  return (
    <span
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center overflow-visible rounded-full border-2 transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-out",
        density.marker,
        tone.marker,
        tone.halo,
        node.isCurrent &&
          "z-20 -translate-y-1.5 scale-[1.25] shadow-xl [transform-style:preserve-3d] will-change-transform motion-reduce:transition-none",
      )}
    >
      {node.isCurrent ? (
        <>
          <span
            className={cn(
              "pointer-events-none absolute -inset-2 z-0 rounded-full blur-md motion-safe:animate-[workflow-current-halo_2.2s_ease-in-out_infinite] motion-reduce:animate-none",
              statusTone.currentHalo,
            )}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute left-1.5 top-1 z-0 h-2 w-3 rounded-full bg-white/75 blur-[1px]"
            aria-hidden
          />
        </>
      ) : null}
      <FlowStatusIcon
        status={node.status}
        className={cn(
          "relative z-10",
          density.icon,
          node.isCurrent && "drop-shadow-[0_2px_3px_rgba(15,23,42,0.22)]",
        )}
      />
    </span>
  )
}

/* ------------------------------- horizontal ------------------------------- */

function HorizontalNode({
  node,
  density,
}: {
  node: SpineNodeData
  density: DensityClasses
}) {
  const tone = getNodeTone(node.status, node.state)
  const emphasized = node.isCurrent || node.showNext || node.isSelected

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      {/* rail row */}
      <div className="flex w-full items-center">
        <span
          className={cn(
            "h-0.5 flex-1 rounded-full",
            node.isFirst ? "opacity-0" : node.connectorIn,
          )}
          aria-hidden
        />
        <WorkflowNodeMarker density={density} node={node} tone={tone} />
        <span
          className={cn(
            "h-0.5 flex-1 rounded-full",
            node.isLast ? "opacity-0" : getConnectorToneAfter(node),
          )}
          aria-hidden
        />
      </div>

      {/* label block */}
      <div
        className={cn(
          "mt-2 flex w-full flex-col items-center px-1 text-center",
          density.gapY,
        )}
      >
        <div
          className={cn(
            "flex max-w-full flex-col items-center justify-center gap-1",
            emphasized && "-mx-1 min-w-[4.75rem]",
          )}
        >
          <span
            className={cn(
              "max-w-full whitespace-nowrap leading-tight",
              density.label,
              tone.label,
            )}
            title={node.label}
          >
            {node.label}
          </span>
        </div>
        {node.timeDisplay ? (
          <span className={cn("text-slate-400", density.time)}>
            {node.timeDisplay}
          </span>
        ) : null}
        <span
          className={cn(
            "mt-1 h-0.5 rounded-full transition-[width,background-color,opacity]",
            node.isSelected || node.isCurrent
              ? "w-7 opacity-100"
              : "w-0 opacity-0",
            getWorkflowStatusTone(node.status).rail,
          )}
          aria-hidden
        />
      </div>
    </div>
  )
}

/** The outgoing connector of a node mirrors the incoming connector of the next. */
function getConnectorToneAfter(node: SpineNodeData): string {
  // A reached segment keeps the lifecycle color of the node it leaves.
  if (node.state === "completed") return getWorkflowStatusTone(node.status).rail
  return "bg-slate-200"
}

/* -------------------------------- vertical -------------------------------- */

function VerticalNode({
  node,
  density,
}: {
  node: SpineNodeData
  density: DensityClasses
}) {
  const tone = getNodeTone(node.status, node.state)

  return (
    <div className="flex w-full min-w-0 gap-3">
      {/* rail column */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "h-3 w-0.5 rounded-full",
            node.isFirst ? "opacity-0" : node.connectorIn,
          )}
          aria-hidden
        />
        <WorkflowNodeMarker density={density} node={node} tone={tone} />
        <span
          className={cn(
            "w-0.5 flex-1 rounded-full",
            node.isLast ? "opacity-0" : getConnectorToneAfter(node),
          )}
          aria-hidden
        />
      </div>

      {/* content */}
      <div
        className={cn("flex min-w-0 flex-1 flex-col pb-4 pt-1.5", density.gapY)}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(density.label, tone.label)}>{node.label}</span>
        </div>
        {node.timeDisplay ? (
          <span className={cn("text-slate-400", density.time)}>
            {node.timeDisplay}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export function AttackWorkflowSpine({
  workflow,
  loading = false,
  recommendedStatus = null,
  density = "dense",
  layout = "auto",
  variant = "card",
  interactive = false,
  showFootnotes = true,
  className,
  selectedStatus = null,
  onStatusSelect,
  onStatusClick,
}: AttackWorkflowSpineProps) {
  const t = useTranslations("pages.attack.workflowCenter")
  const locale = useLocale()
  const isChinese = isChineseLocale(locale)

  if (!workflow) {
    return (
      <div className={cn("w-full min-w-0", className)}>
        {loading ? (
          <AttackWorkflowSpineLoading t={t} />
        ) : (
          <AttackWorkflowSpineEmpty t={t} />
        )}
      </div>
    )
  }

  const normalizedStatus = normalizeWorkflowStatus(workflow.status)
  const isKnownStatus = normalizedStatus !== ""
  const currentStageIndex = isKnownStatus
    ? workflowDisplayStageIndex(normalizedStatus)
    : -1
  const recommendedStage = recommendedStatus
    ? workflowDisplayStageForStatus(recommendedStatus)
    : ""
  const selectedStage = selectedStatus
    ? workflowDisplayStageForStatus(selectedStatus)
    : ""

  const densityClasses = getDensityClasses(density, isChinese)
  const hasInconsistency = detectTimestampInconsistency(workflow)

  const closeReason = (workflow.close_reason ?? "").trim()
  const showCloseReason = normalizedStatus === "closed" && closeReason !== ""

  const totalSteps = ATTACK_WORKFLOW_DISPLAY_STAGES.length
  const progressPct = isKnownStatus
    ? Math.round(((currentStageIndex + 1) / totalSteps) * 100)
    : 0

  const nodes: SpineNodeData[] = ATTACK_WORKFLOW_DISPLAY_STAGES.map(
    ({ stage }, index) => {
      const status = workflowDisplayStageRepresentativeForWorkflow(
        workflow,
        stage,
      )
      const rawTime = workflowDisplayStageTime(workflow, stage)
      const hasTimestamp = isRecorded(rawTime)
      const state = getNodeState({
        status,
        currentIndex: currentStageIndex,
        nodeIndex: index,
        hasTimestamp,
        isKnownStatus,
      })
      return {
        stage,
        status,
        label: t(DISPLAY_STAGE_LABEL_KEYS[stage]),
        state,
        timeDisplay: formatWorkflowTime(rawTime),
        isCurrent: isKnownStatus && index === currentStageIndex,
        showNext: recommendedStage === stage && index !== currentStageIndex,
        connectorIn: getConnectorTone(
          status,
          index,
          currentStageIndex,
          isKnownStatus,
        ),
        isFirst: index === 0,
        isLast: index === totalSteps - 1,
        isSelected: selectedStage === stage,
      }
    },
  )

  const renderItem = (node: SpineNodeData, useVertical: boolean) => {
    const ariaState = node.timeDisplay
      ? t("spine.nodeAria.recorded", { time: node.timeDisplay })
      : node.state === "pending"
        ? t("spine.nodeAria.pending")
        : ""
    const ariaLabel = [
      node.label,
      node.isCurrent ? t("spine.nodeAria.currentPrefix") : "",
      ariaState,
    ]
      .filter(Boolean)
      .join(", ")

    const inner = useVertical ? (
      <VerticalNode
        node={node}
        density={densityClasses}
      />
    ) : (
      <HorizontalNode
        node={node}
        density={densityClasses}
      />
    )

    const itemClassName = useVertical ? "min-w-0" : "min-w-0 flex-1 basis-0"

    const isInteractive =
      interactive || Boolean(onStatusClick || onStatusSelect)

    if (isInteractive) {
      return (
        <li key={node.stage} className={itemClassName}>
          <button
            type="button"
            aria-current={node.isCurrent ? "step" : undefined}
            aria-label={ariaLabel}
            aria-pressed={node.isSelected}
            onClick={() => {
              onStatusSelect?.(node.status)
              onStatusClick?.(node.status)
            }}
            className={cn(
              "block w-full min-w-0 cursor-pointer rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
            )}
          >
            {inner}
          </button>
        </li>
      )
    }
    return (
      <li
        key={node.stage}
        className={itemClassName}
        aria-current={node.isCurrent ? "step" : undefined}
      >
        {inner}
      </li>
    )
  }

  // Layout selection. "auto" => horizontal on lg+, vertical below.
  const showHorizontal = layout === "horizontal" || layout === "auto"
  const showVertical = layout === "vertical" || layout === "auto"
  const showHeader = variant === "card"

  return (
    <section
      className={cn(
        "w-full min-w-0 overflow-hidden",
        variant === "card"
          ? "rounded-2xl border border-slate-200 bg-white shadow-sm"
          : "bg-transparent",
        className,
      )}
      aria-label={t("spine.ariaLabel")}
    >
      {/* Header */}
      {showHeader && (
        <header className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-3">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
            {workflow.title?.trim() || t("queue.untitled")}
          </h3>

          {workflow.severity?.trim() && (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                getSeverityTone(workflow.severity),
              )}
            >
              {workflow.severity}
            </span>
          )}

          {isKnownStatus ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                getWorkflowStatusTone(normalizedStatus).statusBadge,
              )}
            >
              {t(STATUS_LABEL_KEYS[normalizedStatus])}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
              <ShieldQuestion className="size-3" />
              {t("unknown")}
            </span>
          )}
        </header>
      )}

      {/* Progress bar */}
      {isKnownStatus && (
        <div className="flex items-center gap-3 px-4 pt-3">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                getWorkflowStatusTone(normalizedStatus).progressBar,
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-mono text-slate-400">
            {currentStageIndex + 1}/{totalSteps}
          </span>
        </div>
      )}

      {/* Unknown-status warning */}
      {!isKnownStatus && (
        <div className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <span className="font-medium">{t("spine.unknownStatusLabel")}</span>{" "}
          <span className="break-all font-mono">{workflow.status}</span>
        </div>
      )}

      {/* Spine body */}
      <div className="px-4 py-4">
        {showHorizontal && (
          <ol
            className={cn(
              "flex w-full min-w-0 items-start",
              layout === "auto" && "hidden lg:flex",
            )}
          >
            {nodes.map((node) => renderItem(node, false))}
          </ol>
        )}

        {showVertical && (
          <ol
            className={cn(
              "flex w-full min-w-0 flex-col",
              layout === "auto" && "lg:hidden",
            )}
          >
            {nodes.map((node) => renderItem(node, true))}
          </ol>
        )}
      </div>

      {/* Footnotes */}
      {showFootnotes && (showCloseReason || hasInconsistency) && (
        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3">
          {showCloseReason && (
            <p className="min-w-0 text-xs text-slate-500">
              <span className="font-medium text-slate-600">
                {t("dialog.closeReason")}:
              </span>{" "}
              <span className="break-all font-mono">{closeReason}</span>
            </p>
          )}
          {hasInconsistency && (
            <p className="inline-flex w-full min-w-0 items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span className="min-w-0">{t("spine.timestampWarning")}</span>
            </p>
          )}
        </div>
      )}
    </section>
  )
}
