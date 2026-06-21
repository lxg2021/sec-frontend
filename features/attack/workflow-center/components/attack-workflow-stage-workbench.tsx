"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileSearch,
  Gauge,
  Lock,
  Radar,
  ScrollText,
  Shield,
  Target,
  Timer,
  Workflow,
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
  workflowStatusIndex,
  workflowStatusTime,
} from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
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
  purpose: string
  whatToVerify: string[]
  completionCriteria: string[]
  riskNote: string
  recommendedReason: string
  transitionEffect: string
}

interface StageTool {
  description: string
  disabled?: boolean
  href: string
  iconName?: string
  title: string
}

interface ToolActionStyle {
  bar: string
  hover: string
  tile: string
}

interface StatusStyle {
  badge: string
  currentBadge: string
  dot: string
  iconBg: string
  iconText: string
  primaryBtn: string
}

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

const RESPONSE_ORCHESTRATION_STATUSES = new Set<AttackWorkflowStatus>([
  "responding",
  "contained",
  "remediated",
])

const STATUS_STYLES: Record<AttackWorkflowStatus, StatusStyle> = {
  detected: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    currentBadge: "border-transparent bg-amber-500 text-white",
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
    dot: "bg-amber-500",
    primaryBtn:
      "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-400",
  },
  investigating: {
    badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
    currentBadge: "border-transparent bg-cyan-500 text-white",
    iconBg: "bg-cyan-100",
    iconText: "text-cyan-700",
    dot: "bg-cyan-500",
    primaryBtn:
      "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-400",
  },
  confirmed: {
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    currentBadge: "border-transparent bg-blue-500 text-white",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    dot: "bg-blue-500",
    primaryBtn:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400",
  },
  forensics: {
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    currentBadge: "border-transparent bg-violet-500 text-white",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
    dot: "bg-violet-500",
    primaryBtn:
      "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-400",
  },
  responding: {
    badge: "border-teal-200 bg-teal-50 text-teal-700",
    currentBadge: "border-transparent bg-teal-500 text-white",
    iconBg: "bg-teal-100",
    iconText: "text-teal-700",
    dot: "bg-teal-500",
    primaryBtn:
      "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-400",
  },
  contained: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    currentBadge: "border-transparent bg-emerald-500 text-white",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    dot: "bg-emerald-500",
    primaryBtn:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400",
  },
  remediated: {
    badge: "border-green-200 bg-green-50 text-green-700",
    currentBadge: "border-transparent bg-green-500 text-white",
    iconBg: "bg-green-100",
    iconText: "text-green-700",
    dot: "bg-green-500",
    primaryBtn:
      "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-400",
  },
  closed: {
    badge: "border-green-300 bg-green-100 text-green-800",
    currentBadge: "border-transparent bg-green-600 text-white",
    iconBg: "bg-green-200",
    iconText: "text-green-800",
    dot: "bg-green-600",
    primaryBtn:
      "bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-500",
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
  aiops: BrainCircuit,
  clipboard: ClipboardCheck,
  external: ExternalLink,
  file: FileSearch,
  forensics: FileSearch,
  ioc: Radar,
  lock: Lock,
  orchestration: Workflow,
  route: Target,
  scroll: ScrollText,
  search: FileSearch,
  shield: Shield,
  target: Target,
  wrench: Wrench,
}

const TOOL_ACTION_STYLES: Record<string, ToolActionStyle> = {
  activity: {
    bar: "bg-orange-500",
    hover: "group-hover:bg-orange-50/80",
    tile: "from-orange-500 to-amber-600",
  },
  aiops: {
    bar: "bg-violet-500",
    hover: "group-hover:bg-violet-50/80",
    tile: "from-violet-500 to-indigo-600",
  },
  clipboard: {
    bar: "bg-amber-500",
    hover: "group-hover:bg-amber-50/80",
    tile: "from-amber-500 to-orange-600",
  },
  external: {
    bar: "bg-sky-500",
    hover: "group-hover:bg-sky-50/80",
    tile: "from-sky-500 to-blue-600",
  },
  file: {
    bar: "bg-blue-500",
    hover: "group-hover:bg-blue-50/80",
    tile: "from-blue-500 to-cyan-600",
  },
  forensics: {
    bar: "bg-amber-500",
    hover: "group-hover:bg-amber-50/80",
    tile: "from-amber-500 to-orange-600",
  },
  ioc: {
    bar: "bg-rose-500",
    hover: "group-hover:bg-rose-50/80",
    tile: "from-rose-500 to-red-600",
  },
  lock: {
    bar: "bg-emerald-500",
    hover: "group-hover:bg-emerald-50/80",
    tile: "from-emerald-500 to-teal-600",
  },
  orchestration: {
    bar: "bg-emerald-500",
    hover: "group-hover:bg-emerald-50/80",
    tile: "from-emerald-500 to-teal-600",
  },
  route: {
    bar: "bg-sky-500",
    hover: "group-hover:bg-sky-50/80",
    tile: "from-sky-500 to-blue-600",
  },
  scroll: {
    bar: "bg-indigo-500",
    hover: "group-hover:bg-indigo-50/80",
    tile: "from-indigo-500 to-violet-600",
  },
  search: {
    bar: "bg-sky-500",
    hover: "group-hover:bg-sky-50/80",
    tile: "from-sky-500 to-blue-600",
  },
  shield: {
    bar: "bg-teal-500",
    hover: "group-hover:bg-teal-50/80",
    tile: "from-teal-500 to-emerald-600",
  },
  target: {
    bar: "bg-rose-500",
    hover: "group-hover:bg-rose-50/80",
    tile: "from-rose-500 to-red-600",
  },
  wrench: {
    bar: "bg-slate-500",
    hover: "group-hover:bg-slate-50/80",
    tile: "from-slate-500 to-slate-700",
  },
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

type WorkflowCenterT = ReturnType<typeof useTranslations>

function isChineseLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh")
}

function statusLabel(t: WorkflowCenterT, status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? t(STATUS_LABEL_KEYS[normalized]) : status || t("unknown")
}

function getStageConfig(
  t: WorkflowCenterT,
  status: AttackWorkflowStatus,
): StageConfig {
  const prefix = `stages.${status}`

  return {
    purpose: t(`${prefix}.purpose`),
    whatToVerify: [
      t(`${prefix}.whatToVerify.1`),
      t(`${prefix}.whatToVerify.2`),
      t(`${prefix}.whatToVerify.3`),
    ],
    completionCriteria: [
      t(`${prefix}.completionCriteria.1`),
      t(`${prefix}.completionCriteria.2`),
      t(`${prefix}.completionCriteria.3`),
    ],
    riskNote: t(`${prefix}.riskNote`),
    recommendedReason: t(`${prefix}.recommendedReason`),
    transitionEffect: t(`${prefix}.transitionEffect`),
  }
}

function getToolIcon(iconName?: string): ComponentType<{ className?: string }> {
  if (iconName && TOOL_ICONS[iconName]) return TOOL_ICONS[iconName]
  return Wrench
}

function getToolActionStyle(iconName?: string) {
  return iconName && TOOL_ACTION_STYLES[iconName]
    ? TOOL_ACTION_STYLES[iconName]
    : TOOL_ACTION_STYLES.wrench
}

function stageTools({
  canInvestigateIoc,
  currentStatus,
  hrefs,
  t,
}: {
  canInvestigateIoc: boolean
  currentStatus: AttackWorkflowStatus | ""
  hrefs: WorkflowNavigationHrefs
  t: WorkflowCenterT
}): StageTool[] {
  const canUseForensicOrchestration = currentStatus === "forensics"
  const canUseResponseOrchestration =
    currentStatus !== "" && RESPONSE_ORCHESTRATION_STATUSES.has(currentStatus)

  return [
    {
      title: t("tools.attackTrace.title"),
      description: t("tools.attackTrace.description"),
      href: hrefs.traceHref,
      iconName: "route",
    },
    {
      title: t("tools.aiAnalysis.title"),
      description: t("tools.aiAnalysis.description"),
      href: hrefs.aiHref,
      iconName: "aiops",
    },
    {
      title: t("tools.iocInvestigation.title"),
      description: t("tools.iocInvestigation.description"),
      href: `${hrefs.aiHref}#iocs`,
      iconName: "ioc",
      disabled: !canInvestigateIoc,
    },
    {
      title: t("tools.forensicOrchestration.title"),
      description: t("tools.forensicOrchestration.description"),
      href: "/frame/evidence",
      iconName: "forensics",
      disabled: !canUseForensicOrchestration,
    },
    {
      title: t("tools.responseOrchestration.title"),
      description: t("tools.responseOrchestration.description"),
      href: "/frame/response/dac",
      iconName: "orchestration",
      disabled: !canUseResponseOrchestration,
    },
  ]
}

function readOnlyReason({
  currentStatus,
  selectedStatus,
  t,
  workflow,
}: {
  currentStatus: AttackWorkflowStatus | ""
  selectedStatus: AttackWorkflowStatus
  t: WorkflowCenterT
  workflow: AttackWorkflowItem | null
}) {
  if (!workflow) return t("control.readOnly.notLoaded")
  if (currentStatus === "closed") return t("control.readOnly.closed")
  if (currentStatus !== selectedStatus) {
    return t("control.readOnly.viewing", {
      current: statusLabel(t, currentStatus),
      selected: statusLabel(t, selectedStatus),
    })
  }
  return ""
}

function stageCompletionLabel({
  currentStatus,
  selectedStatus,
  t,
  workflow,
}: {
  currentStatus: AttackWorkflowStatus | ""
  selectedStatus: AttackWorkflowStatus
  t: WorkflowCenterT
  workflow: AttackWorkflowItem | null
}) {
  if (!workflow || !currentStatus) return t("completion.notLoaded")
  const selectedIndex = workflowStatusIndex(selectedStatus)
  const currentIndex = workflowStatusIndex(currentStatus)
  const timestamp = workflowStatusTime(workflow, selectedStatus)
  if (selectedIndex < currentIndex) return t("completion.completed")
  if (selectedIndex === currentIndex) {
    return currentStatus === "closed"
      ? t("completion.closed")
      : t("completion.current")
  }
  if (timestamp) return t("completion.recorded")
  return t("completion.pending")
}

function HeaderStat({
  icon: Icon,
  iconClassName = "text-slate-400",
  isChinese,
  label,
  mono = false,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  isChinese: boolean
  label: string
  mono?: boolean
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 text-slate-500",
          isChinese
            ? "text-[11px] font-normal"
            : "text-[11px] font-semibold uppercase tracking-wide",
        )}
      >
        <Icon className={cn("size-3.5", iconClassName)} aria-hidden="true" />
        <span>{label}</span>
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-xs font-semibold text-slate-900",
          isChinese && "font-normal",
          mono && "font-mono text-xs tabular-nums",
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

function GuideTextBlock({
  isChinese,
  label,
  value,
}: {
  isChinese: boolean
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "font-medium text-slate-900",
          isChinese ? "text-[11px]" : "text-[11px] uppercase tracking-wide",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-slate-500",
          isChinese ? "text-[13px] leading-5" : "text-sm leading-relaxed",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function GuideBulletList({
  isChinese,
  items,
  label,
}: {
  isChinese: boolean
  items: string[]
  label: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className={cn(
          "font-medium text-slate-900",
          isChinese ? "text-[11px]" : "text-[11px] uppercase tracking-wide",
        )}
      >
        {label}
      </span>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              "flex gap-2 text-slate-500",
              isChinese ? "text-[13px] leading-5" : "text-sm leading-relaxed",
            )}
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
  )
}

function TransitionDetail({
  isChinese,
  label,
  value,
}: {
  isChinese: boolean
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <span
        className={cn(
          "font-medium text-slate-900",
          isChinese ? "text-[11px]" : "text-[11px] uppercase tracking-wide",
        )}
      >
        {label}
      </span>
      <p
        className={cn(
          "text-slate-500",
          isChinese
            ? "mt-0.5 text-[13px] leading-5"
            : "mt-0.5 text-xs leading-relaxed",
        )}
      >
        {value}
      </p>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  iconClassName,
  isChinese,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  isChinese: boolean
  children: ReactNode
}) {
  return (
    <h3
      className={cn(
        "flex items-center gap-1.5 text-sm font-semibold text-slate-900",
        isChinese && "font-medium",
      )}
    >
      <Icon
        className={cn("h-4 w-4", iconClassName ?? "text-slate-400")}
        aria-hidden="true"
      />
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
    <div className="flex shrink-0 items-center gap-2">
      <span className="shrink-0 text-xs font-medium text-slate-500">
        {label}
      </span>
      <Badge
        variant="outline"
        className={cn(
          "h-5 min-w-0 max-w-full gap-1.5 rounded-full px-2 py-0 text-[11px] leading-none",
          "shrink-0",
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
        <span className="whitespace-nowrap">{value}</span>
      </Badge>
    </div>
  )
}

function ToolRow({
  isChinese,
  t,
  tool,
}: {
  isChinese: boolean
  t: WorkflowCenterT
  tool: StageTool
}) {
  const Icon = getToolIcon(tool.iconName)
  const actionStyle = getToolActionStyle(tool.iconName)
  const disabled = Boolean(tool.disabled)
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl bg-transparent transition-colors duration-200",
          !disabled && actionStyle.hover,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-200",
          !disabled && "group-hover:opacity-100",
          actionStyle.bar,
        )}
      />
      <span
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all duration-200",
          disabled
            ? "bg-slate-200 text-slate-400"
            : cn(
                "bg-gradient-to-br group-hover:-translate-y-0.5 group-hover:shadow-md",
                actionStyle.tile,
              ),
        )}
      >
        <Icon className="size-[22px]" aria-hidden="true" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[15px] font-semibold leading-tight text-slate-900",
            isChinese && "font-medium",
            disabled && "text-slate-500",
          )}
        >
          {tool.title}
        </span>
        <span
          className={cn(
            "mt-0.5 block truncate text-[13px] leading-relaxed text-slate-500",
            isChinese && "leading-5 text-slate-500/90",
            disabled && "text-slate-400",
          )}
        >
          {tool.description}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className={cn(
          "relative ml-auto size-4 shrink-0 text-slate-300 transition-all duration-200",
          !disabled && "group-hover:translate-x-0.5 group-hover:text-slate-500",
        )}
      />
    </>
  )

  if (disabled) {
    return (
      <div
        aria-disabled="true"
        aria-label={t("tools.unavailableAria", { title: tool.title })}
        className={cn(
          "group relative flex min-h-[68px] w-full items-center gap-4 rounded-2xl px-3 py-3 text-left opacity-70",
          "focus-visible:outline-none",
        )}
        title={tool.title}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      href={tool.href}
      aria-label={t("tools.openAria", { title: tool.title })}
      className={cn(
        "group relative flex min-h-[68px] w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
      )}
      title={`${tool.title} - ${tool.description}`}
    >
      {content}
    </Link>
  )
}

export function AttackWorkflowStageWorkbench({
  actions,
  allowedStatuses,
  currentStatus,
  hrefs,
  loading = false,
  onOpenStatusDialog,
  recommendedStatus,
  selectedStatus,
  updating = false,
  workflow,
}: AttackWorkflowStageWorkbenchProps) {
  const t = useTranslations("pages.attack.workflowCenter")
  const locale = useLocale()
  const isChinese = isChineseLocale(locale)
  const normalizedCurrentStatus = normalizeWorkflowStatus(currentStatus)
  const config = getStageConfig(t, selectedStatus)
  // IOC investigation needs a backend IOC availability signal before it can be enabled reliably.
  const canInvestigateIoc = false
  const tools = stageTools({
    canInvestigateIoc,
    currentStatus: normalizedCurrentStatus,
    hrefs,
    t,
  })
  const selectedStyle = getStatusStyle(selectedStatus)
  const stageTime = workflow
    ? formatWorkflowTime(workflowStatusTime(workflow, selectedStatus))
    : "-"
  const completionLabel = stageCompletionLabel({
    currentStatus: normalizedCurrentStatus,
    selectedStatus,
    t,
    workflow,
  })
  const readOnlyText = readOnlyReason({
    currentStatus: normalizedCurrentStatus,
    selectedStatus,
    t,
    workflow,
  })
  const isReadOnly = Boolean(readOnlyText)
  const showRecommended =
    !isReadOnly &&
    recommendedStatus != null &&
    allowedStatuses.includes(recommendedStatus)
  const secondaryStatuses = allowedStatuses.filter(
    (status) => status !== recommendedStatus,
  )
  const isViewingCurrentStage = normalizedCurrentStatus === selectedStatus
  const pairedSectionsRef = useRef<HTMLDivElement | null>(null)
  const [pairedSectionHeight, setPairedSectionHeight] = useState<number | null>(
    null,
  )
  const hasPairedSectionHeight = pairedSectionHeight != null
  const stageLayoutStyle = hasPairedSectionHeight
    ? ({
        "--stage-workbench-pair-height": `${pairedSectionHeight}px`,
      } as CSSProperties)
    : undefined

  useLayoutEffect(() => {
    const pairedSections = pairedSectionsRef.current

    if (!pairedSections) {
      return undefined
    }

    const updatePairedSectionHeight = () => {
      const nextHeight = Math.ceil(
        pairedSections.getBoundingClientRect().height,
      )

      setPairedSectionHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      )
    }

    updatePairedSectionHeight()
    window.addEventListener("resize", updatePairedSectionHeight)

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.removeEventListener("resize", updatePairedSectionHeight)
      }
    }

    const observer = new ResizeObserver(updatePairedSectionHeight)
    observer.observe(pairedSections)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updatePairedSectionHeight)
    }
  }, [
    isChinese,
    tools.length,
  ])

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 xl:flex-row xl:items-start xl:justify-between">
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
              <h2
                className={cn(
                  "whitespace-nowrap text-lg font-semibold leading-6 text-slate-900",
                  isChinese && "text-base font-semibold leading-5",
                )}
              >
                {t("workbench.title")}
              </h2>
              {loading ? (
                <span className="text-xs font-medium text-slate-400">
                  {t("loading")}
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              {isViewingCurrentStage ? (
                <HeaderMetaField
                  current
                  label={t("labels.current")}
                  value={statusLabel(t, selectedStatus)}
                  valueClassName={selectedStyle.currentBadge}
                />
              ) : (
                <>
                  <HeaderMetaField
                    label={t("labels.selected")}
                    value={statusLabel(t, selectedStatus)}
                    valueClassName={selectedStyle.currentBadge}
                  />
                  {normalizedCurrentStatus ? (
                    <HeaderMetaField
                      current
                      label={t("labels.current")}
                      value={statusLabel(t, normalizedCurrentStatus)}
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

        <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 xl:w-auto xl:max-w-xl">
          <HeaderStat
            icon={Gauge}
            iconClassName={selectedStyle.iconText}
            isChinese={isChinese}
            label={t("labels.result")}
            value={completionLabel}
          />
          <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" />
          <HeaderStat
            icon={Timer}
            iconClassName="text-cyan-500"
            isChinese={isChinese}
            label={t("labels.time")}
            value={stageTime}
            mono
          />
          <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" />
          <HeaderStat
            icon={Activity}
            iconClassName="text-violet-500"
            isChinese={isChinese}
            label={t("labels.actions")}
            value={String(actions.length)}
          />
        </div>
      </header>

      <div
        className="grid grid-cols-1 items-start gap-4 p-4 sm:p-5 2xl:grid-cols-12 2xl:gap-5"
        style={stageLayoutStyle}
      >
        <div
          ref={pairedSectionsRef}
          className="grid grid-cols-1 items-stretch gap-4 2xl:col-span-7 2xl:grid-cols-7 2xl:gap-5"
        >
        <section className="flex flex-col gap-3 2xl:col-span-4">
          <SectionTitle
            icon={Activity}
            iconClassName="text-sky-500"
            isChinese={isChinese}
          >
            {t("control.title")}
          </SectionTitle>

          {isReadOnly ? (
            <div
              className={cn(
                "min-h-0 rounded-xl border border-slate-200 bg-slate-50 p-3",
                "2xl:flex-1",
              )}
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Lock className="h-4 w-4 text-sky-500" aria-hidden="true" />
                {t("control.reviewMode")}
              </p>
              <p className="mt-1.5 pl-2.5 text-xs leading-relaxed text-slate-500">
                {readOnlyText}
              </p>
              <TransitionDetail
                isChinese={isChinese}
                label={t("control.guidance")}
                value={config.transitionEffect}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex min-h-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3",
                "2xl:flex-1",
              )}
            >
              <span
                className={cn(
                  "font-medium text-slate-900",
                  isChinese
                    ? "text-[11px]"
                    : "text-[11px] uppercase tracking-wide",
                )}
              >
                {t("control.recommendedTransition")}
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
                      isChinese && "text-sm font-medium",
                    )}
                  >
                    <span>
                      {updating
                        ? t("control.updating")
                        : t("control.moveTo", {
                            status: statusLabel(
                              t,
                              recommendedStatus as AttackWorkflowStatus,
                            ),
                          })}
                    </span>
                    {!updating ? (
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    ) : null}
                  </Button>
                  <TransitionDetail
                    isChinese={isChinese}
                    label={t("control.whyThisStep")}
                    value={config.recommendedReason}
                  />
                  <TransitionDetail
                    isChinese={isChinese}
                    label={t("control.whatHappensNext")}
                    value={config.transitionEffect}
                  />
                </>
              ) : (
                <>
                  <p
                    className={cn(
                      "rounded-lg border border-dashed border-slate-200 px-2.5 py-3 text-slate-400",
                      isChinese ? "text-xs leading-relaxed" : "text-xs",
                    )}
                  >
                    {t("control.noRecommended")}
                  </p>
                  <TransitionDetail
                    isChinese={isChinese}
                    label={t("control.guidance")}
                    value={t("control.keepSelectedGuidance")}
                  />
                </>
              )}

              {secondaryStatuses.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <span
                      className={cn(
                        "font-medium text-slate-900",
                        isChinese
                          ? "text-[11px]"
                          : "text-[11px] uppercase tracking-wide",
                      )}
                    >
                      {t("control.otherTransitions")}
                    </span>
                    <p
                      className={cn(
                        "text-slate-500",
                        isChinese
                          ? "mt-0.5 text-xs leading-relaxed"
                          : "mt-0.5 text-xs leading-relaxed",
                      )}
                    >
                      {t("control.otherTransitionsHint")}
                    </p>
                  </div>
                  <div
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${secondaryStatuses.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {secondaryStatuses.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        disabled={updating}
                        onClick={() => onOpenStatusDialog(status)}
                        className={cn(
                          "h-8 min-w-0 justify-center px-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-offset-2",
                          getStatusStyle(status).primaryBtn,
                        )}
                      >
                        <span className="truncate">{statusLabel(t, status)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 2xl:col-span-3">
          <SectionTitle
            icon={Wrench}
            iconClassName="text-teal-500"
            isChinese={isChinese}
          >
            {t("tools.title")}
          </SectionTitle>
          <div
            className={cn(
              "flex min-h-0 flex-col 2xl:flex-1",
              tools.length > 0
                ? "overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.10)] 2xl:justify-evenly"
                : "rounded-xl border border-slate-200 bg-white/95 p-2",
            )}
          >
            {tools.length > 0 ? (
              tools.map((tool, index) => (
                <ToolRow
                  key={`${tool.title}-${index}`}
                  isChinese={isChinese}
                  t={t}
                  tool={tool}
                />
              ))
            ) : (
              <p
                className={cn(
                  "px-3 py-4 text-slate-400",
                  isChinese ? "text-xs leading-relaxed" : "text-xs",
                )}
              >
                {t("tools.empty")}
              </p>
            )}
          </div>
        </section>
        </div>

        <section
          className={cn(
            "flex flex-col gap-3 overflow-hidden 2xl:col-span-5",
            hasPairedSectionHeight &&
              "2xl:h-[var(--stage-workbench-pair-height)] 2xl:max-h-[var(--stage-workbench-pair-height)]",
          )}
        >
          <SectionTitle
            icon={ScrollText}
            iconClassName="text-indigo-500"
            isChinese={isChinese}
          >
            {t("guide.title")}
          </SectionTitle>
          <div
            className={cn(
              "flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3",
              hasPairedSectionHeight && "2xl:flex-1",
            )}
          >
            <GuideTextBlock
              isChinese={isChinese}
              label={t("guide.purpose")}
              value={config.purpose}
            />
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2">
              <span
                className={cn(
                  "font-medium text-amber-800",
                  isChinese
                    ? "text-[11px]"
                    : "text-[11px] uppercase tracking-wide",
                )}
              >
                {t("guide.riskNote")}
              </span>
              <p
                className={cn(
                  "text-amber-700",
                  isChinese
                    ? "mt-0.5 text-[13px] leading-5"
                    : "mt-0.5 text-xs leading-relaxed",
                )}
              >
                {config.riskNote}
              </p>
            </div>
            <details open className="group rounded-lg border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <span>{t("guide.detailedChecklist")}</span>
                <ChevronDown
                  className="size-4 shrink-0 text-indigo-400 transition-transform group-open:rotate-180 group-hover:text-indigo-500"
                  aria-hidden="true"
                />
              </summary>
              <div className="flex flex-col gap-3 border-t border-slate-200 p-3">
                <GuideBulletList
                  isChinese={isChinese}
                  label={t("guide.whatToVerify")}
                  items={config.whatToVerify}
                />
                <Separator className="bg-slate-200" />
                <GuideBulletList
                  isChinese={isChinese}
                  label={t("guide.completionCriteria")}
                  items={config.completionCriteria}
                />
              </div>
            </details>
          </div>
        </section>
      </div>
    </Card>
  )
}
