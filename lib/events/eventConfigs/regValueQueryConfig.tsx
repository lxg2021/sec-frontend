"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import { Badge } from "@/components/ui/badge"

// Header 配置
export const REGVALUE_QUERY_HEADER: HeaderConfig = {
  title: { key: "ObjectName" },
  badges: [
    { key: "Classification", variant: "default" },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const REGVALUE_QUERY_CARD: SectionConfig[] = [
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
    title: "Registry Value Information",
    icon: "ListTree",
    color: "text-blue-600",
    fields: [
      { key: "ObjectName", label: "Registry Key", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, maxLength: 50, showInPopover: true, copyable: true },
      { key: "ObjectValue", label: "Registry Value", icon: "Database", color: "text-gray-600", monospace: true, copyable: true },
      { key: "Description", label: "Description", icon: "FileText", color: "text-gray-600" },
      {
        key: "Classification",
        label: "Classification",
        icon: "Tag",
        color: "text-gray-600",
        bold: true,
        customRender: (value: string) => (
          <Badge variant="outline" className="bg-black text-white border-black">
            {value || "N/A"}
          </Badge>
        ),
      },
      { key: "ValueExist", label: "Value Exist", icon: "Info", color: "text-gray-600" },
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
