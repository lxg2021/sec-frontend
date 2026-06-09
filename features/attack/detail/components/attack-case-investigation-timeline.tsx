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
  Clock,
  DoorOpen,
  Download,
  FileSearch,
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
import { fetchAttackCaseTimeline } from "@/features/attack/dashboard/api"
import type {
  AttackCaseTimelineResult,
  AttackGroupTimelineInstance,
  AttackTimelineEvidenceItem,
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

const STAGE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Binoculars,
  Wrench,
  DoorOpen,
  Terminal,
  Anchor,
  ArrowUp,
  ShieldOff,
  Key: KeyRound,
  Search,
  ArrowRightLeft,
  Download,
  Cast,
  Upload,
  Zap,
}

const TIMELINE_WIDTH = 2320
const STAGE_STEP = 160
const STAGE_START_X = 80
const RAIL_TOP = 235

interface AttackCaseInvestigationTimelineProps {
  caseId?: string
  timezone?: string
  className?: string
  noCaseDescription?: string
  noCaseHint?: string
}

interface TimelineEvent {
  item: AttackTimelineEvidenceItem
  instance: AttackGroupTimelineInstance
  stageKey: AttckStageKey | "unknown"
}

function compactId(value: string, visible = 8) {
  if (!value) return "-"
  return value.length > visible ? `${value.slice(0, visible)}...` : value
}

function formatClock(value: string) {
  if (!value) return "-"
  const normalized = value.trim()
  const timeMatch = normalized.match(/(\d{2}:\d{2}(?::\d{2})?)/)
  if (timeMatch) return timeMatch[1]
  return normalized
}

function formatRange(startTime: string, endTime: string) {
  if (!startTime && !endTime) return "-"
  if (!startTime) return endTime
  if (!endTime) return startTime
  return `${startTime} - ${endTime}`
}

function normalizeStageKey(...values: string[]): AttckStageKey | "unknown" {
  for (const value of values) {
    const stage = resolveAttckStage(value) ?? getAttckStageDefinition(value)
    if (stage) return stage.key
  }
  return "unknown"
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
          stageKey: normalizeStageKey(
            item.primary_phase,
            ...item.phases,
            instance.primary_phase,
            ...instance.phases,
            group.group.primary_phase,
            ...group.group.phases,
            data.case.primary_phase,
          ),
        })
      }
    }
  }

  return events
}

function EventCard({
  event,
  color,
  compact = false,
}: {
  event: TimelineEvent
  color: string
  compact?: boolean
}) {
  const { item, instance } = event
  const title = item.rule_title || item.detection_name || item.event_name || item.rule_id || "Evidence event"
  const description = item.event_name || item.detection_name || item.find_string || "Timeline evidence"
  const iocCount = item.ioc_evidences.length
  const markCount = item.matched_attack_marks.length

  return (
    <div
      className={cn(
        "w-[232px] rounded-xl border bg-white p-3 shadow-[0_8px_18px_rgba(15,23,42,0.08)]",
        compact && "w-[210px] p-2.5",
      )}
      style={{ borderColor: `${color}55` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Clock className="size-3.5" style={{ color }} />
          {formatClock(item.occurred_at)}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {iocCount > 0 ? `${iocCount} IOC` : "evidence"}
        </span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-slate-950" title={title}>
        {title}
      </div>
      <div className="mt-1 truncate text-xs leading-5 text-slate-500" title={description}>
        {description}
      </div>
      <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
          {compactId(item.rule_id || instance.rule_id)}
        </span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
          inst {compactId(item.instance_id || instance.instance_id, 6)}
        </span>
        {markCount > 0 ? (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
            marks {markCount}
          </span>
        ) : null}
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
    <Card className="min-w-0 max-w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Activity className="size-5 text-slate-500" />
          Attack Case Investigation Timeline
        </CardTitle>
        <CardDescription>
          {hasCaseId
            ? "No timeline data was returned for this case."
            : noCaseDescription ?? "Select an attack case to inspect its ATT&CK timeline."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-12">
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <FileSearch className="size-8 text-slate-400" />
          <p className="text-sm text-slate-500">
            {hasCaseId
              ? "Timeline evidence will appear here when available."
              : noCaseHint ?? "Click a case row above to load its investigation timeline."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <Card className="min-w-0 max-w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Loader2 className="size-5 animate-spin text-blue-600" />
          Loading investigation timeline
        </CardTitle>
        <CardDescription>Fetching case groups, instances, and evidence events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-6">
        <div className="h-8 w-72 rounded-lg bg-slate-100" />
        <div className="h-80 rounded-xl bg-slate-100" />
      </CardContent>
    </Card>
  )
}

export function AttackCaseInvestigationTimeline({
  caseId = "",
  timezone = "Asia/Shanghai",
  className,
  noCaseDescription,
  noCaseHint,
}: AttackCaseInvestigationTimelineProps) {
  const [data, setData] = useState<AttackCaseTimelineResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadTimeline(nextCaseId = caseId) {
    const normalizedCaseId = nextCaseId.trim()
    if (!normalizedCaseId) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await fetchAttackCaseTimeline({
        caseId: normalizedCaseId,
        timezone,
      })
      setData(result)
    } catch (err) {
      console.error("load attack case timeline failed", err)
      setData(null)
      setError(err instanceof Error ? err.message : "Failed to load investigation timeline")
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
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await fetchAttackCaseTimeline({
          caseId: normalizedCaseId,
          timezone,
        })
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        console.error("load attack case timeline failed", err)
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : "Failed to load investigation timeline")
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
  const eventsByStage = useMemo(() => {
    const grouped = new Map<AttckStageKey | "unknown", TimelineEvent[]>()
    for (const event of events) {
      grouped.set(event.stageKey, [...(grouped.get(event.stageKey) ?? []), event])
    }
    return grouped
  }, [events])
  const primaryStageKey = data
    ? normalizeStageKey(data.case.primary_phase, ...data.case.phases)
    : "unknown"

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
      <Card className={cn("min-w-0 max-w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm", className)}>
        <CardHeader className="border-b border-slate-200 px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <AlertTriangle className="size-5 text-rose-500" />
            Attack Case Investigation Timeline
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 px-6 py-6">
          <p className="text-sm text-slate-500">Unable to load timeline for this CaseID.</p>
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
    <Card className={cn("min-w-0 max-w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-950">
              <ShieldAlert className="size-5 text-blue-600" />
              <span className="truncate">Attack Case Investigation Timeline</span>
            </CardTitle>
            <CardDescription className="mt-1">
              14 ATT&CK tactics, evidence events from GetCaseTimeline
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
                className="min-w-[104px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full overflow-hidden px-0 py-0">
        <div className="max-w-full overflow-x-auto px-6 py-5">
          <div
            className="relative h-[520px]"
            style={{ minWidth: TIMELINE_WIDTH }}
          >
            <div
              className="absolute left-0 right-0 h-px bg-slate-300"
              style={{ top: RAIL_TOP }}
            />
            <div
              className="absolute left-0 h-1 rounded-full bg-blue-600"
              style={{
                top: RAIL_TOP - 1,
                width:
                  primaryStageKey === "unknown"
                    ? STAGE_START_X
                    : STAGE_START_X +
                      Math.max(
                        0,
                        ATTCK_STAGE_DEFINITIONS.findIndex((stage) => stage.key === primaryStageKey),
                      ) *
                        STAGE_STEP,
              }}
            />

            {ATTCK_STAGE_DEFINITIONS.map((stage, index) => {
              const Icon = STAGE_ICONS[stage.icon] ?? Activity
              const x = STAGE_START_X + index * STAGE_STEP
              const stageEvents = eventsByStage.get(stage.key) ?? []
              const active = stageEvents.length > 0
              const primary = primaryStageKey === stage.key
              const color = stage.color
              const eventTop = index % 2 === 0 ? 50 : 340
              const connectorStart = index % 2 === 0 ? eventTop + 114 : RAIL_TOP + 44
              const connectorEnd = index % 2 === 0 ? RAIL_TOP - 44 : eventTop - 12
              const visibleEvents = stageEvents.slice(0, 2)
              const hiddenCount = Math.max(0, stageEvents.length - visibleEvents.length)

              return (
                <div key={stage.key}>
                  {active ? (
                    <div
                      className="absolute w-[232px]"
                      style={{
                        left: x - 116,
                        top: eventTop,
                      }}
                    >
                      <div className="space-y-2">
                        {visibleEvents.map((event) => (
                          <EventCard
                            key={`${event.item.evidence_id}-${event.item.occurred_at}-${event.item.instance_id}`}
                            event={event}
                            color={color}
                            compact={stageEvents.length > 1}
                          />
                        ))}
                        {hiddenCount > 0 ? (
                          <div
                            className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold"
                            style={{
                              borderColor: `${color}44`,
                              color,
                            }}
                          >
                            +{hiddenCount} more evidence events
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {active ? (
                    <div
                      className="absolute w-px"
                      style={{
                        left: x,
                        top: Math.min(connectorStart, connectorEnd),
                        height: Math.abs(connectorEnd - connectorStart),
                        backgroundColor: color,
                      }}
                    />
                  ) : null}

                  <div
                    className="absolute flex flex-col items-center"
                    style={{
                      left: x - 72,
                      top: RAIL_TOP - 44,
                      width: 144,
                    }}
                  >
                    <div
                      className={cn(
                        "flex size-20 items-center justify-center rounded-full border-2 bg-slate-50 text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.10)]",
                        active && "text-white",
                        primary && "ring-4 ring-blue-100",
                      )}
                      style={{
                        backgroundColor: active ? color : "#f8fafc",
                        borderColor: active ? color : "#cbd5e1",
                      }}
                    >
                      <Icon className="size-8" />
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-sm font-semibold leading-5 text-slate-950">
                        {STAGE_LABELS[stage.key]}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {stageEvents.length > 0 ? `${stageEvents.length} events` : "No evidence"}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {eventsByStage.get("unknown")?.length ? (
              <div className="absolute bottom-4 left-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {eventsByStage.get("unknown")?.length} events could not be mapped to an ATT&CK tactic.
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs text-slate-500 lg:flex-row lg:items-center lg:gap-6">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-600" />
            Fixed ATT&CK tactic order, no Kill Chain remapping.
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-slate-400" />
            Empty stages remain visible for investigation context.
          </span>
          <span className="inline-flex items-center gap-2">
            <Bug className="size-3.5" />
            Evidence cards use primary_phase; additional phases stay in event details.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
