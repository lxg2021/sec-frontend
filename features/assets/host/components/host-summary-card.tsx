"use client"

import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Monitor, CheckCircle, XCircle, Laptop } from "lucide-react"
import type { HostSummary } from "@/features/assets/host/types/host-summary"
import { SystemType } from "@/features/assets/host/types/system-info"
import Image from "next/image"
import { useTranslations } from "next-intl"

const systemIcons: Record<string, string> = {
  windows: "/icons/system/windows.svg",
  linux: "/icons/system/linux.svg",
  macos: "/icons/system/macos.svg",
}

function getSystemIcon(osType: SystemType) {
  const src = systemIcons[osType] || systemIcons.windows
  return (
    <Image
      src={src}
      width={18}
      height={18}
      alt={osType}
      className="inline-block"
    />
  )
}

export function HostSummaryCard({ summary }: { summary: HostSummary }) {
  const t = useTranslations("pages.assets.hardware.host.summary")
  const onlinePercent = summary.total > 0 ? ((summary.online / summary.total) * 100).toFixed(1) : "0.0"
  const offlinePercent = summary.total > 0 ? ((summary.offline / summary.total) * 100).toFixed(1) : "0.0"
  const osTypeEntries = Object.entries(summary.osTypeCount).filter(
    ([osType, count]) => osType !== "unknown" && Number(count) > 0,
  )

  const getSystemName = (systemType: SystemType) => {
    switch (systemType) {
      case SystemType.WINDOWS:
        return "Windows"
      case SystemType.MACOS:
        return "macOS"
      case SystemType.LINUX:
        return "Linux"
      default:
        return systemType
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total hosts */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("total")}</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <Monitor className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{summary.total}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("totalDescription")}</p>
        </CardContent>
      </Card>

      {/* Online hosts */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("online")}</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-green-600">{summary.online}</span>
            <span className="text-xs text-slate-500 ml-2">{onlinePercent}%</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("onlineDescription")}</p>
        </CardContent>
      </Card>

      {/* Offline hosts */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("offline")}</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
            <XCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-red-600">{summary.offline}</span>
            <span className="text-xs text-slate-500 ml-2">{offlinePercent}%</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("offlineDescription")}</p>
        </CardContent>
      </Card>

      {/* Operating system distribution */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("osDistribution")}</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-700">
            <Laptop className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {osTypeEntries.length > 0 ? osTypeEntries.map(([osType, count]) => (
              <div key={osType} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSystemIcon(osType as SystemType)}
                  <span className="text-sm">{getSystemName(osType as SystemType)}</span>
                </div>
                <span className="text-xs text-slate-800 dark:text-white">{count}</span>
              </div>
            )) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">{t("empty")}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
