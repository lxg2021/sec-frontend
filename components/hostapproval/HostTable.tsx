"use client"

import type React from "react"

import type { Host } from "@/components/hostapproval/computer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ArrowUpDown, Edit, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface HostTableProps {
  hosts: Host[]
  onEditHost?: (host: Host) => void
  highlightUngrouped?: boolean
  highlightUnowned?: boolean
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  sortField?: keyof Host | null
  sortDirection?: "asc" | "desc"
  onSort?: (field: keyof Host) => void
}

export function HostTable({
  hosts,
  onEditHost,
  highlightUngrouped = false,
  highlightUnowned = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  sortField,
  sortDirection,
  onSort,
}: HostTableProps) {
  const getStatusBadge = (status: Host["status"]) => {
    const statusConfig = {
      online: { label: "在线", variant: "default" as const, color: "bg-green-500" },
      offline: { label: "离线", variant: "destructive" as const, color: "bg-red-500" },
      inactive: { label: "不活跃", variant: "secondary" as const, color: "bg-yellow-500" },
    }

    const config = statusConfig[status]
    return (
      <Badge variant={config.variant} className="gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    )
  }

  const formatHeartbeat = (heartbeat: string) => {
    const date = new Date(heartbeat)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return "刚刚"
  }

  const SortableHeader = ({
    field,
    children,
  }: {
    field: keyof Host
    children: React.ReactNode
  }) => (
    <TableHead>
      <Button variant="ghost" size="sm" onClick={() => onSort?.(field)} className="-ml-3 h-8 text-xs font-medium">
        {children}
        <ArrowUpDown
          className={cn("ml-2 h-3.5 w-3.5", sortField === field ? "text-foreground" : "text-muted-foreground")}
        />
      </Button>
    </TableHead>
  )

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <SortableHeader field="hostname">主机名</SortableHeader>
              <TableHead>IP地址</TableHead>
              <TableHead>MAC地址</TableHead>
              <SortableHeader field="os_name">操作系统</SortableHeader>
              <SortableHeader field="status">状态</SortableHeader>
              <TableHead>逻辑组</TableHead>
              <TableHead>负责人</TableHead>
              <SortableHeader field="heartbeat_time">最近心跳</SortableHeader>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hosts.map((host) => {
              const needsAttention = (highlightUngrouped && !host.group) || (highlightUnowned && !host.owner)

              return (
                <TableRow
                  key={host.host_id}
                  className={cn(
                    "border-border transition-colors hover:bg-muted/50",
                    needsAttention && "bg-yellow-500/5",
                  )}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {needsAttention && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {host.hostname}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1.5">
                      {host.ip.map((ip, idx) => (
                        <code key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">
                          {ip}
                        </code>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1.5">
                      {host.macs.map((mac, idx) => (
                        <code key={idx} className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">
                          {mac}
                        </code>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{host.os_name}</span>
                      <span className="text-xs text-muted-foreground">{host.os_version}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(host.status)}</TableCell>
                  <TableCell>
                    {host.group ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{host.group.name}</span>
                        <span className="text-xs text-muted-foreground">{host.group.company_name}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        未分组
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {host.owner ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{host.owner.owner_name}</span>
                        {host.owner.owner_role && (
                          <span className="text-xs text-muted-foreground">{host.owner.owner_role}</span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        未指定
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatHeartbeat(host.heartbeat_time)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onEditHost?.(host)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-sm text-muted-foreground">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
