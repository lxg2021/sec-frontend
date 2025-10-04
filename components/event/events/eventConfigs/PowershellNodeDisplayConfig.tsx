"use client"
import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

// Header 配置
export const POWERSHELL_NODE_HEADER: HeaderConfig = {
  title: { key: "FileName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const POWERSHELL_NODE_CARD: SectionConfig[] = [
  {
    title: "Script Information",
    icon: "FileText",
    color: "text-blue-600",
    fields: [
      { key: "SessionID", label: "Session ID", icon: "Hash", color: "text-gray-600" },
      { key: "ProcessCommandLine", label: "Command Line", icon: "Terminal", color: "text-gray-600", monospace: true, truncate: true, maxLength: 50, showInPopover: true, copyable: true },
      { key: "FileName", label: "Script Path", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, showInPopover: true, copyable: true },
      { key: "Content", label: "Script Content", icon: "Code", color: "text-red-400", monospace: true, truncate: true, maxLength: 50, showInPopover: true, copyable: true },
    ],
  }
]
