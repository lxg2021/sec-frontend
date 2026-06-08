"use client"

import { useMemo, type ComponentType } from "react"
import { useTranslations } from "next-intl"
import {
  Boxes,
  Bug,
  CalendarClock,
  Crosshair,
  FileSearch,
  GitBranch,
  ScrollText,
  Server,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import { resolveAttckStage } from "@/features/attack/constants/attck-stages"
import type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"

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

const TABLE_GRID =
  "lg:grid-cols-[96px_minmax(200px,0.95fr)_minmax(112px,0.48fr)_minmax(140px,0.58fr)_180px_70px_70px_86px_86px_86px_124px]"

function HeaderCell({
  icon: Icon,
  label,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  className?: string
}) {
  return (
    <span className={cn("flex items-center gap-1.5 whitespace-nowrap", className)}>
      <Icon className="size-3.5 text-muted-foreground/70" />
      <span>{label}</span>
    </span>
  )
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
  )}:${pad(d.getMinutes())}`
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
          "overflow-hidden rounded-2xl border border-border bg-card",
          className,
        )}
      >
        <div
          className={cn(
            "hidden min-h-11 items-center gap-3 border-b border-border bg-muted/20 px-5 text-sm font-semibold text-muted-foreground lg:grid",
            TABLE_GRID,
          )}
        >
          <HeaderCell
            icon={ShieldAlert}
            label={t("columns.risk")}
          />
          <HeaderCell
            icon={Target}
            label={t("columns.scene")}
          />
          <HeaderCell
            icon={GitBranch}
            label={t("columns.stage")}
          />
          <HeaderCell
            icon={Crosshair}
            label={t("columns.technique")}
          />
          <HeaderCell
            icon={ScrollText}
            label={t("columns.ruleIds")}
            className="justify-center"
          />
          <HeaderCell
            icon={ScrollText}
            label={t("metrics.rules")}
            className="justify-center"
          />
          <HeaderCell
            icon={Server}
            label={t("metrics.hosts")}
            className="justify-center"
          />
          <HeaderCell
            icon={Bug}
            label={t("metrics.instances")}
            className="justify-center"
          />
          <HeaderCell
            icon={Boxes}
            label={t("metrics.groups")}
            className="justify-center"
          />
          <HeaderCell
            icon={FileSearch}
            label={t("metrics.evidence")}
            className="justify-center"
          />
          <HeaderCell
            icon={CalendarClock}
            label={t("columns.timeRange")}
            className="justify-center"
          />
        </div>

        <div className="divide-y divide-border">
          {items.map((item) => (
            <CaseRow
              key={item.case_id}
              item={item}
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
  onViewDetail,
}: {
  item: AttackCaseTimelineSummary
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

  const clickable = Boolean(onViewDetail)

  return (
    <article
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
        "grid min-h-[100px] gap-3 px-5 py-4 outline-none transition-colors lg:items-center",
        TABLE_GRID,
        clickable &&
          "cursor-pointer hover:bg-muted/25 focus-visible:bg-muted/25 focus-visible:ring-2 focus-visible:ring-primary/25",
      )}
    >
      <div>
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
            severity.badge,
          )}
        >
          <ShieldCheck className="size-3.5" />
          {t(`severity.${severity.labelKey}`)}
        </span>
      </div>

      <div className="min-w-0">
        <h3
          className="truncate text-base font-semibold leading-6 text-foreground"
          title={title}
        >
          {title}
        </h3>
        <p
          className="mt-0.5 line-clamp-1 text-sm leading-5 text-muted-foreground"
          title={summary}
        >
          {summary}
        </p>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground/55">
          case-{shortenId(item.case_id, 10, 4)}
        </p>
      </div>

      <PhaseChips phases={orderedPhases} />
      <TechniqueChips techniques={techniques} />

      <RuleIdsCell ruleIds={item.rule_ids ?? []} />
      <CountCell value={item.rule_count} label={t("metrics.rules")} />
      <CountCell value={item.host_count} label={t("metrics.hosts")} />
      <CountCell value={item.instance_count} label={t("metrics.instances")} />
      <CountCell value={item.group_count} label={t("metrics.groups")} />
      <CountCell value={item.evidence_count} label={t("metrics.evidence")} />

      <div
        className="min-w-0 text-center text-sm leading-5 text-muted-foreground"
        title={`${formatFullTime(item.start_time)} - ${formatFullTime(item.end_time)}`}
      >
        <div className="truncate text-foreground/75">
          {formatShortTime(item.start_time)}
        </div>
        <div className="truncate text-muted-foreground/70">
          {formatShortTime(item.end_time)}
        </div>
      </div>
    </article>
  )
}

function RuleIdsCell({ ruleIds }: { ruleIds: string[] }) {
  const visibleRuleId = ruleIds[0]
  const extraRuleIds = ruleIds.slice(1)

  if (!visibleRuleId) {
    return <span className="text-center text-sm text-muted-foreground/60">-</span>
  }

  return (
    <div className="flex min-w-0 items-center justify-center gap-1.5">
      <span
        className="max-w-[154px] truncate font-mono text-xs text-muted-foreground"
        title={visibleRuleId}
      >
        {shortenId(visibleRuleId, 12, 6)}
      </span>
      {extraRuleIds.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              +{extraRuleIds.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-0.5 font-mono text-xs">
              {extraRuleIds.map((ruleId) => (
                <span key={ruleId}>{ruleId}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
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

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {visiblePhases.map((phase, index) => (
        <span
          key={phase.key}
          className={cn(
            "max-w-[88px] truncate rounded-md px-2 py-0.5 text-xs font-normal",
            index === 0
              ? "bg-muted text-foreground"
              : "bg-muted/70 text-muted-foreground",
          )}
          title={
            phase.stageKey
              ? stageT(`${phase.stageKey}.label`)
              : phase.fallbackLabel
          }
        >
          {phase.stageKey
            ? stageT(`${phase.stageKey}.label`)
            : phase.fallbackLabel}
        </span>
      ))}
      {extraPhases.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
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
      )}
    </div>
  )
}

function TechniqueChips({ techniques }: { techniques: string[] }) {
  const visibleTechniques = techniques.length > 3 ? techniques.slice(0, 2) : techniques
  const hiddenTechniques = techniques.slice(visibleTechniques.length)

  if (techniques.length === 0) {
    return <span className="text-sm text-muted-foreground/60">-</span>
  }

  return (
    <div className="grid min-w-0 grid-cols-1 justify-items-start gap-1">
      {visibleTechniques.map((technique) => (
        <a
          key={technique}
          href={`https://attack.mitre.org/techniques/${technique.replace(".", "/")}/`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="max-w-[118px] truncate rounded-md border border-technique/30 bg-technique/10 px-1.5 py-0.5 font-mono text-xs leading-4 text-technique transition-colors hover:bg-technique/20"
          title={technique}
        >
          {technique}
        </a>
      ))}
      {hiddenTechniques.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-md bg-muted px-1.5 py-0.5 text-xs leading-4 text-muted-foreground">
              +{hiddenTechniques.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-0.5 font-mono text-xs">
              {techniques.map((technique) => (
                <span key={technique}>{technique}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

function CountCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 lg:block lg:text-center">
      <span className="text-xs text-muted-foreground lg:hidden">{label}</span>
      <span className="tabular-nums text-base font-normal leading-none text-foreground">
        {value}
      </span>
    </div>
  )
}
