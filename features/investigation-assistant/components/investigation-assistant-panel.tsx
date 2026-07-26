"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Bot, RotateCcw } from "lucide-react"
import Image from "next/image"

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
  graphContextVersion?: number
  className?: string
  onActionClick?: (action: InvestigationNextAction) => void | Promise<void>
}

type PreviewState = "idle" | "loading" | "ready" | "invalid" | "error"

const aiInvestigationLoaderSrc: Record<InvestigationAssistantLanguage, string> = {
  "zh-CN": "/icons/ai-investigation-loader.svg",
  en: "/icons/ai-investigation-loader-en.svg",
}

const panelCopy = {
  "zh-CN": {
    title: "AI 调查助手",
    loadingTitle: "正在生成调查建议",
    invalidTitle: "调查建议未通过校验",
    errorTitle: "调查建议生成失败",
    loadingDescription: "正在基于当前 CASE 图谱生成待验证事项。",
    invalidDescription: "后端已经拦截了不稳定的 AI 输出，请重试或查看校验问题。",
    errorDescription: "请确认后端服务、网关权限映射和 AI provider 配置正常。",
    defaultError: "调查建议生成失败。",
    noResult: "后端没有返回可展示的调查建议。",
    validationFailed: "校验失败",
    retry: "重试",
  },
  en: {
    title: "AI Investigation Assistant",
    loadingTitle: "Generating investigation suggestions",
    invalidTitle: "Investigation suggestions failed validation",
    errorTitle: "Failed to generate investigation suggestions",
    loadingDescription: "Generating verification items from the current CASE graph.",
    invalidDescription: "The backend rejected unstable AI output. Retry or review the validation issues.",
    errorDescription: "Check the backend service, gateway permissions, and AI provider configuration.",
    defaultError: "Failed to generate investigation suggestions.",
    noResult: "The backend did not return displayable investigation suggestions.",
    validationFailed: "Validation failed",
    retry: "Retry",
  },
} satisfies Record<InvestigationAssistantLanguage, {
  title: string
  loadingTitle: string
  invalidTitle: string
  errorTitle: string
  loadingDescription: string
  invalidDescription: string
  errorDescription: string
  defaultError: string
  noResult: string
  validationFailed: string
  retry: string
}>

function normalizeAssistantLanguage(language?: InvestigationAssistantLanguage): InvestigationAssistantLanguage {
  return language === "en" ? "en" : "zh-CN"
}

type PanelCopy = (typeof panelCopy)[InvestigationAssistantLanguage]

function normalizeFocusNodeIds(value: string[] | undefined) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean)
}

function errorMessage(error: unknown, copy: PanelCopy) {
  if (error instanceof Error && error.message.trim()) return error.message
  return copy.defaultError
}

function stateTitle(state: PreviewState, copy: PanelCopy) {
  if (state === "loading") return copy.loadingTitle
  if (state === "invalid") return copy.invalidTitle
  if (state === "error") return copy.errorTitle
  return copy.title
}

function stateDescription(state: PreviewState, copy: PanelCopy, message?: string) {
  if (state === "loading") return copy.loadingDescription
  if (state === "invalid") return copy.invalidDescription
  if (state === "error") return message || copy.errorDescription
  return ""
}

function InvestigationAssistantStateCard({
  className,
  issues,
  message,
  onRetry,
  state,
  language,
}: {
  className?: string
  issues?: AIInvestigationValidationIssue[]
  message?: string
  onRetry?: () => void
  state: PreviewState
  language: InvestigationAssistantLanguage
}) {
  const isLoading = state === "loading"
  const isWarning = state === "invalid"
  const copy = panelCopy[language]

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[24px] border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
        className,
      )}
      aria-busy={isLoading}
      aria-label={copy.title}
    >
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-slate-100 bg-white p-4 sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <Bot className="size-5" />
        </span>
        <span className="text-base font-medium leading-6 text-slate-950">{copy.title}</span>
      </header>

      {isLoading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center bg-slate-50/70 px-5 py-8">
          <Image
            src={aiInvestigationLoaderSrc[language]}
            alt=""
            width={320}
            height={220}
            unoptimized
            aria-hidden="true"
            className="h-[220px] w-[320px] max-w-full select-none"
            draggable={false}
          />
          <p className="sr-only">{stateDescription(state, copy, message)}</p>
        </div>
      ) : (
        <div className="bg-slate-50/70 px-5 py-5">
          <div
            className={cn(
              "rounded-2xl border bg-white p-4 shadow-sm",
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
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">{stateTitle(state, copy)}</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                  {stateDescription(state, copy, message)}
                </p>
                {issues?.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {issues.slice(0, 3).map((issue, index) => (
                      <li key={`${issue.code || "issue"}:${issue.field || index}`} className="text-xs leading-5 text-slate-600">
                        <span className="font-semibold text-red-600">{issue.code || copy.validationFailed}</span>
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
                  className="inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  {copy.retry}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export function InvestigationAssistantPanel({
  caseId,
  className,
  focusNodeIds,
  graphContextVersion = 0,
  language = "zh-CN",
  onActionClick,
}: InvestigationAssistantPanelProps) {
  const resolvedLanguage = normalizeAssistantLanguage(language)
  const copy = panelCopy[resolvedLanguage]
  const normalizedCaseId = caseId.trim()
  const normalizedFocusNodeIds = useMemo(() => normalizeFocusNodeIds(focusNodeIds), [focusNodeIds])
  const focusKey = normalizedFocusNodeIds.join("|")
  const [preview, setPreview] = useState<AIInvestigationPreviewData | null>(null)
  const [state, setState] = useState<PreviewState>("idle")
  const [message, setMessage] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [lastAnalyzedGraphVersion, setLastAnalyzedGraphVersion] = useState(graphContextVersion)
  const forceRefreshRef = useRef(false)
  const graphContextVersionRef = useRef(graphContextVersion)

  useEffect(() => {
    graphContextVersionRef.current = graphContextVersion
  }, [graphContextVersion])

  useEffect(() => {
    if (!normalizedCaseId) {
      setPreview(null)
      setState("idle")
      setMessage("")
      return
    }

    const controller = new AbortController()
    const forceRefresh = forceRefreshRef.current
    forceRefreshRef.current = false
    setState("loading")
    setMessage("")

    previewAIInvestigation({
      caseId: normalizedCaseId,
      forceRefresh,
      focusNodeIds: focusKey ? focusKey.split("|") : undefined,
      language: resolvedLanguage,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return
        setPreview(data)
        if (!data?.assistant_result) {
          setState("error")
          setMessage(copy.noResult)
          return
        }
        if (data.validation?.valid === false) {
          setState("invalid")
          setMessage("")
          return
        }
        setLastAnalyzedGraphVersion(graphContextVersionRef.current)
        setState("ready")
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setPreview(null)
        setState("error")
        setMessage(errorMessage(error, copy))
      })

    return () => {
      controller.abort()
    }
  }, [copy, focusKey, normalizedCaseId, reloadKey, resolvedLanguage])

  if (!normalizedCaseId) {
    return null
  }

  if (state === "loading" || state === "error" || state === "invalid") {
    return (
      <InvestigationAssistantStateCard
        className={className}
        issues={preview?.validation?.errors}
        language={resolvedLanguage}
        message={message}
        onRetry={() => setReloadKey((key) => key + 1)}
        state={state}
      />
    )
  }

  const data = preview?.assistant_result
  if (!data) return null

  const canContinueInvestigation = graphContextVersion > lastAnalyzedGraphVersion
  function handleContinueInvestigation() {
    if (!canContinueInvestigation) return
    forceRefreshRef.current = true
    setState("loading")
    setReloadKey((key) => key + 1)
  }

  return (
    <InvestigationAssistant
      className={className}
      data={{
        ...data,
        case_id: data.case_id || normalizedCaseId,
      }}
      language={resolvedLanguage}
      continueInvestigationDisabled={!canContinueInvestigation}
      onContinueInvestigation={handleContinueInvestigation}
      onActionClick={onActionClick}
    />
  )
}
