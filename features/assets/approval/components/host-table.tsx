"use client"

import type React from "react"

import type { Host } from "@/features/assets/approval/types"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Cpu,
  Edit,
  Fingerprint,
  FolderTree,
  Monitor,
  Network,
  Settings,
  UserRound,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useTranslations } from "next-intl"

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

function HeaderLabel({
  icon: Icon,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </span>
  )
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
  onSort,
}: HostTableProps) {
  const t = useTranslations("pages.computers.approve")
  const getStatusBadge = (status: Host["status"]) => {
    const statusConfig = {
      online: { label: t("statusOnline"), variant: "default" as const, color: "bg-green-500" },
      offline: { label: t("statusOffline"), variant: "destructive" as const, color: "bg-gray-500" },
    }

    const config = statusConfig[status]
    return (
      <div className="flex items-center gap-2">
        {/* 圆点 */}
        <span className={`h-3.5 w-3.5 rounded-full ${config.color}`} />

        {/* Badge */}
        {config.label}
      </div>
    )
  }

  const formatHeartbeat = (heartbeat: string) => {
    const date = new Date(heartbeat)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return t("dayAgo", { count: days })
    if (hours > 0) return t("hourAgo", { count: hours })
    if (minutes > 0) return t("minuteAgo", { count: minutes })
    return t("justNow")
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
              <SortableHeader field="hostname">
                <HeaderLabel icon={Monitor}>{t("hostname")}</HeaderLabel>
              </SortableHeader>
              <TableHead>
                <HeaderLabel icon={Network}>{t("ipAddress")}</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={Fingerprint}>{t("macAddress")}</HeaderLabel>
              </TableHead>
              <SortableHeader field="os_name">
                <HeaderLabel icon={Cpu}>{t("os")}</HeaderLabel>
              </SortableHeader>
              <SortableHeader field="status">
                <HeaderLabel icon={CircleDot}>{t("status")}</HeaderLabel>
              </SortableHeader>
              <TableHead>
                <HeaderLabel icon={FolderTree}>{t("logicGroup")}</HeaderLabel>
              </TableHead>
              <TableHead>
                <HeaderLabel icon={UserRound}>{t("owner")}</HeaderLabel>
              </TableHead>
              <SortableHeader field="heartbeat_time">
                <HeaderLabel icon={Clock3}>{t("heartbeat")}</HeaderLabel>
              </SortableHeader>
              <TableHead className="text-right">
                <HeaderLabel icon={Settings} className="justify-end">
                  {t("actions")}
                </HeaderLabel>
              </TableHead>
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
                        <span className="text-sm font-medium">{host.group.full_path}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        {t("ungrouped")}
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
                        {t("unowned")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono w-20 text-left">
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
            {t("pageInfo", { current: currentPage, total: totalPages })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("prevPage")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t("nextPage")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
