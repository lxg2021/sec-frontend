"use client"

import type { ComponentType, ReactNode } from "react"
import { useLocale } from "next-intl"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Monitor,
  TrendingUp,
  XCircle,
} from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import type { BaselineItemResultStatistics, BaselineTemplateItem } from "../../dashboard/api"

type IconComponent = ComponentType<{ className?: string }>

interface BaselineDetailHeaderProps {
  item: BaselineTemplateItem | null
  statistics: BaselineItemResultStatistics | null
  baselineUuid: string
  baselineName?: string
  categoryIcon?: IconComponent
  fallbackCategory?: string
  fallbackTitle?: string
  isLoading?: boolean
  onBack?: () => void
}

function getSeverityMeta(severity?: string) {
  const normalized = (severity || "").toLowerCase()

  if (normalized === "high") {
    return {
      label: "高风险",
      className: "border-red-200 bg-red-50 text-red-700",
      iconClassName: "text-red-600",
    }
  }

  if (normalized === "medium") {
    return {
      label: "中风险",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      iconClassName: "text-amber-600",
    }
  }

  if (normalized === "low") {
    return {
      label: "低风险",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClassName: "text-emerald-600",
    }
  }

  return {
    label: severity || "未知风险",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    iconClassName: "text-slate-500",
  }
}

function formatNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function formatPassRate(statistics: BaselineItemResultStatistics | null) {
  if (!statistics || !Number.isFinite(statistics.pass_rate)) return "0.0%"
  return `${statistics.pass_rate.toFixed(1)}%`
}

function SkeletonLine({ className }: { className: string }) {
  return <span className={cn("inline-block animate-pulse rounded bg-muted", className)} />
}

function StatItem({
  className,
  icon,
  isLoading,
  label,
  value,
}: {
  className: string
  icon: ReactNode
  isLoading?: boolean
  label: string
  value: number | string
}) {
  return (
    <div className={cn("min-h-14 rounded-2xl px-3 py-2.5", className)}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 opacity-80" aria-hidden="true">
          {icon}
        </span>
        {isLoading ? (
          <SkeletonLine className="h-5 w-12" />
        ) : (
          <div className="font-mono text-base font-semibold leading-none tabular-nums">{value}</div>
        )}
      </div>
      <div className="mt-1.5 text-[11px] font-medium leading-none opacity-70">{label}</div>
    </div>
  )
}

export function BaselineDetailHeader({
  item,
  statistics,
  baselineUuid,
  baselineName,
  categoryIcon: CategoryIcon = Info,
  fallbackCategory,
  fallbackTitle,
  isLoading = false,
  onBack,
}: BaselineDetailHeaderProps) {
  const locale = useLocale()
  const useZh = locale.toLowerCase().startsWith("zh")
  const title = (useZh ? item?.name_zh : item?.name) || item?.name || item?.name_zh || fallbackTitle || "检查项详情"
  const categoryLabel =
    (useZh ? item?.category_zh : item?.category) || item?.category || item?.category_zh || fallbackCategory || "未分类"
  const templateLabel = baselineName || baselineUuid || "基线模板"
  const itemId = item?.id || "未知"
  const severityMeta = getSeverityMeta(item?.severity)

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_34px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100 text-blue-600">
            <CategoryIcon className="size-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <SkeletonLine className="h-6 w-full max-w-[28rem]" />
                ) : (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
                          {title}
                        </h1>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[32rem] whitespace-normal break-words">
                        {title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onBack}
              className="size-9 shrink-0 rounded-full border-slate-200 bg-white text-slate-700 shadow-none transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              aria-label="返回"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            </div>

            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap text-xs">
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="max-w-[14rem] truncate font-normal text-slate-500">
                      {templateLabel}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="max-w-[14rem] truncate font-medium text-slate-600">
                      {isLoading ? <SkeletonLine className="h-4 w-20" /> : categoryLabel}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {isLoading ? (
                <div className="flex flex-wrap gap-2">
                  <SkeletonLine className="h-6 w-20 rounded-full" />
                  <SkeletonLine className="h-6 w-24 rounded-full" />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("gap-1.5", severityMeta.className)}>
                    <AlertTriangle className={cn("h-3 w-3", severityMeta.iconClassName)} />
                    {severityMeta.label}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 border-slate-200 bg-background text-slate-600">
                    <Info className="h-3 w-3" />
                    ID: {itemId}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:w-auto xl:min-w-[600px]">
          <StatItem
            label="总主机数"
            value={formatNumber(statistics?.total_hosts)}
            icon={<Monitor className="size-4" />}
            className="bg-slate-100 text-slate-950"
            isLoading={isLoading}
          />
          <StatItem
            label="通过"
            value={formatNumber(statistics?.passed_hosts)}
            icon={<CheckCircle2 className="size-4" />}
            className="bg-emerald-50 text-emerald-700"
            isLoading={isLoading}
          />
          <StatItem
            label="失败"
            value={formatNumber(statistics?.failed_hosts)}
            icon={<XCircle className="size-4" />}
            className="bg-rose-50 text-rose-700"
            isLoading={isLoading}
          />
          <StatItem
            label="异常"
            value={formatNumber(statistics?.error_hosts)}
            icon={<AlertCircle className="size-4" />}
            className="bg-amber-50 text-amber-700"
            isLoading={isLoading}
          />
          <StatItem
            label="通过率"
            value={formatPassRate(statistics)}
            icon={<TrendingUp className="size-4" />}
            className="bg-indigo-50 text-indigo-700"
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  )
}

export default BaselineDetailHeader
