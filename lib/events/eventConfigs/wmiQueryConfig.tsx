"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// WmiQuery事件Header配置
export const WMI_QUERY_HEADER: HeaderConfig = {
  title: {
    key: "ProcessName",
  },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// WmiQuery事件Card配置
export const WMI_QUERY_CARD: SectionConfig[] = [
  {
    title: "Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "ProcessImage", label: "Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "ProcessMD5", label: "Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
    ],
  },
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
  {
    title: "Other Information",
    icon: "Info",
    color: "text-gray-600",
    fields: [
      { key: "EventID", label: "Event ID", icon: "Hash", color: "text-gray-500", bold: true },
      { key: "UniqueID", label: "Unique ID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
    ],
  },
]
