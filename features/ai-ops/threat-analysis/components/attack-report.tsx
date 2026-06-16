"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  Check,
  ChartNoAxesCombined,
  Clock,
  Copy,
  Cpu,
  Crosshair,
  FileText,
  FileWarning,
  GitBranch,
  Globe,
  Hash,
  Lightbulb,
  Link2,
  ListChecks,
  Search,
  Server,
  TerminalSquare,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/shared/lib/utils"
import type {
  AttackAIReport,
  AttackAIReportTask,
  AttackStoryStep,
  AffectedAsset,
  Hypothesis,
  Ioc,
  IocType,
  KeyFinding,
  RecommendedAction,
  ReportValidation,
  Severity,
} from "@/features/ai-ops/threat-analysis/report-types"

type ReportTask = AttackAIReportTask
type ResolvedReportTask = Omit<AttackAIReportTask, "report" | "validation"> & {
  report: AttackAIReport
  validation: ReportValidation | null
}

const severityStyles: Record<Severity, { badge: string; dot: string; text: string }> = {
  critical: {
    badge: "bg-destructive/15 text-destructive border-destructive/40",
    dot: "bg-destructive",
    text: "text-destructive",
  },
  high: {
    badge: "bg-chart-2/15 text-chart-2 border-chart-2/40",
    dot: "bg-chart-2",
    text: "text-chart-2",
  },
  medium: {
    badge: "bg-chart-3/15 text-chart-3 border-chart-3/40",
    dot: "bg-chart-3",
    text: "text-chart-3",
  },
  low: {
    badge: "bg-chart-4/15 text-chart-4 border-chart-4/40",
    dot: "bg-chart-4",
    text: "text-chart-4",
  },
  info: {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
}

const iocIcon: Record<IocType, typeof Globe> = {
  ip: Globe,
  url: Link2,
  hash: Hash,
  md5: Hash,
  sha1: Hash,
  sha256: Hash,
  file: FileWarning,
  process: TerminalSquare,
  domain: Globe,
}

function confidencePct(value: number) {
  return Math.round(value * 100)
}

function parseMaybeJson<T>(value?: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function Section({
  id,
  title,
  icon: Icon,
  count,
  description,
  children,
  className,
}: {
  id?: string
  title: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  count?: number
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {typeof count === "number" ? (
            <span className="font-mono text-sm text-muted-foreground tabular-nums">{count}</span>
          ) : null}
        </div>
      </div>
      {description ? <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {children}
    </section>
  )
}

function CopyButton({
  value,
  className,
  label,
}: {
  value: string
  className?: string
  label: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label}: ${value}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-chart-3" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const s = severityStyles[severity]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        s.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {t(`severity.${severity}`)}
    </span>
  )
}

function EvidenceRefs({ refs }: { refs: string[] }) {
  if (!refs?.length) return null
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <FileText className="h-3.5 w-3.5" aria-hidden />
      {refs.length} {t("evidenceRefs")}
    </span>
  )
}

function ConfidenceMeter({
  value,
  className,
  showLabel = true,
}: {
  value: number
  className?: string
  showLabel?: boolean
}) {
  const pct = confidencePct(value)
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${pct}%` }} />
      </div>
      {showLabel ? <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span> : null}
    </div>
  )
}

function ReportNav() {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const items = [
    { id: "attack-story", label: t("nav.attackStory") },
    { id: "key-findings", label: t("nav.keyFindings") },
    { id: "iocs", label: t("nav.iocs") },
    { id: "assets", label: t("nav.assets") },
    { id: "actions", label: t("nav.actions") },
    { id: "hypotheses", label: t("nav.hypotheses") },
    { id: "limitations", label: t("nav.limitations") },
  ]
  const [active, setActive] = useState(items[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )
    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-8">
        <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("nav.title")}</p>
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block rounded-md border-l-2 px-3 py-1.5 text-sm transition-colors",
                  active === item.id
                    ? "border-primary bg-accent/50 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

function ReportHeader({ task }: { task: ResolvedReportTask }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const { report, validation } = task
  const severity = report.risk_level || "info"
  const s = severityStyles[(severity === "critical" || severity === "high" || severity === "medium" || severity === "low" ? severity : "info")]
  const latencyMs = task.latency_ms ?? 0
  const providerName = task.provider_name || "-"
  const modelName = task.model_name || "-"
  const caseId = report.case_id || task.case_id || "-"

  return (
    <header className="relative overflow-hidden border-b border-border">
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
              <ChartNoAxesCombined className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h1 className="truncate text-lg font-semibold text-slate-950">{t("title")}</h1>
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <span className="text-slate-500">
                  {t("header.riskLabel")}
                  <span className={cn("px-1 font-semibold", s.text)}>{t(`severity.${report.risk_level || "info"}`)}</span>
                  <span className="px-1 text-slate-200">/</span>
                  {t("header.overallConfidence")}
                  <span className="px-1 font-mono font-semibold tabular-nums text-slate-950">{confidencePct(report.confidence ?? 0)}%</span>
                  <span className="px-1 text-slate-200">/</span>
                  {t("header.attackStages")}
                  <span className="px-1 font-mono font-semibold tabular-nums text-slate-950">{report.attack_story.length}</span>
                  <span className="px-1 text-slate-200">/</span>
                  {t("header.threatIndicators")}
                  <span className="px-1 font-mono font-semibold tabular-nums text-slate-950">{report.iocs.length}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:ml-auto">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5 text-primary" aria-hidden />
                {providerName} · {modelName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {(latencyMs / 1000).toFixed(1)}s
              </span>
              {validation?.valid ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-chart-4/40 bg-chart-4/15 px-2 py-1 font-mono text-xs text-chart-4">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  {t("header.validated")} · {validation.checked_refs?.evidence_refs ?? 0} {t("header.references")}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card py-1 pl-2 pr-1 font-mono text-xs text-muted-foreground">
                <Hash className="h-3.5 w-3.5" aria-hidden />
                <span className="text-foreground/80">Case</span>
                <span className="max-w-[12rem] truncate">{caseId}</span>
                <CopyButton value={caseId} className="h-5 w-5 border-0" label={t("header.copy")} />
              </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function ExecutiveSummary({ summary }: { summary: string }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("summary.title")}</h2>
      </div>
      <p className="text-pretty text-base leading-relaxed text-foreground/90">{summary}</p>
    </div>
  )
}

function AttackStory({ steps }: { steps: AttackStoryStep[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  return (
    <Section
      id="attack-story"
      title={t("story.title")}
      icon={GitBranch}
      count={steps.length}
      description={t("story.description")}
    >
      <ol className="relative space-y-4 pl-2">
        {steps.map((step, index) => {
          const s = severityStyles[(step.severity === "critical" || step.severity === "high" || step.severity === "medium" || step.severity === "low" ? step.severity : "info")]
          const isLast = index === steps.length - 1
          return (
            <li key={step.step} className="relative pl-8">
              {!isLast ? <span className="absolute left-[11px] top-7 h-[calc(100%+1rem)] w-px bg-border" aria-hidden /> : null}
              <span
                className={cn(
                  "absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border bg-card font-mono text-xs font-semibold",
                  s.badge,
                )}
              >
                {step.step}
              </span>

              <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <SeverityBadge severity={(step.severity === "critical" || step.severity === "high" || step.severity === "medium" || step.severity === "low" ? step.severity : "info")} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <EvidenceRefs refs={step.evidence_refs} />
                  <ConfidenceMeter value={step.confidence} />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}

function KeyFindings({ findings }: { findings: KeyFinding[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  return (
    <Section
      id="key-findings"
      title={t("findings.title")}
      icon={Search}
      count={findings.length}
      description={t("findings.description")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {findings.map((finding) => (
          <div key={finding.title} className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-snug text-foreground">{finding.title}</h3>
              <SeverityBadge severity={(finding.severity === "critical" || finding.severity === "high" || finding.severity === "medium" || finding.severity === "low" ? finding.severity : "info")} />
            </div>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{finding.reason}</p>
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <ConfidenceMeter value={finding.confidence} />
              <EvidenceRefs refs={finding.evidence_refs} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function IocTable({ iocs }: { iocs: Ioc[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  return (
    <Section
      id="iocs"
      title={t("iocs.title")}
      icon={Crosshair}
      count={iocs.length}
      description={t("iocs.description")}
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden grid-cols-[7rem_1fr_8rem] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:grid">
          <span>{t("iocHeaders.type")}</span>
          <span>{t("iocHeaders.value")}</span>
          <span>{t("iocHeaders.source")}</span>
        </div>
        <ul className="divide-y divide-border">
          {iocs.map((ioc, index) => {
            const Icon = iocIcon[ioc.type] || Globe
            return (
              <li key={`${ioc.type}-${index}`} className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-accent/40 md:grid-cols-[7rem_1fr_8rem] md:items-center md:gap-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="text-xs font-medium text-foreground">{t(`iocType.${ioc.type}`)}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <code className="truncate rounded bg-muted/60 px-2 py-1 font-mono text-xs text-foreground/90">{ioc.value}</code>
                  <CopyButton value={ioc.value} className="h-7 w-7" label={t("header.copy")} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{ioc.source}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

function AffectedAssets({ assets }: { assets: AffectedAsset[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  return (
    <Section
      id="assets"
      title={t("assets.title")}
      icon={Server}
      count={assets.length}
      description={t("assets.description")}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {assets.map((asset) => (
          <div key={asset.agent_id} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/15 text-destructive">
                <Server className="h-6 w-6" aria-hidden />
              </div>
              <span className="rounded-md border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-destructive">
                {t("assets.compromised")}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-semibold uppercase tracking-wide text-foreground">{asset.asset_type}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agent</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground/90">{asset.agent_id}</code>
                <CopyButton value={asset.agent_id} label={t("header.copy")} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{asset.impact}</p>
              <div className="mt-3 border-t border-border pt-3">
                <EvidenceRefs refs={asset.evidence_refs} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function RecommendedActions({ actions }: { actions: RecommendedAction[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const sorted = [...actions].sort((a, b) => a.priority - b.priority)
  return (
    <Section
      id="actions"
      title={t("actions.title")}
      icon={ListChecks}
      count={actions.length}
      description={t("actions.description")}
    >
      <ol className="space-y-3">
        {sorted.map((action) => (
          <li key={action.priority} className="flex gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">
                {action.priority}
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("actions.priority")}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{action.detail}</p>
              <div className="mt-3">
                <EvidenceRefs refs={action.evidence_refs} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function HypothesesAndLimitations({ hypotheses, limitations }: { hypotheses: Hypothesis[]; limitations: string[] }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  return (
    <>
      <Section
        id="hypotheses"
        title={t("hypotheses.title")}
        icon={Lightbulb}
        count={hypotheses.length}
        description={t("hypotheses.description")}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {hypotheses.map((hypothesis) => (
            <div key={hypothesis.title} className="rounded-lg border border-dashed border-border bg-card/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{hypothesis.title}</h3>
                <ConfidenceMeter value={hypothesis.confidence} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hypothesis.detail}</p>
              <div className="mt-3 border-t border-border pt-3">
                <EvidenceRefs refs={hypothesis.evidence_refs} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="limitations"
        title={t("limitations.title")}
        icon={AlertCircle}
        count={limitations.length}
        description={t("limitations.description")}
      >
        <ul className="space-y-2 rounded-lg border border-border bg-card p-4">
          {limitations.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}

function ReportBody({ report }: { report: AttackAIReport }) {
  return (
    <div className="min-w-0 space-y-10">
      <ExecutiveSummary summary={report.executive_summary || "-"} />
      <AttackStory steps={report.attack_story} />
      <KeyFindings findings={report.key_findings} />
      <IocTable iocs={report.iocs} />
      <AffectedAssets assets={report.affected_assets} />
      <RecommendedActions actions={report.recommended_actions} />
      <HypothesesAndLimitations hypotheses={report.hypotheses} limitations={report.limitations} />
    </div>
  )
}

export function AttackReport({ task }: { task: ReportTask }) {
  const report = task.report ?? parseMaybeJson<AttackAIReport>(task.report_json)
  const validation = task.validation ?? parseMaybeJson(task.validation_json) ?? null

  if (!report) {
    return (
      <article className="mx-auto w-full max-w-[120rem]">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            No report data.
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="mx-auto w-full max-w-[120rem]">
      <ReportHeader task={{ ...task, report, validation }} />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:px-8 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <ReportNav />
        <ReportBody report={report} />
      </div>
    </article>
  )
}

export default AttackReport
