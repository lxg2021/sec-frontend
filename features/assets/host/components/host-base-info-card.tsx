import { Monitor, Laptop, Server, Shield, Calendar, Building, Users, Tag, Cpu, Zap, Cloud, Fingerprint, Grid } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"
import type { AgentInfo, SystemType } from "@/features/assets/host/types/system-info"
import { cn } from "@/shared/lib/utils"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("pages.assets.hardware.host.base")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 主机信息卡片 */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="h-4 w-4" />
            {t("hostInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("hostId")}</span>
              <span className="flex items-center gap-1 text-sm font-mono text-right">
                <Fingerprint className="w-3.5 h-3.5 text-red-400" />
                {host.hostId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("hostname")}</span>
              <span className="text-sm text-right">{host.hostname}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("systemType")}</span>
              <div className="flex items-center gap-1">
                {getSystemIcon(host.osType)}
                <span className="text-sm capitalize">{host.osType}</span>
              </div>
            </div>

            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">{t("onlineStatus")}</span>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-block w-3.5 h-3.5 rounded-full",
                    host.status === "online" ? "bg-green-500" : "bg-gray-400"
                  )}
                />
                <span className="text-sm">{host.status === "online" ? t("online") : t("offline")}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("manufacturer")}</span>
              <span className="text-sm text-right">{host.manufacturer || t("unknown")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("model")}</span>
              <span className="text-sm text-right">{host.model || t("unknown")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统信息卡片 */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" />
            {t("systemInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between">
              <span className="ext-sm text-muted-foreground">{t("os")}</span>
              <span className="ext-sm text-right">{host.osName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("osVersion")}</span>
              <span className="text-sm text-right">{host.osVersion}</span>
            </div>

            {host.productId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("productId")}</span>
                <span className="flex items-center gap-1 text-sm font-mono text-right">
                  {host.productId}
                </span>
              </div>
            )}

            {host.buildNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("buildNumber")}</span>
                <span className="text-sm text-right">{host.buildNumber}</span>
              </div>
            )}
            {host.kernelVersion && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("kernelVersion")}</span>
                <span className="text-sm text-right">{host.kernelVersion}</span>
              </div>
            )}
            {host.serialNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("serialNumber")}</span>
                <span className="text-sm font-mono text-right">{host.serialNumber}</span>
              </div>
            )}
            {host.installDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("installDate")}</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-sm">{host.installDate}</span>
                </div>
              </div>
            )}
            {host.activated !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("activationStatus")}</span>
                <div className="flex items-center gap-1">
                  <Badge variant={host.activated ? "default" : "destructive"} className="text-xs h-5">
                    {host.activated ? t("activated") : t("notActivated")}
                  </Badge>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("architecture")}</span>
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
              {t("organization")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              {host.company && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("company")}</span>
                  <div className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    <span className="text-sm text-right">{host.company}</span>
                  </div>
                </div>
              )}
              {host.department && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("department")}</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-sm text-right">{host.department}</span>
                  </div>
                </div>
              )}
              {host.group && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("group")}</span>
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
