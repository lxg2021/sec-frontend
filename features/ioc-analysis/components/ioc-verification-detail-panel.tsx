"use client"

import { CheckCircle2, Clipboard, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  IocCandidate,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Separator } from "@/shared/ui/separator"

import { TypeBadge, VerdictBadge } from "./ioc-verification-badges"
import {
  confidenceText,
  isAllowlisted,
  isRemoteHit,
  observationSources,
  riskText,
  verdictFromItem,
} from "./ioc-verification-display-utils"

export function IocVerificationDetailPanel({
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
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">{t("detail.title")}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{t("detail.noSelection")}</p>
          </div>
        </div>
      </section>
    )
  }

  const verdict = verdictFromItem(item)
  const sources = observationSources(item)
  const entry = item.result?.entry
  const verification = item.verification
  const allowlistLabel =
    item.status === "checking"
      ? t("allowlist.checking")
      : isAllowlisted(item)
        ? t("allowlist.hit")
      : item.status === "idle"
        ? t("allowlist.pending")
        : t("allowlist.miss")
  const hitSource = [
    verification?.hit_source_database,
    verification?.hit_source_table,
  ].filter(Boolean).join(".")
  const hitScope = verification?.hit_scope || "-"
  const hitKind = verification?.hit_kind || "-"
  const hitCategory = verification?.hit_category || "-"
  const hitRecordId = verification?.hit_source_record_id || "-"
  const localIntelStatus =
    verification?.local_status ||
    verification?.local_decision ||
    item.result?.hit_source ||
    "pending"
  const remoteIntelStatus =
    verification?.remote_status ||
    (item.result?.hit_source === "remote_hit" ? "hit" : "skipped")

  return (
    <section className="flex h-full w-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{t("detail.title")}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{t("detail.description")}</p>
        </div>
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
            <h3 className="text-sm font-semibold text-slate-950">Hit Source</h3>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-2">
                <span className="text-slate-400">Scope</span>
                <span className="font-mono text-slate-700">{hitScope}</span>
                <span className="text-slate-400">Kind</span>
                <span className="font-mono text-slate-700">{hitKind}</span>
                <span className="text-slate-400">Category</span>
                <span className="font-mono text-slate-700">{hitCategory}</span>
                <span className="text-slate-400">Source</span>
                <span className="break-all font-mono text-slate-700">{hitSource || "-"}</span>
                <span className="text-slate-400">Record</span>
                <span className="break-all font-mono text-slate-700">{hitRecordId}</span>
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
                    : hitSource ||
                      item.verification?.local_hit_source ||
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
