"use client"

import { useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
} from "lucide-react"

import { HighlightIOC } from "@/features/investigation-assistant/components/highlight-ioc"
import type {
  AIInvestigationResult,
  InvestigationAssistantLanguage,
  InvestigationAssistantConfidence,
  InvestigationAttackObjective,
  InvestigationConfirmedFact,
  InvestigationMissingEvidence,
  InvestigationNextAction,
  InvestigationVerificationItem,
} from "@/features/investigation-assistant/types"
import { cn } from "@/shared/lib/utils"

type Confidence = "high" | "medium" | "low"

interface InvestigationAssistantProps {
  data: AIInvestigationResult
  language?: InvestigationAssistantLanguage
  className?: string
  onActionClick?: (action: InvestigationNextAction) => void | Promise<void>
  onContinueInvestigation?: () => void
  continueInvestigationDisabled?: boolean
  continueInvestigationLoading?: boolean
  continueInvestigationDisabledReason?: string
}

const confidenceStyle: Record<Confidence, { dot: string; badge: string }> = {
  high: {
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
  medium: {
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  low: {
    dot: "bg-slate-400",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
}

const assistantCopy = {
  "zh-CN": {
    title: "AI 调查助手",
    criticalEvent: "高危事件",
    currentAssessment: "当前研判",
    confirmedFacts: "已确认事实",
    attackObjectives: "攻击目标",
    evidenceToVerify: "待补充证据",
    finalizable: "可结案",
    investigating: "调查中",
    executed: "已执行",
    executing: "执行中",
    investigate: "调查",
    continueInvestigation: "继续研判",
    continuingInvestigation: "研判中",
    noNewGraphContext: "暂无新增图谱上下文",
    confidence: {
      high: "高置信",
      medium: "中置信",
      low: "低置信",
    },
  },
  en: {
    title: "AI Investigation Assistant",
    criticalEvent: "Critical Event",
    currentAssessment: "Current Assessment",
    confirmedFacts: "Confirmed Facts",
    attackObjectives: "Attack Objectives",
    evidenceToVerify: "Evidence To Verify",
    finalizable: "Ready to Close",
    investigating: "Investigating",
    executed: "Done",
    executing: "Running",
    investigate: "Investigate",
    continueInvestigation: "Continue Analysis",
    continuingInvestigation: "Analyzing",
    noNewGraphContext: "No new graph context",
    confidence: {
      high: "High Confidence",
      medium: "Medium Confidence",
      low: "Low Confidence",
    },
  },
} satisfies Record<InvestigationAssistantLanguage, {
  title: string
  criticalEvent: string
  currentAssessment: string
  confirmedFacts: string
  attackObjectives: string
  evidenceToVerify: string
  finalizable: string
  investigating: string
  executed: string
  executing: string
  investigate: string
  continueInvestigation: string
  continuingInvestigation: string
  noNewGraphContext: string
  confidence: Record<Confidence, string>
}>

function normalizeAssistantLanguage(language?: InvestigationAssistantLanguage): InvestigationAssistantLanguage {
  return language === "en" ? "en" : "zh-CN"
}

function safeList<T>(items: T[] | null | undefined): T[] {
  return Array.isArray(items) ? items : []
}

function confidenceLevel(value?: InvestigationAssistantConfidence): Confidence {
  const normalized = String(value || "").toLowerCase()
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized
  return "low"
}

function cleanText(value: string | undefined, language: InvestigationAssistantLanguage = "zh-CN") {
  const normalized = (value || "")
    .replace(/\s+/g, " ")
    .trim()

  if (language === "en") {
    return normalized
      .replace(/无直接边连接/gi, "no direct edge connection")
      .replace(/load\/execute\s*边/gi, "load/execute edge")
      .replace(/PROCESS_LOAD_DLL\s*边/gi, "PROCESS_LOAD_DLL edge")
      .replace(/边连接/gi, "edge connection")
  }

  return normalized
    .replace(/（\s*无\s*load\/execute\s*边\s*）/gi, "")
    .replace(/\(\s*无\s*load\/execute\s*边\s*\)/gi, "")
    .replace(/load\/execute\s*边/gi, "加载或执行关系")
    .replace(/PROCESS_LOAD_DLL\s*边/gi, "DLL 加载关系")
    .replace(/当前图仅显示/gi, "当前只确认")
    .replace(/图上还没有/gi, "目前还没有")
    .replace(/无直接边连接/gi, "目前还没有直接关系")
    .replace(/边连接/gi, "关系连接")
}

function ConfidenceDot({
  labels,
  level,
}: {
  labels: Record<Confidence, string>
  level: Confidence
}) {
  const config = confidenceStyle[level]

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5", config.badge)}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", config.dot)} />
      <span className="text-[10px] font-semibold">{labels[level]}</span>
    </span>
  )
}

function SectionLabel({
  icon,
  title,
  count,
  countColor = "text-slate-500",
  accent = "text-slate-500",
}: {
  icon: ReactNode
  title: string
  count?: number
  countColor?: string
  accent?: string
}) {
  return (
    <div className="mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
      <span className={accent}>{icon}</span>
      <span className="text-[12px] font-semibold text-slate-700">{title}</span>
      {count !== undefined ? (
        <span
          className={cn(
            "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border bg-white px-1.5 text-[11px] font-bold tabular-nums shadow-sm",
            countColor,
          )}
        >
          {count}
        </span>
      ) : null}
    </div>
  )
}

function actionKey(action: InvestigationNextAction, index: number) {
  return action.action_id ? `${action.action_id}:${index}` : `action:${index}`
}

function actionButtonLabel(action: InvestigationNextAction, fallback: string) {
  return fallback || action.label?.trim()
}

interface RenderVerificationItem {
  id: string
  title: string
  action?: InvestigationNextAction
}

function buildLegacyVerificationItems(
  missingEvidence: InvestigationMissingEvidence[],
  nextActions: InvestigationNextAction[],
  language: InvestigationAssistantLanguage,
): RenderVerificationItem[] {
  return missingEvidence.map((item, index) => ({
    id: `legacy:${index}`,
    title: cleanText(item.text, language),
    action: nextActions[index],
  }))
}

function buildVerificationItems(
  verificationItems: InvestigationVerificationItem[],
  missingEvidence: InvestigationMissingEvidence[],
  nextActions: InvestigationNextAction[],
  language: InvestigationAssistantLanguage,
): RenderVerificationItem[] {
  if (verificationItems.length) {
    return verificationItems.map((item, index) => ({
      id: item.id || `verification:${index}`,
      title: cleanText(item.title, language),
      action: item.action,
    }))
  }
  return buildLegacyVerificationItems(missingEvidence, nextActions, language)
}

export function InvestigationAssistant({
  data,
  language = "zh-CN",
  className,
  onActionClick,
  onContinueInvestigation,
  continueInvestigationDisabled = false,
  continueInvestigationLoading = false,
  continueInvestigationDisabledReason,
}: InvestigationAssistantProps) {
  const resolvedLanguage = normalizeAssistantLanguage(language)
  const copy = assistantCopy[resolvedLanguage]
  const [executed, setExecuted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const confirmedFacts = safeList<InvestigationConfirmedFact>(data.confirmed_facts)
  const attackObjectives = safeList<InvestigationAttackObjective>(data.attack_objectives)
  const verificationItems = safeList<InvestigationVerificationItem>(data.verification_items)
  const missingEvidence = safeList<InvestigationMissingEvidence>(data.missing_evidence)
  const nextActions = safeList<InvestigationNextAction>(data.next_actions)
  const renderedVerificationItems = buildVerificationItems(verificationItems, missingEvidence, nextActions, resolvedLanguage)
  const objectiveKeywords = attackObjectives.map((objective) => objective.name).filter(Boolean)
  const confidence = confidenceLevel(data.confidence)

  async function handleExecute(action: InvestigationNextAction, index: number) {
    const key = actionKey(action, index)
    if (loading || executed.has(key)) return

    setLoading(key)
    try {
      await onActionClick?.(action)
      setExecuted((current) => new Set(current).add(key))
    } finally {
      setLoading(null)
    }
  }

  return (
    <section
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.07)]",
        className,
      )}
      aria-label={copy.title}
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
            <Bot className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-950">{copy.title}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
          <ShieldAlert className="h-3.5 w-3.5" />
          {copy.criticalEvent}
        </span>
        <div className="ml-auto" />
        {onContinueInvestigation ? (
          <button
            type="button"
            onClick={onContinueInvestigation}
            disabled={continueInvestigationDisabled || continueInvestigationLoading}
            title={
              continueInvestigationDisabled && !continueInvestigationLoading
                ? continueInvestigationDisabledReason || copy.noNewGraphContext
                : undefined
            }
            aria-busy={continueInvestigationLoading}
            className={cn(
              "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              continueInvestigationDisabled || continueInvestigationLoading
                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none"
                : "border border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700",
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", continueInvestigationLoading ? "animate-spin" : "")} />
            {continueInvestigationLoading ? copy.continuingInvestigation : copy.continueInvestigation}
          </button>
        ) : null}
      </header>

      <div className="bg-slate-50/70 px-5 py-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
          <section className="flex min-h-[250px] flex-col rounded-xl border border-red-100 bg-white p-4 shadow-sm">
            <SectionLabel
              icon={<AlertTriangle className="h-4 w-4" />}
              title={copy.currentAssessment}
              accent="text-red-500"
            />
            <p className="flex-1 text-pretty text-sm font-semibold leading-7 text-slate-800">
              <HighlightIOC text={cleanText(data.current_assessment, resolvedLanguage)} keywords={objectiveKeywords} />
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <ConfidenceDot labels={copy.confidence} level={confidence} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {data.can_finalize ? copy.finalizable : copy.investigating}
              </span>
            </div>
          </section>

          <section className="min-h-[250px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200">
            <SectionLabel
              icon={<CheckCircle2 className="h-4 w-4" />}
              title={copy.confirmedFacts}
              count={confirmedFacts.length}
              countColor="border-emerald-200 text-emerald-600"
              accent="text-emerald-600"
            />
            <ol className="space-y-3">
              {confirmedFacts.map((fact, index) => (
                <li key={`${fact.text}-${index}`} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                    <span className="text-[10px] font-bold text-emerald-700">{index + 1}</span>
                  </span>
                  <p className="text-xs font-medium leading-6 text-slate-700">
                    <HighlightIOC text={cleanText(fact.text, resolvedLanguage)} />
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="min-h-[250px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200">
            <SectionLabel
              icon={<Target className="h-4 w-4" />}
              title={copy.attackObjectives}
              count={attackObjectives.length}
              countColor="border-red-200 text-red-600"
              accent="text-red-500"
            />
            <div className="space-y-2.5">
              {attackObjectives.map((objective, index) => (
                <div
                  key={`${objective.name}-${index}`}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition-colors hover:bg-white"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-red-600">{objective.name}</span>
                    <ConfidenceDot labels={copy.confidence} level={confidenceLevel(objective.confidence)} />
                  </div>
                  <p className="text-xs leading-5 text-slate-600">
                    <HighlightIOC text={cleanText(objective.reason, resolvedLanguage)} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="min-h-[250px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200">
            <SectionLabel
              icon={<Search className="h-4 w-4" />}
              title={copy.evidenceToVerify}
              count={renderedVerificationItems.length}
              countColor="border-amber-200 text-amber-600"
              accent="text-amber-500"
            />
            <div className="space-y-3">
              {renderedVerificationItems.map((item, index) => {
                const action = item.action
                const key = action ? actionKey(action, index) : `missing:${index}`
                const done = action ? executed.has(key) : false
                const busy = action ? loading === key : false

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 transition-all",
                      done ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50/70 hover:border-blue-100 hover:bg-white",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Circle className="mt-1 h-3 w-3 flex-shrink-0 text-amber-500" />
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-5 text-slate-700">
                            <HighlightIOC text={item.title} />
                          </p>
                        </div>

                        {action ? (
                          <button
                            type="button"
                            onClick={() => void handleExecute(action, index)}
                            disabled={done || busy}
                            className={cn(
                              "inline-flex min-h-8 flex-shrink-0 cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                              done
                                ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : busy
                                  ? "cursor-wait border border-blue-200 bg-blue-50 text-blue-700"
                                  : "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
                            )}
                          >
                            {done ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                {copy.executed}
                              </>
                            ) : busy ? (
                              <>
                                <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-blue-600 border-t-transparent" />
                                {copy.executing}
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3" />
                                {actionButtonLabel(action, copy.investigate)}
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
