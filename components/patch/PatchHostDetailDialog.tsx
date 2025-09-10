"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, AlertTriangle, Download, Monitor, Calendar, CheckCircle2 } from "lucide-react"
import type { PatchInstallProgress } from "@/lib/taskProgress"
import type { HostPatchInfo } from "@/lib/patch"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import Image from "next/image"
import { SystemType } from "@/lib/patch";

const systemIcons = {
  [SystemType.WINDOWS]: "/icons/system/windows.svg",
  [SystemType.MACOS]: "/icons/system/macos.svg",
  [SystemType.LINUX]: "/icons/system/linux.svg",
} as const

interface PatchHostDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  patchProgress: PatchInstallProgress | null
  initialTab?: "all" | "installed" | "failed" | "pending"
}

export function PatchHostDetailDialog({
  isOpen,
  onClose,
  patchProgress,
  initialTab = "all",
}: PatchHostDetailDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  if (!patchProgress) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "INSTALLED":
        return <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
      case "FAILED":
        return <XCircle className="h-4 w-4 mr-1 text-red-500" />
      case "UNINSTALLED":
        return <Clock className="h-4 w-4 mr-1 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 mr-1 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const commonClasses = "text-white px-2 py-1 min-w-[70px] text-center" // min-w-[70px] 固定最小宽度，text-center 居中显示文字
    switch (status) {
      case "INSTALLED":
        return <Badge className={`bg-green-600 ${commonClasses}`}>已安装</Badge>
      case "FAILED":
        return <Badge className={`bg-red-500 ${commonClasses}`}>安装失败</Badge>
      case "UNINSTALLED":
        return <Badge className={`bg-gray-500 ${commonClasses}`} variant="secondary">未安装</Badge>
      default:
        return <Badge className={`bg-gray-400 ${commonClasses}`} variant="secondary">未知状态</Badge>
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderHostList = (hosts: HostPatchInfo[], title: string, emptyMessage: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">
          {title} ({hosts.length})
        </h4>
        {hosts.length > 0 && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出列表
          </Button>
        )}
      </div>
      {hosts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="rounded-lg overflow-x-auto bg-white border">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left font-medium text-gray-700">主机ID</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">主机名</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">系统</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">安装时间</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">状态</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((host) => (
                <tr
                  key={host.hostId}
                  className={host.status === "FAILED" ? "bg-destructive/10" : ""}
                >
                  {/* host ID */}
                  <td className="px-4 py-3">{host.hostId}</td>
                  {/* 主机名 */}
                  <td className="px-4 py-3">{host.hostName}</td>
                  {/* 系统 */}
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="relative w-4 h-4">
                      <Image
                        src={systemIcons[host.system] || "/placeholder.svg"}
                        alt={host.system}
                        fill
                        className="object-contain"
                      />
                    </div>
                    {host.system}
                  </td>
                  {/* 安装时间 */}
                  <td className="px-4 py-3">
                    {host.installedAt ? (
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        {formatDateTime(host.installedAt)}
                      </span>
                    ) : "-"}
                  </td>
                  {/* 状态 */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(host.status)}
                      {/* 只针对安装失败的Badge加Tooltip */}
                      {host.status === "FAILED" && host.errorMessage ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              {getStatusBadge(host.status)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            align="start"
                            className="max-w-xs text-destructive break-words whitespace-pre-wrap"
                          >
                            {host.errorMessage}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        getStatusBadge(host.status)
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const allHosts = [...patchProgress.installedHosts, ...patchProgress.failedHosts, ...patchProgress.pendingHosts]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        <TooltipProvider>
          <DialogHeader>
            <DialogTitle className="text-xl">{patchProgress.patch.title} - 主机详情</DialogTitle>
            <div className="text-sm text-muted-foreground">
              KB: {patchProgress.patch.kbArticleIds.join(", ")} • 总计 {patchProgress.totalHosts} 台主机
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">全部 ({allHosts.length})</TabsTrigger>
              <TabsTrigger value="installed" className="text-chart-2">
                已安装 ({patchProgress.installedCount})
              </TabsTrigger>
              <TabsTrigger value="failed" className="text-destructive">
                失败 ({patchProgress.failedCount})
              </TabsTrigger>
              <TabsTrigger value="pending">未安装 ({patchProgress.pendingCount})</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[50vh] mt-4">
              <TabsContent value="all" className="mt-0">
                {renderHostList(allHosts, "所有主机", "暂无主机数据")}
              </TabsContent>

              <TabsContent value="installed" className="mt-0">
                {renderHostList(patchProgress.installedHosts, "安装成功的主机", "暂无安装成功的主机")}
              </TabsContent>

              <TabsContent value="failed" className="mt-0">
                {renderHostList(patchProgress.failedHosts, "安装失败的主机", "暂无安装失败的主机")}
              </TabsContent>

              <TabsContent value="pending" className="mt-0">
                {renderHostList(patchProgress.pendingHosts, "未安装的主机", "暂无未安装的主机")}
              </TabsContent>
            </div>
          </Tabs>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
