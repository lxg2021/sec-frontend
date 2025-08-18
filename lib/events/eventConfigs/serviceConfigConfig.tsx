"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// ServiceConfig事件的Header配置
export const SERVICE_CONFIG_HEADER: HeaderConfig = {
  title: {
    key: "ServiceName",
  },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// ServiceConfig事件的Card配置
export const SERVICE_CONFIG_CARD: SectionConfig[] = [
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
    title: "Original Service Configuration",
    icon: "Server",
    color: "text-blue-600",
    fields: [
      { key: "OrgDisplayName", label: "Display Name", icon: "FileText", color: "text-gray-600" },
      { key: "OrgServiceType", label: "Service Type", icon: "Hash", color: "text-gray-600" },
      { key: "OrgStartType", label: "Start Type", icon: "Play", color: "text-gray-600" },
      { key: "OrgServiceStartName", label: "Start Name", icon: "User", color: "text-gray-600" },
      { key: "OrgServiceBinaryPathName", label: "Binary Path", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, maxLength: 100, showInPopover: true, copyable: true },
      { key: "OrgServiceBinaryMD5", label: "Binary MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
    ],
  },
  {
    title: "New Service Configuration",
    icon: "Server",
    color: "text-blue-600",
    fields: [
      { key: "NewDisplayName", label: "Display Name", icon: "FileText", color: "text-gray-600" },
      { key: "NewServiceType", label: "Service Type", icon: "Hash", color: "text-gray-600" },
      { key: "NewStartType", label: "Start Type", icon: "Play", color: "text-gray-600" },
      { key: "NewServiceStartName", label: "Start Name", icon: "User", color: "text-gray-600" },
      { key: "NewServiceBinaryPathName", label: "Binary Path", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, maxLength: 100, showInPopover: true, copyable: true },
      { key: "NewServiceBinaryMD5", label: "Binary MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
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
