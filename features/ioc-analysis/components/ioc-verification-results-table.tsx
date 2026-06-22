"use client"

import { Clipboard, Loader2, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  IocCandidate,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import { AllowlistBadge, TypeBadge, VerdictBadge } from "./ioc-verification-badges"
import { verificationSourceText } from "./ioc-verification-display-utils"
import { IocVerificationEmptyState } from "./ioc-verification-empty-state"

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
                  {item.evidence_refs.length ? ` 路 ${item.evidence_refs[0]}` : ""}
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
