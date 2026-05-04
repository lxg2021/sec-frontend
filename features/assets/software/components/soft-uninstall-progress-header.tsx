"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import {
  Clock,
  Calendar,
  Settings,
  CheckCircle,
  Package,
  Monitor,
  RefreshCw,
  ClipboardList,
  Play,
  Fingerprint,
} from "lucide-react"
import type { SoftwareUninstallProgress } from "@/features/assets/software/types/task-soft-uninstall-progress"
import { useLocale, useTranslations } from "next-intl"

interface SoftUninstallProgressHeaderProps {
  data: SoftwareUninstallProgress[]
  selectedTaskId?: string
  onTaskSelect?: (taskId: string) => void
}

export function SoftUninstallProgressHeader({
  data = [], // Added default empty array to prevent undefined errors
  selectedTaskId,
  onTaskSelect,
}: SoftUninstallProgressHeaderProps) {
  const t = useTranslations("pages.assets.software.uninstallProgress")
  const locale = useLocale()

  const getStatusBadge = (progress: number) => {
    if (progress === 100) {
      return (
        <Badge variant="default" className="bg-chart-2 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t("completed")}
        </Badge>
      )
    } else if (progress > 0) {
      return (
        <Badge variant="default" className="bg-blue-500 text-white">
          <Play className="h-3 w-3 mr-1 text-white" />
          {t("inProgress")}
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="bg-gray-400 text-white">
          <Clock className="h-3 w-3 mr-1 text-white" />
          {t("waiting")}
        </Badge>
      )
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getScheduleText = (schedule: any) => {
    if (schedule.type === "IMMEDIATE") {
      return t("immediate")
    } else if (schedule.type === "SCHEDULED") {
      return t("scheduled", { time: formatDateTime(schedule.executeAt) })
    }
    return t("unknownSchedule")
  }

  const getTypeText = (type: string) => {
    return type === "quietUninstall" ? t("quietUninstall") : t("normalUninstall")
  }

  return (
    <div className="mb-6 space-y-4">
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">{t("title")}</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t("taskCount", { count: data.length })}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((task, index) => {
              const isSelected = task.taskId === selectedTaskId

              return (
                <Card
                  key={task.taskId}
                  className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-blue-400 bg-muted/50" : "hover:bg-muted/60"
                    }`}
                  onClick={() => onTaskSelect?.(task.taskId)} // Added optional chaining for onTaskSelect
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center"
                          aria-label={t("rank", { rank: index + 1 })}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg"> {task.taskName}</h3>
                          <p className="text-sm text-muted-foreground font-mono"> {task.taskId}</p>
                        </div>
                      </div>
                      {getStatusBadge(task.overallProgress)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground">{t("type")}:</span>
                        <span className="font-medium">{getTypeText(task.type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">{t("createdAt")}:</span>
                        <span className="font-medium">{formatDateTime(task.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-500" />
                        <span className="text-muted-foreground">{t("software")}:</span>
                        <span className="font-medium">{task.name || t("unknownSoftware")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-purple-500" />
                        <span className="text-muted-foreground">{t("hosts")}:</span>
                        <span className="font-medium">{task.totalHosts}</span>
                      </div>
                    </div>

                    {(task.name || task.version || task.vendor) && (
                      <div className="bg-slate-50 p-3 rounded-lg mb-3">
                        {/* 标题加大与下方内容的间距 */}
                        <span className="block font-semibold text-gray-700 mb-4">{t("softwareInfo")}</span>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Fingerprint className="h-3 w-3 text-blue-500" />
                            <span className="text-gray-600">{t("fingerprint")}:</span>
                            <span className="font-mono text-gray-800">{task.hash.slice(0, 16)}...</span>
                          </div>
                          {task.name && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">{t("name")}:</span>
                              <span className="font-medium text-gray-800">{task.name}</span>
                            </div>
                          )}
                          {task.version && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">{t("version")}:</span>
                              <span className="font-medium text-gray-800">{task.version}</span>
                            </div>
                          )}
                          {task.vendor && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">{t("vendor")}:</span>
                              <span className="font-medium text-gray-800">{task.vendor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">{t("uninstallProgress")}</span>
                        <span className="text-gray-600 bg-white px-2 py-1 rounded text-xs">
                          {t("hostSuccess", {
                            success: task.successCount,
                            total: task.totalHosts,
                            progress: task.overallProgress,
                          })}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={task.overallProgress} className="h-1.5 bg-gray-200" />
                        <div
                          className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300"
                          style={{ width: `${task.overallProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1 border-gray-300 bg-gray-50 text-gray-700"
                      >
                        <Clock className="h-3 w-3 mr-1 text-blue-500" />
                        {getScheduleText(task.schedule)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1 border-gray-300 bg-gray-50 text-gray-700"
                      >
                        <RefreshCw className="h-3 w-3 mr-1 text-purple-500" />
                        {t("retry", { count: task.retryCount })}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
