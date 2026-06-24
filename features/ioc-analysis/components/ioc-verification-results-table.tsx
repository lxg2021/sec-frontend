"use client"

import type { KeyboardEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BadgeCheck,
  Clipboard,
  Cloud,
  Clock3,
  Database,
  FileText,
  Gauge,
  Hash,
  Loader2,
  Percent,
  RefreshCw,
  ShieldCheck,
  Tag,
} from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  IocCandidate,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import { VerdictBadge } from "./ioc-verification-badges"
import {
  confidenceText,
  isAllowlisted,
  riskText,
  verdictFromItem,
} from "./ioc-verification-display-utils"
import { IocVerificationEmptyState } from "./ioc-verification-empty-state"

const tableGridClass =
  "grid-cols-[minmax(320px,1.15fr)_minmax(136px,0.65fr)_52px_minmax(84px,0.35fr)_minmax(88px,0.35fr)_minmax(96px,0.4fr)_minmax(148px,0.55fr)_56px_76px_minmax(96px,0.35fr)_92px_52px]"
const actionButtonClass =
  "h-10 w-10 shrink-0 rounded-full text-teal-600 hover:bg-teal-50 hover:text-teal-700"
const inlineCopyButtonClass =
  "h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-teal-50 hover:text-teal-700"

type IntelTone = "hit" | "miss" | "skipped" | "pending" | "checking" | "error"

function fileNameFromPath(value: string) {
  const trimmed = value.trim().replace(/[\\/]+$/, "")
  return trimmed.split(/[\\/]/).pop() || value
}

function compactLabel(value: string) {
  return value.trim().replace(/_/g, " ").toLocaleLowerCase()
}

function statusDotClass(tone: IntelTone) {
  switch (tone) {
    case "hit":
      return "bg-emerald-500"
    case "checking":
      return "bg-blue-500"
    case "error":
      return "bg-rose-500"
    case "miss":
      return "bg-violet-300"
    case "skipped":
      return "bg-slate-300"
    default:
      return "bg-slate-300"
  }
}

function statusTextClass(tone: IntelTone) {
  switch (tone) {
    case "hit":
      return "text-emerald-700"
    case "checking":
      return "text-blue-700"
    case "error":
      return "text-rose-700"
    case "miss":
      return "text-violet-700"
    default:
      return "text-slate-500"
  }
}

function statusFromRaw(
  raw: string,
  missLabel = "miss",
): { label: string; tone: IntelTone } {
  const value = raw.trim().toLowerCase()
  if (!value) return { label: "pending", tone: "pending" }
  if (value.includes("checking") || value.includes("running")) {
    return { label: "checking", tone: "checking" }
  }
  if (value.includes("error") || value.includes("failed")) {
    return { label: "error", tone: "error" }
  }
  if (value.includes("miss") || value.includes("no_hit") || value.includes("no hit")) {
    return { label: missLabel, tone: "miss" }
  }
  if (
    value.includes("skip") ||
    value.includes("not_required") ||
    value.includes("not required") ||
    value.includes("disabled")
  ) {
    return { label: "skipped", tone: "skipped" }
  }
  if (value.includes("hit") || value.includes("allow")) {
    return { label: value.includes("allow") ? "allowed" : "hit", tone: "hit" }
  }
  if (value.includes("pending") || value.includes("idle") || value.includes("ready")) {
    return { label: "pending", tone: "pending" }
  }
  return { label: compactLabel(raw), tone: "pending" }
}

function StatusSignal({
  label,
  tone,
}: {
  label: string
  tone: IntelTone
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 text-xs font-medium",
        statusTextClass(tone),
      )}
      title={label}
    >
      <span className={cn("size-2.5 shrink-0 rounded-full", statusDotClass(tone))} />
      <span className="truncate">{compactLabel(label)}</span>
    </span>
  )
}

function TableHeaderCell({
  icon: Icon,
  label,
  center,
}: {
  icon: LucideIcon
  label: string
  center?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1.5",
        center && "justify-center",
      )}
      title={label}
    >
      <Icon className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </div>
  )
}

export function IocResultsTable({
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

  if (!items.length) return <IocVerificationEmptyState />

  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>, id: string) {
    if (event.currentTarget !== event.target) return
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    onSelect(id)
  }

  function whitelistStatus(item: IocVerificationItem) {
    if (item.status === "checking") {
      return { label: t("allowlist.checking"), tone: "checking" as const }
    }
    if (isAllowlisted(item)) {
      return { label: t("allowlist.hit"), tone: "hit" as const }
    }
    if (item.status === "idle") {
      return { label: t("allowlist.pending"), tone: "pending" as const }
    }
    return { label: t("allowlist.miss"), tone: "miss" as const }
  }

  function localIntelStatus(item: IocVerificationItem) {
    if (item.status === "checking") return { label: t("status.checking"), tone: "checking" as const }
    if (item.error) return { label: t("status.error"), tone: "error" as const }

    const verification = item.verification
    if (verification) {
      if (
        verification.hit_status_key === "local_ioc_hit" ||
        verification.final_status === "local_hit" ||
        (verification.hit && verification.hit_scope === "local" && verification.hit_kind === "ioc")
      ) {
        return { label: t("status.hit"), tone: "hit" as const }
      }
      if (
        verification.hit_status_key === "local_whitelist_hit" ||
        verification.hit_kind === "whitelist"
      ) {
        return { label: "skipped", tone: "skipped" as const }
      }
      if (verification.hit_status_key === "error" || verification.final_status === "local_error") {
        return { label: t("status.error"), tone: "error" as const }
      }
      if (verification.local_status) {
        return statusFromRaw(verification.local_status, t("allowlist.miss"))
      }
      if (verification.local_decision) {
        return statusFromRaw(verification.local_decision, t("allowlist.miss"))
      }
      if (verification.hit_status_key === "no_hit" || verification.final_status === "local_miss") {
        return { label: t("allowlist.miss"), tone: "miss" as const }
      }
    }

    switch (item.result?.hit_source) {
      case "local_hit":
      case "cache_hit":
        return { label: t("status.hit"), tone: "hit" as const }
      case "remote_hit":
      case "remote_miss":
      case "miss_cache_hit":
        return { label: t("allowlist.miss"), tone: "miss" as const }
      case "remote_error_suppressed":
        return { label: t("status.error"), tone: "error" as const }
      default:
        break
    }

    if (item.status === "idle") return { label: t("allowlist.pending"), tone: "pending" as const }
    if (item.status === "miss") return { label: t("allowlist.miss"), tone: "miss" as const }
    return { label: "-", tone: "pending" as const }
  }

  function onlineIntelStatus(item: IocVerificationItem) {
    if (item.status === "checking") return { label: t("status.checking"), tone: "checking" as const }
    if (item.error) return { label: t("status.error"), tone: "error" as const }
    if (isAllowlisted(item)) return { label: "skipped", tone: "skipped" as const }

    const verification = item.verification
    if (verification) {
      if (
        verification.hit_status_key === "remote_ioc_hit" ||
        verification.final_status === "remote_hit" ||
        (verification.hit && verification.hit_scope === "remote" && verification.hit_kind === "ioc")
      ) {
        return { label: t("status.hit"), tone: "hit" as const }
      }
      if (verification.final_status === "remote_error") {
        return { label: t("status.error"), tone: "error" as const }
      }
      if (verification.remote_status) {
        return statusFromRaw(verification.remote_status, t("allowlist.miss"))
      }
      if (
        verification.hit_status_key === "local_ioc_hit" ||
        verification.hit_status_key === "local_whitelist_hit" ||
        verification.final_status === "local_hit" ||
        verification.final_status === "allowlisted"
      ) {
        return { label: "skipped", tone: "skipped" as const }
      }
      if (verification.hit_status_key === "no_hit" || verification.final_status === "remote_miss") {
        return { label: t("allowlist.miss"), tone: "miss" as const }
      }
    }

    switch (item.result?.hit_source) {
      case "remote_hit":
        return { label: t("status.hit"), tone: "hit" as const }
      case "remote_miss":
      case "miss_cache_hit":
        return { label: t("allowlist.miss"), tone: "miss" as const }
      case "remote_error_suppressed":
        return { label: t("status.error"), tone: "error" as const }
      case "local_hit":
      case "cache_hit":
        return { label: "skipped", tone: "skipped" as const }
      default:
        break
    }

    if (item.status === "idle") return { label: t("allowlist.pending"), tone: "pending" as const }
    if (item.status === "miss") return { label: t("allowlist.miss"), tone: "miss" as const }
    return { label: "-", tone: "pending" as const }
  }

  return (
    <div className="min-w-[1460px] overflow-hidden rounded-2xl border border-slate-100">
      <div
        className={cn(
          "grid items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-400",
          tableGridClass,
        )}
      >
        <TableHeaderCell icon={Hash} label={t("table.ioc").toLocaleLowerCase()} />
        <TableHeaderCell icon={FileText} label="filename" />
        <TableHeaderCell icon={Tag} label={t("fields.type").toLocaleLowerCase()} />
        <TableHeaderCell icon={ShieldCheck} label={t("table.allowlist").toLocaleLowerCase()} />
        <TableHeaderCell
          icon={Database}
          label={t("pipeline.steps.localIntel").toLocaleLowerCase()}
        />
        <TableHeaderCell
          icon={Cloud}
          label={t("pipeline.steps.onlineIntel").toLocaleLowerCase()}
        />
        <TableHeaderCell icon={Clock3} label={t("table.time").toLocaleLowerCase()} />
        <TableHeaderCell icon={Gauge} label={t("fields.risk").toLocaleLowerCase()} center />
        <TableHeaderCell
          icon={Percent}
          label={t("fields.confidence").toLocaleLowerCase()}
          center
        />
        <TableHeaderCell icon={Activity} label={t("table.action").toLocaleLowerCase()} />
        <TableHeaderCell
          icon={BadgeCheck}
          label={t("table.verdict").toLocaleLowerCase()}
          center
        />
        <TableHeaderCell icon={RefreshCw} label="refresh" center />
      </div>
      <div className="h-[260px] divide-y divide-slate-100 overflow-y-auto">
        {items.map((item) => {
          const selected = item.id === selectedId
          const occurredAt = item.occurred_at || ""
          const whitelist = whitelistStatus(item)
          const localIntel = localIntelStatus(item)
          const onlineIntel = onlineIntelStatus(item)
          const riskLabel = riskText(item)
          const confidenceLabel = confidenceText(item)
          const actionLabel =
            verdictFromItem(item) === "malicious"
              ? t("detail.investigate")
              : t("detail.noQuery")
          const fileLabel = item.file_name || (item.file_path ? fileNameFromPath(item.file_path) : "")
          const fileTitle = item.file_path || item.file_name || undefined

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => handleRowKeyDown(event, item.id)}
              className={cn(
                "group grid h-[52px] w-full cursor-pointer items-center gap-3 px-4 py-2 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-200",
                tableGridClass,
                selected && "relative bg-blue-50 hover:bg-blue-50",
              )}
            >
              {selected ? (
                <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-blue-600" />
              ) : null}
              <div className="min-w-0 pl-1">
                <div className="inline-flex max-w-full items-center gap-1.5">
                  <code className="min-w-0 truncate font-mono text-xs font-medium text-slate-800">
                    {item.value}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={inlineCopyButtonClass}
                    onClick={(event) => {
                      event.stopPropagation()
                      onCopy(item.value)
                    }}
                    aria-label={t("actions.copy")}
                  >
                    <Clipboard className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="min-w-0 text-xs text-slate-500" title={fileTitle}>
                {fileLabel ? (
                  <span className="block truncate">{fileLabel}</span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </div>
              <div
                className="truncate text-xs font-medium text-slate-500"
                title={item.type}
              >
                {item.type}
              </div>
              <div className="min-w-0">
                <StatusSignal label={whitelist.label} tone={whitelist.tone} />
              </div>
              <div className="min-w-0">
                <StatusSignal label={localIntel.label} tone={localIntel.tone} />
              </div>
              <div className="min-w-0">
                <StatusSignal label={onlineIntel.label} tone={onlineIntel.tone} />
              </div>
              <div
                className="truncate font-mono text-xs text-slate-500"
                title={occurredAt || undefined}
              >
                {occurredAt || "-"}
              </div>
              <div
                className="truncate text-center font-mono text-xs font-medium text-slate-500"
                title={riskLabel}
              >
                {riskLabel.toLocaleLowerCase()}
              </div>
              <div
                className="truncate text-center font-mono text-xs font-medium text-slate-500"
                title={confidenceLabel}
              >
                {confidenceLabel.toLocaleLowerCase()}
              </div>
              <div
                className="truncate text-xs font-medium text-slate-700"
                title={actionLabel}
              >
                {actionLabel.toLocaleLowerCase()}
              </div>
              <div className="flex justify-center">
                <VerdictBadge item={item} lowercase />
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={actionButtonClass}
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
