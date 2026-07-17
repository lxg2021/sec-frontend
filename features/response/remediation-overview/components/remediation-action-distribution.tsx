"use client"

import { AlertCircle, BarChart3, ListChecks, Loader2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import type { RemediationOverviewActionBucket } from "@/features/attack/remediation-order"
import { remediationActionIcon, remediationActionIconClassName } from "@/features/response/remediation-orchestration/components/remediation-action-icons"
import { remediationOrderActionLabel } from "@/features/response/remediation-orchestration/components/remediation-order-parameter-editor"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

import { countNumber, formatCount } from "../presentation"

interface ActionDistributionProps {
  data: RemediationOverviewActionBucket[]
  error: string
  loading: boolean
  onRetry: () => void
}

export function RemediationActionDistribution({ data, error, loading, onRetry }: ActionDistributionProps) {
  const t = useTranslations("pages.response.overview.actions")
  const locale = useLocale()
  const sorted = [...data].sort((left, right) => countNumber(right.item_count) - countNumber(left.item_count))
  const max = Math.max(1, ...sorted.map((item) => countNumber(item.item_count)))

  return (
    <Card className="flex min-h-0 flex-col border-0 shadow-md">
      <CardHeader className="flex shrink-0 flex-row items-center gap-3 px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <BarChart3 className="size-4.5 text-white" aria-hidden />
        </span>
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">{t("title")}</CardTitle>
          <p className="mt-0.5 text-xs text-slate-400">{t("description")}</p>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4 pb-3 pt-0">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" aria-hidden />{t("loading")}</div>
        ) : error ? (
          <button type="button" onClick={onRetry} className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl text-sm text-red-600 hover:bg-red-50">
            <AlertCircle className="size-5" aria-hidden /><span>{t("loadFailed")}</span><span className="text-xs text-slate-400">{t("retry")}</span>
          </button>
        ) : sorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400"><ListChecks className="size-7 opacity-40" aria-hidden />{t("empty")}</div>
        ) : (
          <div className="custom-scrollbar h-full space-y-2.5 overflow-y-auto pr-1">
            {sorted.map((item) => {
              const count = countNumber(item.item_count)
              const Icon = remediationActionIcon(item.action_code)
              return (
                <div key={item.action_code} className="grid grid-cols-[minmax(130px,0.9fr)_minmax(120px,1.3fr)_auto] items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-700" title={item.action_code}>
                    <Icon className={cn("size-4 shrink-0", remediationActionIconClassName(item.action_code))} aria-hidden />
                    <span className="truncate">{remediationOrderActionLabel({ action_code: item.action_code, entity_type: "" }, locale)}</span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                    <span className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${Math.max(3, (count / max) * 100)}%` }} />
                  </span>
                  <span className="min-w-8 text-right text-xs font-semibold tabular-nums text-slate-700">{formatCount(item.item_count, locale)}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
