"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { Search, X, Circle, CircleOff, Dot } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import type { AgentInfo, AgentStatus, SystemType } from "@/features/assets/host/types/system-info"
import { cn } from "@/shared/lib/utils"

const systemIcons: Record<string, string> = {
  windows: "/icons/system/windows.svg",
  linux: "/icons/system/linux.svg",
  macos: "/icons/system/macos.svg",
}

const statusMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  online: {
    label: "在线",
    icon: (
      <span className="inline-block w-4 h-4 rounded-full bg-green-500 align-middle" />
    ),
  },
  offline: {
    label: "离线",
    icon: (
      <span className="inline-block w-4 h-4 rounded-full bg-gray-400 align-middle" />
    ),
  },
}

const osMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  windows: {
    label: "Windows",
    icon: (
      <Image
        src={systemIcons.windows}
        alt="Windows"
        width={16}
        height={16}
        className="inline-block"
      />
    ),
  },
  linux: {
    label: "Linux",
    icon: (
      <Image
        src={systemIcons.linux}
        alt="Linux"
        width={16}
        height={16}
        className="inline-block"
      />
    ),
  },
  macos: {
    label: "macOS",
    icon: (
      <Image
        src={systemIcons.macos}
        alt="macOS"
        width={16}
        height={16}
        className="inline-block"
      />
    ),
  },
}

function OptionWithIcon({
  icon,
  text,
  className,
}: {
  icon?: React.ReactNode
  text: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span className="truncate">{text}</span>
    </div>
  )
}

interface HostListToolbarProps {
  hosts: AgentInfo[]
  onFilter: (filteredHosts: AgentInfo[]) => void
}

export function HostListToolbar({ hosts, onFilter }: HostListToolbarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all")
  const [osTypeFilter, setOsTypeFilter] = useState<SystemType | "all">("all")
  const [manufacturerFilter, setManufacturerFilter] = useState<string | "all">("all")

  // 提取厂商列表
  const manufacturers = useMemo(() => {
    const unique = Array.from(new Set(hosts.map((h) => h.manufacturer).filter(Boolean)))
    return unique.sort()
  }, [hosts])

  // 过滤后的主机列表：纯粹运算，不副作用
  const filteredHosts = useMemo(() => {
    let filtered = hosts
    if (searchTerm) {
      filtered = filtered.filter(
        (host) =>
          host.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          host.hostId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((host) => host.status === statusFilter)
    }
    if (osTypeFilter !== "all") {
      filtered = filtered.filter((host) => host.osType === osTypeFilter)
    }
    if (manufacturerFilter !== "all") {
      filtered = filtered.filter((host) => host.manufacturer === manufacturerFilter)
    }
    return filtered
  }, [hosts, searchTerm, statusFilter, osTypeFilter, manufacturerFilter])

  // 只在依赖项变化时通知父组件
  useEffect(() => {
    onFilter(filteredHosts)
  }, [filteredHosts, onFilter])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setOsTypeFilter("all")
    setManufacturerFilter("all")
  }

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    osTypeFilter !== "all" ||
    manufacturerFilter !== "all"

  return (
    <div className="border-b bg-card p-4">
      <div className="flex flex-wrap gap-4">
        {/* 搜索 */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索主机名或主机ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 状态筛选 */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as AgentStatus | "all")}
        >
          <SelectTrigger className="w-32">
            <SelectValue
              placeholder="状态"
              aria-label={statusFilter !== "all" ? statusFilter : undefined}
            >
              {statusFilter !== "all" ? (
                <OptionWithIcon
                  icon={statusMeta[statusFilter]?.icon}
                  text={statusMeta[statusFilter]?.label ?? ""}
                />
              ) : (
                "状态"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <OptionWithIcon text="全部状态" />
            </SelectItem>
            <SelectItem value="online">
              <OptionWithIcon
                icon={statusMeta.online.icon}
                text={statusMeta.online.label}
              />
            </SelectItem>
            <SelectItem value="offline">
              <OptionWithIcon
                icon={statusMeta.offline.icon}
                text={statusMeta.offline.label}
              />
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 系统筛选 */}
        <Select
          value={osTypeFilter}
          onValueChange={(value) => setOsTypeFilter(value as SystemType | "all")}
        >
          <SelectTrigger className="w-32">
            <SelectValue
              placeholder="系统"
              aria-label={osTypeFilter !== "all" ? osTypeFilter : undefined}
            >
              {osTypeFilter !== "all" ? (
                <OptionWithIcon
                  icon={osMeta[osTypeFilter]?.icon}
                  text={osMeta[osTypeFilter]?.label ?? ""}
                />
              ) : (
                "系统"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <OptionWithIcon text="全部系统" />
            </SelectItem>
            <SelectItem value="windows">
              <OptionWithIcon
                icon={osMeta.windows.icon}
                text={osMeta.windows.label}
              />
            </SelectItem>
            <SelectItem value="linux">
              <OptionWithIcon
                icon={osMeta.linux.icon}
                text={osMeta.linux.label}
              />
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 厂商筛选 */}
        <Select
          value={manufacturerFilter}
          onValueChange={setManufacturerFilter}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="厂商" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部厂商</SelectItem>
            {manufacturers.map((manufacturer) => (
              <SelectItem key={manufacturer} value={manufacturer}>
                {manufacturer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 一键清除 */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            清除筛选
          </Button>
        )}
      </div>

      {/* 已选过滤项徽章 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {searchTerm && (
            <Badge variant="secondary">搜索: {searchTerm}</Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary">
              <span className="inline-flex items-center gap-1">
                {statusMeta[statusFilter]?.icon}
                状态: {statusMeta[statusFilter]?.label}
              </span>
            </Badge>
          )}
          {osTypeFilter !== "all" && (
            <Badge variant="secondary">
              <span className="inline-flex items-center gap-1">
                {osMeta[osTypeFilter]?.icon}
                系统: {osMeta[osTypeFilter]?.label}
              </span>
            </Badge>
          )}
          {manufacturerFilter !== "all" && (
            <Badge variant="secondary">
              厂商: {manufacturerFilter}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
