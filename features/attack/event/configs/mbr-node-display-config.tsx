"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"
import { Badge } from "@/shared/ui/badge"

// Header 配置
export const MBR_NODE_HEADER: HeaderConfig = {
  title: { key: "ProcessName" },
  badges: [
    {
      key: "PhysicalName",
      customRender: (value: string) =>
        value && value.length > 0 ? (
          <Badge variant="destructive">MBR</Badge>
        ) : null,
    },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const MBR_NODE_CARD: SectionConfig[] = [
  {
    title: "MBR Information",
    icon: "HardDrive",
    color: "text-blue-600",
    fields: [
      { key: "PhysicalName", label: "Physical Drive", icon: "FolderOpen", color: "text-red-400", monospace: true },
      { key: "DriverType", label: "Driver Type", icon: "HardDrive", color: "text-gray-600" },
    ],
  },
]
