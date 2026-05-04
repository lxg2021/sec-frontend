"use client"

import { useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { XCircle, Clock, Download, CheckCircle2, ClipboardList, MinusCircle } from "lucide-react"
import type { SoftwareUninstallProgress } from "@/features/assets/software/types/task-soft-uninstall-progress"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/shared/ui/tooltip"

interface SoftHostUninstallDetailProps {
  uninstallProgress: SoftwareUninstallProgress | null
  initialTab?: "all" | "success" | "failed" | "pending"
}

export function SoftHostUninstallDetail({
  uninstallProgress,
  initialTab = "all",
}: SoftHostUninstallDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  if (!uninstallProgress) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
      case "FAILED":
        return <XCircle className="h-4 w-4 mr-1 text-red-500" />
      case "PENDING":
        return <Clock className="h-4 w-4 mr-1 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 mr-1 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const commonClasses = "text-white px-2 py-1 min-w-[70px] text-center"
    switch (status) {
      case "SUCCESS":
        return <Badge className={`bg-green-600 ${commonClasses}`}>已卸载</Badge>
      case "FAILED":
        return <Badge className={`bg-red-500 ${commonClasses}`}>卸载失败</Badge>
      case "PENDING":
        return <Badge className={`bg-orange-500 ${commonClasses}`}>待卸载</Badge>
      default:
        return (
          <Badge className={`bg-gray-400 ${commonClasses}`} variant="secondary">
            未知状态
          </Badge>
        )
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

  const renderHostList = (hosts: any[], title: string, emptyMessage: string) => (
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
                <th className="px-4 py-2 text-left font-medium text-gray-700">状态</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">卸载时间</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">错误信息</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((host) => (
                <tr key={host.hostId} className={host.status === "FAILED" ? "bg-destructive/10" : ""}>
                  <td className="px-4 py-3">{host.hostId}</td>
                  <td className="px-4 py-3">{host.hostName}</td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(host.status)}
                      {host.status === "FAILED" && host.errorMessage ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{getStatusBadge(host.status)}</span>
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
                  <td className="px-4 py-3">{formatDateTime(host.uninstalledAt)}</td>
                  <td className="px-4 py-3">{host.errorMessage || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const allHosts = [
    ...uninstallProgress.successHosts,
    ...uninstallProgress.failedHosts,
    ...uninstallProgress.pendingHosts,
  ]

  return (
    <div className="mb-6 space-y-4">
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <TooltipProvider>
          
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center space-x-3">
              {/* 图标背景块 */}
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                <MinusCircle className="h-5 w-5 text-white" />
              </div>

              {/* 标题 + 副标题 */}
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                  {uninstallProgress.name} - 卸载详情
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  版本: {uninstallProgress.version} • 厂商: {uninstallProgress.vendor} • 总计 {uninstallProgress.totalHosts} 台主机
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">全部 ({allHosts.length})</TabsTrigger>
                <TabsTrigger value="success" className="text-green-600">
                  已卸载 ({uninstallProgress.successCount})
                </TabsTrigger>
                <TabsTrigger value="failed" className="text-destructive">
                  失败 ({uninstallProgress.failedCount})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-orange-600">
                  待卸载 ({uninstallProgress.pendingCount})
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="all" className="mt-0">
                  {renderHostList(allHosts, "所有主机", "暂无主机数据")}
                </TabsContent>

                <TabsContent value="success" className="mt-0">
                  {renderHostList(uninstallProgress.successHosts, "卸载成功的主机", "暂无卸载成功的主机")}
                </TabsContent>

                <TabsContent value="failed" className="mt-0">
                  {renderHostList(uninstallProgress.failedHosts, "卸载失败的主机", "暂无卸载失败的主机")}
                </TabsContent>

                <TabsContent value="pending" className="mt-0">
                  {renderHostList(uninstallProgress.pendingHosts, "待卸载的主机", "暂无待卸载的主机")}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </TooltipProvider>
      </Card>
    </div>
  )
}
