"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowRightLeft,
  ArrowUp,
  Binoculars,
  Bug,
  Cast,
  DoorOpen,
  Download,
  FileSearch,
  FileText,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldOff,
  Terminal,
  Upload,
  Wrench,
  Zap,
} from "lucide-react"

import {
  ATTCK_STAGE_DEFINITIONS,
  getAttckStageDefinition,
  resolveAttckStage,
  type AttckStageKey,
} from "@/features/attack/constants/attck-stages"
import {
  batchDescribeEventSourcesByKeys,
  fetchAttackCaseTimeline,
} from "@/features/attack/dashboard/api"
import type {
  AttackCaseTimelineResult,
  AttackGroupTimelineInstance,
  AttackIocEvidence,
  AttackTimelineEvidenceItem,
  BatchDescribeEventSourceItem,
  EventSourceDescriptionKey,
  EventSourceDescriptionSlot,
} from "@/features/attack/dashboard/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

const STAGE_ICONS: Record<AttckStageKey | "unknown", ComponentType<{ className?: string }>> = {
  "reconnaissance": Binoculars,
  "resource-development": Wrench,
  "initial-access": DoorOpen,
  "execution": Terminal,
  "persistence": Anchor,
  "privilege-escalation": ArrowUp,
  "defense-evasion": ShieldOff,
  "credential-access": KeyRound,
  "discovery": Search,
  "lateral-movement": ArrowRightLeft,
  "collection": Download,
  "command-and-control": Cast,
  "exfiltration": Upload,
  "impact": Zap,
  "unknown": Activity,
}

const STAGE_LABELS: Record<AttckStageKey, string> = {
  "reconnaissance": "Reconnaissance",
  "resource-development": "Resource Development",
  "initial-access": "Initial Access",
  "execution": "Execution",
  "persistence": "Persistence",
  "privilege-escalation": "Privilege Escalation",
  "defense-evasion": "Defense Evasion",
  "credential-access": "Credential Access",
  "discovery": "Discovery",
  "lateral-movement": "Lateral Movement",
  "collection": "Collection",
  "command-and-control": "Command & Control",
  "exfiltration": "Exfiltration",
  "impact": "Impact",
}

interface AttackCaseStoryTimelineRenderProps {
  caseId?: string
  snapshotId?: string
  timezone?: string
  className?: string
  noCaseDescription?: string
  noCaseHint?: string
}

export interface AttackCaseStoryTimelineStep {
  id: string
  occurredAt: string
  timeLabel: string
  phaseKey: AttckStageKey | "unknown"
  phaseLabel: string
  phaseColor: string
  summary: string
  shortSummary: string
  ruleTitle: string
  ruleId: string
  detectionName: string
  eventName: string
  eventType: number
  sourceUniqueId: string
  agentId: string
  attackMarks: string[]
  techniques: string[]
  iocEvidences: AttackIocEvidence[]
  slots: EventSourceDescriptionSlot[]
  describeStatus: string
  missReason: string
}

interface AttackCaseStoryTimelineBodyProps {
  steps: AttackCaseStoryTimelineStep[]
  className?: string
}

interface TimelineEvent {
  item: AttackTimelineEvidenceItem
  instance: AttackGroupTimelineInstance
  stageKey: AttckStageKey | "unknown"
}

function compactId(value: string, visible = 10) {
  if (!value) return ""
  return value.length > visible ? `${value.slice(0, visible)}...` : value
}

function firstFilled(...values: string[]) {
  return values.find((value) => value.trim())?.trim() ?? ""
}

function isRuleDetectionMarker(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}:\d+:[a-z0-9_.-]+$/i.test(value.trim())
}

function extractTechniques(values: string[]) {
  const techniques: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const match = value.match(/T\d{4}(?:[./]\d{3})?/i)
    if (!match?.[0]) continue

    const technique = match[0].replace("/", ".").toUpperCase()
    if (seen.has(technique)) continue

    seen.add(technique)
    techniques.push(technique)
  }

  return techniques
}

function formatBehavior(value: string) {
  return value.trim().replace(/_/g, " ").replace(/\s+/g, " ")
}

function fallbackEvidenceSummary(item: AttackTimelineEvidenceItem) {
  return firstFilled(
    item.detection_name,
    item.rule_title,
    item.event_name,
    isRuleDetectionMarker(item.find_string) ? "" : item.find_string,
    "Timeline evidence",
  )
}

function formatOccurredAt(value: string) {
  if (!value) return "-"
  const normalized = value.trim()
  const timeMatch = normalized.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/)
  if (timeMatch) return `${timeMatch[1]} ${timeMatch[2]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized
  return normalized
}

function formatRange(startTime: string, endTime: string) {
  if (!startTime && !endTime) return "-"
  if (!startTime) return endTime
  if (!endTime) return startTime
  return `${startTime} - ${endTime}`
}

function formatIocLine(ioc: AttackIocEvidence) {
  const value = firstFilled(ioc.ioc_display_value, ioc.ioc_normalized_value, ioc.candidate_value, ioc.marker)
  const type = firstFilled(ioc.ioc_type, ioc.candidate_type, ioc.hit_source)
  if (type && value) return `${type}: ${value}`
  return value || type || "IOC evidence matched"
}

function visibleSlots(slots: EventSourceDescriptionSlot[]) {
  return slots
    .filter((slot) => slot.primary && slot.display_value)
    .sort((left, right) => left.order - right.order)
    .slice(0, 4)
}

function normalizeStageCandidates(...values: string[]): AttckStageKey[] {
  const candidates: AttckStageKey[] = []
  const seen = new Set<AttckStageKey>()

  for (const value of values) {
    const stage = resolveAttckStage(value) ?? getAttckStageDefinition(value)
    if (!stage || seen.has(stage.key)) continue

    seen.add(stage.key)
    candidates.push(stage.key)
  }

  return candidates
}

function pickSemanticStageFromCandidates(
  item: AttackTimelineEvidenceItem,
  candidates: AttckStageKey[],
): AttckStageKey | null {
  const candidateSet = new Set(candidates)
  const eventName = item.event_name.trim().toLowerCase()
  const evidenceText = [
    item.event_name,
    item.detection_name,
    item.find_string,
    item.rule_title,
  ].join(" ").toLowerCase()

  if (
    candidateSet.has("execution") &&
    (
      eventName === "processcreate" ||
      eventName === "process_create" ||
      /\b(process|script|command|powershell|cmd|wscript|cscript|mshta|rundll32|regsvr32)\b/.test(evidenceText)
    )
  ) {
    return "execution"
  }

  if (
    candidateSet.has("defense-evasion") &&
    /\b(evasion|hide|hidden|tamper|disable|dropped|extract|filecreate|file_create)\b/.test(evidenceText)
  ) {
    return "defense-evasion"
  }

  return null
}

function resolveEvidenceStageKey(
  item: AttackTimelineEvidenceItem,
  fallbackPhases: string[],
): AttckStageKey | "unknown" {
  const itemCandidates = normalizeStageCandidates(item.primary_phase, ...item.phases)
  const semanticStage = pickSemanticStageFromCandidates(item, itemCandidates)
  if (semanticStage) return semanticStage
  if (itemCandidates.length > 0) return itemCandidates[0]

  const fallbackCandidates = normalizeStageCandidates(...fallbackPhases)
  return fallbackCandidates[0] ?? "unknown"
}

function flattenTimelineEvents(data: AttackCaseTimelineResult | null): TimelineEvent[] {
  if (!data) return []

  const events: TimelineEvent[] = []
  for (const group of data.groups) {
    for (const instance of group.instances) {
      for (const item of instance.items) {
        events.push({
          item,
          instance,
          stageKey: resolveEvidenceStageKey(item, [
            instance.primary_phase,
            ...instance.phases,
            group.group.primary_phase,
            ...group.group.phases,
            data.case.primary_phase,
            ...data.case.phases,
          ]),
        })
      }
    }
  }

  return events
}

function compareOccurredAt(left: string, right: string) {
  const leftTime = Date.parse(left.replace(" ", "T"))
  const rightTime = Date.parse(right.replace(" ", "T"))

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime
  }

  return left.localeCompare(right)
}

function descriptionKeyId(key: Pick<EventSourceDescriptionKey, "event_type" | "source_unique_id">) {
  return `${key.event_type}|${key.source_unique_id}`
}

function buildDescriptionKeys(events: TimelineEvent[]): EventSourceDescriptionKey[] {
  const keys = new Map<string, EventSourceDescriptionKey>()

  for (const event of events) {
    const { item } = event
    if (item.event_type <= 0 || !item.source_unique_id) continue

    const key = {
      event_type: item.event_type,
      event_name: item.event_name,
      source_unique_id: item.source_unique_id,
    }
    const id = descriptionKeyId(key)
    if (!keys.has(id)) {
      keys.set(id, key)
    }
  }

  return Array.from(keys.values())
}

function buildDescriptionMap(items: BatchDescribeEventSourceItem[]) {
  const descriptions = new Map<string, BatchDescribeEventSourceItem>()
  for (const item of items) {
    descriptions.set(descriptionKeyId(item.key), item)
  }
  return descriptions
}

function buildStorySteps(
  events: TimelineEvent[],
  descriptions: Map<string, BatchDescribeEventSourceItem>,
): AttackCaseStoryTimelineStep[] {
  return [...events]
    .sort((left, right) => compareOccurredAt(left.item.occurred_at, right.item.occurred_at))
    .map((event, index) => {
      const { item, instance, stageKey } = event
      const stage = stageKey === "unknown" ? null : ATTCK_STAGE_DEFINITIONS.find((entry) => entry.key === stageKey)
      const descriptionItem = descriptions.get(descriptionKeyId(item))
      const description = descriptionItem?.description ?? null
      const fallbackSummary = fallbackEvidenceSummary(item)
      const summary = firstFilled(description?.summary ?? "", description?.short_summary ?? "", fallbackSummary)
      const ruleTitle = firstFilled(item.rule_title, item.detection_name, item.rule_id, instance.rule_id)

      return {
        id: firstFilled(item.evidence_id, `${item.event_type}-${item.source_unique_id}-${index}`),
        occurredAt: item.occurred_at,
        timeLabel: formatOccurredAt(item.occurred_at),
        phaseKey: stageKey,
        phaseLabel: stage ? STAGE_LABELS[stage.key] : "Unknown",
        phaseColor: stage?.color ?? "#64748b",
        summary,
        shortSummary: firstFilled(description?.short_summary ?? "", summary),
        ruleTitle,
        ruleId: firstFilled(item.rule_id, instance.rule_id),
        detectionName: item.detection_name,
        eventName: firstFilled(item.event_name, description?.title ?? ""),
        eventType: item.event_type,
        sourceUniqueId: item.source_unique_id,
        agentId: item.agent_id || instance.agent_id,
        attackMarks: item.matched_attack_marks,
        techniques: extractTechniques(item.attack_techniques),
        iocEvidences: item.ioc_evidences,
        slots: description?.slots ?? [],
        describeStatus: descriptionItem?.describe_status ?? "",
        missReason: descriptionItem?.miss_reason ?? "",
      }
    })
}

function StepBranches({ step }: { step: AttackCaseStoryTimelineStep }) {
  const slots = visibleSlots(step.slots)
  const firstIoc = step.iocEvidences[0]
  const techniques = step.techniques.length > 0 ? step.techniques.join(", ") : ""
  const ruleId = step.ruleId.trim()
  const ruleTitle = step.ruleTitle.trim()
  const behavior = formatBehavior(step.detectionName)
  const status =
    step.describeStatus && step.describeStatus !== "ok"
      ? firstFilled(step.missReason, step.describeStatus)
      : ""

  const lines = [
    step.summary,
    ruleId ? `RuleID: ${ruleId}` : "",
    ruleTitle ? `Rule Title: ${ruleTitle}` : "",
    behavior ? `Suspicious Behavior: ${behavior}` : "",
    techniques ? `ATT&CK: ${techniques}` : "",
    firstIoc ? `IOC: ${formatIocLine(firstIoc)}` : "",
    status ? `Source description: ${status}` : "",
  ].filter(Boolean)

  return (
    <div className="mt-3 space-y-2">
      {lines.map((line, index) => (
        <div key={`${step.id}-line-${index}`} className="flex min-w-0 gap-3">
          <div className="flex w-7 shrink-0 justify-end pt-2">
            <span
              className={cn(
                "h-px w-5 bg-slate-300",
                index === 0 && "bg-slate-400",
              )}
            />
          </div>
          <p
            className={cn(
              "min-w-0 text-sm leading-6",
              index === 0 ? "font-medium text-slate-800" : "text-slate-500",
            )}
          >
            {line}
          </p>
        </div>
      ))}

      {slots.length > 0 ? (
        <div className="ml-10 flex min-w-0 flex-wrap gap-1.5 pt-1">
          {slots.map((slot) => (
            <span
              key={`${step.id}-${slot.slot_id}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
              title={`${slot.label}: ${slot.display_value}`}
            >
              <span className="shrink-0 text-slate-400">{slot.label}</span>
              <span className="min-w-0 truncate font-medium text-slate-700">
                {slot.display_value}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function AttackCaseStoryTimelineBody({
  steps,
  className,
}: AttackCaseStoryTimelineBodyProps) {
  if (steps.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center", className)}>
        <FileText className="mx-auto size-8 text-slate-400" />
        <p className="mt-3 text-sm text-slate-500">No story evidence is available for this case.</p>
      </div>
    )
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600">
          {steps.length} evidence events
        </span>
      </div>

      <div className="relative">
        <div className="absolute bottom-4 left-[176px] top-4 w-px bg-slate-200" />

        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = STAGE_ICONS[step.phaseKey] ?? Bug
            const borderColor = `${step.phaseColor}66`

            return (
              <div
                key={step.id}
                className="relative grid grid-cols-[minmax(164px,176px)_40px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md"
                style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
              >
                <div className="pt-1 text-right font-mono text-xs font-semibold tabular-nums whitespace-nowrap text-slate-700">
                  {step.timeLabel}
                </div>

                <div className="relative flex justify-center pt-0.5">
                  <div
                    className="z-10 flex size-9 items-center justify-center rounded-full border bg-white shadow-sm"
                    style={{ borderColor, color: step.phaseColor }}
                  >
                    <Icon className="size-[18px]" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="min-w-0 text-base font-semibold leading-6 text-slate-950">
                      {step.phaseLabel}
                    </h3>
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                      style={{
                        borderColor,
                        color: step.phaseColor,
                        backgroundColor: "#fff",
                      }}
                    >
                      {step.eventName || "Evidence"}
                    </span>
                    {step.eventType > 0 ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-500">
                        type {step.eventType}
                      </span>
                    ) : null}
                  </div>

                  <StepBranches step={step} />

                  <div className="mt-3 flex min-w-0 flex-wrap gap-1.5 text-[11px] text-slate-400">
                    {step.sourceUniqueId ? (
                      <span className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono">
                        src {compactId(step.sourceUniqueId, 12)}
                      </span>
                    ) : null}
                    {step.agentId ? (
                      <span className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono">
                        host {compactId(step.agentId, 10)}
                      </span>
                    ) : null}
                    {step.iocEvidences.length > 1 ? (
                      <span className="rounded-md bg-slate-50 px-1.5 py-0.5">
                        +{step.iocEvidences.length - 1} IOC
                      </span>
                    ) : null}
                    {step.attackMarks.length > 1 ? (
                      <span className="rounded-md bg-slate-50 px-1.5 py-0.5">
                        +{step.attackMarks.length - 1} marks
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  caseId,
  noCaseDescription,
  noCaseHint,
}: {
  caseId?: string
  noCaseDescription?: string
  noCaseHint?: string
}) {
  const hasCaseId = Boolean(caseId?.trim())

  return (
    <Card className="min-w-0 max-w-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Activity className="size-5 text-slate-500" />
          Attack Story
        </CardTitle>
        <CardDescription>
          {hasCaseId
            ? "No timeline data was returned for this case."
            : noCaseDescription ?? "Select an attack case to inspect its story timeline."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-10">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
          <FileSearch className="size-8 text-slate-400" />
          <p className="text-sm text-slate-500">
            {hasCaseId
              ? "Timeline evidence will appear here when available."
              : noCaseHint ?? "Open this view with a CaseID to load the investigation story."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <Card className="min-w-0 max-w-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Loader2 className="size-5 animate-spin text-blue-600" />
          Loading attack story
        </CardTitle>
        <CardDescription>Fetching timeline evidence and source event descriptions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-6">
        <div className="h-8 w-72 rounded-lg bg-slate-100" />
        <div className="h-24 rounded-lg bg-slate-100" />
        <div className="h-24 rounded-lg bg-slate-100" />
        <div className="h-24 rounded-lg bg-slate-100" />
      </CardContent>
    </Card>
  )
}

export function AttackCaseStoryTimelineRender({
  caseId = "",
  snapshotId: _snapshotId = "",
  timezone = "Asia/Shanghai",
  className,
  noCaseDescription,
  noCaseHint,
}: AttackCaseStoryTimelineRenderProps) {
  const [data, setData] = useState<AttackCaseTimelineResult | null>(null)
  const [descriptions, setDescriptions] = useState<BatchDescribeEventSourceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [describeWarning, setDescribeWarning] = useState<string | null>(null)

  async function loadTimeline(nextCaseId = caseId) {
    const normalizedCaseId = nextCaseId.trim()
    if (!normalizedCaseId) {
      setData(null)
      setDescriptions([])
      setError(null)
      setDescribeWarning(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setDescribeWarning(null)
    try {
      const result = await fetchAttackCaseTimeline({
        caseId: normalizedCaseId,
        timezone,
      })
      setData(result)

      const events = flattenTimelineEvents(result)
      const keys = buildDescriptionKeys(events)
      if (keys.length === 0) {
        setDescriptions([])
        return
      }

      try {
        const described = await batchDescribeEventSourcesByKeys({
          keys,
          tenantId: result?.case.tenant_id,
          language: "en-US",
          includeEventSource: false,
          includeAllFields: false,
        })
        setDescriptions(described.items)
      } catch (err) {
        console.error("describe attack story source events failed", err)
        setDescriptions([])
        setDescribeWarning("Source event descriptions are unavailable; fallback evidence text is shown.")
      }
    } catch (err) {
      console.error("load attack case timeline failed", err)
      setData(null)
      setDescriptions([])
      setError(err instanceof Error ? err.message : "Failed to load attack story")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
      const normalizedCaseId = caseId.trim()
      if (!normalizedCaseId) {
        setData(null)
        setDescriptions([])
        setError(null)
        setDescribeWarning(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setDescribeWarning(null)
      try {
        const result = await fetchAttackCaseTimeline({
          caseId: normalizedCaseId,
          timezone,
        })
        if (cancelled) return

        setData(result)
        const events = flattenTimelineEvents(result)
        const keys = buildDescriptionKeys(events)
        if (keys.length === 0) {
          setDescriptions([])
          return
        }

        try {
          const described = await batchDescribeEventSourcesByKeys({
            keys,
            tenantId: result?.case.tenant_id,
            language: "en-US",
            includeEventSource: false,
            includeAllFields: false,
          })
          if (!cancelled) {
            setDescriptions(described.items)
          }
        } catch (err) {
          console.error("describe attack story source events failed", err)
          if (!cancelled) {
            setDescriptions([])
            setDescribeWarning("Source event descriptions are unavailable; fallback evidence text is shown.")
          }
        }
      } catch (err) {
        console.error("load attack case timeline failed", err)
        if (!cancelled) {
          setData(null)
          setDescriptions([])
          setError(err instanceof Error ? err.message : "Failed to load attack story")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [caseId, timezone])

  const events = useMemo(() => flattenTimelineEvents(data), [data])
  const descriptionMap = useMemo(() => buildDescriptionMap(descriptions), [descriptions])
  const storySteps = useMemo(
    () => buildStorySteps(events, descriptionMap),
    [events, descriptionMap],
  )

  if (!caseId.trim()) {
    return (
      <EmptyState
        noCaseDescription={noCaseDescription}
        noCaseHint={noCaseHint}
      />
    )
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <Card className={cn("min-w-0 max-w-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm", className)}>
        <CardHeader className="border-b border-slate-200 px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <AlertTriangle className="size-5 text-rose-500" />
            Attack Story
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 px-6 py-6">
          <p className="text-sm text-slate-500">Unable to load story timeline for this CaseID.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadTimeline()}>
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return <EmptyState caseId={caseId} />
  }

  const summary = data.case

  return (
    <Card className={cn("min-w-0 max-w-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-950">
              <ShieldAlert className="size-5 text-blue-600" />
              <span className="truncate">Attack Story</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Case investigation timeline from GetCaseTimeline and source event descriptions.
            </CardDescription>
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
              <span className="max-w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                Case {compactId(summary.case_id, 24)}
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                {summary.severity || "unknown"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                {formatRange(summary.start_time, summary.end_time)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Rules", summary.rule_count],
              ["Hosts", summary.host_count],
              ["Instances", summary.instance_count],
              ["Evidence", summary.evidence_count],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-[104px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full px-6 py-5">
        {describeWarning ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {describeWarning}
          </div>
        ) : null}
        <AttackCaseStoryTimelineBody steps={storySteps} />
      </CardContent>
    </Card>
  )
}
