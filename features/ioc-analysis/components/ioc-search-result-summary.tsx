"use client"

import { useState, type ReactNode } from "react"
import {
  BadgeCheck,
  Bug,
  Check,
  Cloud,
  Copy,
  HardDrive,
  Network,
  Share2,
  ShieldAlert,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  confidenceText,
  isAllowlisted,
  isRemoteHit,
  verdictFromItem,
} from "@/features/ioc-analysis/components/ioc-verification-display-utils"
import type { IocVerificationItem } from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"

function verdictLabelKey(item: IocVerificationItem | null) {
  if (!item) return "verdict.unchecked"
  switch (verdictFromItem(item)) {
    case "malicious":
      return "verdict.malicious"
    case "allow":
      return "verdict.allow"
    case "error":
      return "verdict.error"
    case "checking":
      return "verdict.checking"
    case "ready":
      return "verdict.ready"
    default:
      return "verdict.unknown"
  }
}

function verdictTone(item: IocVerificationItem) {
  switch (verdictFromItem(item)) {
    case "allow":
      return {
        accent: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700",
      }
    case "error":
      return {
        accent: "bg-rose-500",
        badge: "bg-rose-50 text-rose-700",
      }
    case "malicious":
      return {
        accent: "bg-red-500",
        badge: "bg-red-50 text-red-700",
      }
    default:
      return {
        accent: "bg-slate-300",
        badge: "bg-slate-100 text-slate-600",
      }
  }
}

function bugIconTone(item: IocVerificationItem) {
  const hasIssue =
    item.status === "hit" ||
    verdictFromItem(item) === "malicious" ||
    verdictFromItem(item) === "error"

  return {
    icon: <Bug className="h-5 w-5" aria-hidden="true" />,
    iconBox: hasIssue
      ? "bg-red-50 text-red-600 ring-1 ring-red-100"
      : "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  }
}

function typePillClass(type: IocVerificationItem["type"]) {
  switch (type) {
    case "md5":
    case "sha1":
    case "sha256":
    case "hash":
      return "bg-violet-50 text-violet-700"
    case "url":
      return "bg-blue-50 text-blue-700"
    case "ip":
      return "bg-cyan-50 text-cyan-700"
    case "domain":
    case "hostname":
      return "bg-emerald-50 text-emerald-700"
    default:
      return "bg-slate-100 text-slate-600"
  }
}

function numericRisk(item: IocVerificationItem) {
  const score = item.verification?.risk_score || item.result?.entry?.risk_score
  if (typeof score === "number" && Number.isFinite(score)) return clampScore(score)
  if (isAllowlisted(item)) return 0
  if (item.status === "hit") return 80
  return 0
}

function numericConfidence(item: IocVerificationItem) {
  const confidence = item.verification?.confidence || item.result?.entry?.confidence
  if (typeof confidence === "number" && Number.isFinite(confidence)) return clampScore(confidence)

  const text = confidenceText(item)
  const parsed = Number(text.replace("%", ""))
  return Number.isFinite(parsed) ? clampScore(parsed) : 0
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function riskBadgeKey(value: number) {
  if (value >= 70) return "risk.high"
  if (value >= 40) return "risk.medium"
  return "risk.low"
}

function intelStatusLabelKey(status: string | undefined, hit: boolean) {
  const normalized = status?.trim().toLowerCase() || ""
  if (hit || normalized.includes("hit")) return "intelStatus.hit"
  if (normalized.includes("error") || normalized.includes("failed")) return "intelStatus.queryError"
  if (
    !normalized ||
    normalized.includes("skip") ||
    normalized.includes("pending") ||
    normalized.includes("checking") ||
    normalized.includes("unknown")
  ) {
    return "intelStatus.notQueried"
  }
  return "intelStatus.noHit"
}

export function IocSearchResultSummary({
  graphScopeId,
  item,
  localEventCount,
  onCopy,
}: {
  graphScopeId?: string
  item: IocVerificationItem
  localEventCount: number
  onCopy: (value: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations("pages.iocAnalysis.search.summary")
  const remoteHit = isRemoteHit(item)
  const tone = verdictTone(item)
  const bugTone = bugIconTone(item)
  const riskScore = numericRisk(item)
  const confidenceScore = numericConfidence(item)
  const checkedAt = item.verification?.checked_at || "-"
  const localHit =
    item.verification?.local_status === "hit" ||
    item.verification?.hit_status_key === "local_ioc_hit" ||
    (item.verification?.hit_scope === "local" && item.verification?.hit === true)
  const localIntelText = t(intelStatusLabelKey(item.verification?.local_status, localHit))
  const remoteIntelText = t(intelStatusLabelKey(item.verification?.remote_status, remoteHit))

  function handleCopy() {
    onCopy(item.value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <article className="relative mx-auto w-full shrink-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <span className={cn("absolute inset-y-4 left-0 z-10 w-1 rounded-full", tone.accent)} aria-hidden="true" />
      <div className="flex flex-col items-stretch 2xl:flex-row 2xl:items-center">
        <div className="relative flex min-w-0 flex-1 items-center gap-4 p-5 pl-6">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", bugTone.iconBox)}>
            {bugTone.icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <code className="truncate font-mono text-base font-medium leading-6 text-slate-950">
                {item.value}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={t("actions.copyIoc")}
                className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-blue-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase", typePillClass(item.type))}>
                {item.type}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", tone.badge)}>
                <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                {t(verdictLabelKey(item))}
              </span>
              <span className="text-xs text-slate-500">
                {t("checkedAt")}<span className="font-mono text-slate-600">{checkedAt}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-stretch divide-x divide-slate-200 border-t border-slate-200 2xl:flex-nowrap 2xl:border-l 2xl:border-t-0">
          <div className="flex min-w-[12rem] flex-1 items-center gap-3 bg-red-50/50 px-6 py-5 2xl:flex-none">
            <RiskGauge value={riskScore} active={item.status === "hit"} />
            <div className="leading-tight">
              <p className="text-xs font-medium text-slate-500">{t("metrics.riskScore")}</p>
              <p className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", item.status === "hit" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
                {t(riskBadgeKey(riskScore))}
              </p>
            </div>
          </div>

          <Metric icon={<BadgeCheck className="h-4 w-4" />} label={t("metrics.confidence")}>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-600">{confidenceScore}</span>
              <span className="text-sm font-semibold text-blue-600">%</span>
            </div>
          </Metric>

          <Metric icon={<HardDrive className="h-4 w-4" />} label={t("metrics.localIntel")}>
            <span className={cn("inline-flex items-center gap-1.5 text-lg font-bold", localHit ? "text-red-600" : "text-slate-600")}>
              <span className={cn("h-2 w-2 rounded-full", localHit ? "bg-red-500" : "bg-slate-400")} aria-hidden="true" />
              {localIntelText}
            </span>
          </Metric>

          <Metric icon={<Cloud className="h-4 w-4" />} label={t("metrics.remoteIntel")}>
            <span className={cn("inline-flex items-center gap-1.5 text-lg font-semibold", remoteHit ? "text-red-600" : "text-slate-500")}>
              <span className={cn("h-2 w-2 rounded-full", remoteHit ? "bg-red-500" : "bg-slate-400")} aria-hidden="true" />
              {remoteIntelText}
            </span>
          </Metric>

          <Metric icon={<Network className="h-4 w-4" />} label={t("metrics.localEvents")}>
            <span className="text-2xl font-bold text-slate-950">{localEventCount}</span>
          </Metric>

          <Metric icon={<Share2 className="h-4 w-4" />} label={t("metrics.graph")}>
            <span className="text-base font-semibold text-slate-950">
              {graphScopeId ? t("graph.generated") : t("graph.pendingEvent")}
            </span>
          </Metric>
        </div>
      </div>
    </article>
  )
}

function Metric({
  children,
  icon,
  label,
}: {
  children: ReactNode
  icon: ReactNode
  label: string
}) {
  return (
    <div className="flex min-w-[7.5rem] flex-1 flex-col justify-center px-6 py-5 2xl:flex-none">
      <div className="mb-1.5 flex items-center gap-1.5 text-slate-500">
        <span aria-hidden="true">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      {children}
    </div>
  )
}

function RiskGauge({ active, value }: { active: boolean; value: number }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          strokeWidth="5"
          className={active ? "stroke-red-100" : "stroke-emerald-100"}
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={active ? "stroke-red-500" : "stroke-emerald-500"}
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-xl font-bold", active ? "text-red-600" : "text-emerald-600")}>
        {value}
      </span>
    </div>
  )
}
