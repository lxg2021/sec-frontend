"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Send, Server, Shield, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import classNames from "classnames"
import { getStatusColorClass, getLevelColorClass, getOnlineStatusColor } from "@/shared/lib/status-color";
import { useTranslations } from "next-intl"

interface Strategy {
  id: string
  name: string
  type: string
  level: string
  description: string
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  status: string
  version: number
  content: string
}

interface Host {
  id: string
  name: string
  type: string
  level: number
  parentId: string
  hostname: string
  hostId: string
  ip: string
  mac: string
  os: string
  status: string
  cpu: string
  memory: string
  disk: string
}

interface ReviewCardProps {
  strategies: Strategy[]
  hosts: Host[]
  onPreview?: () => void
  onDeploy?: (strategies: Strategy[], hosts: Host[]) => Promise<boolean>
}

export default function ReviewCard({ strategies = [], hosts = [], onPreview, onDeploy }: ReviewCardProps) {
  const t = useTranslations("pages.baseline.dispatch.reviewCard")
  const [isDeploying, setIsDeploying] = useState(false)

  const formatType = (type: string) => {
    const typeMap: Record<string, string> = {
      "\u57fa\u7ebf": "baseline",
      "\u8865\u4e01": "patch",
      "\u56de\u6eaf": "rollback",
    }
    const key = typeMap[type]
    return key ? t(`types.${key}`) : type
  }

  const formatLevel = (level: string) => {
    const levelMap: Record<string, string> = {
      "\u9ad8": "high",
      "\u4e2d": "medium",
      "\u4f4e": "low",
    }
    const key = levelMap[level]
    return key ? t(`levels.${key}`) : level
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      "\u542f\u7528": "enabled",
      "\u7981\u7528": "disabled",
      "\u8349\u7a3f": "draft",
    }
    const key = statusMap[status]
    return key ? t(`statuses.${key}`) : status
  }

  // 参数检查
  const hasStrategies = strategies.length > 0
  const hasHosts = hosts.length > 0
  const canDeploy = hasStrategies && hasHosts

  const handleDeploy = async () => {
    if (!canDeploy) {
      toast.error(t("deployFailed"), {
        description: t("selectStrategiesAndHosts"),
      })
      return
    }

    setIsDeploying(true)

    try {
      // 模拟API调用或使用传入的onDeploy函数
      const success = onDeploy ? await onDeploy(strategies, hosts) : Math.random() > 0.3 // 模拟70%成功率

      if (success) {
        toast.success(t("deploySuccess"), {
          description: t("deploySuccessDescription", { hosts: hosts.length, strategies: strategies.length }),
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
      } else {
        toast.error(t("deployFailed"), {
          description: t("deployErrorDescription"),
          icon: <AlertCircle className="h-4 w-4" />,
        })
      }
    } catch (error) {
      toast.error(t("deployFailed"), {
        description: t("networkErrorDescription"),
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50/80 to-blue-50/50 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/90 to-blue-50/70 rounded-t-lg border-b border-slate-200/60">
          <CardTitle className="flex items-center gap-3 text-slate-700">
            {/* 图标背景块 */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {/* 渐变文字标题 */}
            <span className="text-xl font-semibold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
              {t("title")}
            </span>
            {/* 装饰小图标 */}
            <Sparkles className="h-4 w-4 text-blue-400 opacity-60" />
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 参数检查提示 */}
          {!canDeploy && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {!hasStrategies && !hasHosts && t("selectStrategiesAndHosts")}
                {!hasStrategies && hasHosts && t("selectStrategies")}
                {hasStrategies && !hasHosts && t("selectHosts")}
              </AlertDescription>
            </Alert>
          )}

          {/* 策略和主机信息并排显示 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 策略信息概览 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <h3 className="font-semibold">{t("selectedStrategies", { count: strategies.length })}</h3>
              </div>

              {strategies.length > 0 ? (
                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="space-y-2 pr-4">
                    {strategies.map((strategy) => (
                      <div key={strategy.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{strategy.name}</span>

                            <Badge
                              className={classNames(
                                "border-none shadow-none hover:bg-inherit cursor-default", // 覆盖默认交互
                                getLevelColorClass(strategy.level)
                              )}
                            >
                              {formatLevel(strategy.level)}
                            </Badge>

                            <Badge variant="outline">{formatType(strategy.type)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                        </div>
                        <Badge className={classNames(
                          "border-none shadow-none hover:bg-inherit cursor-default", // 覆盖默认交互
                          getStatusColorClass(strategy.status)
                        )}>{formatStatus(strategy.status)}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noStrategies")}</p>
                </div>
              )}
            </div>

            {/* 主机信息概览 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <h3 className="font-semibold">{t("targetHosts", { count: hosts.length })}</h3>
              </div>

              {hosts.length > 0 ? (
                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="space-y-2 pr-4">
                    {hosts.map((host) => (
                      <div key={host.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{host.name}</span>
                            <span className="text-sm text-muted-foreground">({host.hostname})</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>IP: {host.ip}</span>
                            <span>OS: {host.os}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`w-2 h-2 rounded-full ${getOnlineStatusColor(host.status)}`} />
                          <span className="text-sm capitalize">{host.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noHosts")}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

		<CardFooter className="flex justify-center">
		  <Button
			onClick={handleDeploy}
			disabled={!canDeploy || isDeploying}
			className="flex items-center gap-2"
		  >
			{isDeploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
			{isDeploying ? t("deploying") : t("deploy")}
		  </Button>
		</CardFooter>
      </Card>
    </div>
  )
}
