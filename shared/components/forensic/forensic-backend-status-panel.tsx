"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Clock,
  Cpu,
  Database,
  FolderTree,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  Network,
  Radio,
  Server,
  ShieldCheck,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicBackendHealthStatus, ForensicBackendStatusData } from "@/shared/lib/forensic/types"
import { ForensicIconBadge } from "./forensic-panel-chrome"

interface Props {
  data: ForensicBackendStatusData
  loading?: boolean
}

type StatusLevel = "healthy" | "warning" | "critical" | "offline"

const STATUS_LEVEL_CLASS: Record<StatusLevel, string> = {
  healthy: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  warning: "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  critical: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300",
  offline: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
}

const STATUS_DOT_CLASS: Record<StatusLevel, string> = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  offline: "bg-slate-400",
}

function backendLevel(status: string): StatusLevel {
  switch (status.toLowerCase()) {
    case "healthy":
    case "ok":
    case "running":
      return "healthy"
    case "degraded":
    case "warning":
      return "warning"
    case "critical":
    case "error":
    case "failed":
      return "critical"
    default:
      return "offline"
  }
}

function usageLevel(percent: number) {
  if (percent >= 90) return { bar: "bg-red-600", text: "text-red-700 dark:text-red-300" }
  if (percent >= 75) return { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" }
  return { bar: "bg-emerald-600", text: "text-emerald-700 dark:text-emerald-300" }
}

function formatBytes(bytes: number, locale: string): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: value >= 10 ? 1 : 2 }).format(value)} ${units[index]}`
}

function formatUnixTime(seconds: number, locale: string): string {
  if (!seconds) return "-"
  return new Date(seconds * 1000).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function formatRelativeTime(seconds: number, locale: string): string {
  if (!seconds) return "-"
  const diffSeconds = Math.round(seconds - Date.now() / 1000)
  const absolute = Math.abs(diffSeconds)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  if (absolute < 60) return formatter.format(diffSeconds, "second")
  if (absolute < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute")
  if (absolute < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour")
  return formatter.format(Math.round(diffSeconds / 86400), "day")
}

function UsageBar({ value, barClassName }: { value: number; barClassName?: string }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn("h-full rounded-full transition-all", barClassName)} style={{ width: `${clamped}%` }} />
    </div>
  )
}

function StatusBadge({ status }: { status: ForensicBackendHealthStatus | "warning" | "offline" }) {
  const t = useTranslations("pages.investigation.collection.backendStatus.status")
  const level = backendLevel(status)
  const labelKey = status === "warning" ? "degraded" : status === "offline" ? "unavailable" : status

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        STATUS_LEVEL_CLASS[level]
      )}
    >
      <span className="relative flex size-1.5">
        {level === "healthy" && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        )}
        <span className={cn("relative inline-flex size-1.5 rounded-full", STATUS_DOT_CLASS[level])} />
      </span>
      {t(labelKey)}
    </span>
  )
}

function MetricItem({
  icon: Icon,
  label,
  value,
  hint,
  className,
}: {
  icon?: LucideIcon
  label: string
  value: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("flex min-h-20 min-w-0 flex-col gap-1 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800", className)}>
      <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <div className="min-w-0 break-words font-mono text-lg font-semibold leading-6 tabular-nums text-foreground">{value}</div>
      {hint ? <div className="truncate text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export function ForensicBackendStatusPanel({ data, loading = false }: Props) {
  const locale = useLocale()
  const t = useTranslations("pages.investigation.collection.backendStatus")
  const { velociraptor, storage, endpoints } = data
  const storageUsage = usageLevel(storage.used_percent)
  const endpointOnlineRate = endpoints.registered > 0 ? Math.round((endpoints.connected / endpoints.registered) * 100) : 0
  const endpointStatus = endpoints.registered > 0 && endpoints.connected === endpoints.registered
    ? "healthy"
    : endpoints.connected > 0
      ? "warning"
      : "offline"

  return (
    <Card className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:bg-slate-950">
      <CardHeader className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:justify-between sm:p-5 sm:pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <ForensicIconBadge icon={ShieldCheck} tone="indigo" className="size-10 rounded-xl" iconClassName="size-5" />
          <div className="min-w-0">
            <CardTitle className="text-base font-medium leading-6 text-foreground">{t("title")}</CardTitle>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-muted-foreground">
              <span>{t("description")}</span>
              <span className="text-muted-foreground/60">|</span>
              <span>{t("lastRefresh", { time: formatUnixTime(data.last_refresh_at, locale) })}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {loading ? <span className="text-xs text-muted-foreground">{t("loading")}</span> : null}
          <StatusBadge status={velociraptor.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <MetricItem icon={Cpu} label={t("metrics.cpu")} value={`${velociraptor.cpu_percent}%`} />
          <MetricItem icon={MemoryStick} label={t("metrics.memory")} value={formatBytes(velociraptor.memory_bytes, locale)} />
          <MetricItem icon={Network} label={t("metrics.frontends")} value={velociraptor.total_frontends} />
          <MetricItem icon={Activity} label={t("metrics.connections")} value={velociraptor.current_connections} />
          <MetricItem
            icon={Clock}
            label={t("metrics.lastSeen")}
            value={formatRelativeTime(velociraptor.last_seen_at, locale)}
            hint={formatUnixTime(velociraptor.last_seen_at, locale)}
            className="col-span-2 md:col-span-1"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="min-w-0 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <HardDrive className="size-4 text-muted-foreground" aria-hidden="true" />
                {t("storage.title")}
              </div>
              <span className={cn("font-mono text-sm font-semibold tabular-nums", storageUsage.text)}>
                {storage.used_percent}%
              </span>
            </div>
            <div className="space-y-2">
              <UsageBar value={storage.used_percent} barClassName={storageUsage.bar} />
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>{t("storage.used", { value: storage.used || "-" })}</span>
                <span className="text-center">{t("storage.available", { value: storage.available || "-" })}</span>
                <span className="text-right">{t("storage.total", { value: storage.total || "-" })}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricItem icon={Database} label={t("storage.type")} value={<span className="text-sm">{storage.type || "-"}</span>} />
              <MetricItem icon={HardDrive} label={t("storage.filesystem")} value={<span className="text-sm">{storage.filesystem || "-"}</span>} />
              <MetricItem
                icon={FolderTree}
                label={t("storage.containerPath")}
                value={<span className="break-all text-sm">{storage.container_path || "-"}</span>}
                className="col-span-2"
              />
            </div>
          </section>

          <section className="min-w-0 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden="true" />
                {t("endpoints.title")}
              </div>
              <StatusBadge status={endpointStatus} />
            </div>
            <div className="flex items-end justify-center gap-2 rounded-2xl bg-white py-6 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
              <span className="font-mono text-4xl font-semibold tabular-nums text-foreground">{endpoints.connected}</span>
              <span className="pb-1 font-mono text-lg text-muted-foreground">/ {endpoints.registered}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("endpoints.onlineRate")}</span>
                <span className="font-mono tabular-nums">{endpointOnlineRate}%</span>
              </div>
              <UsageBar value={endpointOnlineRate} barClassName="bg-emerald-600" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricItem icon={Radio} label={t("endpoints.connected")} value={endpoints.connected} />
              <MetricItem icon={Server} label={t("endpoints.registered")} value={endpoints.registered} />
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}
