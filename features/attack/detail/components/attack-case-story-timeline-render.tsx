"use client"

import type { ComponentType } from "react"
import {
  Activity,
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
  Search,
  ShieldOff,
  Terminal,
  Upload,
  Wrench,
  Zap,
} from "lucide-react"

import type { AttckStageKey } from "@/features/attack/constants/attck-stages"
import type {
  AttackIocEvidence,
  EventSourceDescriptionSlot,
} from "@/features/attack/dashboard/types"
import { cn } from "@/shared/lib/utils"

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
  iocEvidences: AttackIocEvidence[]
  slots: EventSourceDescriptionSlot[]
  describeStatus: string
  missReason: string
}

interface AttackCaseStoryTimelineRenderProps {
  steps: AttackCaseStoryTimelineStep[]
  className?: string
}

function compactId(value: string, visible = 10) {
  if (!value) return ""
  return value.length > visible ? `${value.slice(0, visible)}...` : value
}

function firstFilled(...values: string[]) {
  return values.find((value) => value.trim())?.trim() ?? ""
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

function StepBranches({ step }: { step: AttackCaseStoryTimelineStep }) {
  const slots = visibleSlots(step.slots)
  const rule = firstFilled(step.ruleTitle, step.detectionName, step.ruleId)
  const firstIoc = step.iocEvidences[0]
  const firstMark = step.attackMarks[0]
  const status =
    step.describeStatus && step.describeStatus !== "ok"
      ? firstFilled(step.missReason, step.describeStatus)
      : ""

  const lines = [
    step.summary,
    rule ? `Rule: ${rule}` : "",
    firstIoc ? `IOC: ${formatIocLine(firstIoc)}` : "",
    firstMark ? `ATT&CK: ${firstMark}` : "",
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

export function AttackCaseStoryTimelineRender({
  steps,
  className,
}: AttackCaseStoryTimelineRenderProps) {
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
        <div className="absolute bottom-4 left-[120px] top-4 w-px bg-slate-200" />

        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = STAGE_ICONS[step.phaseKey] ?? Bug
            const borderColor = `${step.phaseColor}66`

            return (
              <div
                key={step.id}
                className="relative grid grid-cols-[72px_40px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md"
                style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
              >
                <div className="pt-1 text-right font-mono text-sm font-semibold tabular-nums text-slate-700">
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
