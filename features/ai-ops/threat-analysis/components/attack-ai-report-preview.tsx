"use client"

import { useMemo } from "react"
import {
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  Clock3,
  Hash,
  ListChecks,
  LucideIcon,
  Package,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  TriangleAlert,
  Workflow,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { cn } from "@/shared/lib/utils"
import type {
  AttackAIReport,
  AttackAIReportTask,
  AttackStoryStep,
  AffectedAsset,
  Hypothesis,
  Ioc,
  KeyFinding,
  RecommendedAction,
  ReportValidation,
  Severity as ReportSeverity,
} from "@/features/ai-ops/threat-analysis/report-types"

const SEVERITY_META: Record<ReportSeverity | "unknown", { labelKey: string; className: string; icon: LucideIcon }> = {
  critical: { labelKey: "severity.critical", className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300", icon: TriangleAlert },
  high: { labelKey: "severity.high", className: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300", icon: AlertTriangle },
  medium: { labelKey: "severity.medium", className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300", icon: ShieldAlert },
  low: { labelKey: "severity.low", className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300", icon: ShieldCheck },
  info: { labelKey: "severity.info", className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300", icon: ShieldAlert },
  unknown: { labelKey: "severity.unknown", className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300", icon: ShieldAlert },
}

function toSeverityMeta(value?: string) {
  return SEVERITY_META[(value?.toLowerCase() as ReportSeverity | "unknown") || "unknown"] ?? SEVERITY_META.unknown
}

function confidenceText(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-"
  return `${Math.round(value * 100)}%`
}

function parseMaybeJson<T>(value?: string): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
        {description ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</div> : null}
      </div>
    </div>
  )
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{value}</div>
    </div>
  )
}

function TextBlock({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{text}</p>
}

function ReferencePills({ refs, kind }: { refs: string[]; kind: "evidence" | "rule" }) {
  if (!refs.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {refs.map((ref) => (
        <span
          key={ref}
          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
        >
          {kind === "evidence" ? "E" : "R"} {ref.slice(0, 10)}
        </span>
      ))}
    </div>
  )
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0 dark:border-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-sm text-slate-800 dark:text-slate-200">{value}</div>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  description,
  children,
  className,
}: {
  title: string
  icon: LucideIcon
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}>
      <CardHeader className="space-y-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <SectionTitle icon={icon} title={title} description={description} />
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}

function TaskStatusBadge({ status }: { status: string }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const normalized = status.trim().toLowerCase()
  const map: Record<string, { labelKey: string; className: string }> = {
    succeeded: { labelKey: "status.succeeded", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300" },
    pending: { labelKey: "status.pending", className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300" },
    running: { labelKey: "status.running", className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300" },
    failed: { labelKey: "status.failed", className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300" },
    invalid: { labelKey: "status.invalid", className: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300" },
  }
  const meta = map[normalized] ?? { labelKey: "status.unknown", className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300" }
  return <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", meta.className)}>{status ? t(meta.labelKey) : t("status.unknown")}</Badge>
}

function JsonStatusCard({ validation }: { validation: ReportValidation | null }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const checked = validation?.checked_refs
  const errors = validation?.errors ?? []
  const warnings = validation?.warnings ?? []

  return (
    <SectionCard
      title={t("validation.title")}
      icon={ShieldCheck}
      description={t("validation.description")}
      className="h-full"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetaBadge label={t("fields.status")} value={validation?.status || "-"} />
          <MetaBadge label={t("fields.valid")} value={validation?.valid ? "true" : "false"} />
          <MetaBadge label={t("fields.evidenceRefs")} value={String(checked?.evidence_refs ?? 0)} />
          <MetaBadge label={t("fields.observables")} value={String(checked?.observables ?? 0)} />
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t("validation.errors")}</div>
            <div className="space-y-2">
              {errors.length ? errors.map((item, index) => (
                <div key={`${item.code || "error"}-${index}`} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  <div className="font-medium">{item.message || item.code || t("validation.error")}</div>
                  {item.field ? <div className="mt-1 text-xs opacity-80">{item.field}</div> : null}
                </div>
              )) : <div className="text-sm text-slate-500 dark:text-slate-400">{t("empty.none")}</div>}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t("validation.warnings")}</div>
            <div className="space-y-2">
              {warnings.length ? warnings.map((item, index) => (
                <div key={`${item.code || "warning"}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                  <div className="font-medium">{item.message || item.code || t("validation.warning")}</div>
                  {item.field ? <div className="mt-1 text-xs opacity-80">{item.field}</div> : null}
                </div>
              )) : <div className="text-sm text-slate-500 dark:text-slate-400">{t("empty.none")}</div>}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function TimelineStepCard({ step }: { step: AttackStoryStep }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const meta = toSeverityMeta(step.severity)
  const Icon = meta.icon

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold", meta.className)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("fields.step")} {step.step}</span>
            <Badge variant="outline" className={cn("rounded-full text-[11px]", meta.className)}>{t(meta.labelKey)}</Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("fields.confidence")} {confidenceText(step.confidence)}</span>
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{step.title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.detail}</div>
          <div className="mt-3 space-y-2">
            <ReferencePills refs={step.evidence_refs} kind="evidence" />
            <ReferencePills refs={step.rule_refs} kind="rule" />
          </div>
        </div>
      </div>
    </div>
  )
}

function IocGroup({ iocs }: { iocs: Ioc[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, Ioc[]>()
    for (const ioc of iocs) {
      const key = ioc.type || "unknown"
      map.set(key, [...(map.get(key) || []), ioc])
    }
    return Array.from(map.entries())
  }, [iocs])

  return (
    <div className="space-y-4">
      {grouped.map(([type, items]) => (
        <div key={type} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4 text-sky-500" />
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{type.toUpperCase()}</div>
            <Badge variant="outline" className="rounded-full">{items.length}</Badge>
          </div>
          <div className="space-y-3">
            {items.map((ioc, index) => (
              <div key={`${ioc.type}-${ioc.value}-${index}`} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-all text-sm font-medium text-slate-900 dark:text-white">{ioc.value}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ioc.source}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ReferencePills refs={ioc.evidence_refs} kind="evidence" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AttackAIReportPreview({ task }: { task: AttackAIReportTask }) {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const report = task.report ?? parseMaybeJson<AttackAIReport>(task.report_json)
  const validation = task.validation ?? parseMaybeJson<ReportValidation>(task.validation_json)
  const story = report?.attack_story ?? []
  const findings = report?.key_findings ?? []
  const iocs = report?.iocs ?? []
  const affectedAssets = report?.affected_assets ?? []
  const actions = report?.recommended_actions ?? []
  const hypotheses = report?.hypotheses ?? []
  const limitations = report?.limitations ?? []
  const severityMeta = toSeverityMeta(report?.risk_level)
  const SeverityIcon = severityMeta.icon
  const hasReport = Boolean(report)

  if (!hasReport) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {t("empty.noReport")}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="space-y-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("rounded-full", severityMeta.className)}>
              <SeverityIcon className="mr-1 h-3.5 w-3.5" />
              {t(severityMeta.labelKey)}
            </Badge>
            <Badge variant="outline" className="rounded-full">{t("fields.confidence")} {confidenceText(report?.confidence)}</Badge>
            <Badge variant="outline" className="rounded-full">{task.provider_name || "mock"}</Badge>
            <Badge variant="outline" className="rounded-full">{task.model_name || "-"}</Badge>
          </div>
          <CardTitle className="text-2xl text-slate-900 dark:text-white">{t("title")}</CardTitle>
          <CardDescription className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            {t("description", { caseId: report?.case_id || task.case_id })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetaBadge label={t("fields.taskId")} value={task.task_id} />
            <MetaBadge label={t("fields.status")} value={task.status} />
            <MetaBadge label={t("fields.contextHash")} value={task.context_hash || report?.context_hash || "-"} />
            <MetaBadge label={t("fields.latency")} value={task.latency_ms ? `${task.latency_ms} ms` : "-"} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <TextBlock text={report?.executive_summary || "-"} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="story" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 xl:grid-cols-8">
          <TabsTrigger value="story">{t("tabs.story")}</TabsTrigger>
          <TabsTrigger value="findings">{t("tabs.findings")}</TabsTrigger>
          <TabsTrigger value="iocs">{t("tabs.iocs")}</TabsTrigger>
          <TabsTrigger value="assets">{t("tabs.assets")}</TabsTrigger>
          <TabsTrigger value="actions">{t("tabs.actions")}</TabsTrigger>
          <TabsTrigger value="hypotheses">{t("tabs.hypotheses")}</TabsTrigger>
          <TabsTrigger value="limitations">{t("tabs.limitations")}</TabsTrigger>
          <TabsTrigger value="validation">{t("tabs.validation")}</TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="space-y-4">
          <SectionCard title={t("story.title")} icon={Workflow} description={t("story.description")}>
            <div className="space-y-3">
              {story.length ? story.map((step) => <TimelineStepCard key={step.step} step={step} />) : <div className="text-sm text-slate-500">{t("empty.noStory")}</div>}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="findings">
          <SectionCard title={t("findings.title")} icon={ClipboardList} description={t("findings.description")}>
            <div className="space-y-3">
              {findings.length ? findings.map((item, index) => {
                const meta = toSeverityMeta(item.severity)
                return (
                  <div key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("rounded-full", meta.className)}>{t(meta.labelKey)}</Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t("fields.confidence")} {confidenceText(item.confidence)}</span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.reason}</div>
                    <div className="mt-3 space-y-2">
                      <ReferencePills refs={item.evidence_refs} kind="evidence" />
                      <ReferencePills refs={item.rule_refs} kind="rule" />
                    </div>
                  </div>
                )
              }) : <div className="text-sm text-slate-500">{t("empty.noFindings")}</div>}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="iocs">
          <SectionCard title={t("iocs.title")} icon={Hash} description={t("iocs.description")}>
            <IocGroup iocs={iocs} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="assets">
          <SectionCard title={t("assets.title")} icon={Package} description={t("assets.description")}>
            <div className="space-y-3">
              {affectedAssets.length ? affectedAssets.map((asset, index) => (
                <div key={`${asset.agent_id}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full">{asset.asset_type || "asset"}</Badge>
                    <Badge variant="outline" className="rounded-full">{asset.agent_id}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{asset.impact}</div>
                  <div className="mt-3"><ReferencePills refs={asset.evidence_refs} kind="evidence" /></div>
                </div>
              )) : <div className="text-sm text-slate-500">{t("empty.noAssets")}</div>}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="actions">
          <SectionCard title={t("actions.title")} icon={ListChecks} description={t("actions.description")}>
            <div className="space-y-3">
              {actions.length ? actions
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((action) => (
                  <div key={`${action.priority}-${action.title}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full">P{action.priority}</Badge>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{action.title}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{action.detail}</div>
                    <div className="mt-3"><ReferencePills refs={action.evidence_refs} kind="evidence" /></div>
                  </div>
                )) : <div className="text-sm text-slate-500">{t("empty.noActions")}</div>}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="hypotheses">
          <SectionCard title={t("hypotheses.title")} icon={TimerReset} description={t("hypotheses.description")}>
            <div className="space-y-3">
              {hypotheses.length ? hypotheses.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">{t("fields.confidence")} {confidenceText(item.confidence)}</Badge>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.detail}</div>
                  <div className="mt-3"><ReferencePills refs={item.evidence_refs} kind="evidence" /></div>
                </div>
              )) : <div className="text-sm text-slate-500">{t("empty.noHypotheses")}</div>}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="limitations">
          <SectionCard title={t("limitations.title")} icon={TriangleAlert} description={t("limitations.description")}>
            <ul className="space-y-2">
              {limitations.length ? limitations.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              )) : <li className="text-sm text-slate-500">{t("empty.noLimitations")}</li>}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="validation">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <JsonStatusCard validation={validation} />
            <SectionCard title={t("metadata.title")} icon={Clock3} description={t("metadata.description")}>
              <div className="space-y-1">
                <KeyValueRow label={t("fields.provider")} value={task.provider_name || "-"} />
                <KeyValueRow label={t("fields.model")} value={task.model_name || "-"} />
                <KeyValueRow label={t("fields.created")} value={task.created_at || "-"} />
                <KeyValueRow label={t("fields.updated")} value={task.updated_at || "-"} />
                <KeyValueRow label={t("fields.started")} value={task.started_at || "-"} />
                <KeyValueRow label={t("fields.finished")} value={task.finished_at || "-"} />
                <KeyValueRow label={t("fields.error")} value={task.error_message || "-"} />
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AttackAIReportPreview
