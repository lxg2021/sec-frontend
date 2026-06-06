"use client"

import React from "react"
import {
  CircleDashed,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Network,
  Server,
} from "lucide-react"
import { useTranslations } from "next-intl"

import type { HostSelectorHostNode } from "@/shared/components/host-selector/types"
import { cn } from "@/shared/lib/utils"

type HostInfoNode = HostSelectorHostNode & {
  name?: string
}

interface HostInfoCardProps {
  node: HostInfoNode | null | undefined
  className?: string
  reserveCloseSpace?: boolean
}

const infoFields = [
  { labelKey: "os", key: "os", icon: Monitor },
  { labelKey: "hostname", key: "hostname", icon: CircleDashed },
  { labelKey: "cpu", key: "cpu", icon: Cpu },
  { labelKey: "memory", key: "memory", icon: MemoryStick },
  { labelKey: "disk", key: "disk", icon: HardDrive },
  { labelKey: "ip", key: "ip", icon: Network },
  { labelKey: "mac", key: "mac", icon: Network },
] as const

function StatusIndicator({ status }: { status: string }) {
  const t = useTranslations("pages.assets.hardware.host.infoCard")
  const isOnline = status.toLowerCase() === "online"

  return (
    <div className="mr-4 flex items-center space-x-1 text-sm font-normal">
      <span
        className={cn(
          "inline-block h-3 w-3 rounded-full",
          isOnline ? "animate-blink bg-green-500" : "bg-gray-400",
        )}
      />
      <span className={isOnline ? "text-green-600" : "text-gray-500"}>
        {isOnline ? t("online") : t("offline")}
      </span>
    </div>
  )
}

export function HostInfoCard({ node, className, reserveCloseSpace = false }: HostInfoCardProps) {
  const t = useTranslations("pages.assets.hardware.host.infoCard")

  if (!node || node.type !== "host") return null

  return (
    <div className={cn("inline-block min-w-[420px] rounded-lg border bg-white text-sm shadow-md", className)}>
      <div
        className={cn(
          "px-4 py-3",
          node.status.toLowerCase() === "online" ? "bg-blue-50" : "bg-gray-100",
        )}
      >
        <div className={cn("flex items-start justify-between gap-4", reserveCloseSpace && "pr-12")}>
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center">
              <Server className="mr-2 h-5 w-5 shrink-0 text-blue-600" />
              <h3 className="truncate text-base text-gray-800">{node.name || node.hostname || node.hostId}</h3>
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">{node.hostId}</p>
          </div>
          <StatusIndicator status={node.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3">
        {infoFields.map(({ labelKey, key, icon: Icon }) => {
          const value = node[key]

          return (
            <div className="flex min-w-0 items-start" key={key}>
              <Icon className="mr-2 mt-1 h-4 w-4 shrink-0 text-gray-500" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{t(labelKey)}</p>
                <p className="truncate text-sm text-gray-800">
                  {value || <span className="text-gray-400">{t("empty")}</span>}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
