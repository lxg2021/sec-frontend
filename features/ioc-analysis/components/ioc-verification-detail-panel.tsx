"use client"

import { CheckCircle2, Clipboard, FileText, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
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
  const verification = item.verification
  const allowlistLabel =
    item.status === "checking"
      ? t("allowlist.checking")
      : isAllowlisted(item)
        ? t("allowlist.hit")
      : item.status === "idle"
        ? t("allowlist.pending")
        : t("allowlist.miss")
  const localIntelStatus =
    verification?.local_status ||
    verification?.local_decision ||
    item.result?.hit_source ||
    "pending"
  const remoteIntelStatus =
    verification?.remote_status ||
    (item.result?.hit_source === "remote_hit" ? "hit" : "skipped")
  const fileLabel = item.file_name || item.file_path || ""
  const fileTitle = item.file_path || item.file_name || undefined
  const filePathLine = item.file_path && item.file_path !== fileLabel ? item.file_path : ""

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
        </div>
        {fileLabel ? (
          <div
            className="mt-3 flex min-w-0 items-start gap-2 border-t border-blue-100 pt-3 text-xs text-slate-600"
            title={fileTitle}
          >
            <FileText className="mt-0.5 size-4 shrink-0 text-blue-500" aria-hidden="true" />
            <div className="min-w-0">
              <div className="font-medium text-slate-700">{t("detail.sourceFile")}</div>
              <div className="mt-0.5 truncate font-mono text-slate-700">{fileLabel}</div>
              {filePathLine ? (
                <div className="mt-0.5 truncate font-mono text-slate-500">{filePathLine}</div>
              ) : null}
            </div>
          </div>
        ) : null}
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
