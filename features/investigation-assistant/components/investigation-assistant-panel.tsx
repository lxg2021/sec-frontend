"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Bot, Loader2, RotateCcw } from "lucide-react"

import { previewAIInvestigation } from "@/features/investigation-assistant/api"
import { InvestigationAssistant } from "@/features/investigation-assistant/components/investigation-assistant"
import type {
  AIInvestigationPreviewData,
  AIInvestigationValidationIssue,
  InvestigationAssistantLanguage,
  InvestigationNextAction,
} from "@/features/investigation-assistant/types"
import { cn } from "@/shared/lib/utils"

export interface InvestigationAssistantPanelProps {
  caseId: string
  language?: InvestigationAssistantLanguage
  focusNodeIds?: string[]
  className?: string
  onActionClick?: (action: InvestigationNextAction) => void | Promise<void>
}

type PreviewState = "idle" | "loading" | "ready" | "invalid" | "error"

function normalizeFocusNodeIds(value: string[] | undefined) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean)
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message
  return "调查建议生成失败。"
}

function stateTitle(state: PreviewState) {
  if (state === "loading") return "正在生成调查建议"
  if (state === "invalid") return "调查建议未通过校验"
  if (state === "error") return "调查建议生成失败"
  return "AI 调查助手"
}

function stateDescription(state: PreviewState, message?: string) {
  if (state === "loading") return "正在基于当前 CASE 图谱生成待验证事项。"
  if (state === "invalid") return "后端已经拦截了不稳定的 AI 输出，请重试或查看校验问题。"
  if (state === "error") return message || "请确认后端服务、网关权限映射和 AI provider 配置正常。"
  return ""
}

function InvestigationAssistantStateCard({
  className,
  issues,
  message,
  onRetry,
  state,
}: {
  className?: string
  issues?: AIInvestigationValidationIssue[]
  message?: string
  onRetry?: () => void
  state: PreviewState
}) {
  const isLoading = state === "loading"
  const isWarning = state === "invalid"

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.07)]",
        className,
      )}
      aria-busy={isLoading}
      aria-label="AI 调查助手"
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        </span>
        <span className="text-base font-bold tracking-tight text-slate-950">AI 调查助手</span>
      </header>

      <div className="bg-slate-50/70 px-5 py-5">
        <div
          className={cn(
            "rounded-xl border bg-white p-4 shadow-sm",
            isWarning ? "border-amber-200" : state === "error" ? "border-red-200" : "border-slate-200",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                isWarning
                  ? "border-amber-200 bg-amber-50 text-amber-600"
                  : state === "error"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-blue-100 bg-blue-50 text-blue-600",
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900">{stateTitle(state)}</h3>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                {stateDescription(state, message)}
              </p>
              {issues?.length ? (
                <ul className="mt-3 space-y-1.5">
                  {issues.slice(0, 3).map((issue, index) => (
                    <li key={`${issue.code || "issue"}:${issue.field || index}`} className="text-xs leading-5 text-slate-600">
                      <span className="font-semibold text-red-600">{issue.code || "校验失败"}</span>
                      {issue.field ? <span className="text-slate-400"> / {issue.field}</span> : null}
                      {issue.message ? <span>：{issue.message}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {!isLoading && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-3 w-3" />
                重试
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export function InvestigationAssistantPanel({
  caseId,
  className,
  focusNodeIds,
  language = "zh-CN",
  onActionClick,
}: InvestigationAssistantPanelProps) {
  const normalizedCaseId = caseId.trim()
  const normalizedFocusNodeIds = useMemo(() => normalizeFocusNodeIds(focusNodeIds), [focusNodeIds])
  const focusKey = normalizedFocusNodeIds.join("|")
  const [preview, setPreview] = useState<AIInvestigationPreviewData | null>(null)
  const [state, setState] = useState<PreviewState>("idle")
  const [message, setMessage] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!normalizedCaseId) {
      setPreview(null)
      setState("idle")
      setMessage("")
      return
    }

    const controller = new AbortController()
    setState("loading")
    setMessage("")

    previewAIInvestigation({
      caseId: normalizedCaseId,
      focusNodeIds: focusKey ? focusKey.split("|") : undefined,
      language,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return
        setPreview(data)
        if (!data?.assistant_result) {
          setState("error")
          setMessage("后端没有返回可展示的调查建议。")
          return
        }
        if (data.validation?.valid === false) {
          setState("invalid")
          setMessage("")
          return
        }
        setState("ready")
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setPreview(null)
        setState("error")
        setMessage(errorMessage(error))
      })

    return () => {
      controller.abort()
    }
  }, [focusKey, language, normalizedCaseId, reloadKey])

  if (!normalizedCaseId) {
    return null
  }

  if (state === "loading" || state === "error" || state === "invalid") {
    return (
      <InvestigationAssistantStateCard
        className={className}
        issues={preview?.validation?.errors}
        message={message}
        onRetry={() => setReloadKey((key) => key + 1)}
        state={state}
      />
    )
  }

  const data = preview?.assistant_result
  if (!data) return null

  return (
    <InvestigationAssistant
      className={className}
      data={{
        ...data,
        case_id: data.case_id || normalizedCaseId,
      }}
      onActionClick={onActionClick}
    />
  )
}
