"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// Header 配置
export const FILEMAPPING_CONNECT_HEADER: HeaderConfig = {
  title: { key: "FileMappingName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const FILEMAPPING_CONNECT_CARD: SectionConfig[] = [
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
    title: "File Mapping Information",
    icon: "Link",
    color: "text-blue-600",
    fields: [
      { key: "FileMappingName", label: "File Mapping Name", icon: "FileText", color: "text-gray-600", monospace: true, truncate: true, maxLength: 50, showInPopover: true, copyable: true },
      { key: "StackModule", label: "Stack Module", icon: "FolderOpen", color: "text-gray-600", monospace: true, copyable: true },
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
