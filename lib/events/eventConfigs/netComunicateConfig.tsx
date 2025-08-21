"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// NetCommunicate事件的Header配置
export const NET_COMMUNICATE_HEADER: HeaderConfig = {
  title: {
    key: "ProcessName",
  },
  badges: [
    { key: "Direction", color: "bg-blue-500 text-white" },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// NetCommunicate事件的Card配置
export const NET_COMMUNICATE_CARD: SectionConfig[] = [
  {
    title: "Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "ProcessImage", label: "Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "ProcessMD5", label: "Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-600", monospace: true },
    ],
  },
  {
    title: "Network Communication",
    icon: "Radio",
    color: "text-blue-600",
    fields: [
      { key: "Protocol", label: "Protocol", icon: "Globe", color: "text-gray-600", bold: true },
      { key: "Direction", label: "Direction", icon: "ArrowRightLeft", color: "text-gray-600" },
      { key: "SourceIP", label: "Source IP", icon: "Server", color: "text-gray-600", monospace: true },
      { key: "SourcePort", label: "Source Port", icon: "Hash", color: "text-gray-600" },
      { key: "DestinationIP", label: "Destination IP", icon: "Server", color: "text-gray-600", monospace: true },
      { key: "DestinationPort", label: "Destination Port", icon: "Hash", color: "text-gray-600" },
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
