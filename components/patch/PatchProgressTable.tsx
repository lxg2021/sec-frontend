"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Eye, CheckCircle, Clock, XCircle, CheckCircle2, BadgeCheck } from "lucide-react"
import type { PatchInstallProgress } from "@/lib/taskProgress"

interface PatchProgressTableProps {
  patchProgressList: PatchInstallProgress[]
  onViewHosts: (patchProgress: PatchInstallProgress, hostType?: "all" | "installed" | "failed" | "pending") => void
}

export function PatchProgressTable({ patchProgressList, onViewHosts }: PatchProgressTableProps) {
  const getSeverityColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-red-500 text-white"
      case "Important":
        return "bg-orange-500 text-white"
      case "Moderate":
        return "bg-yellow-500 text-black"
      case "Low":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getProgressPercentage = (installed: number, total: number) => {
    return total > 0 ? Math.round((installed / total) * 100) : 0
  }

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center space-x-3">
          {/* 图标渐变圆角背景 */}
          <div className="p-2 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg">
            <Eye className="h-5 w-5 text-white" />
          </div>
          {/* 标题和副标题 */}
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
              补丁安装明细
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              共 {patchProgressList.length} 个补丁
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-gray-500 ">补丁信息</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">安全等级</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">成功</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">失败</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">未应用</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">进度</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {patchProgressList.map((patchProgress) => {
                const progressPercentage = getProgressPercentage(patchProgress.installedCount, patchProgress.totalHosts)

                return (
                  <tr
                    key={patchProgress.patch.patchGuid}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{patchProgress.patch.title}</div>
                        <div className="text-sm text-muted-foreground">
                          KB: {patchProgress.patch.kbArticleIds.join(", ")}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={`${getSeverityColor(patchProgress.patch.securityLevel)} w-18 justify-center`}
                      >
                        {patchProgress.patch.securityLevel}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-600 hover:bg-green-100"
                        onClick={() => onViewHosts(patchProgress, "installed")}
                        disabled={patchProgress.installedCount === 0}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {patchProgress.installedCount}
                      </Button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-500 hover:bg-red-100"
                        onClick={() => onViewHosts(patchProgress, "failed")}
                        disabled={patchProgress.failedCount === 0}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {patchProgress.failedCount}
                      </Button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => onViewHosts(patchProgress, "pending")}
                        disabled={patchProgress.pendingCount === 0}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {patchProgress.pendingCount}
                      </Button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-2 min-w-[120px]">
                        <div className="flex items-center justify-between text-sm">
                          <span>{progressPercentage}%</span>
                          <span className="text-gray-500">
                            {patchProgress.installedCount}/{patchProgress.totalHosts}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={progressPercentage} className="h-1.5 bg-gray-200" />
                          <div
                            className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => onViewHosts(patchProgress, "all")}>
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
