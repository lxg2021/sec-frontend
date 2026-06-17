"use client"

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Bug,
  CalendarClock,
  Check,
  CircleDot,
  Copy,
  Crosshair,
  BrainCircuit,
  ExternalLink,
  FileText,
  FileSearch,
  GitBranch,
  Loader2,
  Route,
  ScrollText,
  Server,
  ShieldAlert,
  Target,
} from "lucide-react"

import {
  fetchAttackRuleDetail,
  updateAttackCaseFriendlyName,
} from "@/features/attack/dashboard/api"
import type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"
import type { AttackRuleMeta } from "@/features/attack/utils/attck-utils"
import { RuleInfoPopover } from "@/features/baseline/rules/components/rule-info-popover"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
import { Textarea } from "@/shared/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import { toast } from "@/shared/hooks/use-toast"
import {
  buildOrderedPhases,
  copyText,
  extractTechniques,
  formatCaseTitle,
  formatFullTime,
  getSeverity,
  isNestedInteractiveTarget,
  matchAutoSummary,
} from "../utils/attack-case-format"

type MetricItem = {
  key: string
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  iconClassName: string
  content?: ReactNode
}
export function AttackCaseRow({
  item,
  snapshotId,
  selected,
  onSelect,
  onViewDetail,
  onAIAnalysis,
  onCaseUpdated,
}: {
  item: AttackCaseTimelineSummary
  snapshotId?: string
  selected?: boolean
  onSelect?: (caseId: string) => void
  onViewDetail?: (caseId: string) => void
  onAIAnalysis?: (caseId: string) => void
  onCaseUpdated?: (item: AttackCaseTimelineSummary) => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const locale = useLocale()
  const isEnglish = locale.toLowerCase().startsWith("en")
  const severity = getSeverity(item.severity)
  const techniques = useMemo(
    () => {
      const explicitTechniques = extractTechniques(item.attack_techniques ?? [])
      return explicitTechniques.length > 0
        ? explicitTechniques
        : extractTechniques([...(item.tags ?? []), ...(item.rule_ids ?? [])])
    },
    [item.attack_techniques, item.tags, item.rule_ids],
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
      iconClassName: "text-slate-400",
      content: (
        <RuleCountValue
          count={item.rule_count}
          ruleIds={item.rule_ids}
          snapshotId={snapshotId}
        />
      ),
    },
    {
      key: "hosts",
      label: t("metrics.hosts"),
      value: item.host_count,
      icon: Server,
      iconClassName: "text-slate-400",
    },
    {
      key: "instances",
      label: t("metrics.instances"),
      value: item.instance_count,
      icon: Bug,
      iconClassName: "text-slate-400",
    },
    {
      key: "evidence",
      label: t("metrics.evidence"),
      value: item.evidence_count,
      icon: FileSearch,
      iconClassName: "text-slate-400",
    },
  ]
  const clickable = true

  return (
    <article data-attack-case-id={item.case_id}>
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-selected={selected || undefined}
        onClick={() => onSelect?.(item.case_id)}
        onDoubleClick={(event) => {
          if (!clickable || isNestedInteractiveTarget(event.target, event.currentTarget)) return
          event.preventDefault()
          onViewDetail?.(item.case_id)
        }}
        onKeyDown={(event) => {
          if (!clickable) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onSelect?.(item.case_id)
          }
        }}
        className={cn(
          "group/case-row relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.045)] outline-none hover:shadow-[0_16px_32px_rgba(15,23,42,0.10)]",
          clickable && "cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-300",
          selected && severity.selected,
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full opacity-0",
            selected && severity.selectedMarker,
            selected && "opacity-100",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-2">
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(294px,1fr)_352px_max-content_max-content] lg:items-center 2xl:grid-cols-[minmax(0,1fr)_416px_max-content_max-content]">
            <div className="min-w-0 self-start">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <span
                  className={cn(
                    "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
                    severity.badge,
                  )}
                >
                  <ShieldAlert className="size-3.5" />
                  {t(`severity.${severity.labelKey}`)}
                </span>
                <h3 className="w-[220px] shrink-0 leading-6 2xl:w-[520px]">
                  <CaseTitleEditor
                    item={item}
                    title={title}
                    onCaseUpdated={onCaseUpdated}
                  />
                </h3>
              </div>

              <CaseSummaryEditor
                item={item}
                summary={summary}
                onCaseUpdated={onCaseUpdated}
              />
            </div>

            <MetricStrip metrics={metrics} />
            <TimeRange
              startTime={item.start_time}
              endTime={item.end_time}
            />
            <div className="flex shrink-0 items-center justify-end gap-1.5">
              <CaseAIAnalysisAction
                disabled={!onAIAnalysis}
                onClick={() => onAIAnalysis?.(item.case_id)}
              />
              <CaseTraceAction
                disabled={!onViewDetail}
                onClick={() => onViewDetail?.(item.case_id)}
              />
            </div>
          </div>

          <div className="grid min-w-0 gap-x-4 gap-y-1.5 rounded-lg bg-slate-50/70 py-1.5 pl-2 pr-3 lg:grid-cols-[max-content_max-content_minmax(0,1fr)] lg:items-center">
            <MetaCluster
              icon={Target}
              label={t("labels.caseId")}
              labelClassName={isEnglish ? "w-20" : undefined}
            >
              <CaseIdPill value={item.case_id} />
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

function CaseIdPill({ value }: { value: string }) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    await copyText(value)
    setCopied(true)
  }

  return (
    <span
      className="group inline-flex max-w-full items-center gap-1.5 rounded-md bg-indigo-50/80 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-100/80 transition-colors hover:bg-indigo-100/80"
      title={value}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="min-w-0 select-all whitespace-nowrap font-mono text-xs leading-5 text-indigo-700">
        {value}
      </span>
      <button
        type="button"
        aria-label={copied ? t("copiedCaseId") : t("copyCaseId")}
        title={copied ? t("copiedCaseId") : t("copyCaseId")}
        onClick={handleCopy}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded text-indigo-500 transition-all hover:bg-white/80 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  )
}

function CaseTitleEditor({
  item,
  title,
  onCaseUpdated,
}: {
  item: AttackCaseTimelineSummary
  title: string
  onCaseUpdated?: (item: AttackCaseTimelineSummary) => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(title)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setDraft(title)
    }
  }, [open, title])

  async function handleSave() {
    const nextTitle = draft.trim()
    if (!nextTitle || saving) return

    setSaving(true)
    try {
      const nextItem =
        (await updateAttackCaseFriendlyName({
          caseId: item.case_id,
          title: nextTitle,
        })) ?? null

      onCaseUpdated?.({
        ...item,
        title: nextItem?.title || nextTitle,
      })
      setOpen(false)
      toast({ title: t("titleEdit.saveSuccess") })
    } catch (error) {
      toast({
        title: t("titleEdit.saveFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="block w-full truncate text-left text-base font-semibold leading-6 text-slate-950 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          title={title}
          onClick={(event) => event.stopPropagation()}
        >
          {title || "-"}
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-xl gap-4 rounded-2xl border-slate-200 p-0 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <FileText className="size-4.5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold leading-6 text-slate-950">
                {t("titleEdit.dialogTitle")}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs leading-5 text-slate-500">
                {t("titleEdit.dialogDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("titleEdit.placeholder")}
            className="rounded-xl border-slate-200 text-sm focus-visible:ring-blue-200"
          />
        </div>
        <DialogFooter className="gap-2 border-t border-slate-100 px-5 py-4 sm:space-x-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={saving}>
              {t("titleEdit.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !draft.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("titleEdit.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CaseSummaryEditor({
  item,
  summary,
  onCaseUpdated,
}: {
  item: AttackCaseTimelineSummary
  summary: string
  onCaseUpdated?: (item: AttackCaseTimelineSummary) => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const locale = useLocale()
  const isEnglish = locale.toLowerCase().startsWith("en")
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(summary)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setDraft(summary)
    }
  }, [open, summary])

  async function handleSave() {
    const nextSummary = draft.trim()
    if (!nextSummary || saving) return

    setSaving(true)
    try {
      const nextItem =
        (await updateAttackCaseFriendlyName({
          caseId: item.case_id,
          summary: nextSummary,
        })) ?? null

      onCaseUpdated?.({
        ...item,
        summary: nextItem?.summary || nextSummary,
      })
      setOpen(false)
      toast({ title: t("summary.saveSuccess") })
    } catch (error) {
      toast({
        title: t("summary.saveFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-4 flex min-w-0 max-w-full items-center gap-1.5 pl-2 text-left text-sm leading-5 text-slate-600 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          title={summary}
          onClick={(event) => event.stopPropagation()}
        >
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-slate-500",
              isEnglish ? "w-20" : "w-[55px]",
            )}
          >
            <FileText className="size-3.5 shrink-0 text-slate-400" />
            {t("summary.label")}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {summary || "-"}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-xl gap-4 rounded-2xl border-slate-200 p-0 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
          <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <FileText className="size-4.5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold leading-6 text-slate-950">
                  {t("summary.dialogTitle")}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs leading-5 text-slate-500">
                  {t("summary.dialogDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-5">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("summary.placeholder")}
              className="min-h-32 resize-y rounded-xl border-slate-200 text-sm leading-6 focus-visible:ring-blue-200"
            />
          </div>
          <DialogFooter className="gap-2 border-t border-slate-100 px-5 py-4 sm:space-x-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                {t("summary.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("summary.save")}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function uniqueRuleIds(ruleIds: string[]) {
  return Array.from(new Set(ruleIds.map((ruleId) => ruleId.trim()).filter(Boolean)))
}

function RuleCountValue({
  count,
  ruleIds,
  snapshotId,
}: {
  count: number
  ruleIds: string[]
  snapshotId?: string
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const ids = useMemo(() => uniqueRuleIds(ruleIds), [ruleIds])
  const clickable = Boolean(snapshotId && ids.length > 0)

  if (!clickable) {
    return (
      <span className="tabular-nums text-sm font-normal leading-5 text-slate-900">
        {count}
      </span>
    )
  }

  if (ids.length === 1) {
    return (
      <RuleCountDetailTrigger
        count={count}
        ruleId={ids[0]}
        snapshotId={snapshotId || ""}
      />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="tabular-nums text-sm font-medium leading-5 text-blue-600 underline underline-offset-4 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          title={t("ruleList.open")}
        >
          {count}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="w-[360px] overflow-hidden rounded-xl border-slate-200 p-0 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
            <ScrollText className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium leading-5 text-slate-800">
              {t("ruleList.title", { count: ids.length })}
            </div>
            <div className="text-xs leading-4 text-slate-500">
              {t("ruleList.description")}
            </div>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto bg-white p-2">
          <div className="space-y-1">
            {ids.map((ruleId) => (
              <RuleIdDetailTrigger
                key={ruleId}
                ruleId={ruleId}
                snapshotId={snapshotId || ""}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function RuleCountDetailTrigger({
  count,
  ruleId,
  snapshotId,
}: {
  count: number
  ruleId: string
  snapshotId: string
}) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const [ruleMeta, setRuleMeta] = useState<AttackRuleMeta | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)

  async function loadRuleDetail() {
    if (loaded) return
    setLoaded(true)
    try {
      const meta = await fetchAttackRuleDetail({ snapshotId, ruleId })
      setRuleMeta(meta ?? { rule_id: ruleId, title: ruleId })
    } catch {
      setRuleMeta({ rule_id: ruleId, title: ruleId })
    }
  }

  return (
    <RuleInfoPopover id={ruleId} side="bottom" ruleMeta={ruleMeta}>
      <button
        type="button"
        onMouseEnter={() => void loadRuleDetail()}
        onFocus={() => void loadRuleDetail()}
        onClick={(event) => {
          event.stopPropagation()
          void loadRuleDetail()
        }}
        className="tabular-nums text-sm font-medium leading-5 text-blue-600 underline underline-offset-4 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        title={t("ruleList.open")}
      >
        {count}
      </button>
    </RuleInfoPopover>
  )
}

function RuleIdDetailTrigger({
  ruleId,
  snapshotId,
}: {
  ruleId: string
  snapshotId: string
}) {
  const [ruleMeta, setRuleMeta] = useState<AttackRuleMeta | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)

  async function handleOpenChange(open: boolean) {
    if (!open || loaded) return
    setLoaded(true)
    try {
      const meta = await fetchAttackRuleDetail({ snapshotId, ruleId })
      setRuleMeta(meta ?? { rule_id: ruleId, title: ruleId })
    } catch {
      setRuleMeta({ rule_id: ruleId, title: ruleId })
    }
  }

  return (
    <RuleInfoPopover id={ruleId} side="right" ruleMeta={ruleMeta}>
      <button
        type="button"
        onMouseEnter={() => void handleOpenChange(true)}
        onFocus={() => void handleOpenChange(true)}
        onClick={(event) => event.stopPropagation()}
        className="group flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        title={ruleId}
      >
        <span className="min-w-0 flex-1 truncate font-mono text-xs leading-5 text-blue-700 group-hover:text-blue-900">
          {ruleId}
        </span>
        <ExternalLink className="size-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500" />
      </button>
    </RuleInfoPopover>
  )
}

function MetaCluster({
  icon: Icon,
  label,
  children,
  className,
  labelClassName,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  children: ReactNode
  className?: string
  labelClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1.5",
        className,
      )}
    >
      <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-500", labelClassName)}>
        <Icon className="size-3.5" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function PhaseChips({
  phases,
}: {
  phases: ReturnType<typeof buildOrderedPhases>
}) {
  const stageT = useTranslations("pages.attack.dashboard.stages")

  if (phases.length === 0) {
    return <span className="text-sm text-slate-400">-</span>
  }

  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-1.5 whitespace-nowrap">
      {phases.map((phase) => {
        const label = phase.stageKey
          ? stageT(`${phase.stageKey}.label`)
          : phase.fallbackLabel

        return (
          <span
            key={phase.key}
            className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-normal leading-5 text-emerald-700 transition-colors hover:bg-emerald-100"
            title={label}
          >
            {label}
          </span>
        )
      })}
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
    <div className="grid min-w-0 grid-cols-4 overflow-hidden rounded-lg">
      {metrics.map((metric) => {
        const Icon = metric.icon

        return (
          <div
            key={metric.key}
            className="flex min-w-0 flex-col items-center justify-center gap-0.5 border-r border-slate-100 px-1 py-1.5 text-center last:border-r-0"
          >
            <span className="flex max-w-full items-center justify-center gap-0.5 whitespace-nowrap text-[10px] leading-4 text-slate-500">
              <Icon className={cn("size-3 shrink-0", metric.iconClassName)} />
              <span>{metric.label}</span>
            </span>
            {metric.content ?? (
              <span className="tabular-nums text-sm font-normal leading-5 text-slate-900">
                {metric.value}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TimeRange({
  startTime,
  endTime,
}: {
  startTime: string
  endTime: string
}) {
  const title = `${formatFullTime(startTime)} - ${formatFullTime(endTime)}`

  return (
    <div
      className="flex h-full w-fit min-w-0 flex-col justify-center px-3 py-1.5"
      title={title}
    >
      <div className="min-w-0 text-xs leading-5 text-slate-600">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 shrink-0 text-slate-400" />
          <span className="whitespace-nowrap">{formatFullTime(startTime)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <CircleDot className="size-3.5 shrink-0 text-slate-400" />
          <span className="whitespace-nowrap">{formatFullTime(endTime)}</span>
        </div>
      </div>
    </div>
  )
}

function CaseAIAnalysisAction({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className="h-10 shrink-0 gap-2 rounded-full px-3 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-blue-300 disabled:text-slate-300"
      title={t("aiAnalysisAction")}
    >
      <BrainCircuit className="size-4" />
      <span className="whitespace-nowrap">{t("aiAnalysisAction")}</span>
    </Button>
  )
}

function CaseTraceAction({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className="h-10 shrink-0 gap-2 rounded-full px-3 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:ring-cyan-300 disabled:text-slate-300"
      title={t("traceAction")}
    >
      <Route className="size-4" />
      <span className="whitespace-nowrap">{t("traceAction")}</span>
    </Button>
  )
}
