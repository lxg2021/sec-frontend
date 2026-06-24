"use client"

import { Loader2, Radar, RefreshCw, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  IocCandidate,
  IocVerificationItem,
  IocVerificationStatus,
  IocVerificationType,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

import { IocResultsTable } from "./ioc-verification-results-table"

export function IocVerificationResultsPanel({
  filteredItems,
  selectedId,
  verifying,
  searchText,
  typeFilter,
  statusFilter,
  actionOnly,
  typeOptions,
  hasItems,
  className,
  onSearchTextChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onActionOnlyChange,
  onVerifyAll,
  onCopy,
  onSelect,
  onVerifyOne,
}: {
  filteredItems: IocVerificationItem[]
  selectedId: string
  verifying: boolean
  searchText: string
  typeFilter: IocVerificationType | "all"
  statusFilter: IocVerificationStatus | "all"
  actionOnly: boolean
  typeOptions: IocVerificationType[]
  hasItems: boolean
  className?: string
  onSearchTextChange: (value: string) => void
  onTypeFilterChange: (value: IocVerificationType | "all") => void
  onStatusFilterChange: (value: IocVerificationStatus | "all") => void
  onActionOnlyChange: (value: boolean) => void
  onVerifyAll: () => void
  onCopy: (value: string) => void
  onSelect: (id: string) => void
  onVerifyOne: (candidate: IocCandidate) => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Radar className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-medium text-slate-950">
              {t("results.title")}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t("results.description")}
            </p>
          </div>
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
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="h-10 rounded-2xl border-slate-200 bg-slate-50 pl-9 shadow-none focus-visible:ring-blue-200"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(event.target.value as IocVerificationType | "all")
          }
          className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
        >
          <option value="all">{t("filters.allTypes")}</option>
          {typeOptions.filter((type) => type !== "auto").map((type) => (
            <option key={type} value={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as IocVerificationStatus | "all")
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
          onClick={() => onActionOnlyChange(!actionOnly)}
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
          disabled={verifying || !hasItems}
          onClick={onVerifyAll}
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
          selectedId={selectedId}
          verifying={verifying}
          onCopy={onCopy}
          onSelect={onSelect}
          onVerify={onVerifyOne}
        />
      </div>
    </section>
  )
}
