"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

// ServiceCreate事件的Header配置
export const SERVICE_NODE_HEADER: HeaderConfig = {
  title: {
    key: "ServiceName",
  },
  badges: [

  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// ServiceCreate事件的Card配置
export const SERVICE_NODE_CARD: SectionConfig[] = [
  {
    title: "Service Information",
    icon: "Server",
    color: "text-blue-600",
    fields: [
      { key: "ServiceName", label: "Service Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "DisplayName", label: "Display Name", icon: "FileText", color: "text-gray-600" },
      { key: "ServiceType", label: "Service Type", icon: "Hash", color: "text-gray-600" },
      { key: "StartType", label: "Start Type", icon: "Play", color: "text-gray-600" },
      { key: "ServiceStartName", label: "Service Start Name", icon: "User", color: "text-gray-600" },
      {
        key: "ServiceBinaryPathName",
        label: "Binary Path",
        icon: "FolderOpen",
        color: "text-gray-600",
        monospace: true,
        truncate: true,
        maxLength: 100,
        showInPopover: true,
        copyable: true,
      },
      {
        key: "ServiceBinaryMD5",
        label: "Binary MD5",
        icon: "Fingerprint",
        color: "text-red-400",
        monospace: true,
      },
    ],
  },
]
