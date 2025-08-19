"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import { Tags, Clipboard } from "lucide-react"

// Header配置
export const WINDOWS_MESSAGE_HOOK_HEADER: HeaderConfig = {
  title: { key: "ProcessName", default: "Unknown Process" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card配置
export const WINDOWS_MESSAGE_HOOK_CARD: SectionConfig[] = [
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
    title: "Message Hook Information",
    icon: "Tag",
    color: "text-blue-600",
    fields: [
      { key: "HookTypeDescription", label: "Hook Type", icon: "Tag", color: "text-red-400" },
      { key: "MessageHookModule", label: "Hook Module", icon: "FolderOpen", color: "text-red-400", monospace: true },
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
