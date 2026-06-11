"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  FileSearch,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"

import {
  batchDescribeEventSourcesByKeys,
  fetchAttackCaseTimeline,
} from "@/features/attack/dashboard/api"
import type {
  AttackCaseTimelineResult,
  BatchDescribeEventSourceItem,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import {
  AttackCaseStoryTimelineBody,
  FactsStrip,
  StoryHeaderIcon,
} from "./attack-case-story-timeline-view"
import {
  buildDescriptionKeys,
  buildDescriptionMap,
  buildStorySteps,
  flattenTimelineEvents,
} from "../utils/attack-story-timeline-model"
import {
  buildAttackDetailHref,
  formatRange,
  formatStorySummary,
} from "../utils/attack-case-format"

interface AttackCaseStoryTimelineRenderProps {
  caseId?: string
  snapshotId?: string
  timezone?: string
  className?: string
  noCaseDescription?: string
  noCaseHint?: string
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

function MissingCaseState({ caseId }: { caseId: string }) {
  const t = useTranslations("pages.attack.dashboard.caseStory")

  return (
    <Card className="min-w-0 max-w-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <StoryHeaderIcon icon={FileSearch} tone="slate" />
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-slate-950">
              {t("title")}
            </CardTitle>
            <CardDescription className="mt-1">
              {t("missing.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-10">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-6 py-10 text-center">
          <FileSearch className="size-8 text-amber-500" />
          <p className="max-w-xl text-sm text-amber-800">
            {t("missing.hint", { caseId })}
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
  const [caseMissing, setCaseMissing] = useState(false)
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
      setCaseMissing(false)
      setDescribeWarning(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setCaseMissing(false)
    setDescribeWarning(null)
    try {
      const result = await fetchAttackCaseTimeline({
        caseId: normalizedCaseId,
        timezone,
      })
      if (!result) {
        setData(null)
        setDescriptions([])
        setStorySummary("")
        setCaseMissing(true)
        return
      }
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
        setDescriptions(described.items)
        setStorySummary(formatStorySummary(described.story_summary || described.story_short_summary))
      } catch (err) {
        logAsyncWarning("describe attack story source events failed", err)
        setDescriptions([])
        setStorySummary("")
        setDescribeWarning(t("describeWarning"))
      }
    } catch (err) {
      logAsyncWarning("load attack case timeline failed", err)
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
        setCaseMissing(false)
        setDescribeWarning(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setCaseMissing(false)
      setDescribeWarning(null)
      try {
        const result = await fetchAttackCaseTimeline({
          caseId: normalizedCaseId,
          timezone,
        })
        if (cancelled) return

        if (!result) {
          setData(null)
          setDescriptions([])
          setStorySummary("")
          setCaseMissing(true)
          return
        }

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
          logAsyncWarning("describe attack story source events failed", err)
          if (!cancelled) {
            setDescriptions([])
            setStorySummary("")
            setDescribeWarning(t("describeWarning"))
          }
        }
      } catch (err) {
        logAsyncWarning("load attack case timeline failed", err)
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

  if (caseMissing) {
    return <MissingCaseState caseId={caseId.trim()} />
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

function logAsyncWarning(message: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  console.warn(message, error instanceof Error ? error.message : error)
}
