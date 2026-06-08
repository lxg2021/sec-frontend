"use client"

import { useMemo, type ComponentType } from "react"
import { useTranslations } from "next-intl"
import {
  ArrowRight,
  Boxes,
  Bug,
  ChevronRight,
  FileSearch,
  Server,
  ShieldCheck,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
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
    text: string
    bar: string
    badge: string
  }
> = {
  critical: {
    labelKey: "critical",
    dot: "bg-severity-critical",
    text: "text-severity-critical",
    bar: "bg-severity-critical",
    badge: "bg-severity-critical/10 text-severity-critical",
  },
  high: {
    labelKey: "high",
    dot: "bg-severity-high",
    text: "text-severity-high",
    bar: "bg-severity-high",
    badge: "bg-severity-high/10 text-severity-high",
  },
  medium: {
    labelKey: "medium",
    dot: "bg-severity-medium",
    text: "text-severity-medium",
    bar: "bg-severity-medium",
    badge: "bg-severity-medium/10 text-severity-medium",
  },
  low: {
    labelKey: "low",
    dot: "bg-severity-low",
    text: "text-severity-low",
    bar: "bg-severity-low",
    badge: "bg-severity-low/10 text-severity-low",
  },
}

function getSeverity(severity: string) {
  return (
    SEVERITY_MAP[severity?.toLowerCase()] ?? {
      labelKey: "unknown",
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
      bar: "bg-border",
      badge: "bg-muted text-muted-foreground",
    }
  )
}

function formatTime(value: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
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
        raw: phase,
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

function Metric({
  value,
  label,
  icon: Icon,
}: {
  value: number
  label: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground/70" />
      <div className="flex items-baseline gap-1">
        <span className="tabular-nums text-sm font-semibold text-foreground">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
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
      <div className={cn("flex flex-col gap-3", className)}>
        {items.map((item) => (
          <CaseCard key={item.case_id} item={item} onViewDetail={onViewDetail} />
        ))}
      </div>
    </TooltipProvider>
  )
}

function CaseCard({
  item,
  onViewDetail,
}: {
  item: AttackCaseTimelineSummary
  onViewDetail?: (caseId: string) => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const stageT = useTranslations("pages.attack.dashboard.stages")
  const severity = getSeverity(item.severity)
  const techniques = useMemo(() => extractTechniques([...item.tags, ...item.rule_ids]), [item.tags, item.rule_ids])

  const visibleTechniques = techniques.slice(0, 4)
  const extraTechniques = techniques.slice(4)

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

  return (
    <article
      className="group relative flex overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/15 hover:shadow-sm"
    >
      <div className={cn("w-1 shrink-0", severity.bar)} aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  severity.badge,
                )}
              >
                <span className={cn("size-1.5 rounded-full", severity.dot)} />
                {t(`severity.${severity.labelKey}`)}
              </span>
              <span className="font-mono text-xs text-muted-foreground/70">
                {item.case_id}
              </span>
            </div>
            <h3 className="text-pretty text-base font-semibold leading-snug text-foreground">
              {title}
            </h3>
            <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </div>

          <div className="hidden shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">
              {formatTime(item.start_time)}
            </span>
            <span className="flex items-center gap-1">
              <ArrowRight className="size-3" />
              {formatTime(item.end_time)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {orderedPhases.map((phase, idx) => (
            <div key={phase.key} className="flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight className="size-3 text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  idx === 0
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {phase.stageKey ? stageT(`${phase.stageKey}.label`) : phase.fallbackLabel}
              </span>
            </div>
          ))}
        </div>

        {techniques.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground/70">ATT&CK</span>
            {visibleTechniques.map((technique) => (
              <a
                key={technique}
                href={`https://attack.mitre.org/techniques/${technique.replace(".", "/")}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-technique/30 bg-technique/10 px-1.5 py-0.5 font-mono text-xs text-technique transition-colors hover:bg-technique/20"
              >
                {technique}
              </a>
            ))}
            {extraTechniques.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    +{extraTechniques.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col gap-0.5 font-mono text-xs">
                    {extraTechniques.map((technique) => (
                      <span key={technique}>{technique}</span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        <div className="border-t border-border/60" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <RuleMetric item={item} />
            <HostMetric item={item} />
            <Metric value={item.instance_count} label={t("metrics.instances")} icon={Bug} />
            <Metric value={item.group_count} label={t("metrics.groups")} icon={Boxes} />
            <Metric
              value={item.evidence_count}
              label={t("metrics.evidence")}
              icon={FileSearch}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 text-muted-foreground hover:text-foreground"
            onClick={() => onViewDetail?.(item.case_id)}
          >
            {t("viewDetail")}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}

function RuleMetric({ item }: { item: AttackCaseTimelineSummary }) {
  const t = useTranslations("pages.attack.dashboard.cases")

  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className="size-4 text-muted-foreground/70" />
      <div className="flex items-baseline gap-1">
        <span className="tabular-nums text-sm font-semibold text-foreground">
          {item.rule_count}
        </span>
        <span className="text-xs text-muted-foreground">{t("metrics.rules")}</span>
      </div>
      {item.rule_ids[0] && (
        <span className="font-mono text-xs text-muted-foreground/80">
          {item.rule_ids[0]}
        </span>
      )}
      {item.rule_ids.length > 1 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              +{item.rule_ids.length - 1}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-0.5 font-mono text-xs">
              {item.rule_ids.slice(1).map((id) => (
                <span key={id}>{id}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

function HostMetric({ item }: { item: AttackCaseTimelineSummary }) {
  const t = useTranslations("pages.attack.dashboard.cases")

  return (
    <div className="flex items-center gap-2">
      <Server className="size-4 text-muted-foreground/70" />
      <div className="flex items-baseline gap-1">
        <span className="tabular-nums text-sm font-semibold text-foreground">
          {item.host_count}
        </span>
        <span className="text-xs text-muted-foreground">{t("metrics.hosts")}</span>
      </div>
      {item.agent_ids[0] && (
        <span className="max-w-[120px] truncate font-mono text-xs text-muted-foreground/80">
          {item.agent_ids[0]}
        </span>
      )}
      {item.agent_ids.length > 1 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              +{item.agent_ids.length - 1}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-0.5 font-mono text-xs">
              {item.agent_ids.slice(1).map((id) => (
                <span key={id}>{id}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
