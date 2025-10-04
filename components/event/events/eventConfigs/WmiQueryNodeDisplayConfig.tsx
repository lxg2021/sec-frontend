"use client"

import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

// WmiQuery事件Header配置
export const WMI_QUERY_NODE_HEADER: HeaderConfig = {
  title: {
    key: "ProcessName",
  },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// WmiQuery事件Card配置
export const WMI_QUERY_NODE_CARD: SectionConfig[] = [
  {
    title: "WMI Query Information",
    icon: "Database",
    color: "text-blue-600",
    fields: [
      { key: "ServerName", label: "Server Name", icon: "Server", color: "text-gray-600" },
      { key: "User", label: "User", icon: "User", color: "text-gray-600" },
      { key: "Namespace", label: "Namespace", icon: "Folder", color: "text-gray-600" },
      { key: "Query", label: "Query", icon: "Terminal", color: "text-red-400", monospace: true },
    ],
  },
]
