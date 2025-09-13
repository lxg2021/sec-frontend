"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, CheckCircle, XCircle, Laptop, Apple, Server } from "lucide-react"
import type { HostSummary } from "@/lib/hostSummary"
import { SystemType } from "@/lib/systemInfo"

interface HostSummaryCardProps {
  summary: HostSummary
}

export function HostSummaryCard({ summary }: HostSummaryCardProps) {
  const getSystemIcon = (systemType: SystemType) => {
    switch (systemType) {
      case SystemType.WINDOWS:
        return <Monitor className="h-4 w-4" />
      case SystemType.MACOS:
        return <Apple className="h-4 w-4" />
      case SystemType.LINUX:
        return <Server className="h-4 w-4" />
      default:
        return <Laptop className="h-4 w-4" />
    }
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 总主机数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总主机数</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total}</div>
          <p className="text-xs text-muted-foreground">已注册主机总数</p>
        </CardContent>
      </Card>

      {/* 在线主机数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">在线主机</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{summary.online}</div>
          <p className="text-xs text-muted-foreground">在线率 {((summary.online / summary.total) * 100).toFixed(1)}%</p>
        </CardContent>
      </Card>

      {/* 离线主机数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">离线主机</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summary.offline}</div>
          <p className="text-xs text-muted-foreground">
            离线率 {((summary.offline / summary.total) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* 操作系统分布 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">操作系统</CardTitle>
          <Laptop className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(summary.osTypeCount).map(([osType, count]) => (
              <div key={osType} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSystemIcon(osType as SystemType)}
                  <span className="text-sm">{getSystemName(osType as SystemType)}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
