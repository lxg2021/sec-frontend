"use client"
import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

// Header 配置
export const VOLUME_NODE_HEADER: HeaderConfig = {
  title: { key: "FileName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
  ],
}

// Card 配置
export const VOLUME_NODE_CARD: SectionConfig[] = [
  {
    title: "Volume Information",
    icon: "HardDrive",
    color: "text-blue-600",
    fields: [
      { key: "FileName", label: "Volume Name", icon: "FolderOpen", color: "text-red-400", monospace: true },
      { key: "AccessType", label: "Access Type", icon: "Lock", color: "text-gray-600" },
      { key: "DriverType", label: "Driver Type", icon: "HardDrive", color: "text-gray-600" },
    ],
  },
]
