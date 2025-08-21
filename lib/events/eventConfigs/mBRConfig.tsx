"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import { Badge } from "@/components/ui/badge"

// Header 配置
export const MBR_HEADER: HeaderConfig = {
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
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const MBR_CARD: SectionConfig[] = [
  {
    title: "Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "ProcessImage", label: "Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-600", monospace: true },
      { key: "ProcessMD5", label: "Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
    ],
  },
  {
    title: "MBR Information",
    icon: "HardDrive",
    color: "text-blue-600",
    fields: [
      { key: "PhysicalName", label: "Physical Drive", icon: "FolderOpen", color: "text-red-400", monospace: true },
      { key: "DriverType", label: "Driver Type", icon: "HardDrive", color: "text-gray-600" },
    ],
  },
  {
    title: "Other Information",
    icon: "Info",
    color: "text-gray-600",
    fields: [
      { key: "EventID", label: "Event ID", icon: "Hash", color: "text-gray-500" },
      { key: "UniqueID", label: "Unique ID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
    ],
  },
]
