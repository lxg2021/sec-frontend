"use client"

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from "react"
import { useTranslations } from "next-intl"
import {
  Bug,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleDot,
  Copy,
  Crosshair,
  ExternalLink,
  FileSearch,
  GitBranch,
  ListTree,
  ScrollText,
  Server,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react"

import { resolveAttckStage } from "@/features/attack/constants/attck-stages"
import { fetchAttackRuleDetail } from "@/features/attack/dashboard/api"
import type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"
import { RuleInfoPopover } from "@/features/baseline/rules/components/rule-info-popover"
import type { AttackRuleMeta } from "@/features/attack/utils/attck-utils"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
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
  snapshotId?: string
  hasMore?: boolean
  loadingMore?: boolean
  pageSize?: number
  onLoadMore?: () => boolean | Promise<boolean>
  onPageSizeChange?: (pageSize: number) => void | Promise<void>
}

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

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
  iconClassName: string
  content?: ReactNode
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
    .replace(/^[.:_-]+/, "")
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

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

export function AttackCaseList({
  items,
  onViewDetail,
  className,
  snapshotId = "",
  hasMore = false,
  loadingMore = false,
  pageSize: controlledPageSize,
  onLoadMore,
  onPageSizeChange,
}: AttackCaseListProps) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const [page, setPage] = useState(1)
  const [localPageSize, setLocalPageSize] = useState(controlledPageSize ?? DEFAULT_PAGE_SIZE)
  const pageSize = controlledPageSize ?? localPageSize
  const loadedTotal = items.length
  const totalPages = Math.max(1, Math.ceil(loadedTotal / pageSize))
  const normalizedPage = Math.min(page, Math.max(1, totalPages))
  const pageStartIndex = (normalizedPage - 1) * pageSize
  const pageEndIndex = Math.min(pageStartIndex + pageSize, loadedTotal)
  const visibleItems = items.slice(pageStartIndex, pageEndIndex)
  const visibleStart = loadedTotal > 0 ? pageStartIndex + 1 : 0
  const visibleEnd = loadedTotal > 0 ? pageEndIndex : 0

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(1, Math.ceil(items.length / pageSize))))
  }, [items.length, pageSize])

  async function handlePageSizeChange(value: string) {
    const nextPageSize = Number(value)
    if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return
    setPage(1)
    if (controlledPageSize === undefined) {
      setLocalPageSize(nextPageSize)
    }
    await onPageSizeChange?.(nextPageSize)
  }

  async function handleNextPage() {
    if (normalizedPage < totalPages) {
      setPage((current) => current + 1)
      return
    }

    if (!hasMore || loadingMore || !onLoadMore) return
    const loaded = await onLoadMore()
    if (loaded !== false) {
      setPage((current) => current + 1)
    }
  }

  function handlePreviousPage() {
    setPage((current) => Math.max(current - 1, 1))
  }

  if (items.length === 0) {
    return (
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm",
          className,
        )}
      >
        <AttackCaseListHeader />
        <CardContent className="px-6 py-14">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-12 text-center">
            <ShieldCheck className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm",
          className,
        )}
      >
        <AttackCaseListHeader />
        <CardContent className="px-4 py-3">
          <div className="space-y-3">
            {visibleItems.map((item, index) => (
              <CaseRow
                key={item.case_id}
                item={item}
                isFirst={index === 0}
                isLast={index === visibleItems.length - 1}
                snapshotId={snapshotId}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {t("pagination.total", {
              total: loadedTotal,
              start: visibleStart,
              end: visibleEnd,
            })}
            {hasMore ? (
              <span className="ml-1 text-slate-400">{t("pagination.moreAvailable")}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">
              {t("pagination.page", {
                page: normalizedPage,
                totalPages: hasMore ? `${totalPages}+` : totalPages,
              })}
            </span>
            <span className="ml-2 text-slate-500">{t("pagination.pageSize")}</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={loadingMore || normalizedPage <= 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("pagination.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={loadingMore || (!hasMore && normalizedPage >= totalPages)}
            >
              {loadingMore ? t("loadingMore") : t("pagination.next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}

function AttackCaseListHeader() {
  const t = useTranslations("pages.attack.dashboard.cases")

  return (
    <CardHeader className="flex-row items-center gap-3 border-b border-slate-200 px-6 py-5">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
        <ListTree className="size-6" />
      </div>
      <div className="min-w-0">
        <CardTitle className="text-lg font-semibold leading-6 text-slate-950">
          {t("title")}
        </CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-500">
          {t("description")}
        </CardDescription>
      </div>
    </CardHeader>
  )
}

function CaseRow({
  item,
  isFirst,
  isLast,
  snapshotId,
  onViewDetail,
}: {
  item: AttackCaseTimelineSummary
  isFirst: boolean
  isLast: boolean
  snapshotId?: string
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
  const clickable = Boolean(onViewDetail)

  return (
    <article className="grid grid-cols-[36px_minmax(0,1fr)] gap-0">
      <div className="relative flex justify-center">
        {!isFirst ? (
          <span className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-slate-200" />
        ) : null}
        {!isLast ? (
          <span className="absolute bottom-0 left-1/2 top-7 w-px -translate-x-1/2 bg-slate-200" />
        ) : null}
        <span
          className={cn(
            "relative mt-4 flex size-4 items-center justify-center rounded-full bg-white ring-4 ring-white",
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
          "min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.045)] outline-none transition-all duration-150",
          clickable &&
            "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] focus-visible:ring-2 focus-visible:ring-primary/25",
        )}
      >
        <div className="min-w-0 space-y-2">
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(294px,1fr)_352px_max-content] lg:items-center 2xl:grid-cols-[minmax(0,1fr)_416px_max-content]">
            <div className="min-w-0">
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
                <h3
                  className="w-[220px] shrink-0 truncate text-base font-semibold leading-6 text-slate-950 2xl:w-[520px]"
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

          <div className="grid min-w-0 gap-x-4 gap-y-1.5 rounded-lg bg-slate-50/70 px-3 py-1.5 lg:grid-cols-[max-content_max-content_minmax(0,1fr)] lg:items-center">
            <MetaCluster
              icon={Target}
              label={t("labels.caseId")}
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
    <div className="grid min-w-0 grid-cols-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
      {metrics.map((metric) => {
        const Icon = metric.icon

        return (
          <div
            key={metric.key}
            className="flex min-w-0 flex-col items-center justify-center gap-0.5 border-r border-slate-200/80 px-1 py-1.5 text-center last:border-r-0"
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
      className="flex h-full w-fit min-w-0 flex-col justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]"
      title={title}
    >
      <div className="min-w-0 text-xs leading-5 text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-700">
          <CalendarClock className="size-3.5 shrink-0 text-sky-500" />
          <span className="whitespace-nowrap">{formatFullTime(startTime)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <CircleDot className="size-3.5 shrink-0 text-indigo-400" />
          <span className="whitespace-nowrap">{formatFullTime(endTime)}</span>
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
