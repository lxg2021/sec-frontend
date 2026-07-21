"use client"

import { Database, FileText, Hash, ShieldCheck } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { cn } from "@/shared/lib/utils"

import type { BaselineListItem } from "../api"

interface ExistingCustomBaselineListProps {
  baselines: BaselineListItem[]
  loading: boolean
  errorMessage: string
  className?: string
}

function formatCreatedAt(value: string, locale: string) {
  const normalized = value.trim()
  if (!normalized) return "-"

  const date = new Date(normalized.includes("T") ? normalized : normalized.replace(" ", "T"))
  if (Number.isNaN(date.getTime())) return normalized

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function ExistingCustomBaselineList({
  baselines,
  loading,
  errorMessage,
  className,
}: ExistingCustomBaselineListProps) {
  const t = useTranslations("pages.baseline.custom.existingList")
  const locale = useLocale()

  return (
    <Card className={cn("relative flex h-[190px] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg", className)}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-4 border-b border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/60 py-3.5 pl-5 pr-16">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-sm shadow-emerald-200/70">
            <Database className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base font-semibold text-zinc-950">{t("title")}</CardTitle>
              <Badge variant="secondary" className="h-5 shrink-0 rounded-full bg-zinc-100 px-2 text-[11px] font-medium text-zinc-700">
                {t("count", { count: baselines.length })}
              </Badge>
            </div>
            <CardDescription className="mt-0.5 truncate text-xs text-zinc-500">{t("subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        {loading && baselines.length === 0 ? (
          <div className="grid h-full grid-cols-3 gap-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-full min-h-12 rounded-xl" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-medium text-rose-700">{t("loadFailed")}</p>
              <p className="mt-1 text-xs text-rose-600">{errorMessage}</p>
            </div>
          </div>
        ) : baselines.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <ShieldCheck className="mx-auto h-7 w-7 text-zinc-300" />
              <p className="mt-1 text-sm font-medium text-zinc-950">{t("emptyTitle")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("emptyDescription")}</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto overscroll-contain [&>div]:overflow-x-hidden">
            <Table className="w-full table-fixed [&_td]:py-2 [&_th]:h-9">
              <TableHeader className="sticky top-0 z-10 bg-zinc-50 shadow-[0_1px_0_0_rgba(228,228,231,1)]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[18%]">{t("columns.name")}</TableHead>
                  <TableHead className="w-[8%]">{t("columns.version")}</TableHead>
                  <TableHead className="w-[8%] text-center">{t("columns.items")}</TableHead>
                  <TableHead className="w-[30%]">{t("columns.fileName")}</TableHead>
                  <TableHead className="w-[16%]">{t("columns.createdAt")}</TableHead>
                  <TableHead className="w-[20%]">{t("columns.uuid")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baselines.map((baseline) => (
                  <TableRow key={baseline.uuid} className="hover:bg-emerald-50/40">
                    <TableCell className="overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="min-w-0 flex-1 truncate font-medium text-zinc-950" title={baseline.display_name || baseline.uuid}>
                          {baseline.display_name || baseline.uuid}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-700">{baseline.baseline_version || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {baseline.item_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-600">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span className="min-w-0 flex-1 truncate font-mono" title={baseline.original_filename || undefined}>
                          {baseline.original_filename || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-zinc-600">
                      {formatCreatedAt(baseline.created_at, locale)}
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-600">
                        <Hash className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <code className="block min-w-0 flex-1 truncate" title={baseline.uuid}>{baseline.uuid}</code>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
