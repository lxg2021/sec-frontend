"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  CircleX,
  FileSearch,
  Loader2,
  Plus,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Wifi,
} from "lucide-react"

import {
  createAttackAIReportTask,
  getAttackAIReportTask,
} from "@/features/ai-ops/threat-analysis/api"
import type {
  AttackAIReport,
  AttackAIReportTask,
  Ioc,
} from "@/features/ai-ops/threat-analysis/report-types"
import {
  normalizeAttackReport,
  parseMaybeJson,
} from "@/features/ai-ops/threat-analysis/report-utils"
import {
  buildAttackDetailHref,
  buildAttackWorkflowHref,
} from "@/features/attack/detail/utils/attack-case-format"
import { queryIoc } from "@/features/ioc-analysis/api"
import type {
  IocCandidate,
  IocQueryResult,
  IocVerificationItem,
  IocVerificationStatus,
  IocVerificationType,
} from "@/features/ioc-analysis/types"
import { toast } from "@/shared/hooks/use-toast"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"

const REPORT_TIMEZONE = "Asia/Shanghai"
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90

const VERIFIABLE_REPORT_TYPES = new Set([
  "hash",
  "md5",
  "sha1",
  "sha256",
  "url",
  "domain",
  "hostname",
  "ip",
])

const TYPE_OPTIONS: IocVerificationType[] = [
  "auto",
  "md5",
  "sha1",
  "sha256",
  "url",
  "ip",
  "domain",
  "hostname",
]
const MANUAL_TYPE_PREFIXES = new Set<IocVerificationType>([
  "auto",
  "hash",
  "md5",
  "sha1",
  "sha256",
  "url",
  "domain",
  "hostname",
  "ip",
  "email",
])

function getRouteParam(value: string | null) {
  return value?.trim() || ""
}

function getRoutePageParam(value: string | null) {
  const normalized = getRouteParam(value)
  if (!normalized) return undefined
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function normalizeTaskStatus(status?: string) {
  return status?.trim().toLowerCase() || "unknown"
}

function isActiveTaskStatus(status: string) {
  return status === "pending" || status === "running"
}

function reportLocaleFromAppLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function reportFromTask(task: AttackAIReportTask) {
  const parsedReport =
    task.report ?? parseMaybeJson<AttackAIReport>(task.report_json)
  return parsedReport ? normalizeAttackReport(parsedReport) : null
}

function normalizeIocType(type: string, value: string): IocVerificationType | null {
  const normalizedType = type.trim().toLowerCase()
  if (
    normalizedType === "md5" ||
    normalizedType === "sha1" ||
    normalizedType === "sha256" ||
    normalizedType === "url" ||
    normalizedType === "domain" ||
    normalizedType === "hostname" ||
    normalizedType === "ip" ||
    normalizedType === "email"
  ) {
    return normalizedType
  }

  if (normalizedType === "hash") {
    return detectIocType(value) ?? "hash"
  }

  return detectIocType(value)
}

function isValidIPv4(value: string) {
  const parts = value.split(".")
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false
      const numeric = Number(part)
      return numeric >= 0 && numeric <= 255
    })
  )
}

function detectIocType(value: string): IocVerificationType | null {
  const normalized = value.trim()
  if (!normalized) return null

  if (/^https?:\/\//i.test(normalized)) return "url"
  if (/^[a-f0-9]{32}$/i.test(normalized)) return "md5"
  if (/^[a-f0-9]{40}$/i.test(normalized)) return "sha1"
  if (/^[a-f0-9]{64}$/i.test(normalized)) return "sha256"
  if (isValidIPv4(normalized)) return "ip"
  if (
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized) &&
    !normalized.includes("/") &&
    !normalized.includes("..")
  ) {
    return "domain"
  }

  return null
}

function normalizeIocValue(type: IocVerificationType, value: string) {
  const normalized = value.trim()
  if (type === "md5" || type === "sha1" || type === "sha256" || type === "hash") {
    return normalized.toLowerCase()
  }
  if (type === "domain" || type === "hostname") return normalized.toLowerCase()
  return normalized
}

function candidateKey(type: IocVerificationType, value: string) {
  return `${type}:${value.toLowerCase()}`
}

function candidateId(candidate: Pick<IocCandidate, "origin" | "type" | "value">) {
  return `${candidate.origin}:${candidateKey(candidate.type, candidate.value)}`
}

function candidateFromReportIoc(ioc: Ioc): IocCandidate | null {
  const value = ioc.value.trim()
  if (!value || !VERIFIABLE_REPORT_TYPES.has(ioc.type)) return null

  const type = normalizeIocType(ioc.type, value)
  if (!type) return null

  const normalizedValue = normalizeIocValue(type, value)
  return {
    id: candidateId({ origin: "case", type, value: normalizedValue }),
    type,
    value: normalizedValue,
    source: ioc.source.trim(),
    evidence_refs: Array.isArray(ioc.evidence_refs) ? ioc.evidence_refs : [],
    origin: "case",
  }
}

function extractCaseCandidates(report: AttackAIReport | null): IocCandidate[] {
  if (!report) return []

  const seen = new Set<string>()
  const candidates: IocCandidate[] = []

  for (const ioc of report.iocs) {
    const candidate = candidateFromReportIoc(ioc)
    if (!candidate) continue

    const key = candidateKey(candidate.type, candidate.value)
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push(candidate)
  }

  return candidates
}

function parseManualLine(line: string, defaultType: IocVerificationType) {
  const trimmed = line.trim()
  if (!trimmed) return null

  const typedMatch = trimmed.match(/^([a-z0-9_-]+)\s*[:：]\s*(.+)$/i)
  const matchedType = typedMatch?.[1]?.trim().toLowerCase()
  const hasKnownTypePrefix =
    Boolean(matchedType) &&
    MANUAL_TYPE_PREFIXES.has(matchedType as IocVerificationType)
  const rawType: IocVerificationType = hasKnownTypePrefix
    ? (matchedType as IocVerificationType)
    : defaultType
  const rawValue = hasKnownTypePrefix && typedMatch ? typedMatch[2] ?? "" : trimmed
  const type = rawType === "auto" ? detectIocType(rawValue) ?? "auto" : normalizeIocType(rawType, rawValue)
  if (!type) return null

  const value = normalizeIocValue(type, rawValue)
  if (!value) return null

  return {
    id: candidateId({ origin: "manual", type, value }),
    type,
    value,
    source: "manual",
    evidence_refs: [],
    origin: "manual" as const,
  }
}

function parseManualCandidates(input: string, defaultType: IocVerificationType) {
  const seen = new Set<string>()
  const candidates: IocCandidate[] = []
  const lines = input
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const candidate = parseManualLine(line, defaultType)
    if (!candidate) continue
    const key = candidateKey(candidate.type, candidate.value)
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push(candidate)
  }

  return candidates
}

function toVerificationItem(candidate: IocCandidate): IocVerificationItem {
  return {
    ...candidate,
    status: "idle",
    result: null,
    error: "",
  }
}

function mergeCandidates(
  current: IocVerificationItem[],
  candidates: IocCandidate[],
  options: { replaceCase?: boolean } = {},
) {
  const base = options.replaceCase
    ? current.filter((item) => item.origin !== "case")
    : [...current]
  const byId = new Map(base.map((item) => [item.id, item]))

  for (const candidate of candidates) {
    byId.set(candidate.id, byId.get(candidate.id) ?? toVerificationItem(candidate))
  }

  return Array.from(byId.values())
}

function statusFromResult(result: IocQueryResult): IocVerificationStatus {
  if (result.hit) return "hit"
  if (result.hit_source === "remote_error_suppressed" || result.hit_source_code === 6) {
    return "suppressed"
  }
  return "miss"
}

function sourceLabelKey(source: string) {
  switch (source) {
    case "cache_hit":
      return "source.cacheHit"
    case "local_hit":
      return "source.localHit"
    case "remote_hit":
      return "source.remoteHit"
    case "remote_miss":
      return "source.remoteMiss"
    case "miss_cache_hit":
      return "source.missCacheHit"
    case "remote_error_suppressed":
      return "source.remoteErrorSuppressed"
    default:
      return "source.unknown"
  }
}

function statusIcon(status: IocVerificationStatus) {
  switch (status) {
    case "checking":
      return Loader2
    case "hit":
      return CircleAlert
    case "miss":
      return CircleCheckBig
    case "suppressed":
      return CircleDashed
    case "error":
      return CircleX
    default:
      return CircleDashed
  }
}

function statusClass(status: IocVerificationStatus) {
  switch (status) {
    case "checking":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "hit":
      return "border-red-200 bg-red-50 text-red-700"
    case "miss":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "suppressed":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "error":
      return "border-slate-300 bg-slate-100 text-slate-600"
    default:
      return "border-slate-200 bg-slate-50 text-slate-500"
  }
}

function typeClass(type: IocVerificationType) {
  switch (type) {
    case "md5":
    case "sha1":
    case "sha256":
    case "hash":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "url":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "ip":
      return "border-cyan-200 bg-cyan-50 text-cyan-700"
    case "domain":
    case "hostname":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function summaryCounts(items: IocVerificationItem[]) {
  return {
    total: items.length,
    hit: items.filter((item) => item.status === "hit").length,
    miss: items.filter((item) => item.status === "miss").length,
    remote: items.filter((item) => item.result?.hit_source === "remote_hit").length,
    pending: items.filter((item) => item.status === "idle" || item.status === "checking").length,
    error: items.filter((item) => item.status === "error" || item.status === "suppressed").length,
  }
}

function VerificationStatusBadge({
  status,
}: {
  status: IocVerificationStatus
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const Icon = statusIcon(status)

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full px-2 py-1 font-medium", statusClass(status))}
    >
      <Icon
        className={cn("size-3.5", status === "checking" && "animate-spin")}
        aria-hidden="true"
      />
      {t(`status.${status}`)}
    </Badge>
  )
}

function TypeBadge({ type }: { type: IocVerificationType }) {
  const t = useTranslations("pages.iocAnalysis.verification")

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2 py-1 font-mono text-[11px] uppercase", typeClass(type))}
    >
      {t(`types.${type}`)}
    </Badge>
  )
}

function EmptyState() {
  const t = useTranslations("pages.iocAnalysis.verification")

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-sm font-semibold text-slate-900">{t("empty.title")}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        {t("empty.description")}
      </p>
    </div>
  )
}

function IocResultRow({
  item,
  onVerify,
  verifying,
}: {
  item: IocVerificationItem
  onVerify: (item: IocCandidate) => void
  verifying: boolean
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const entry = item.result?.entry
  const sourceNames = item.result?.observations
    .map((observation) => observation.source_name)
    .filter(Boolean)
  const uniqueSources = Array.from(new Set(sourceNames)).slice(0, 3)
  const evidenceCount = item.evidence_refs.length
  const relationCount = item.result?.relations.length ?? 0
  const observationCount = item.result?.observations.length ?? 0

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={item.type} />
            <VerificationStatusBadge status={item.status} />
            {item.result ? (
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"
              >
                {t(sourceLabelKey(item.result.hit_source))}
              </Badge>
            ) : null}
          </div>

          <div className="mt-3 flex min-w-0 items-start gap-3">
            <code className="min-w-0 flex-1 break-all rounded-2xl bg-slate-50 px-3 py-2 font-mono text-sm leading-6 text-slate-950">
              {item.value}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 rounded-full border-slate-200 px-3 text-slate-700"
              disabled={verifying || item.status === "checking"}
              onClick={() => onVerify(item)}
            >
              {item.status === "checking" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {t("actions.recheck")}
            </Button>
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <span className="text-slate-400">{t("fields.source")}: </span>
              <span className="text-slate-600">{item.source || "-"}</span>
            </div>
            <div>
              <span className="text-slate-400">{t("fields.evidence")}: </span>
              <span className="font-mono text-slate-600">{evidenceCount}</span>
            </div>
            <div>
              <span className="text-slate-400">{t("fields.observations")}: </span>
              <span className="font-mono text-slate-600">{observationCount}</span>
            </div>
            <div>
              <span className="text-slate-400">{t("fields.relations")}: </span>
              <span className="font-mono text-slate-600">{relationCount}</span>
            </div>
          </div>

          {item.error ? (
            <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              {item.error}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-[180px] grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2 text-center lg:w-[220px]">
          <div className="rounded-xl bg-white px-2 py-2">
            <div className="font-mono text-sm font-semibold text-slate-900">
              {entry?.risk_score ?? "-"}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{t("fields.risk")}</div>
          </div>
          <div className="rounded-xl bg-white px-2 py-2">
            <div className="font-mono text-sm font-semibold text-slate-900">
              {entry?.confidence ?? "-"}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{t("fields.confidence")}</div>
          </div>
          <div className="rounded-xl bg-white px-2 py-2">
            <div className="font-mono text-sm font-semibold text-slate-900">
              {entry?.tags.length ?? 0}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{t("fields.tags")}</div>
          </div>
        </div>
      </div>

      {uniqueSources.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">{t("fields.intelSources")}</span>
          {uniqueSources.map((source) => (
            <span
              key={source}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
            >
              {source}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  )
}

export function IocVerificationPage() {
  const t = useTranslations("pages.iocAnalysis.verification")
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const reportLocale = useMemo(() => reportLocaleFromAppLocale(locale), [locale])
  const routeParams = useMemo(
    () => ({
      caseId:
        getRouteParam(searchParams.get("caseId")) ||
        getRouteParam(searchParams.get("case_id")),
      workflowId:
        getRouteParam(searchParams.get("workflowId")) ||
        getRouteParam(searchParams.get("workflow_id")),
      snapshotId:
        getRouteParam(searchParams.get("snapshotId")) ||
        getRouteParam(searchParams.get("snapshot_id")),
      returnTo:
        getRouteParam(searchParams.get("returnTo")) ||
        getRouteParam(searchParams.get("return_to")),
      queuePage:
        getRoutePageParam(searchParams.get("queuePage")) ||
        getRoutePageParam(searchParams.get("queue_page")),
    }),
    [searchParams],
  )
  const [caseId, setCaseId] = useState(routeParams.caseId)
  const [manualType, setManualType] = useState<IocVerificationType>("auto")
  const [manualInput, setManualInput] = useState("")
  const [items, setItems] = useState<IocVerificationItem[]>([])
  const [extracting, setExtracting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [taskStatus, setTaskStatus] = useState("")
  const [reportTaskId, setReportTaskId] = useState("")
  const extractRunIdRef = useRef(0)
  const verifyRunIdRef = useRef(0)
  const autoLoadedCaseRef = useRef("")
  const counts = useMemo(() => summaryCounts(items), [items])

  useEffect(() => {
    setCaseId(routeParams.caseId)
  }, [routeParams.caseId])

  useEffect(() => {
    return () => {
      extractRunIdRef.current += 1
      verifyRunIdRef.current += 1
    }
  }, [])

  const verifyCandidates = useCallback(
    async (candidates: IocCandidate[]) => {
      if (!candidates.length) {
        toast({ title: t("toasts.noIocs") })
        return
      }

      const runId = verifyRunIdRef.current + 1
      verifyRunIdRef.current = runId
      setVerifying(true)
      setItems((current) => mergeCandidates(current, candidates))

      try {
        for (const candidate of candidates) {
          if (verifyRunIdRef.current !== runId) return

          setItems((current) =>
            current.map((item) =>
              item.id === candidate.id
                ? { ...item, status: "checking", error: "", result: null }
                : item,
            ),
          )

          try {
            const result = await queryIoc({
              type: candidate.type,
              value: candidate.value,
            })

            if (verifyRunIdRef.current !== runId) return

            setItems((current) =>
              current.map((item) =>
                item.id === candidate.id
                  ? {
                      ...item,
                      status: statusFromResult(result),
                      result,
                      error: "",
                    }
                  : item,
              ),
            )
          } catch (error) {
            if (verifyRunIdRef.current !== runId) return

            setItems((current) =>
              current.map((item) =>
                item.id === candidate.id
                  ? {
                      ...item,
                      status: "error",
                      result: null,
                      error:
                        error instanceof Error
                          ? error.message
                          : t("errors.verifyFailed"),
                    }
                  : item,
              ),
            )
          }
        }

        toast({ title: t("toasts.verifyComplete") })
      } finally {
        if (verifyRunIdRef.current === runId) {
          setVerifying(false)
        }
      }
    },
    [t],
  )

  const loadCaseIocs = useCallback(
    async (verifyAfterLoad = true) => {
      const normalizedCaseId = caseId.trim()
      if (!normalizedCaseId) {
        toast({ title: t("toasts.caseRequired"), variant: "destructive" })
        return
      }

      const runId = extractRunIdRef.current + 1
      extractRunIdRef.current = runId
      setExtracting(true)
      setTaskStatus("creating")
      setReportTaskId("")

      try {
        let task = await createAttackAIReportTask({
          caseId: normalizedCaseId,
          timezone: REPORT_TIMEZONE,
          locale: reportLocale,
        })

        if (extractRunIdRef.current !== runId) return

        setReportTaskId(task.task_id || "")
        let status = normalizeTaskStatus(task.status)
        setTaskStatus(status)

        for (let attempt = 0; isActiveTaskStatus(status); attempt += 1) {
          if (attempt >= MAX_POLL_ATTEMPTS) {
            throw new Error(t("errors.analysisTimeout"))
          }

          await delay(POLL_INTERVAL_MS)
          if (extractRunIdRef.current !== runId) return

          task = await getAttackAIReportTask({
            taskId: task.task_id,
            locale: reportLocale,
          })

          if (extractRunIdRef.current !== runId) return

          status = normalizeTaskStatus(task.status)
          setTaskStatus(status)
        }

        if (status === "failed") {
          throw new Error(task.error_message || t("errors.analysisFailed"))
        }

        if (status === "invalid") {
          throw new Error(task.error_message || t("errors.analysisInvalid"))
        }

        if (status !== "succeeded") {
          throw new Error(t("errors.analysisUnknown", { status: task.status || "unknown" }))
        }

        const report = reportFromTask(task)
        const candidates = extractCaseCandidates(report)
        setItems((current) =>
          mergeCandidates(current, candidates, { replaceCase: true }),
        )

        if (!candidates.length) {
          toast({ title: t("toasts.noIocs") })
          return
        }

        toast({
          title: t("toasts.extracted", { count: candidates.length }),
        })

        if (verifyAfterLoad) {
          void verifyCandidates(candidates)
        }
      } catch (error) {
        if (extractRunIdRef.current !== runId) return

        toast({
          title:
            error instanceof Error && error.message
              ? error.message
              : t("errors.extractFailed"),
          variant: "destructive",
        })
      } finally {
        if (extractRunIdRef.current === runId) {
          setExtracting(false)
        }
      }
    },
    [caseId, reportLocale, t, verifyCandidates],
  )

  useEffect(() => {
    const normalizedCaseId = routeParams.caseId.trim()
    if (!normalizedCaseId || autoLoadedCaseRef.current === normalizedCaseId) return
    autoLoadedCaseRef.current = normalizedCaseId
    void loadCaseIocs(true)
  }, [loadCaseIocs, routeParams.caseId])

  function handleBack() {
    const normalizedCaseId = caseId.trim()

    if (routeParams.returnTo === "workflow" || routeParams.workflowId) {
      router.push(
        buildAttackWorkflowHref(
          normalizedCaseId,
          routeParams.snapshotId,
          routeParams.workflowId,
          { queuePage: routeParams.queuePage },
        ),
      )
      return
    }

    if (normalizedCaseId) {
      router.push(buildAttackDetailHref(normalizedCaseId, routeParams.snapshotId))
      return
    }

    router.push("/frame/attack/workflow")
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const candidates = parseManualCandidates(manualInput, manualType)

    if (!candidates.length) {
      toast({ title: t("toasts.manualInvalid"), variant: "destructive" })
      return
    }

    setItems((current) => mergeCandidates(current, candidates))
    setManualInput("")
    void verifyCandidates(candidates)
  }

  function verifyAll() {
    const candidates = items.map(
      ({ status: _status, result: _result, error: _error, ...candidate }) =>
        candidate,
    )
    void verifyCandidates(candidates)
  }

  return (
    <main className="min-h-[calc(100dvh-3rem)] bg-gray-50 p-4 sm:p-5 xl:p-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-slate-200 px-3 text-slate-800"
                  onClick={handleBack}
                >
                  <ArrowLeft className="size-4" />
                  {t("actions.back")}
                </Button>
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700"
                >
                  <Wifi className="size-3.5" aria-hidden="true" />
                  {t("onlineBadge")}
                </Badge>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
                {t("title")}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                {t("description")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              {[
                ["total", counts.total, "bg-slate-50 text-slate-900"],
                ["hit", counts.hit, "bg-red-50 text-red-700"],
                ["miss", counts.miss, "bg-emerald-50 text-emerald-700"],
                ["remote", counts.remote, "bg-blue-50 text-blue-700"],
                ["pending", counts.pending, "bg-amber-50 text-amber-700"],
                ["error", counts.error, "bg-slate-100 text-slate-600"],
              ].map(([key, value, className]) => (
                <div
                  key={key}
                  className={cn("rounded-2xl px-3 py-2", className as string)}
                >
                  <div className="font-mono text-lg font-semibold">{value}</div>
                  <div className="text-[11px] font-medium uppercase tracking-normal opacity-70">
                    {t(`summary.${key}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(360px,0.42fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <FileSearch className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    {t("casePanel.title")}
                  </h2>
                  <p className="text-xs leading-5 text-slate-500">
                    {t("casePanel.description")}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-slate-500">
                  {t("fields.caseId")}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={caseId}
                    onChange={(event) => setCaseId(event.target.value)}
                    placeholder={t("casePanel.casePlaceholder")}
                    disabled={extracting || verifying}
                    className="h-10 rounded-2xl border-slate-200 bg-slate-50 font-mono text-sm shadow-none focus-visible:ring-blue-200"
                  />
                  <Button
                    type="button"
                    className="h-10 shrink-0 rounded-2xl bg-blue-600 px-4 text-white hover:bg-blue-700"
                    disabled={extracting || verifying || !caseId.trim()}
                    onClick={() => void loadCaseIocs(true)}
                  >
                    {extracting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Radar className="size-4" />
                    )}
                    {extracting ? t("actions.extracting") : t("actions.extractVerify")}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{t("fields.taskStatus")}: {taskStatus || "-"}</span>
                  {reportTaskId ? (
                    <span className="font-mono text-slate-400">| {reportTaskId}</span>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Plus className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    {t("manual.title")}
                  </h2>
                  <p className="text-xs leading-5 text-slate-500">
                    {t("manual.description")}
                  </p>
                </div>
              </div>

              <form className="mt-4 space-y-3" onSubmit={handleManualSubmit}>
                <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <label className="block text-xs font-medium text-slate-500">
                    {t("fields.type")}
                    <select
                      value={manualType}
                      onChange={(event) =>
                        setManualType(event.target.value as IocVerificationType)
                      }
                      disabled={verifying}
                      className="mt-1 h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-300 focus:bg-white"
                    >
                      {TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {t(`types.${type}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-500">
                    {t("fields.value")}
                    <Textarea
                      value={manualInput}
                      onChange={(event) => setManualInput(event.target.value)}
                      placeholder={t("manual.placeholder")}
                      disabled={verifying}
                      className="mt-1 min-h-[120px] resize-none rounded-2xl border-slate-200 bg-slate-50 font-mono text-sm shadow-none focus-visible:ring-blue-200"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    className="h-10 rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-800"
                    disabled={verifying || !manualInput.trim()}
                  >
                    <Search className="size-4" />
                    {t("actions.addVerify")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200 px-4"
                    disabled={verifying || !items.length}
                    onClick={verifyAll}
                  >
                    {verifying ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    {t("actions.verifyAll")}
                  </Button>
                </div>
              </form>
            </section>
          </div>

          <section className="min-w-0 rounded-[28px] border border-slate-200 bg-white/60 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  {t("results.title")}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("results.description")}
                </p>
              </div>
              {verifying ? (
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700"
                >
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {t("actions.verifying")}
                </Badge>
              ) : null}
            </div>

            {items.length ? (
              <div className="grid gap-3">
                {items.map((item) => (
                  <IocResultRow
                    key={item.id}
                    item={item}
                    onVerify={(candidate) => void verifyCandidates([candidate])}
                    verifying={verifying}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
