"use client"

import { useState, type ComponentType } from "react"
import { useTranslations } from "next-intl"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
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
  FileText,
  KeyRound,
  Loader2,
  Search,
  ShieldOff,
  Terminal,
  Upload,
  Wrench,
  Zap,
} from "lucide-react"

import type { AttckStageKey } from "@/features/attack/constants/attck-stages"
import { fetchAttackRuleDetail } from "@/features/attack/dashboard/api"
import { getHardwareInfo, getSingleHostDetail } from "@/features/assets/host/api"
import { HostInfoCard } from "@/features/assets/host/components/host-info-card"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import type { AttackRuleMeta } from "@/features/attack/utils/attck-utils"
import type { HostSelectorHostNode } from "@/shared/components/host-selector/types"
import { RuleInfoPopover } from "@/features/baseline/rules/components/rule-info-popover"
import { cn } from "@/shared/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import type { AttackCaseStoryTimelineStep } from "../utils/attack-story-timeline-model"
import {
  firstFilled,
  formatBehavior,
  formatIocLine,
  splitOccurredAt,
  techniqueHref,
} from "../utils/attack-case-format"

interface AttackCaseStoryTimelineBodyProps {
  steps: AttackCaseStoryTimelineStep[]
  storySummary: string
  snapshotId: string
  eventCount: number
  className?: string
}

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

function TruncatedText({
  value,
  tooltipValue,
  className,
  tooltipClassName,
}: {
  value: string
  tooltipValue?: string
  className?: string
  tooltipClassName?: string
}) {
  if (!value) return null
  const displayTooltip = tooltipValue || value

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("block min-w-0 max-w-full truncate", className)}>
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className={cn("max-w-[760px] break-all text-xs leading-5", tooltipClassName)}
      >
        {displayTooltip}
      </TooltipContent>
    </Tooltip>
  )
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
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs leading-4 text-slate-600"
    >
      <span className="shrink-0 font-semibold text-slate-400">{label}</span>
      <TruncatedText
        value={value}
        tooltipValue={title || `${label}: ${value}`}
        className={cn("font-semibold text-slate-700", monoValue && "font-mono", valueClassName)}
        tooltipClassName={monoValue ? "font-mono" : undefined}
      />
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

      <div className="mt-2 min-w-0 text-sm leading-6 text-slate-700">
        <TruncatedText value={step.summary} />
      </div>

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
            <TruncatedText value={ruleTitle} className="text-sm font-medium text-slate-700" />
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
  const summaryText = storySummary || t("summaryFallback")

  return (
    <div className="mb-5 flex min-w-0 items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
      <span className="min-h-7 w-1 self-stretch rounded-full bg-blue-600" />
      <p className="min-w-0 flex-1 whitespace-normal break-words">
        {summaryText}
      </p>
      <span className="shrink-0 pt-1 text-xs font-semibold text-slate-400">
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

export function FactsStrip({
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

export function StoryHeaderIcon({
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

export function AttackCaseStoryTimelineBody({
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
    <TooltipProvider delayDuration={150}>
      <div className={cn("min-w-0", className)}>
        <StorySummaryStrip storySummary={storySummary} eventCount={eventCount || steps.length} />
        <TimelineFrame
          steps={steps}
          snapshotId={snapshotId}
          loadingHostId={loadingHostId}
          onHostClick={(agentId) => void handleHostClick(agentId)}
        />
      </div>
    </TooltipProvider>

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
