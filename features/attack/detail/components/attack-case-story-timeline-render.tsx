"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUp,
  Binoculars,
  Bug,
  CalendarClock,
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
  fetchAttackRuleDetail,
  fetchAttackCaseTimeline,
} from "@/features/attack/dashboard/api"
import { getHardwareInfo, getSingleHostDetail } from "@/features/assets/host/api"
import { HostInfoCard } from "@/features/assets/host/components/host-info-card"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import { RuleInfoPopover } from "@/features/baseline/rules/components/rule-info-popover"
import type { AttackRuleMeta } from "@/features/attack/utils/attck-utils"
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
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import type { HostSelectorHostNode } from "@/shared/components/host-selector/types"

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
  storySummary: string
  snapshotId: string
  eventCount: number
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

function fallbackEvidenceSummary(item: AttackTimelineEvidenceItem, fallbackText = "Timeline evidence") {
  return firstFilled(
    item.detection_name,
    item.rule_title,
    item.event_name,
    isRuleDetectionMarker(item.find_string) ? "" : item.find_string,
    fallbackText,
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

function splitOccurredAt(value: string) {
  const label = formatOccurredAt(value)
  const match = label.match(/^(\d{4}-\d{2}-\d{2})\s+(.+)$/)
  if (!match) return { date: "", time: label }
  return { date: match[1], time: match[2] }
}

function formatRange(startTime: string, endTime: string) {
  if (!startTime && !endTime) return "-"
  if (!startTime) return endTime
  if (!endTime) return startTime
  return `${startTime} - ${endTime}`
}

function formatStorySummary(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function joinDisplay(values?: string[] | null) {
  return Array.isArray(values) && values.length > 0 ? values.join(", ") : "-"
}

function uniqueDisplay(values: string[]) {
  const normalized = Array.from(new Set(values.map((value) => value.trim()).filter((value) => value && value !== "-")))
  return normalized.length > 0 ? normalized.join(", ") : "-"
}

function formatMemory(hardware?: AgentHardwareInfo | null) {
  const totalMiB = hardware?.rams.reduce((sum, ram) => sum + (Number(ram.sizeMiB) || 0), 0) || 0
  if (totalMiB <= 0) return "-"
  if (totalMiB >= 1024) return `${Math.round((totalMiB / 1024) * 10) / 10} GB`
  return `${totalMiB} MB`
}

function toHostInfoNode(host: AgentInfo, hardware?: AgentHardwareInfo | null): HostSelectorHostNode {
  const cpuNames = uniqueDisplay(hardware?.cpu.sockets.map((cpu) => cpu.model) || [])
  const diskNames = uniqueDisplay(hardware?.disks.disks.map((disk) => disk.model) || [])

  return {
    id: `host:${host.hostId}`,
    type: "host",
    name: host.hostname || host.hostId,
    hostname: host.hostname || host.hostId,
    hostId: host.hostId,
    status: host.status,
    os: [host.osName, host.osVersion].filter(Boolean).join(" ") || host.osType || "-",
    ip: joinDisplay(host.ip),
    mac: joinDisplay(host.macs),
    cpu: cpuNames !== "-" ? cpuNames : host.cpuId || "-",
    memory: formatMemory(hardware),
    disk: diskNames !== "-" ? diskNames : joinDisplay(host.harddiskIds),
  }
}

function techniqueHref(technique: string) {
  return `https://attack.mitre.org/techniques/${technique.replace(".", "/")}/`
}

function buildAttackDetailHref(caseId: string, snapshotId: string) {
  const params = new URLSearchParams()
  params.set("caseId", caseId)
  if (snapshotId.trim()) params.set("snapshotId", snapshotId.trim())
  return `/frame/attack/detail?${params.toString()}`
}

function formatIocLine(ioc: AttackIocEvidence, fallbackText = "IOC evidence matched") {
  const value = firstFilled(ioc.ioc_display_value, ioc.ioc_normalized_value, ioc.candidate_value, ioc.marker)
  const type = firstFilled(ioc.ioc_type, ioc.candidate_type, ioc.hit_source)
  if (type && value) return `${type}: ${value}`
  return value || type || fallbackText
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
  options: {
    fallbackEvidenceText?: string
    unknownStageLabel?: string
    stageLabel?: (stage: AttckStageKey) => string
  } = {},
): AttackCaseStoryTimelineStep[] {
  return [...events]
    .sort((left, right) => compareOccurredAt(left.item.occurred_at, right.item.occurred_at))
    .map((event, index) => {
      const { item, instance, stageKey } = event
      const stage = stageKey === "unknown" ? null : ATTCK_STAGE_DEFINITIONS.find((entry) => entry.key === stageKey)
      const descriptionItem = descriptions.get(descriptionKeyId(item))
      const description = descriptionItem?.description ?? null
      const fallbackSummary = fallbackEvidenceSummary(item, options.fallbackEvidenceText)
      const summary = firstFilled(description?.summary ?? "", description?.short_summary ?? "", fallbackSummary)
      const ruleTitle = firstFilled(item.rule_title, item.detection_name, item.rule_id, instance.rule_id)

      return {
        id: firstFilled(item.evidence_id, `${item.event_type}-${item.source_unique_id}-${index}`),
        occurredAt: item.occurred_at,
        timeLabel: formatOccurredAt(item.occurred_at),
        phaseKey: stageKey,
        phaseLabel: stage ? options.stageLabel?.(stage.key) ?? STAGE_LABELS[stage.key] : options.unknownStageLabel ?? "Unknown",
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

function StoryRuleDetailTrigger({
  ruleId,
  ruleTitle,
  snapshotId,
}: {
  ruleId: string
  ruleTitle: string
  snapshotId: string
}) {
  const fallbackMeta: AttackRuleMeta = { rule_id: ruleId, title: ruleTitle || ruleId }
  const [ruleMeta, setRuleMeta] = useState<AttackRuleMeta | undefined>(fallbackMeta)
  const [loaded, setLoaded] = useState(false)

  async function loadRuleDetail() {
    if (loaded) return
    setLoaded(true)

    if (!snapshotId.trim()) {
      setRuleMeta(fallbackMeta)
      return
    }

    try {
      const meta = await fetchAttackRuleDetail({ snapshotId, ruleId })
      setRuleMeta(meta ?? fallbackMeta)
    } catch {
      setRuleMeta(fallbackMeta)
    }
  }

  return (
    <RuleInfoPopover id={ruleId} side="right" ruleMeta={ruleMeta}>
      <button
        type="button"
        onMouseEnter={() => void loadRuleDetail()}
        onFocus={() => void loadRuleDetail()}
        onClick={(event) => {
          event.stopPropagation()
          void loadRuleDetail()
        }}
        className="font-mono text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        title={ruleId}
      >
        {ruleId}
      </button>
    </RuleInfoPopover>
  )
}

function AttackTechniqueLinks({ techniques }: { techniques: string[] }) {
  return (
    <div className="inline-flex min-w-0 flex-wrap items-center gap-1.5 align-middle">
      {techniques.map((technique) => (
        <a
          key={technique}
          href={techniqueHref(technique)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="max-w-[96px] truncate rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-xs leading-5 text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          title={technique}
        >
          {technique}
        </a>
      ))}
    </div>
  )
}

function EvidenceChip({
  label,
  value,
  title,
  monoValue = false,
  valueClassName,
}: {
  label: string
  value: string
  title?: string
  monoValue?: boolean
  valueClassName?: string
}) {
  if (!value) return null

  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs leading-4 text-slate-600"
      title={title || `${label}: ${value}`}
    >
      <span className="shrink-0 font-semibold text-slate-400">{label}</span>
      <span className={cn("min-w-0 truncate font-semibold text-slate-700", monoValue && "font-mono", valueClassName)}>
        {value}
      </span>
    </span>
  )
}

function TimelineEventCard({
  step,
  snapshotId,
  loadingHost,
  onHostClick,
}: {
  step: AttackCaseStoryTimelineStep
  snapshotId: string
  loadingHost: boolean
  onHostClick: (agentId: string) => void
}) {
  const t = useTranslations("pages.attack.dashboard.caseStory")
  const primarySlots = step.slots
    .filter((slot) => slot.primary && slot.display_value)
    .sort((left, right) => left.order - right.order)
  const slots = primarySlots.slice(0, 4)
  const hiddenSlotCount = Math.max(primarySlots.length - slots.length, 0)
  const firstIoc = step.iocEvidences[0]
  const ruleId = step.ruleId.trim()
  const ruleTitle = step.ruleTitle.trim()
  const behavior = formatBehavior(step.detectionName)
  const status =
    step.describeStatus && step.describeStatus !== "ok"
      ? firstFilled(step.missReason, step.describeStatus)
      : ""
  const borderColor = `${step.phaseColor}66`
  const subtleColor = `${step.phaseColor}12`

  return (
    <div
      className="min-w-0 rounded-lg border bg-white px-4 py-3 shadow-sm"
      style={{ borderColor, borderLeftColor: step.phaseColor, borderLeftWidth: 3 }}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 className="min-w-0 text-base font-semibold leading-6 text-slate-950">
          {step.phaseLabel}
        </h3>
        <span
          className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
          style={{
            borderColor,
            color: step.phaseColor,
            backgroundColor: subtleColor,
          }}
        >
          {step.eventName || t("eventFallback")}
        </span>
        {step.agentId ? (
          <button
            type="button"
            className="rounded-lg border border-sky-100 bg-sky-50/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 disabled:cursor-wait disabled:opacity-70"
            disabled={loadingHost}
            onClick={() => onHostClick(step.agentId)}
            title={step.agentId}
          >
            {loadingHost ? (
              <Loader2 className="mr-1 inline size-3 animate-spin align-[-2px]" />
            ) : null}
            HostID: {step.agentId}
          </button>
        ) : null}
      </div>

      <p className="mt-2 min-w-0 text-sm leading-6 text-slate-700">
        {step.summary}
      </p>

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-8 gap-y-2 text-sm leading-5 text-slate-500">
        {ruleId ? (
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-slate-500">{t("labels.ruleId")}</span>
            <StoryRuleDetailTrigger
              ruleId={ruleId}
              ruleTitle={ruleTitle}
              snapshotId={snapshotId}
            />
          </span>
        ) : null}
        {ruleTitle ? (
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-slate-500">{t("labels.ruleTitle")}</span>
            <span className="min-w-0 truncate text-sm font-medium text-slate-700">{ruleTitle}</span>
          </span>
        ) : null}
        {step.techniques.length > 0 ? (
          <span className="inline-flex min-w-0 items-center gap-2 rounded-md bg-blue-50 px-2 py-0.5">
            <span className="shrink-0 text-xs font-semibold text-slate-500">ATT&CK:</span>
            <AttackTechniqueLinks techniques={step.techniques} />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <EvidenceChip label={t("labels.suspiciousBehavior")} value={behavior} valueClassName="text-orange-600" />
        {firstIoc ? (
          <EvidenceChip
            label="IOC:"
            value={formatIocLine(firstIoc, t("iocFallback"))}
            valueClassName="text-rose-600"
          />
        ) : null}
        {status ? <EvidenceChip label={t("labels.sourceDescription")} value={status} /> : null}
      </div>

      {slots.length > 0 ? (
        <div className="mt-2 flex min-w-0 flex-wrap gap-2">
          {slots.map((slot) => (
            <EvidenceChip
              key={`${step.id}-${slot.slot_id}`}
              label={slot.label}
              value={slot.display_value}
              title={`${slot.label}: ${slot.display_value}`}
              monoValue={slot.value_type === "path" || /command|line|path|process|file/i.test(slot.label)}
            />
          ))}
          {hiddenSlotCount > 0 ? (
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-400">
              {t("moreFields", { count: hiddenSlotCount })}
            </span>
          ) : null}
        </div>
      ) : null}

      {(step.iocEvidences.length > 1 || step.attackMarks.length > 1) ? (
        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 text-[11px] text-slate-400">
          {step.iocEvidences.length > 1 ? (
            <span className="rounded-md bg-slate-50 px-1.5 py-0.5">
              {t("moreIoc", { count: step.iocEvidences.length - 1 })}
            </span>
          ) : null}
          {step.attackMarks.length > 1 ? (
            <span className="rounded-md bg-slate-50 px-1.5 py-0.5">
              {t("moreMarks", { count: step.attackMarks.length - 1 })}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function TimelineEventRow({
  step,
  snapshotId,
  loadingHost,
  onHostClick,
  isLast,
}: {
  step: AttackCaseStoryTimelineStep
  snapshotId: string
  loadingHost: boolean
  onHostClick: (agentId: string) => void
  isLast: boolean
}) {
  const Icon = STAGE_ICONS[step.phaseKey] ?? Bug
  const occurredAt = splitOccurredAt(step.occurredAt)
  const borderColor = `${step.phaseColor}66`

  return (
    <div className="grid min-w-[900px] grid-cols-[112px_56px_minmax(0,1fr)] gap-3">
      <div className="pt-5 text-right">
        <div className="font-mono text-xs font-semibold tabular-nums text-slate-800">
          {occurredAt.time}
        </div>
        {occurredAt.date ? (
          <div className="mt-1 font-mono text-[11px] font-semibold tabular-nums text-slate-400">
            {occurredAt.date}
          </div>
        ) : null}
      </div>

      <div className="relative flex justify-center pt-3">
        <span
          className={cn(
            "absolute left-1/2 top-0 w-px -translate-x-1/2 bg-slate-200",
            isLast ? "bottom-5" : "-bottom-4",
          )}
        />
        <div
          className="relative z-10 flex size-10 items-center justify-center rounded-full border bg-white shadow-sm"
          style={{ borderColor, color: step.phaseColor, backgroundColor: `${step.phaseColor}10` }}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>

      <TimelineEventCard
        step={step}
        snapshotId={snapshotId}
        loadingHost={loadingHost}
        onHostClick={onHostClick}
      />
    </div>
  )
}

function StorySummaryStrip({
  storySummary,
  eventCount,
}: {
  storySummary: string
  eventCount: number
}) {
  const t = useTranslations("pages.attack.dashboard.caseStory")

  return (
    <div className="mb-5 flex min-w-0 items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
      <span className="h-7 w-1 shrink-0 rounded-full bg-blue-600" />
      <p className="min-w-0 flex-1 truncate">
        {storySummary || t("summaryFallback")}
      </p>
      <span className="shrink-0 text-xs font-semibold text-slate-400">
        {t("summaryEvents", { count: eventCount })}
      </span>
    </div>
  )
}

function TimelineFrame({
  steps,
  snapshotId,
  loadingHostId,
  onHostClick,
}: {
  steps: AttackCaseStoryTimelineStep[]
  snapshotId: string
  loadingHostId: string | null
  onHostClick: (agentId: string) => void
}) {
  const t = useTranslations("pages.attack.dashboard.caseStory")

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-[112px_56px_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
          <div className="pl-2">{t("table.time")}</div>
          <div className="text-center">{t("table.phase")}</div>
          <div>{t("table.evidence")}</div>
        </div>
        <div className="max-h-[720px] overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <TimelineEventRow
                key={step.id}
                step={step}
                snapshotId={snapshotId}
                loadingHost={loadingHostId === step.agentId}
                onHostClick={onHostClick}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FactsStrip({
  items,
}: {
  items: Array<[string, number]>
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      {items.map(([label, value], index) => (
        <div key={label} className="flex items-center">
          {index > 0 ? <span className="mx-4 h-5 w-px bg-slate-200" /> : null}
          <span className="text-xs font-semibold text-slate-400">{label}</span>
          <span className="ml-3 text-sm font-bold tabular-nums text-slate-950">{value}</span>
        </div>
      ))}
    </div>
  )
}

function StoryHeaderIcon({
  icon: Icon,
  tone = "teal",
}: {
  icon: ComponentType<{ className?: string }>
  tone?: "teal" | "slate" | "blue" | "rose"
}) {
  const toneClassName = {
    teal: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600",
    slate: "bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 text-slate-500",
    blue: "bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100 text-blue-600",
    rose: "bg-gradient-to-br from-rose-50 via-red-50 to-rose-100 text-rose-600",
  }[tone]

  return (
    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", toneClassName)}>
      <Icon className="h-6 w-6" />
    </div>
  )
}

function AttackCaseStoryTimelineBody({
  steps,
  storySummary,
  snapshotId,
  eventCount,
  className,
}: AttackCaseStoryTimelineBodyProps) {
  const t = useTranslations("pages.attack.dashboard.caseStory")
  const [hostDialogOpen, setHostDialogOpen] = useState(false)
  const [selectedHostId, setSelectedHostId] = useState("")
  const [selectedHost, setSelectedHost] = useState<HostSelectorHostNode | null>(null)
  const [loadingHostId, setLoadingHostId] = useState<string | null>(null)
  const [hostInfoError, setHostInfoError] = useState("")

  async function handleHostClick(agentId: string) {
    const normalizedAgentId = agentId.trim()
    if (!normalizedAgentId) return

    setHostDialogOpen(true)
    setSelectedHostId(normalizedAgentId)
    setSelectedHost(null)
    setHostInfoError("")
    setLoadingHostId(normalizedAgentId)

    try {
      const detail = await getSingleHostDetail({ agentId: normalizedAgentId })
      if (!detail) {
        setHostInfoError(t("host.notFound", { host: normalizedAgentId }))
        return
      }

      let hardware: AgentHardwareInfo | null = null
      try {
        hardware = await getHardwareInfo({ agentId: normalizedAgentId, host: detail })
      } catch {
        hardware = null
      }

      setSelectedHost(toHostInfoNode(detail, hardware))
    } catch (error) {
      setHostInfoError(error instanceof Error ? error.message : t("host.failedFallback"))
    } finally {
      setLoadingHostId(null)
    }
  }

  if (steps.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center", className)}>
        <FileText className="mx-auto size-8 text-slate-400" />
        <p className="mt-3 text-sm text-slate-500">{t("empty.noEvidence")}</p>
      </div>
    )
  }

  return (
    <>
    <div className={cn("min-w-0", className)}>
      <StorySummaryStrip storySummary={storySummary} eventCount={eventCount || steps.length} />
      <TimelineFrame
        steps={steps}
        snapshotId={snapshotId}
        loadingHostId={loadingHostId}
        onHostClick={(agentId) => void handleHostClick(agentId)}
      />
    </div>

    <Dialog
      open={hostDialogOpen}
      onOpenChange={(open) => {
        setHostDialogOpen(open)
        if (!open) {
          setSelectedHost(null)
          setHostInfoError("")
          setLoadingHostId(null)
        }
      }}
    >
      <DialogContent className="w-auto max-w-[600px] border-none p-0 shadow-xl">
        <DialogTitle className="m-0 h-0 overflow-hidden p-0">
          <VisuallyHidden>{selectedHost?.hostname || selectedHostId || t("host.infoTitle")}</VisuallyHidden>
        </DialogTitle>
        {loadingHostId ? (
          <div className="flex min-w-[420px] flex-col items-center justify-center gap-3 rounded-lg border bg-white px-8 py-10 text-sm text-slate-500">
            <Loader2 className="size-5 animate-spin text-blue-600" />
            <div>{t("host.loading")}</div>
            <div className="max-w-[360px] truncate font-mono text-xs text-slate-400">{selectedHostId}</div>
          </div>
        ) : hostInfoError ? (
          <div className="min-w-[420px] rounded-lg border bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
              <AlertTriangle className="size-4" />
              {t("host.loadFailed")}
            </div>
            <p className="mt-2 break-words text-sm leading-6 text-slate-500">{hostInfoError}</p>
            {selectedHostId ? (
              <p className="mt-2 truncate font-mono text-xs text-slate-400">{selectedHostId}</p>
            ) : null}
          </div>
        ) : selectedHost ? (
          <HostInfoCard
            node={selectedHost}
            className="m-0 border-none p-0 shadow-none"
            reserveCloseSpace
          />
        ) : null}
      </DialogContent>
    </Dialog>
    </>
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
  const t = useTranslations("pages.attack.dashboard.caseStory")
  const hasCaseId = Boolean(caseId?.trim())

  return (
    <Card className="min-w-0 max-w-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <StoryHeaderIcon icon={Activity} tone="slate" />
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-slate-950">
              {t("title")}
            </CardTitle>
            <CardDescription className="mt-1">
              {hasCaseId
                ? t("empty.noTimelineData")
                : noCaseDescription ?? t("empty.selectCaseDescription")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-10">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
          <FileSearch className="size-8 text-slate-400" />
          <p className="text-sm text-slate-500">
            {hasCaseId
              ? t("empty.timelineEvidenceHint")
              : noCaseHint ?? t("empty.openCaseHint")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  const t = useTranslations("pages.attack.dashboard.caseStory")

  return (
    <Card className="min-w-0 max-w-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100 text-blue-600">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-slate-950">
              {t("loading.title")}
            </CardTitle>
            <CardDescription className="mt-1">
              {t("loading.description")}
            </CardDescription>
          </div>
        </div>
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
  snapshotId = "",
  timezone = "Asia/Shanghai",
  className,
  noCaseDescription,
  noCaseHint,
}: AttackCaseStoryTimelineRenderProps) {
  const t = useTranslations("pages.attack.dashboard.caseStory")
  const stageT = useTranslations("pages.attack.dashboard.stages")
  const locale = useLocale()
  const [data, setData] = useState<AttackCaseTimelineResult | null>(null)
  const [descriptions, setDescriptions] = useState<BatchDescribeEventSourceItem[]>([])
  const [storySummary, setStorySummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [describeWarning, setDescribeWarning] = useState<string | null>(null)
  const router = useRouter()
  const descriptionLanguage = useMemo(
    () => (locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"),
    [locale],
  )

  async function loadTimeline(nextCaseId = caseId) {
    const normalizedCaseId = nextCaseId.trim()
    if (!normalizedCaseId) {
      setData(null)
      setDescriptions([])
      setStorySummary("")
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
          language: descriptionLanguage,
          includeEventSource: false,
          includeAllFields: false,
        })
        setDescriptions(described.items)
        setStorySummary(formatStorySummary(described.story_summary || described.story_short_summary))
      } catch (err) {
        console.error("describe attack story source events failed", err)
        setDescriptions([])
        setStorySummary("")
        setDescribeWarning(t("describeWarning"))
      }
    } catch (err) {
      console.error("load attack case timeline failed", err)
      setData(null)
      setDescriptions([])
      setStorySummary("")
      setError(err instanceof Error ? err.message : t("loadErrorFallback"))
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
        setStorySummary("")
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
          setStorySummary("")
          return
        }

        try {
          const described = await batchDescribeEventSourcesByKeys({
            keys,
            tenantId: result?.case.tenant_id,
            language: descriptionLanguage,
            includeEventSource: false,
            includeAllFields: false,
          })
          if (!cancelled) {
            setDescriptions(described.items)
            setStorySummary(formatStorySummary(described.story_summary || described.story_short_summary))
          }
        } catch (err) {
          console.error("describe attack story source events failed", err)
          if (!cancelled) {
            setDescriptions([])
            setStorySummary("")
            setDescribeWarning(t("describeWarning"))
          }
        }
      } catch (err) {
        console.error("load attack case timeline failed", err)
        if (!cancelled) {
          setData(null)
          setDescriptions([])
          setStorySummary("")
          setError(err instanceof Error ? err.message : t("loadErrorFallback"))
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
  }, [caseId, descriptionLanguage, t, timezone])

  const events = useMemo(() => flattenTimelineEvents(data), [data])
  const descriptionMap = useMemo(() => buildDescriptionMap(descriptions), [descriptions])
  const storySteps = useMemo(
    () =>
      buildStorySteps(events, descriptionMap, {
        fallbackEvidenceText: t("fallbackEvidence"),
        unknownStageLabel: t("unknown"),
        stageLabel: (stage) => stageT(`${stage}.label`),
      }),
    [descriptionMap, events, stageT, t],
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
          <div className="flex min-w-0 items-center gap-4">
            <StoryHeaderIcon icon={AlertTriangle} tone="rose" />
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold text-slate-950">
                {t("title")}
              </CardTitle>
              <CardDescription className="mt-1">{error}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 px-6 py-6">
          <p className="text-sm text-slate-500">{t("loadErrorMessage")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadTimeline()}>
            <RefreshCw className="mr-2 size-4" />
            {t("retry")}
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-4">
              <StoryHeaderIcon icon={ShieldAlert} tone="teal" />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <CardTitle className="truncate text-lg font-semibold text-slate-950">
                    {t("title")}
                  </CardTitle>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={t("backToCaseList")}
                          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-sky-100 bg-sky-50/80 text-sky-700 shadow-sm transition-all duration-150 hover:-translate-x-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 motion-reduce:transform-none motion-reduce:transition-none"
                          onClick={() => router.push(buildAttackDetailHref(summary.case_id, snapshotId))}
                        >
                          <ArrowLeft className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {t("backToCaseList")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription className="mt-1">
                  {t("description")}
                </CardDescription>
              </div>
            </div>
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50/70 px-2.5 py-1 text-left font-mono text-xs font-semibold text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                title={t("caseButtonTitle")}
                onClick={() => router.push(buildAttackDetailHref(summary.case_id, snapshotId))}
              >
                <FileText className="size-3.5 shrink-0" />
                <span className="min-w-0 truncate">Case {summary.case_id}</span>
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                <ShieldAlert className="size-3.5 shrink-0" />
                {summary.severity || t("unknown")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/60 px-2.5 py-1 text-xs font-medium text-blue-700">
                <CalendarClock className="size-3.5 shrink-0" />
                {formatRange(summary.start_time, summary.end_time)}
              </span>
            </div>
          </div>
          <FactsStrip
            items={[
              [t("facts.rules"), summary.rule_count],
              [t("facts.hosts"), summary.host_count],
              [t("facts.instances"), summary.instance_count],
              [t("facts.evidence"), summary.evidence_count],
            ]}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full px-6 py-5">
        {describeWarning ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {describeWarning}
          </div>
        ) : null}
        <AttackCaseStoryTimelineBody
          steps={storySteps}
          storySummary={storySummary}
          snapshotId={snapshotId}
          eventCount={summary.evidence_count}
        />
      </CardContent>
    </Card>
  )
}
