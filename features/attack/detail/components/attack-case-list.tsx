"use client"

import { useMemo, type ComponentType, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  Boxes,
  Bug,
  CalendarClock,
  CircleDot,
  Crosshair,
  FileSearch,
  GitBranch,
  ScrollText,
  Server,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react"

import { RuleInfoPopover } from "@/features/baseline/rules/components/rule-info-popover"
import { resolveAttckStage } from "@/features/attack/constants/attck-stages"
import type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"
import { cn } from "@/shared/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

export type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"

interface AttackCaseListProps {
  items: AttackCaseTimelineSummary[]
  onViewDetail?: (caseId: string) => void
  className?: string
}

const SEVERITY_MAP: Record<
  string,
  {
    labelKey: string
    dot: string
    badge: string
  }
> = {
  critical: {
    labelKey: "critical",
    dot: "bg-severity-critical",
    badge:
      "border-severity-critical/30 bg-severity-critical/10 text-severity-critical",
  },
  high: {
    labelKey: "high",
    dot: "bg-severity-high",
    badge: "border-severity-high/30 bg-severity-high/10 text-severity-high",
  },
  medium: {
    labelKey: "medium",
    dot: "bg-severity-medium",
    badge:
      "border-severity-medium/30 bg-severity-medium/10 text-severity-medium",
  },
  low: {
    labelKey: "low",
    dot: "bg-severity-low",
    badge: "border-severity-low/30 bg-severity-low/10 text-severity-low",
  },
}

type MetricItem = {
  key: string
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
}

function getSeverity(severity: string) {
  return (
    SEVERITY_MAP[severity?.toLowerCase()] ?? {
      labelKey: "unknown",
      dot: "bg-muted-foreground",
      badge: "border-border bg-muted text-muted-foreground",
    }
  )
}

function formatFullTime(value: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatShortTime(value: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

function shortenId(value: string, head = 8, tail = 4) {
  if (!value) return "-"
  if (value.length <= head + tail + 3) return value
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

function extractTechniques(values: string[]) {
  const techniques: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const match = value.match(/T\d{4}(?:[./]\d{3})?/i)
    if (match?.[0]) {
      const technique = match[0].replace("/", ".").toUpperCase()
      if (!seen.has(technique)) {
        seen.add(technique)
        techniques.push(technique)
      }
    }
  }

  return techniques
}

function normalizeUnknownPhase(phase: string) {
  return phase
    .trim()
    .replace(/^phase[.:_-]\s*/i, "")
    .replace(/^phase\./i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
}

function buildOrderedPhases(item: AttackCaseTimelineSummary) {
  const phases = [
    item.primary_phase,
    ...item.phases.filter((phase) => phase !== item.primary_phase),
  ].filter(Boolean)

  const seen = new Set<string>()
  return phases
    .map((phase) => {
      const stage = resolveAttckStage(phase)
      const key = stage?.key || normalizeUnknownPhase(phase).toLowerCase()
      return {
        key,
        stageKey: stage?.key,
        fallbackLabel: normalizeUnknownPhase(phase),
      }
    })
    .filter((phase) => {
      if (!phase.key || seen.has(phase.key)) return false
      seen.add(phase.key)
      return true
    })
}

function matchAutoSummary(summary: string) {
  const acrossMatch = summary.match(
    /^Auto aggregated from (\d+) instance\(s\) across (\d+) group\(s\)\.?$/i,
  )
  if (acrossMatch) {
    return {
      instances: Number(acrossMatch[1]),
      groups: Number(acrossMatch[2]),
      rules: null,
    }
  }

  const multiMatch = summary.match(
    /^Auto aggregated from (\d+) instance\(s\), (\d+) group\(s\), (\d+) rule\(s\)\.?$/i,
  )
  if (multiMatch) {
    return {
      instances: Number(multiMatch[1]),
      groups: Number(multiMatch[2]),
      rules: Number(multiMatch[3]),
    }
  }

  return null
}

function formatCaseTitle(title: string) {
  const normalized = title.trim()
  return normalized.replace(/^攻击链[:：]\s*/i, "") || normalized
}

export function AttackCaseList({
  items,
  onViewDetail,
  className,
}: AttackCaseListProps) {
  const t = useTranslations("pages.attack.dashboard.cases")

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-16 text-center",
          className,
        )}
      >
        <ShieldCheck className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <section
        className={cn(
          "rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm",
          className,
        )}
      >
        <div className="space-y-3">
          {items.map((item, index) => (
            <CaseRow
              key={item.case_id}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      </section>
    </TooltipProvider>
  )
}

function CaseRow({
  item,
  isFirst,
  isLast,
  onViewDetail,
}: {
  item: AttackCaseTimelineSummary
  isFirst: boolean
  isLast: boolean
  onViewDetail?: (caseId: string) => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const severity = getSeverity(item.severity)
  const techniques = useMemo(
    () => extractTechniques([...(item.tags ?? []), ...(item.rule_ids ?? [])]),
    [item.tags, item.rule_ids],
  )
  const orderedPhases = useMemo(() => buildOrderedPhases(item), [item])
  const title = formatCaseTitle(item.title)
  const autoSummary = matchAutoSummary(item.summary)
  const summary = autoSummary
    ? autoSummary.rules === null
      ? t("summary.autoAcross", {
          instances: autoSummary.instances,
          groups: autoSummary.groups,
        })
      : t("summary.autoMulti", {
          instances: autoSummary.instances,
          groups: autoSummary.groups,
          rules: autoSummary.rules,
        })
    : item.summary
  const metrics: MetricItem[] = [
    {
      key: "rules",
      label: t("metrics.rules"),
      value: item.rule_count,
      icon: ScrollText,
    },
    {
      key: "hosts",
      label: t("metrics.hosts"),
      value: item.host_count,
      icon: Server,
    },
    {
      key: "instances",
      label: t("metrics.instances"),
      value: item.instance_count,
      icon: Bug,
    },
    {
      key: "groups",
      label: t("metrics.groups"),
      value: item.group_count,
      icon: Boxes,
    },
    {
      key: "evidence",
      label: t("metrics.evidence"),
      value: item.evidence_count,
      icon: FileSearch,
    },
  ]
  const clickable = Boolean(onViewDetail)

  return (
    <article className="grid grid-cols-[36px_minmax(0,1fr)] gap-0">
      <div className="relative flex justify-center">
        {!isFirst ? (
          <span className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-slate-200" />
        ) : null}
        {!isLast ? (
          <span className="absolute bottom-0 left-1/2 top-8 w-px -translate-x-1/2 bg-slate-200" />
        ) : null}
        <span
          className={cn(
            "relative mt-5 flex size-4 items-center justify-center rounded-full bg-white ring-4 ring-white",
            severity.dot,
          )}
          aria-hidden="true"
        >
          <span className="size-2 rounded-full bg-white/85" />
        </span>
      </div>

      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={() => onViewDetail?.(item.case_id)}
        onKeyDown={(event) => {
          if (!clickable) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onViewDetail?.(item.case_id)
          }
        }}
        className={cn(
          "min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.045)] outline-none transition-all duration-150",
          clickable &&
            "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] focus-visible:ring-2 focus-visible:ring-primary/25",
        )}
      >
        <div className="min-w-0 space-y-2.5">
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_360px_126px] lg:items-center 2xl:grid-cols-[minmax(0,1fr)_380px_136px]">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
                    severity.badge,
                  )}
                >
                  <ShieldAlert className="size-3.5" />
                  {t(`severity.${severity.labelKey}`)}
                </span>
                <h3
                  className="min-w-0 truncate text-base font-semibold leading-6 text-slate-950"
                  title={title}
                >
                  {title}
                </h3>
              </div>

              <p
                className="mt-1 line-clamp-1 text-sm leading-5 text-slate-600"
                title={summary}
              >
                {summary}
              </p>
            </div>

            <MetricStrip metrics={metrics} />
            <TimeRange
              startTime={item.start_time}
              endTime={item.end_time}
              onViewDetail={onViewDetail ? () => onViewDetail(item.case_id) : undefined}
            />
          </div>

          <div className="grid min-w-0 gap-x-4 gap-y-1.5 rounded-lg bg-slate-50/70 px-3 py-2 lg:grid-cols-[190px_230px_150px_minmax(0,1fr)] lg:items-center">
            <MetaCluster
              icon={Target}
              label={t("labels.caseId")}
            >
              <span
                className="truncate font-mono text-xs text-slate-500"
                title={item.case_id}
              >
                case-{shortenId(item.case_id, 10, 4)}
              </span>
            </MetaCluster>

            <MetaCluster icon={ScrollText} label={t("labels.ruleIds")}>
              <RuleIdsInline ruleIds={item.rule_ids ?? []} />
            </MetaCluster>

            <MetaCluster icon={GitBranch} label={t("labels.stage")}>
              <PhaseChips phases={orderedPhases} />
            </MetaCluster>

            <MetaCluster
              icon={Crosshair}
              label={t("labels.techniques")}
            >
              <TechniqueChips techniques={techniques} />
            </MetaCluster>
          </div>
        </div>
      </div>
    </article>
  )
}

function MetaCluster({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1.5",
        className,
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500">
        <Icon className="size-3.5" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function RuleIdsInline({ ruleIds }: { ruleIds: string[] }) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const visibleRuleIds = ruleIds.slice(0, 2)
  const hiddenRuleIds = ruleIds.slice(2)

  if (ruleIds.length === 0) {
    return <span className="text-sm text-slate-400">-</span>
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {visibleRuleIds.map((ruleId) => (
        <RuleInfoPopover key={ruleId} id={ruleId} side="right">
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="max-w-[132px] truncate rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-xs leading-5 text-blue-700 transition-all duration-150 hover:-translate-y-0.5 hover:bg-blue-100 hover:text-blue-800 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            title={ruleId}
            aria-label={`${t("labels.ruleIds")} ${ruleId}`}
          >
            {shortenId(ruleId, 12, 5)}
          </button>
        </RuleInfoPopover>
      ))}
      {hiddenRuleIds.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs leading-5 text-slate-600">
              +{hiddenRuleIds.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex max-w-[320px] flex-col gap-1 font-mono text-xs">
              {ruleIds.map((ruleId) => (
                <span key={ruleId}>{ruleId}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

function PhaseChips({
  phases,
}: {
  phases: ReturnType<typeof buildOrderedPhases>
}) {
  const stageT = useTranslations("pages.attack.dashboard.stages")
  const visiblePhases = phases.slice(0, 2)
  const extraPhases = phases.slice(2)

  if (phases.length === 0) {
    return <span className="text-sm text-slate-400">-</span>
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {visiblePhases.map((phase) => {
        const label = phase.stageKey
          ? stageT(`${phase.stageKey}.label`)
          : phase.fallbackLabel

        return (
          <span
            key={phase.key}
            className="max-w-[92px] truncate rounded-md bg-slate-50 px-1.5 py-0.5 text-xs font-normal leading-5 text-slate-700"
            title={label}
          >
            {label}
          </span>
        )
      })}
      {extraPhases.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-md bg-slate-100 px-1.5 py-0.5 text-xs leading-5 text-slate-500">
              +{extraPhases.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-0.5 text-xs">
              {extraPhases.map((phase) => (
                <span key={phase.key}>
                  {phase.stageKey
                    ? stageT(`${phase.stageKey}.label`)
                    : phase.fallbackLabel}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

function TechniqueChips({ techniques }: { techniques: string[] }) {
  const visibleTechniques = techniques.slice(0, 5)
  const hiddenTechniques = techniques.slice(5)

  if (techniques.length === 0) {
    return <span className="text-sm text-slate-400">-</span>
  }

  return (
    <div className="flex max-h-[66px] min-w-0 flex-wrap items-center gap-1.5 overflow-hidden">
      {visibleTechniques.map((technique) => (
        <a
          key={technique}
          href={`https://attack.mitre.org/techniques/${technique.replace(".", "/")}/`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="max-w-[96px] truncate rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-xs leading-5 text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
          title={technique}
        >
          {technique}
        </a>
      ))}
      {hiddenTechniques.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs leading-5 text-slate-600">
              +{hiddenTechniques.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="grid max-w-[280px] grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs">
              {techniques.map((technique) => (
                <span key={technique}>{technique}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

function MetricStrip({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div className="grid min-w-0 grid-cols-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
      {metrics.map((metric) => {
        const Icon = metric.icon

        return (
          <div
            key={metric.key}
            className="flex min-w-0 flex-col items-center justify-center gap-1 border-r border-slate-200/80 px-1 py-2 text-center last:border-r-0"
          >
            <span className="flex max-w-full items-center gap-1 truncate text-[11px] leading-4 text-slate-500">
              <Icon className="size-3 shrink-0" />
              <span className="truncate">{metric.label}</span>
            </span>
            <span className="tabular-nums text-sm font-normal leading-5 text-slate-900">
              {metric.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TimeRange({
  startTime,
  endTime,
  onViewDetail,
}: {
  startTime: string
  endTime: string
  onViewDetail?: () => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const title = `${formatFullTime(startTime)} - ${formatFullTime(endTime)}`

  return (
    <div
      className="flex h-full min-w-0 flex-col justify-center rounded-xl border border-slate-200 bg-white px-3 py-2"
      title={title}
    >
      <div className="min-w-0 text-xs leading-5 text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-700">
          <CalendarClock className="size-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{formatShortTime(startTime)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <CircleDot className="size-3.5 shrink-0 text-slate-300" />
          <span className="truncate">{formatShortTime(endTime)}</span>
        </div>
      </div>
      {onViewDetail ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onViewDetail()
          }}
          className="shrink-0 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          {t("viewDetail")}
        </button>
      ) : null}
    </div>
  )
}
