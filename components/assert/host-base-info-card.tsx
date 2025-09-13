import { Monitor, Laptop, Server, Shield, Calendar, Building, Users, Tag, Cpu, Zap, Cloud, Fingerprint, Grid } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { AgentInfo, SystemType } from "@/lib/systemInfo"
import { cn } from "@/lib/utils"
interface HostBaseInfoCardProps {
  host: AgentInfo
}

const systemIcons: Record<string, string> = {
  windows: "/icons/system/windows.svg",
  linux: "/icons/system/linux.svg",
  macos: "/icons/system/macos.svg",
}

function getSystemIcon(osType: string) {
  const src = systemIcons[osType] || systemIcons["windows"]
  return (
    <img
      src={src}
      alt={osType}
      className="inline-block w-3 h-3"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  )
}

export function HostBaseInfoCard({ host }: HostBaseInfoCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 主机信息卡片 */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="h-4 w-4" />
            主机信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">主机ID</span>
              <span className="flex items-center gap-1 text-sm font-mono text-right">
                <Fingerprint className="w-3.5 h-3.5 text-red-400" />
                {host.hostId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">主机名称</span>
              <span className="text-sm text-right">{host.hostname}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">系统类型</span>
              <div className="flex items-center gap-1">
                {getSystemIcon(host.osType)}
                <span className="text-sm capitalize">{host.osType}</span>
              </div>
            </div>

            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">在线状态</span>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-block w-3.5 h-3.5 rounded-full",
                    host.status === "online" ? "bg-green-500" : "bg-gray-400"
                  )}
                />
                <span className="text-sm">{host.status === "online" ? "在线" : "离线"}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">生产厂商</span>
              <span className="text-sm text-right">{host.manufacturer || "未知"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">电脑型号</span>
              <span className="text-sm text-right">{host.model || "未知"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统信息卡片 */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between">
              <span className="ext-sm text-muted-foreground">操作系统</span>
              <span className="ext-sm text-right">{host.osName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">系统版本</span>
              <span className="text-sm text-right">{host.osVersion}</span>
            </div>

            {host.productId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">产品ID</span>
                <span className="flex items-center gap-1 text-sm font-mono text-right">
                  {host.productId}
                </span>
              </div>
            )}

            {host.buildNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">构建版本</span>
                <span className="text-sm text-right">{host.buildNumber}</span>
              </div>
            )}
            {host.kernelVersion && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">内核版本</span>
                <span className="text-sm text-right">{host.kernelVersion}</span>
              </div>
            )}
            {host.serialNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">序列号</span>
                <span className="text-sm font-mono text-right">{host.serialNumber}</span>
              </div>
            )}
            {host.installDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">安装日期</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-sm">{host.installDate}</span>
                </div>
              </div>
            )}
            {host.activated !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">激活状态</span>
                <div className="flex items-center gap-1">
                  <Badge variant={host.activated ? "default" : "destructive"} className="text-xs h-5">
                    {host.activated ? "已激活" : "未激活"}
                  </Badge>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">系统架构</span>
              <span className="text-sm text-right">{host.architecture}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 组织信息卡片 */}
      {(host.company || host.department || host.group) && (
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4" />
              组织信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              {host.company && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">企业</span>
                  <div className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    <span className="text-sm text-right">{host.company}</span>
                  </div>
                </div>
              )}
              {host.department && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">部门</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-sm text-right">{host.department}</span>
                  </div>
                </div>
              )}
              {host.group && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">组名称</span>
                  <div className="flex items-center gap-1">
                    <Grid className="h-3.5 w-3.5" />
                    <span className="text-sm text-right">{host.group}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}