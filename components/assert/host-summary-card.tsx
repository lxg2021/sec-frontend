"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Monitor, CheckCircle, XCircle, Laptop } from "lucide-react"
import type { HostSummary } from "@/lib/hostSummary"
import { SystemType } from "@/lib/systemInfo"
import Image from "next/image"

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
      {/* 总主机数 */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">总主机数</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <Monitor className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{summary.total}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">已注册主机总数</p>
        </CardContent>
      </Card>

      {/* 在线主机数 */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">在线主机</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-green-600">{summary.online}</span>
            <span className="text-xs text-slate-500 ml-2">{((summary.online / summary.total) * 100).toFixed(1)}%</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">当前在线主机数</p>
        </CardContent>
      </Card>

      {/* 离线主机数 */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">离线主机</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
            <XCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-red-600">{summary.offline}</span>
            <span className="text-xs text-slate-500 ml-2">{((summary.offline / summary.total) * 100).toFixed(1)}%</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">当前离线主机数</p>
        </CardContent>
      </Card>

      {/* 操作系统分布 */}
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 opacity-10 group-hover:opacity-20 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">操作系统分布</span>
          <div className="p-2 rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-700">
            <Laptop className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(summary.osTypeCount).map(([osType, count]) => (
              <div key={osType} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSystemIcon(osType as SystemType)}
                  <span className="text-sm">{getSystemName(osType as SystemType)}</span>
                </div>
                <span className="text-xs text-slate-800 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
