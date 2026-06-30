"use client"

import { useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  Search,
  ShieldAlert,
  Target,
} from "lucide-react"

import { HighlightIOC } from "@/features/investigation-assistant/components/highlight-ioc"
import type {
  AIInvestigationResult,
  InvestigationAssistantConfidence,
  InvestigationAttackObjective,
  InvestigationConfirmedFact,
  InvestigationMissingEvidence,
  InvestigationNextAction,
} from "@/features/investigation-assistant/types"
import { cn } from "@/shared/lib/utils"

type Confidence = "high" | "medium" | "low"

interface InvestigationAssistantProps {
  data: AIInvestigationResult
  className?: string
  onActionClick?: (action: InvestigationNextAction) => void | Promise<void>
}

const confidenceConfig: Record<Confidence, { label: string; dot: string; text: string; badge: string }> = {
  high: {
    label: "高置信",
    dot: "bg-red-500",
    text: "text-red-600",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
  medium: {
    label: "中置信",
    dot: "bg-amber-500",
    text: "text-amber-600",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  low: {
    label: "低置信",
    dot: "bg-slate-400",
    text: "text-slate-500",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
}

function safeList<T>(items: T[] | null | undefined): T[] {
  return Array.isArray(items) ? items : []
}

function confidenceLevel(value?: InvestigationAssistantConfidence): Confidence {
  const normalized = String(value || "").toLowerCase()
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized
  return "low"
}

function cleanText(value: string | undefined) {
  return (value || "")
    .replace(/（\s*无\s*load\/execute\s*边\s*）/gi, "")
    .replace(/\(\s*无\s*load\/execute\s*边\s*\)/gi, "")
    .replace(/load\/execute\s*边/gi, "加载或执行关系")
    .replace(/PROCESS_LOAD_DLL\s*边/gi, "DLL 加载关系")
    .replace(/当前图仅显示/gi, "当前只确认")
    .replace(/图上还没有/gi, "目前还没有")
    .replace(/无直接边连接/gi, "目前还没有直接关系")
    .replace(/边连接/gi, "关系连接")
    .replace(/\s+/g, " ")
    .trim()
}

function ConfidenceDot({ level }: { level: Confidence }) {
  const config = confidenceConfig[level]

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5", config.badge)}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", config.dot)} />
      <span className="text-[10px] font-semibold">{config.label}</span>
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

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function basename(value: string) {
  const normalized = value.replace(/\\/g, "/")
  return normalized.split("/").filter(Boolean).pop() || value
}

function targetFromNodeID(nodeID: string) {
  const parts = nodeID.split(":")
  const kind = parts[0]

  if (kind === "file" && parts.length >= 4) {
    return basename(parts.slice(3).join(":"))
  }

  if (kind === "net_endpoint" && parts.length >= 4) {
    return `${parts[2]}:${parts[3]}`
  }

  if (kind === "net_address" && parts.length >= 3) {
    return parts[2]
  }

  return ""
}

function targetsFromAction(action?: InvestigationNextAction) {
  if (!action) return []

  const nodeTargets = safeList(action.target_node_ids).map(targetFromNodeID)
  const textTargets = `${action.label} ${action.reason}`.match(/\b[\w.\-\[\]]+\.(?:dll|exe|mso|sys|bat|ps1|vbs)\b/gi) || []
  const merged = unique([...nodeTargets, ...textTargets])
  const endpoints = merged.filter((item) => /^\d{1,3}(?:\.\d{1,3}){3}:\d{1,5}$/.test(item))

  return merged.filter((item) => {
    if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(item)) return true
    return !endpoints.some((endpoint) => endpoint.startsWith(`${item}:`))
  })
}

function actionButtonLabel() {
  return "调查"
}

function targetText(targets: string[]) {
  return targets.join("、")
}

function evidenceTitle(item: InvestigationMissingEvidence, action: InvestigationNextAction | undefined, targets: string[]) {
  const actionID = action?.action_id || ""
  const target = targetText(targets)
  const primaryTarget = targets[0]

  if (actionID.includes("file_load") && target) {
    return `${target} 是否被加载或执行。`
  }

  if (actionID.includes("network") && primaryTarget) {
    return `远程地址 ${primaryTarget} 的恶意性未确认。`
  }

  if (actionID.includes("children")) {
    return primaryTarget ? `查询 ${primaryTarget} 子进程` : "查询子进程"
  }

  return cleanText(item.text)
}

export function InvestigationAssistant({
  data,
  className,
  onActionClick,
}: InvestigationAssistantProps) {
  const [executed, setExecuted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const caseId = data.case_id || ""
  const caseIdShort = caseId ? caseId.slice(0, 8).toUpperCase() : "UNKNOWN"
  const confirmedFacts = safeList<InvestigationConfirmedFact>(data.confirmed_facts)
  const attackObjectives = safeList<InvestigationAttackObjective>(data.attack_objectives)
  const missingEvidence = safeList<InvestigationMissingEvidence>(data.missing_evidence)
  const nextActions = safeList<InvestigationNextAction>(data.next_actions)
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
        "overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.07)]",
        className,
      )}
      aria-label="AI 调查助手"
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
            <Bot className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-950">AI 调查助手</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <span className="text-xs font-medium text-slate-500">
          案例 <span className="font-mono font-semibold text-slate-700">{caseIdShort}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
          <ShieldAlert className="h-3.5 w-3.5" />
          高危事件
        </span>
        <div className="ml-auto" />
      </header>

      <div className="bg-slate-50/70 px-5 py-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <section className="flex min-h-[250px] flex-col rounded-xl border border-red-100 bg-white p-4 shadow-sm">
            <SectionLabel
              icon={<AlertTriangle className="h-4 w-4" />}
              title="当前研判"
              accent="text-red-500"
            />
            <p className="flex-1 text-pretty text-sm font-semibold leading-7 text-slate-800">
              <HighlightIOC text={cleanText(data.current_assessment)} keywords={objectiveKeywords} />
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <ConfidenceDot level={confidence} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {data.can_finalize ? "可结案" : "调查中"}
              </span>
            </div>
          </section>

          <section className="min-h-[250px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200">
            <SectionLabel
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="已确认事实"
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
                    <HighlightIOC text={cleanText(fact.text)} />
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="min-h-[250px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200">
            <SectionLabel
              icon={<Target className="h-4 w-4" />}
              title="攻击目标"
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
                    <ConfidenceDot level={confidenceLevel(objective.confidence)} />
                  </div>
                  <p className="text-xs leading-5 text-slate-600">
                    <HighlightIOC text={cleanText(objective.reason)} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="min-h-[250px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 xl:col-span-2">
            <SectionLabel
              icon={<Search className="h-4 w-4" />}
              title="待补充证据"
              count={missingEvidence.length}
              countColor="border-amber-200 text-amber-600"
              accent="text-amber-500"
            />
            <div className="space-y-3">
              {missingEvidence.map((item, index) => {
                const action = nextActions[index]
                const key = action ? actionKey(action, index) : `missing:${index}`
                const done = action ? executed.has(key) : false
                const busy = action ? loading === key : false
                const targets = targetsFromAction(action)

                return (
                  <div
                    key={`${item.text}-${index}`}
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
                            <HighlightIOC text={evidenceTitle(item, action, targets)} />
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
                                已执行
                              </>
                            ) : busy ? (
                              <>
                                <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-blue-600 border-t-transparent" />
                                执行中
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3" />
                                {actionButtonLabel()}
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
