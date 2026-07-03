"use client"

import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock3, Hexagon, Plus, RefreshCw, ScanSearch, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

interface Props {
  loading?: boolean
  refreshedAt?: Date | null
  caseId?: string
  onCaseIdSubmit?: (caseId: string) => void
  onRefresh?: () => void
}

function formatRefreshTime(value?: Date | null): string {
  if (!value) return "--"

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(value)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`
}

export function ForensicOverviewHeader({
  loading,
  refreshedAt,
  caseId,
  onCaseIdSubmit,
  onRefresh,
}: Props) {
  const t = useTranslations("pages.investigation.collection.header")
  const [caseInput, setCaseInput] = useState(caseId ?? "")
  useEffect(() => {
    setCaseInput(caseId ?? "")
  }, [caseId])

  function handleCaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onCaseIdSubmit?.(caseInput)
  }

  function handleRefreshClick() {
    const nextCaseId = caseInput.trim()
    const currentCaseId = (caseId ?? "").trim()
    if (onCaseIdSubmit && nextCaseId !== currentCaseId) {
      onCaseIdSubmit(nextCaseId)
      return
    }
    onRefresh?.()
  }

  const createTaskParams = new URLSearchParams({ action: "create" })
  const nextCaseId = caseInput.trim()
  if (nextCaseId) {
    createTaskParams.set("case_id", nextCaseId)
  }
  const createTaskHref = `/frame/investigation/tasks?${createTaskParams.toString()}`

  return (
    <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            <ScanSearch aria-hidden className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-1.5">
            <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
              {t("title")}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="inline-flex h-7 items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-teal-600">
                FORENSIC
              </span>
              <span className="min-w-0 truncate text-slate-500">{t("subtitle")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:gap-3">
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <form
              className="flex h-12 w-full min-w-[320px] max-w-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 sm:w-[420px] xl:w-[520px]"
              onSubmit={handleCaseSubmit}
            >
              <Search aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="search"
                aria-label={t("caseInputLabel")}
                value={caseInput}
                onChange={(event) => setCaseInput(event.target.value)}
                placeholder={t("casePlaceholder")}
                disabled={loading}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>

            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                <Clock3 aria-hidden className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400">{t("updatedAt")}</div>
                <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                  {formatRefreshTime(refreshedAt)}
                </div>
              </div>
            </div>

            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRefreshClick}
              disabled={loading}
              aria-label={t("refreshLabel")}
              className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="sr-only">{t("refreshLabel")}</span>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="h-10 shrink-0 rounded-full px-3 text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700"
            >
              <Link href="/frame/investigation/artifacts">
                <Hexagon className="h-4 w-4" />
                <span>{t("artifactConfigLabel")}</span>
              </Link>
            </Button>

            <Button
              asChild
              className="h-10 shrink-0 rounded-full bg-teal-600 px-4 text-white shadow-sm hover:bg-teal-700"
            >
              <Link href={createTaskHref}>
                <Plus className="h-4 w-4" />
                <span>{t("createTaskLabel")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
