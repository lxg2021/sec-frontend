import {
  ATTCK_STAGE_DEFINITIONS,
  getAttckStageDefinition,
  resolveAttckStage,
  type AttckStageKey,
} from "@/features/attack/constants/attck-stages"
import type {
  AttackCaseTimelineResult,
  AttackGroupTimelineInstance,
  AttackIocEvidence,
  AttackTimelineEvidenceItem,
  BatchDescribeEventSourceItem,
  EventSourceDescriptionKey,
  EventSourceDescriptionSlot,
} from "@/features/attack/dashboard/types"
import { extractTechniques, firstFilled, formatOccurredAt } from "./attack-case-format"

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

export interface TimelineEvent {
  item: AttackTimelineEvidenceItem
  instance: AttackGroupTimelineInstance
  stageKey: AttckStageKey | "unknown"
}

function isRuleDetectionMarker(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}:\d+:[a-z0-9_.-]+$/i.test(value.trim())
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

export function flattenTimelineEvents(data: AttackCaseTimelineResult | null): TimelineEvent[] {
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

export function buildDescriptionKeys(events: TimelineEvent[]): EventSourceDescriptionKey[] {
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

export function buildDescriptionMap(items: BatchDescribeEventSourceItem[]) {
  const descriptions = new Map<string, BatchDescribeEventSourceItem>()
  for (const item of items) {
    descriptions.set(descriptionKeyId(item.key), item)
  }
  return descriptions
}

export function buildStorySteps(
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
