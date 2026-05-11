"use client"

import type { ComponentType, ReactNode } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Monitor,
  Shield,
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
import { Card } from "@/shared/ui/card"
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
  accentClassName,
  icon,
  iconClassName,
  isLoading,
  label,
  value,
  valueClassName,
}: {
  accentClassName: string
  icon: ReactNode
  iconClassName: string
  isLoading?: boolean
  label: string
  value: number | string
  valueClassName: string
}) {
  return (
    <Card className="relative overflow-hidden rounded-md border bg-background shadow-sm transition-shadow hover:shadow-md">
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", accentClassName)} />
      <div className="flex min-h-[86px] items-center gap-2.5 px-3 py-4 pl-4">
        <div className={cn("shrink-0", iconClassName)}>{icon}</div>
        <div className="min-w-0">
          <div className="text-[11px] leading-4 text-muted-foreground">{label}</div>
          {isLoading ? (
            <SkeletonLine className="mt-1 h-5 w-12" />
          ) : (
            <div className={cn("text-lg font-semibold leading-6 tabular-nums", valueClassName)}>{value}</div>
          )}
        </div>
      </div>
    </Card>
  )
}

export function BaselineDetailHeader({
  item,
  statistics,
  baselineUuid,
  baselineName,
  fallbackCategory,
  fallbackTitle,
  isLoading = false,
  onBack,
}: BaselineDetailHeaderProps) {
  const title = item?.name_zh || item?.name || fallbackTitle || "检查项详情"
  const categoryLabel = item?.category_zh || item?.category || fallbackCategory || "未分类"
  const templateLabel = baselineName || baselineUuid || "基线模板"
  const itemId = item?.id || "未知"
  const severityMeta = getSeverityMeta(item?.severity)

  return (
    <section className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[18rem] truncate font-normal text-muted-foreground">
              {templateLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[18rem] truncate font-medium text-foreground">
              {isLoading ? <SkeletonLine className="h-4 w-20" /> : categoryLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="flex min-w-0 shrink-0 items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 shrink-0 rounded-full bg-background shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              aria-label="返回"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

          <div className="flex min-h-[86px] w-full min-w-0 px-1 py-1 xl:w-[32rem]">
            {isLoading ? (
              <div className="flex min-h-[78px] w-full flex-col justify-between gap-2">
                <SkeletonLine className="h-8 w-full max-w-[28rem]" />
                <div className="flex flex-wrap gap-2">
                  <SkeletonLine className="h-6 w-32 rounded-full" />
                  <SkeletonLine className="h-6 w-20 rounded-full" />
                  <SkeletonLine className="h-6 w-24 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[78px] w-full flex-col justify-between gap-2">
                <div className="min-w-0 w-full">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h1 className="w-full truncate text-xl font-semibold leading-snug tracking-tight text-foreground">
                          {title}
                        </h1>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[32rem] whitespace-normal break-words">
                        {title}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

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
              </div>
            )}
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatItem
              label="总主机数"
              value={formatNumber(statistics?.total_hosts)}
              icon={<Monitor className="h-4 w-4" />}
              accentClassName="bg-blue-500"
              iconClassName="text-blue-500"
              valueClassName="text-blue-600"
              isLoading={isLoading}
            />
            <StatItem
              label="通过"
              value={formatNumber(statistics?.passed_hosts)}
              icon={<CheckCircle2 className="h-4 w-4" />}
              accentClassName="bg-emerald-500"
              iconClassName="text-emerald-500"
              valueClassName="text-emerald-600"
              isLoading={isLoading}
            />
            <StatItem
              label="失败"
              value={formatNumber(statistics?.failed_hosts)}
              icon={<XCircle className="h-4 w-4" />}
              accentClassName="bg-rose-500"
              iconClassName="text-rose-500"
              valueClassName="text-rose-600"
              isLoading={isLoading}
            />
            <StatItem
              label="异常"
              value={formatNumber(statistics?.error_hosts)}
              icon={<AlertCircle className="h-4 w-4" />}
              accentClassName="bg-amber-500"
              iconClassName="text-amber-500"
              valueClassName="text-amber-600"
              isLoading={isLoading}
            />
            <StatItem
              label="通过率"
              value={formatPassRate(statistics)}
              icon={<TrendingUp className="h-4 w-4" />}
              accentClassName="bg-indigo-500"
              iconClassName="text-indigo-500"
              valueClassName="text-indigo-600"
              isLoading={isLoading}
            />
          </div>
        </div>
    </section>
  )
}

export default BaselineDetailHeader
