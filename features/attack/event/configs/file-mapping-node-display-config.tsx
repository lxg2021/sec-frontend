"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header 配置
export const FILEMAPPING_NODE_HEADER: HeaderConfig = {
  title: { key: "FileMappingName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const FILEMAPPING_NODE_CARD: SectionConfig[] = [
  {
    title: "File Mapping Information",
    icon: "Link",
    color: "text-blue-600",
    fields: [
      { key: "FileMappingName", label: "File Mapping Name", icon: "FileText", color: "text-gray-600", monospace: true, truncate: true, maxLength: 50, showInPopover: true, copyable: true },
      { key: "StackModule", label: "Stack Module", icon: "FolderOpen", color: "text-gray-600", monospace: true, copyable: true },
    ],
  },
]
