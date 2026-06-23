"use client"

import type { KeyboardEvent } from "react"
import { Clipboard, FileText, Loader2, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  IocCandidate,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import { VerdictBadge } from "./ioc-verification-badges"
import {
  isAllowlisted,
  riskText,
  verificationSourceText,
} from "./ioc-verification-display-utils"
import { IocVerificationEmptyState } from "./ioc-verification-empty-state"

const tableGridClass =
  "grid-cols-[minmax(360px,1.8fr)_minmax(140px,0.7fr)_64px_92px_108px_148px_64px_108px_64px]"
const actionButtonClass =
  "h-10 w-10 shrink-0 rounded-full text-teal-600 hover:bg-teal-50 hover:text-teal-700"
const inlineCopyButtonClass =
  "h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-teal-50 hover:text-teal-700"

function fileNameFromPath(value: string) {
  const trimmed = value.trim().replace(/[\\/]+$/, "")
  return trimmed.split(/[\\/]/).pop() || value
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

  function allowlistText(item: IocVerificationItem) {
    if (item.status === "checking") return t("allowlist.checking")
    if (isAllowlisted(item)) return t("allowlist.hit")
    if (item.status === "idle") return t("allowlist.pending")
    return t("allowlist.miss")
  }

  return (
    <div className="min-w-[1220px] overflow-hidden rounded-2xl border border-slate-100">
      <div
        className={cn(
          "grid items-center gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400",
          tableGridClass,
        )}
      >
        <div>{t("table.ioc").toLocaleLowerCase()}</div>
        <div>filename</div>
        <div>{t("fields.type").toLocaleLowerCase()}</div>
        <div>{t("table.allowlist").toLocaleLowerCase()}</div>
        <div>{t("table.verification").toLocaleLowerCase()}</div>
        <div>{t("table.time").toLocaleLowerCase()}</div>
        <div className="text-center">{t("fields.risk").toLocaleLowerCase()}</div>
        <div className="text-center">{t("table.verdict").toLocaleLowerCase()}</div>
        <div className="text-center">refresh</div>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const selected = item.id === selectedId
          const occurredAt = item.occurred_at || ""
          const allowlistLabel = allowlistText(item)
          const verificationLabel = verificationSourceText(item, t)
          const riskLabel = riskText(item)
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
                "group grid w-full cursor-pointer items-center gap-4 px-4 py-3 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-200",
                tableGridClass,
                selected && "relative bg-blue-50 hover:bg-blue-50",
              )}
            >
              {selected ? (
                <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-blue-600" />
              ) : null}
              <div className="min-w-0 pl-1">
                <div className="inline-flex max-w-full items-center gap-1.5">
                  <code className="min-w-0 truncate font-mono text-sm text-slate-950">
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
              <div
                className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500"
                title={fileTitle}
              >
                {fileLabel ? (
                  <>
                    <FileText className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate">{fileLabel}</span>
                  </>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </div>
              <div
                className="truncate font-mono text-xs font-semibold text-slate-500"
                title={item.type}
              >
                {item.type}
              </div>
              <div
                className="truncate text-sm font-medium text-slate-600"
                title={allowlistLabel}
              >
                {allowlistLabel.toLocaleLowerCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-700">
                  {verificationLabel.toLocaleLowerCase()}
                </div>
              </div>
              <div
                className="truncate font-mono text-xs text-slate-500"
                title={occurredAt || undefined}
              >
                {occurredAt || "-"}
              </div>
              <div
                className="truncate text-center font-mono text-xs font-semibold text-slate-500"
                title={riskLabel}
              >
                {riskLabel.toLocaleLowerCase()}
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
