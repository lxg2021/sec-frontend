"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  CircleX,
  Clipboard,
  FileSearch,
  Loader2,
  Plus,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react"

import {
  buildAttackDetailHref,
  buildAttackWorkflowHref,
} from "@/features/attack/detail/utils/attack-case-format"
import { IocVerificationHeader } from "@/features/ioc-analysis/components/ioc-verification-header"
import {
  createAttackCaseIocVerifyTask,
  getAttackCaseIocVerification,
  getAttackCaseIocVerifyTask,
  listAttackCaseIocCandidates,
  queryIoc,
} from "@/features/ioc-analysis/api"
import type {
  AttackCaseIOCCandidateListData,
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
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Separator } from "@/shared/ui/separator"
import { Textarea } from "@/shared/ui/textarea"

const DEFAULT_TENANT_ID = "public"
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90

const TYPE_OPTIONS: IocVerificationType[] = [
  "auto",
  "md5",
  "sha1",
  "sha256",
  "url",
  "ip",
  "domain",
  "hostname",
  "certificate",
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
  "certificate",
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

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
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
    normalizedType === "email" ||
    normalizedType === "certificate"
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

function isVerificationItem(candidate: IocCandidate | IocVerificationItem): candidate is IocVerificationItem {
  return "status" in candidate && "result" in candidate && "error" in candidate
}

function toVerificationItem(candidate: IocCandidate | IocVerificationItem): IocVerificationItem {
  if (isVerificationItem(candidate)) return candidate

  return {
    ...candidate,
    status: "idle",
    result: null,
    error: "",
  }
}

function mergeCandidates(
  current: IocVerificationItem[],
  candidates: Array<IocCandidate | IocVerificationItem>,
  options: { replaceCase?: boolean } = {},
) {
  const base = options.replaceCase
    ? current.filter((item) => item.origin !== "case")
    : [...current]
  const byId = new Map(base.map((item) => [item.id, item]))

  for (const candidate of candidates) {
    const next = toVerificationItem(candidate)
    const existing = byId.get(candidate.id)
    byId.set(candidate.id, existing ? { ...existing, ...next } : next)
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
    case "allowlisted":
      return CircleCheckBig
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
    case "allowlisted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
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
    case "certificate":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function isAllowlisted(item: IocVerificationItem) {
  return (
    item.status === "allowlisted" ||
    item.verification?.final_status === "allowlisted" ||
    item.verification?.whitelist_status === "hit"
  )
}

function isRemoteHit(item: IocVerificationItem) {
  return (
    item.result?.hit_source === "remote_hit" ||
    item.verification?.final_status === "remote_hit" ||
    item.verification?.remote_status === "hit"
  )
}

function summaryCounts(items: IocVerificationItem[]) {
  return {
    total: items.length,
    hit: items.filter((item) => item.status === "hit").length,
    miss: items.filter((item) => item.status === "miss").length,
    remote: items.filter(isRemoteHit).length,
    pending: items.filter((item) => item.status === "idle" || item.status === "checking").length,
    error: items.filter((item) => item.status === "error" || item.status === "suppressed").length,
    whitelist: items.filter(isAllowlisted).length,
  }
}

type IocVerdict = "checking" | "malicious" | "allow" | "unknown" | "error" | "ready"

function verdictFromItem(item: IocVerificationItem): IocVerdict {
  const finalStatus = item.verification?.final_status
  const finalVerdict = item.verification?.final_verdict

  if (item.status === "checking") return "checking"
  if (finalStatus === "allowlisted" || finalVerdict === "allow") return "allow"
  if (
    finalStatus === "local_hit" ||
    finalStatus === "remote_hit" ||
    finalVerdict === "malicious" ||
    item.status === "hit"
  ) {
    return "malicious"
  }
  if (
    finalStatus === "local_error" ||
    finalStatus === "remote_error" ||
    finalVerdict === "error" ||
    item.status === "error" ||
    item.status === "suppressed"
  ) {
    return "error"
  }
  if (
    finalStatus === "local_miss" ||
    finalStatus === "remote_miss" ||
    finalVerdict === "unknown"
  ) {
    return "unknown"
  }
  if (item.status === "idle") return "ready"
  return "unknown"
}

function verdictClass(verdict: IocVerdict) {
  switch (verdict) {
    case "checking":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "malicious":
      return "border-red-200 bg-red-50 text-red-700"
    case "allow":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "unknown":
      return "border-slate-200 bg-slate-100 text-slate-600"
    default:
      return "border-slate-200 bg-slate-50 text-slate-500"
  }
}

function allowlistClass(item: IocVerificationItem) {
  if (item.status === "checking") return "border-blue-200 bg-blue-50 text-blue-700"
  if (isAllowlisted(item)) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (item.status === "idle") return "border-slate-200 bg-slate-50 text-slate-500"
  return "border-slate-200 bg-slate-100 text-slate-600"
}

function verificationSourceText(
  item: IocVerificationItem,
  t: ReturnType<typeof useTranslations>,
) {
  if (item.status === "checking") return t("status.checking")
  if (item.error) return item.error
  if (item.result) return t(sourceLabelKey(item.result.hit_source))
  if (item.verification) {
    switch (item.verification.final_status) {
      case "allowlisted":
        return t("allowlist.hit")
      case "local_hit":
        return t("source.localHit")
      case "local_miss":
        return t("source.localMiss")
      case "local_error":
        return t("source.localError")
      case "remote_hit":
        return t("source.remoteHit")
      case "remote_miss":
        return t("source.remoteMiss")
      case "remote_error":
        return t("source.remoteError")
      default:
        return t("status.idle")
    }
  }
  return t("status.idle")
}

function observationSources(item: IocVerificationItem) {
  return Array.from(
    new Set(
      item.result?.observations
        .map((observation) => observation.source_name)
        .filter(Boolean) ?? [],
    ),
  )
}

function riskText(item: IocVerificationItem) {
  const score = item.verification?.risk_score || item.result?.entry?.risk_score
  if (typeof score === "number" && score > 0) return String(score)
  if (item.status === "hit") return "High"
  if (item.status === "miss") return "Low"
  if (item.status === "checking") return "-"
  return "-"
}

function confidenceText(item: IocVerificationItem) {
  const confidence = item.verification?.confidence || item.result?.entry?.confidence
  if (typeof confidence === "number" && confidence > 0) return `${confidence}%`
  if (item.status === "hit") return "80%"
  if (item.status === "miss") return "60%"
  return "-"
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

function VerdictBadge({ item }: { item: IocVerificationItem }) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const verdict = verdictFromItem(item)

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", verdictClass(verdict))}
    >
      {t(`verdict.${verdict}`)}
    </Badge>
  )
}

function AllowlistBadge({ item }: { item: IocVerificationItem }) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const label =
    item.status === "checking"
      ? t("allowlist.checking")
      : isAllowlisted(item)
        ? t("allowlist.hit")
      : item.status === "idle"
        ? t("allowlist.pending")
        : t("allowlist.miss")

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", allowlistClass(item))}
    >
      {label}
    </Badge>
  )
}

function IocResultsTable({
  items,
  selectedId,
  verifying,
  onCopy,
  onSelect,
  onVerify,
}: {
  items: IocVerificationItem[]
  selectedId: string
  verifying: boolean
  onCopy: (value: string) => void
  onSelect: (id: string) => void
  onVerify: (item: IocCandidate) => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")

  if (!items.length) return <EmptyState />

  return (
    <div className="min-w-[760px] overflow-hidden rounded-2xl border border-slate-100">
      <div className="grid grid-cols-[minmax(240px,1.4fr)_88px_112px_150px_110px_98px] items-center gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400">
        <div>{t("table.ioc")}</div>
        <div>{t("fields.type")}</div>
        <div>{t("table.allowlist")}</div>
        <div>{t("table.verification")}</div>
        <div>{t("table.verdict")}</div>
        <div>{t("table.action")}</div>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const selected = item.id === selectedId
          const observationCount = item.result?.observations.length ?? 0
          const source = item.origin === "case" ? t("detail.caseSource") : t("detail.manualSource")
          const checkedAt = item.verification?.checked_at || item.verification?.updated_at || ""

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "group grid w-full grid-cols-[minmax(240px,1.4fr)_88px_112px_150px_110px_98px] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                selected && "relative bg-blue-50 hover:bg-blue-50",
              )}
            >
              {selected ? (
                <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-blue-600" />
              ) : null}
              <div className="min-w-0 pl-1">
                <code className="block truncate font-mono text-sm text-slate-950">
                  {item.value}
                </code>
                <span className="mt-1 block truncate text-xs text-slate-400">
                  {source}
                  {item.evidence_refs.length ? ` · ${item.evidence_refs[0]}` : ""}
                </span>
              </div>
              <TypeBadge type={item.type} />
              <AllowlistBadge item={item} />
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-700">
                  {verificationSourceText(item, t)}
                </div>
                <div className="mt-1 truncate text-xs text-slate-400">
                  {observationCount
                    ? t("detail.observationCount", { count: observationCount })
                    : checkedAt || item.result?.hit_source || "-"}
                </div>
              </div>
              <VerdictBadge item={item} />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-xl border-blue-100 bg-white text-blue-700 hover:bg-blue-50"
                  disabled={verifying || item.status === "checking"}
                  onClick={(event) => {
                    event.stopPropagation()
                    onVerify(item)
                  }}
                  aria-label={t("actions.recheck")}
                >
                  {item.status === "checking" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-xl border-blue-100 bg-white text-blue-700 hover:bg-blue-50"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCopy(item.value)
                  }}
                  aria-label={t("actions.copy")}
                >
                  <Clipboard className="size-4" />
                </Button>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SelectedIocDetail({
  item,
  onCopy,
  onVerify,
  verifying,
}: {
  item: IocVerificationItem | null
  onCopy: (value: string) => void
  onVerify: (item: IocCandidate) => void
  verifying: boolean
}) {
  const t = useTranslations("pages.iocAnalysis.verification")

  if (!item) {
    return (
      <section className="flex h-full w-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <h2 className="text-base font-semibold text-slate-950">{t("detail.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t("detail.noSelection")}</p>
      </section>
    )
  }

  const verdict = verdictFromItem(item)
  const sources = observationSources(item)
  const entry = item.result?.entry
  const allowlistHit = item.verification?.allowlist_hit
  const allowlistSource = [
    allowlistHit?.source_name,
    allowlistHit?.source_version,
  ].filter(Boolean).join(" ")
  const allowlistLabel =
    item.status === "checking"
      ? t("allowlist.checking")
      : isAllowlisted(item)
        ? t("allowlist.hit")
      : item.status === "idle"
        ? t("allowlist.pending")
        : t("allowlist.miss")
  const allowlistAction =
    allowlistHit?.action ||
    (isAllowlisted(item) ? item.verification?.whitelist_status || allowlistLabel : allowlistLabel)
  const allowlistLevel = allowlistHit?.allow_level || "-"
  const allowlistReason =
    allowlistHit?.reason ||
    item.verification?.local_hit_source ||
    t("detail.allowlistNotConnected")
  const localIntelStatus =
    item.verification?.local_status ||
    item.verification?.local_decision ||
    item.result?.hit_source ||
    "pending"
  const remoteIntelStatus =
    item.verification?.remote_status ||
    (item.result?.hit_source === "remote_hit" ? "hit" : "skipped")

  return (
    <section className="flex h-full w-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{t("detail.title")}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{t("detail.description")}</p>
      </div>

      <div className="mt-4 rounded-[20px] border border-blue-200 bg-blue-50 p-4">
        <code className="block break-all font-mono text-sm font-semibold text-blue-950">
          {item.value}
        </code>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VerdictBadge item={item} />
          <TypeBadge type={item.type} />
          <span className="text-xs text-slate-400">{item.result?.entry?.last_seen || ""}</span>
        </div>
      </div>

      <ScrollArea className="mt-5 h-[560px] pr-3 2xl:h-auto 2xl:min-h-0 2xl:flex-1">
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">{t("detail.decision")}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.error ||
                (verdict === "malicious"
                  ? t("detail.maliciousReason")
                  : verdict === "allow"
                    ? t("detail.allowReason")
                  : verdict === "unknown"
                    ? t("detail.unknownReason")
                    : verdict === "checking"
                      ? t("detail.checkingReason")
                      : t("detail.readyReason"))}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-xs text-emerald-700">{t("fields.risk")}</div>
                <div className="mt-1 font-mono text-lg font-semibold text-emerald-700">
                  {riskText(item)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-400">{t("fields.confidence")}</div>
                <div className="mt-1 font-mono text-lg font-semibold text-slate-950">
                  {confidenceText(item)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-400">{t("table.action")}</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">
                  {verdict === "malicious" ? t("detail.investigate") : t("detail.noQuery")}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          <div>
            <h3 className="text-sm font-semibold text-slate-950">{t("detail.verificationPath")}</h3>
            <div className="mt-4 space-y-4">
              {[
                [t("pipeline.steps.normalized"), "completed", true],
                [t("pipeline.steps.allowlist"), allowlistLabel, item.status !== "idle"],
                [t("pipeline.steps.localIntel"), localIntelStatus, Boolean(item.result || item.verification)],
                [t("pipeline.steps.onlineIntel"), remoteIntelStatus, isRemoteHit(item)],
              ].map(([label, status, done], index) => (
                <div key={`${label}-${index}`} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full",
                      done ? "bg-emerald-500" : "bg-slate-300",
                    )}
                  >
                    {done ? <CheckCircle2 className="size-3 text-white" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-slate-700">{label}</span>
                  <span className="max-w-[9rem] truncate text-xs text-slate-400">{status}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-200" />

          <div>
            <h3 className="text-sm font-semibold text-slate-950">{t("detail.allowlistEvidence")}</h3>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-2">
                <span className="text-slate-400">Action</span>
                <span className="font-mono text-slate-700">{allowlistAction}</span>
                <span className="text-slate-400">Level</span>
                <span className="font-mono text-slate-700">{allowlistLevel}</span>
                <span className="text-slate-400">Source</span>
                <span className="text-slate-700">{allowlistSource || "-"}</span>
                <span className="text-slate-400">Reason</span>
                <span className="text-slate-700">{allowlistReason}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          <div>
            <h3 className="text-sm font-semibold text-slate-950">{t("detail.threatIntel")}</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t("fields.observations")}</span>
                <span className="font-mono text-slate-700">
                  {item.result?.observations.length ?? (item.verification ? 1 : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t("fields.relations")}</span>
                <span className="font-mono text-slate-700">
                  {item.result?.relations.length ?? 0}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400">{t("fields.intelSources")}</span>
                <span className="text-right text-slate-700">
                  {sources.length
                    ? sources.join(", ")
                    : item.verification?.local_hit_source ||
                      item.verification?.remote_hit_source ||
                      "-"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400">{t("fields.tags")}</span>
                <span className="text-right text-slate-700">
                  {entry?.tags.length ? entry.tags.join(", ") : "-"}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          <div>
            <h3 className="text-sm font-semibold text-slate-950">{t("detail.recommendedActions")}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                className="h-10 rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                onClick={() => onCopy(item.value)}
              >
                <Clipboard className="size-4" />
                {t("actions.copy")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-2xl border-slate-200"
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
          </div>
        </div>
      </ScrollArea>
    </section>
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
      tenantId:
        getRouteParam(searchParams.get("tenantId")) ||
        getRouteParam(searchParams.get("tenant_id")),
      queuePage:
        getRoutePageParam(searchParams.get("queuePage")) ||
        getRoutePageParam(searchParams.get("queue_page")),
    }),
    [searchParams],
  )
  const [caseId, setCaseId] = useState(routeParams.caseId)
  const tenantId = routeParams.tenantId || DEFAULT_TENANT_ID
  const [manualType, setManualType] = useState<IocVerificationType>("auto")
  const [manualInput, setManualInput] = useState("")
  const [items, setItems] = useState<IocVerificationItem[]>([])
  const [casePreview, setCasePreview] =
    useState<AttackCaseIOCCandidateListData | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [taskStatus, setTaskStatus] = useState("")
  const [caseTaskId, setCaseTaskId] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [searchText, setSearchText] = useState("")
  const [typeFilter, setTypeFilter] = useState<IocVerificationType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<IocVerificationStatus | "all">("all")
  const [actionOnly, setActionOnly] = useState(false)
  const extractRunIdRef = useRef(0)
  const verifyRunIdRef = useRef(0)
  const detailRunIdRef = useRef(0)
  const autoLoadedCaseRef = useRef("")
  const mountedRef = useRef(false)
  const counts = useMemo(() => summaryCounts(items), [items])
  const casePreviewMessage = useMemo(() => {
    if (!caseId.trim()) return ""
    if (!casePreview) return t("casePanel.previewNotLoaded")
    if (!casePreview.extract_task_exists) return t("casePanel.noExtractTask")

    const status = normalizeTaskStatus(casePreview.extract_task?.status)
    if (isActiveTaskStatus(status)) return t("casePanel.extractRunning", { status })
    if (status === "failed") {
      return casePreview.extract_task?.error_message || t("casePanel.extractFailed")
    }
    if (!casePreview.items.length) return t("casePanel.noPreviewItems")
    return t("casePanel.previewReady", { count: casePreview.items.length })
  }, [caseId, casePreview, t])

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false
      if (statusFilter !== "all") {
        if (statusFilter === "allowlisted") {
          if (!isAllowlisted(item)) return false
        } else if (item.status !== statusFilter) {
          return false
        }
      }
      if (actionOnly && item.status !== "hit" && item.status !== "error" && item.status !== "suppressed") {
        return false
      }
      if (!keyword) return true
      return (
        item.value.toLowerCase().includes(keyword) ||
        item.source.toLowerCase().includes(keyword) ||
        item.evidence_refs.some((ref) => ref.toLowerCase().includes(keyword)) ||
        observationSources(item).some((source) => source.toLowerCase().includes(keyword))
      )
    })
  }, [actionOnly, items, searchText, statusFilter, typeFilter])
  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
    filteredItems[0] ??
    items[0] ??
    null

  useEffect(() => {
    setCaseId(routeParams.caseId)
  }, [routeParams.caseId])

  useEffect(() => {
    if (!items.length) {
      setSelectedItemId("")
      return
    }
    if (!items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id)
    }
  }, [items, selectedItemId])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const candidateId = selectedItem?.candidate_id?.trim() || ""
    const normalizedCaseId =
      selectedItem?.case_id?.trim() || caseId.trim() || routeParams.caseId.trim()

    if (
      !selectedItem ||
      selectedItem.origin !== "case" ||
      !candidateId ||
      !normalizedCaseId ||
      !selectedItem.verification ||
      !isAllowlisted(selectedItem) ||
      selectedItem.verification.allowlist_hit
    ) {
      return
    }

    const runId = detailRunIdRef.current + 1
    detailRunIdRef.current = runId

    void (async () => {
      try {
        const detail = await getAttackCaseIocVerification({
          caseId: normalizedCaseId,
          tenantId,
          candidateId,
        })

        if (!mountedRef.current || detailRunIdRef.current !== runId) return

        setItems((current) =>
          current.map((item) => {
            if ((item.candidate_id || item.id) !== candidateId) return item

            const baseVerification = item.verification || detail.item
            if (!baseVerification) return item

            return {
              ...item,
              verification: {
                ...baseVerification,
                ...(detail.item || {}),
                raw_local_json:
                  detail.raw_local_json ||
                  detail.item?.raw_local_json ||
                  baseVerification.raw_local_json,
                raw_remote_json:
                  detail.raw_remote_json ||
                  detail.item?.raw_remote_json ||
                  baseVerification.raw_remote_json,
                allowlist_hit:
                  detail.allowlist_hit ||
                  detail.item?.allowlist_hit ||
                  baseVerification.allowlist_hit,
              },
            }
          }),
        )
      } catch {
        // Detail enrichment is best-effort; the list row remains usable.
      }
    })()
  }, [
    caseId,
    routeParams.caseId,
    selectedItem,
    selectedItem?.candidate_id,
    selectedItem?.case_id,
    selectedItem?.origin,
    selectedItem?.verification,
    selectedItem?.verification?.allowlist_hit,
    selectedItem?.verification?.verification_id,
    selectedItem?.verification?.whitelist_status,
    tenantId,
  ])

  const loadCaseIocs = useCallback(
    async () => {
      const normalizedCaseId = caseId.trim()
      if (!normalizedCaseId) {
        toast({ title: t("toasts.caseRequired"), variant: "destructive" })
        return
      }

      const runId = extractRunIdRef.current + 1
      extractRunIdRef.current = runId
      setExtracting(true)
      setTaskStatus(t("casePanel.loadingPreview"))
      setCaseTaskId("")

      try {
        const preview = await listAttackCaseIocCandidates({
          caseId: normalizedCaseId,
          tenantId,
        })

        if (!mountedRef.current || extractRunIdRef.current !== runId) return

        setCasePreview(preview)
        setTaskStatus(
          preview.extract_task_exists
            ? normalizeTaskStatus(preview.extract_task?.status)
            : t("casePanel.noExtractTaskShort"),
        )
        setItems((current) =>
          mergeCandidates(current, preview.items, { replaceCase: true }),
        )

        if (preview.items.length) {
          toast({ title: t("toasts.previewLoaded", { count: preview.items.length }) })
        } else if (preview.extract_task_exists) {
          toast({ title: t("toasts.noIocs") })
        }
      } catch (error) {
        if (!mountedRef.current || extractRunIdRef.current !== runId) return

        toast({
          title:
            error instanceof Error && error.message
              ? error.message
              : t("errors.extractFailed"),
          variant: "destructive",
        })
      } finally {
        if (mountedRef.current && extractRunIdRef.current === runId) {
          setExtracting(false)
        }
      }
    },
    [caseId, t, tenantId],
  )

  const verifyCandidates = useCallback(
    async (candidates: IocCandidate[]) => {
      if (!candidates.length) {
        toast({ title: t("toasts.noIocs") })
        return
      }

      const caseCandidates = candidates.filter(
        (candidate) => candidate.origin === "case" && candidate.candidate_id,
      )
      const manualCandidates = candidates.filter(
        (candidate) => candidate.origin !== "case" || !candidate.candidate_id,
      )
      const normalizedCaseId =
        caseId.trim() || caseCandidates[0]?.case_id?.trim() || routeParams.caseId.trim()

      const runId = verifyRunIdRef.current + 1
      verifyRunIdRef.current = runId
      setVerifying(true)
      setItems((current) => mergeCandidates(current, manualCandidates))

      try {
        if (caseCandidates.length) {
          if (!normalizedCaseId) {
            throw new Error(t("toasts.caseRequired"))
          }

          const candidateIds = Array.from(
            new Set(
              caseCandidates
                .map((candidate) => candidate.candidate_id?.trim())
                .filter((candidateId): candidateId is string => Boolean(candidateId)),
            ),
          )

          setItems((current) =>
            current.map((item) =>
              candidateIds.includes(item.candidate_id || item.id)
                ? { ...item, status: "checking", error: "", result: null }
                : item,
            ),
          )

          let task = (
            await createAttackCaseIocVerifyTask({
              caseId: normalizedCaseId,
              tenantId,
              candidateIds,
            })
          ).task

          if (!mountedRef.current || verifyRunIdRef.current !== runId) return

          setCaseTaskId(task.task_id ? String(task.task_id) : "")
          let status = normalizeTaskStatus(task.status)
          setTaskStatus(t("casePanel.verifyProgress", {
            done: task.done_count,
            total: task.total_count,
            status,
          }))

          for (let attempt = 0; isActiveTaskStatus(status); attempt += 1) {
            if (attempt >= MAX_POLL_ATTEMPTS) {
              throw new Error(t("errors.analysisTimeout"))
            }

            await delay(POLL_INTERVAL_MS)
            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

            task = await getAttackCaseIocVerifyTask({
              caseId: normalizedCaseId,
              tenantId,
              taskId: task.task_id,
            })

            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

            status = normalizeTaskStatus(task.status)
            setTaskStatus(t("casePanel.verifyProgress", {
              done: task.done_count,
              total: task.total_count,
              status,
            }))
          }

          if (status === "failed") {
            throw new Error(task.error_message || t("errors.verifyFailed"))
          }

          if (status !== "success" && status !== "partial_success") {
            throw new Error(t("errors.analysisUnknown", { status: task.status || "unknown" }))
          }

          const preview = await listAttackCaseIocCandidates({
            caseId: normalizedCaseId,
            tenantId,
          })

          if (!mountedRef.current || verifyRunIdRef.current !== runId) return

          setCasePreview(preview)
          setItems((current) =>
            mergeCandidates(current, preview.items, { replaceCase: true }),
          )
          setTaskStatus(status)
        }

        for (const candidate of manualCandidates) {
          if (!mountedRef.current || verifyRunIdRef.current !== runId) return

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

            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

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
            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

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
      } catch (error) {
        if (!mountedRef.current || verifyRunIdRef.current !== runId) return

        const caseCandidateIds = new Set(
          caseCandidates.map((candidate) => candidate.candidate_id || candidate.id),
        )
        setItems((current) =>
          current.map((item) =>
            caseCandidateIds.has(item.candidate_id || item.id)
              ? {
                  ...item,
                  status: "error",
                  error:
                    error instanceof Error && error.message
                      ? error.message
                      : t("errors.verifyFailed"),
                }
              : item,
          ),
        )
        toast({
          title:
            error instanceof Error && error.message
              ? error.message
              : t("errors.verifyFailed"),
          variant: "destructive",
        })
      } finally {
        if (mountedRef.current && verifyRunIdRef.current === runId) {
          setVerifying(false)
        }
      }
    },
    [caseId, routeParams.caseId, t, tenantId],
  )

  useEffect(() => {
    const normalizedCaseId = routeParams.caseId.trim()
    if (!normalizedCaseId || autoLoadedCaseRef.current === normalizedCaseId) return
    autoLoadedCaseRef.current = normalizedCaseId
    void loadCaseIocs()
  }, [loadCaseIocs, routeParams.caseId])

  function handleBack() {
    const normalizedCaseId = caseId.trim()

    if (routeParams.returnTo === "workflow" || routeParams.workflowId) {
      router.push(
        buildAttackWorkflowHref(
          normalizedCaseId,
          routeParams.snapshotId,
          routeParams.workflowId,
          { queuePage: routeParams.queuePage, tenantId },
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

  function copyIoc(value: string) {
    void navigator.clipboard.writeText(value)
    toast({ title: t("toasts.copied") })
  }

  return (
    <main className="min-h-[calc(100dvh-3rem)] w-full min-w-0 bg-gray-50 p-3 sm:p-4 xl:p-5 2xl:p-6">
      <div className="flex w-full min-w-0 flex-col gap-4">
        <IocVerificationHeader counts={counts} onBack={handleBack} />

        <section className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(300px,360px)_minmax(520px,1fr)_minmax(320px,400px)] 2xl:items-stretch">
          <div className="flex flex-col gap-4">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <FileSearch className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-950">
                    {t("casePanel.title")}
                  </h2>
                  <p className="text-xs leading-5 text-slate-500">
                    {t("casePanel.description")}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-xs font-medium text-slate-500">
                  {t("fields.caseId")}
                  <Input
                    value={caseId}
                    onChange={(event) => setCaseId(event.target.value)}
                    placeholder={t("casePanel.casePlaceholder")}
                    disabled={extracting || verifying}
                    className="mt-2 h-10 rounded-2xl border-slate-200 bg-slate-50 font-mono text-sm shadow-none focus-visible:ring-blue-200"
                  />
                </label>

                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-3 border-y border-slate-100 py-4 text-sm">
                  <span className="text-slate-400">{t("detail.workflow")}</span>
                  <span className="truncate font-mono text-slate-700">
                    {routeParams.workflowId || "-"}
                  </span>
                  <span className="text-slate-400">{t("fields.tenant")}</span>
                  <span className="truncate font-mono text-slate-700">
                    {tenantId}
                  </span>
                  <span className="text-slate-400">{t("fields.taskStatus")}</span>
                  <span className="text-slate-700">{taskStatus || "-"}</span>
                  <span className="text-slate-400">{t("detail.extracted")}</span>
                  <span className="text-slate-700">
                    {t("detail.extractedCount", { count: items.filter((item) => item.origin === "case").length })}
                  </span>
                </div>

                {casePreviewMessage ? (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                    {casePreviewMessage}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="h-10 rounded-2xl bg-blue-600 px-4 text-white hover:bg-blue-700"
                    disabled={extracting || verifying || !caseId.trim()}
                    onClick={() => void loadCaseIocs()}
                  >
                    {extracting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Radar className="size-4" />
                    )}
                    {extracting ? t("actions.loadingPreview") : t("actions.loadPreview")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-2xl border-slate-200"
                    disabled={extracting || verifying || !caseId.trim()}
                    onClick={() => void loadCaseIocs()}
                  >
                    <RefreshCw className="size-4" />
                    {t("actions.refreshPreview")}
                  </Button>
                </div>
                {caseTaskId ? (
                  <div className="truncate font-mono text-xs text-slate-400">
                    {t("fields.verifyTask")}: {caseTaskId}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Plus className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-950">
                    {t("manual.title")}
                  </h2>
                  <p className="text-xs leading-5 text-slate-500">
                    {t("manual.description")}
                  </p>
                </div>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleManualSubmit}>
                <div className="grid gap-3">
                  <label className="block text-xs font-medium text-slate-500">
                    {t("fields.type")}
                    <select
                      value={manualType}
                      onChange={(event) =>
                        setManualType(event.target.value as IocVerificationType)
                      }
                      disabled={verifying}
                      className="mt-2 h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-300 focus:bg-white"
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
                      className="mt-2 min-h-[174px] resize-none rounded-2xl border-slate-200 bg-slate-50 font-mono text-sm shadow-none focus-visible:ring-blue-200"
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

          <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  {t("results.title")}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
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

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={t("filters.searchPlaceholder")}
                  className="h-10 rounded-2xl border-slate-200 bg-slate-50 pl-9 shadow-none focus-visible:ring-blue-200"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as IocVerificationType | "all")
                }
                className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
              >
                <option value="all">{t("filters.allTypes")}</option>
                {TYPE_OPTIONS.filter((type) => type !== "auto").map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as IocVerificationStatus | "all")
                }
                className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
              >
                <option value="all">{t("filters.allVerdicts")}</option>
                {([
                  "hit",
                  "allowlisted",
                  "miss",
                  "checking",
                  "error",
                  "suppressed",
                  "idle",
                ] as IocVerificationStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setActionOnly((value) => !value)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                  actionOnly
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-600",
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-full border bg-white",
                    actionOnly ? "border-blue-500 bg-blue-500" : "border-slate-300",
                  )}
                />
                {t("filters.actionOnly")}
              </button>
              <Button
                type="button"
                className="h-10 rounded-2xl bg-blue-600 px-4 text-white hover:bg-blue-700"
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

            <div className="mt-4 overflow-x-auto">
              <IocResultsTable
                items={filteredItems}
                selectedId={selectedItem?.id ?? ""}
                verifying={verifying}
                onCopy={copyIoc}
                onSelect={setSelectedItemId}
                onVerify={(candidate) => void verifyCandidates([candidate])}
              />
            </div>
          </section>

          <div className="min-w-0 xl:col-span-2 2xl:col-span-1 2xl:flex">
            <SelectedIocDetail
              item={selectedItem}
              verifying={verifying}
              onCopy={copyIoc}
              onVerify={(candidate) => void verifyCandidates([candidate])}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
