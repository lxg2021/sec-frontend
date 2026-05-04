"use client"

import Image from "next/image"
import { Cpu, Calendar, Server, HardDrive, Building, Users } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { cn } from "@/shared/lib/utils"
import type { AgentInfo, SystemType } from "@/features/assets/host/types/system-info"

// 系统图标
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
      width={14}
      height={14}
      alt={osType}
      className="inline-block"
    />
  )
}

export function HostListTable({ hosts, selectedHostId, onSelectHost }: {
  hosts: AgentInfo[]
  selectedHostId: string | null
  onSelectHost: (hostId: string | null) => void
}) {
  return (
    <div className="flex-1 overflow-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-medium">主机信息</TableHead>
            <TableHead className="font-medium">状态</TableHead>
            <TableHead className="font-medium">系统</TableHead>
            <TableHead className="font-medium">操作系统</TableHead>
            <TableHead className="font-medium">版本</TableHead>
            <TableHead className="font-medium">架构</TableHead>
            <TableHead className="font-medium">硬件信息</TableHead>
            <TableHead className="font-medium">组织信息</TableHead>
            <TableHead className="font-medium">安装日期</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hosts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Server className="h-12 w-12 mb-2 opacity-30" />
                  <p>暂无主机数据</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            hosts.map((host) => (
              <TableRow
                key={host.hostId}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/30",
                  selectedHostId === host.hostId && "bg-primary/10 border-l-4 border-l-primary"
                )}
                onClick={() => onSelectHost(host.hostId)}
              >
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-auto p-0 font-medium text-left transition-all duration-200",
                          "hover:text-primary hover:underline"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectHost(host.hostId)
                        }}
                      >
                        {host.hostname}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{host.hostId}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-3 h-3 rounded-full",
                        host.status === "online" ? "bg-green-500" : "bg-gray-400"
                      )}
                    />
                    <span className="text-sm">
                      {host.status === "online" ? "在线" : "离线"}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSystemIcon(host.osType)}
                    <span className="text-sm">{host.osType}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm max-w-[120px] truncate" title={host.osName}>
                    {host.osName}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {host.osVersion}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5" />
                    <span className="text-sm">{host.architecture}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1 max-w-[140px]">
                    <div className="flex items-center gap-1 text-sm">
                      <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate" title={host.manufacturer}>
                        {host.manufacturer}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate" title={host.model}>
                      {host.model}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1 max-w-[150px]">
                    <div className="flex items-center gap-1 text-sm">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate" title={host.company}>
                        {host.company}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="truncate" title={`${host.department} / ${host.group}`}>
                        {host.department} / {host.group}
                      </span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{host.installDate}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}