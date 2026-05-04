"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header 配置
export const FILE_STREAM_NODE_HEADER: HeaderConfig = {
  title: { key: "FileName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
  ],
}

// Card 配置
export const FILE_STREAM_NODE_CARD: SectionConfig[] = [
  {
    title: "File Stream Information",
    icon: "FileText",
    color: "text-blue-600",
    fields: [
      { key: "FileName", label: "File Name", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, maxLength: 100, showInPopover: true, copyable: true },
      { key: "FileMD5", label: "File MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "FileClassDescription", label: "File Class", icon: "Tag", color: "text-gray-600" },
      { key: "FileFormatDescription", label: "File Format", icon: "Tag", color: "text-gray-600" },
      { key: "DriverType", label: "Driver Type", icon: "HardDrive", color: "text-gray-600" },
    ],
  },
]
