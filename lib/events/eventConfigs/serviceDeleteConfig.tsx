"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// ServiceDelete事件的Header配置
export const SERVICE_DELETE_HEADER: HeaderConfig = {
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

// ServiceDelete事件的Card配置
export const SERVICE_DELETE_CARD: SectionConfig[] = [
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
    title: "Service Information",
    icon: "Server",
    color: "text-blue-600",
    fields: [
      { key: "ServiceName", label: "Service Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "DisplayName", label: "Display Name", icon: "FileText", color: "text-gray-600" },
      { key: "ServiceType", label: "Service Type", icon: "Hash", color: "text-gray-600" },
      { key: "StartType", label: "Start Type", icon: "Play", color: "text-gray-600" },
      { key: "ServiceStartName", label: "Service Start Name", icon: "User", color: "text-gray-600" },
      { key: "ServiceBinaryPathName", label: "Binary Path", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, maxLength: 100, showInPopover: true, copyable: true },
      { key: "ServiceBinaryMD5", label: "Binary MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "ServiceStartArgs", label: "Start Arguments", icon: "Terminal", color: "text-gray-600", monospace: true, truncate: true, maxLength: 100, showInPopover: true, copyable: true },
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
