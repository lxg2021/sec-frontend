"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Server, Shield, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

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
  const [isDeploying, setIsDeploying] = useState(false)

  // 参数检查
  const hasStrategies = strategies.length > 0
  const hasHosts = hosts.length > 0
  const canDeploy = hasStrategies && hasHosts

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "高":
        return "destructive"
      case "中":
        return "default"
      case "低":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleDeploy = async () => {
    if (!canDeploy) {
      toast.error("下发失败", {
        description: "请确保已选择策略和主机信息",
      })
      return
    }

    setIsDeploying(true)

    try {
      // 模拟API调用或使用传入的onDeploy函数
      const success = onDeploy ? await onDeploy(strategies, hosts) : Math.random() > 0.3 // 模拟70%成功率

      if (success) {
        toast.success("下发成功", {
          description: `已成功向 ${hosts.length} 台主机下发 ${strategies.length} 个策略`,
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
      } else {
        toast.error("下发失败", {
          description: "策略下发过程中出现错误，请重试",
          icon: <AlertCircle className="h-4 w-4" />,
        })
      }
    } catch (error) {
      toast.error("下发失败", {
        description: "网络错误或服务异常，请稍后重试",
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
              下发预览
            </span>
            {/* 装饰小图标 */}
            <Sparkles className="h-4 w-4 text-blue-400 opacity-60" />
          </CardTitle>
          <CardDescription className="mt-2 text-slate-600">
            确认策略信息和目标主机，然后执行下发操作
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 参数检查提示 */}
          {!canDeploy && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {!hasStrategies && !hasHosts && "请选择策略和主机信息"}
                {!hasStrategies && hasHosts && "请选择策略信息"}
                {hasStrategies && !hasHosts && "请选择主机信息"}
              </AlertDescription>
            </Alert>
          )}

          {/* 策略和主机信息并排显示 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 策略信息概览 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <h3 className="font-semibold">选择的策略 ({strategies.length})</h3>
              </div>

              {strategies.length > 0 ? (
                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="space-y-2 pr-4">
                    {strategies.map((strategy) => (
                      <div key={strategy.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{strategy.name}</span>
                            <Badge variant={getLevelColor(strategy.level)}>{strategy.level}</Badge>
                            <Badge variant="outline">{strategy.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                        </div>
                        <Badge variant={strategy.status === "启用" ? "default" : "secondary"} className="ml-2 shrink-0">
                          {strategy.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂未选择策略</p>
                </div>
              )}
            </div>

            {/* 主机信息概览 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <h3 className="font-semibold">目标主机 ({hosts.length})</h3>
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
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(host.status)}`} />
                          <span className="text-sm capitalize">{host.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂未选择主机</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button onClick={handleDeploy} disabled={!canDeploy || isDeploying} className="flex items-center gap-2">
            {isDeploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isDeploying ? "下发中..." : "下发策略"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
