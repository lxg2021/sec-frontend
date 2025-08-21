"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import { Tags, Clipboard } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Header配置
export const TOKEN_ADJUST_PRIVILEGE_HEADER: HeaderConfig = {
  title: { key: "ProcessName" },
  badges: [
    {
      key: "Self",
      customRender: (value: number) => (
        <Badge variant={value === 1 ? "default" : "destructive"}>{value === 1 ? "SelfAdjust" : "CrossAdjust"}</Badge>
      ),
    },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card配置
export const TOKEN_ADJUST_PRIVILEGE_CARD: SectionConfig[] = [
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
    title: "Privilege Information",
    icon: "Lock",
    color: "text-blue-600",
    fields: [
      { key: "Privileges", label: "Privileges", icon: "Tag", color: "text-gray-600" },
      {
        key: "Self",
        label: "AdjustPrivilege",
        icon: "Lock",
        color: "text-red-400",
        customRender: (value: number) => (
          <Badge variant={value === 1 ? "default" : "destructive"}>{value === 1 ? "SelfAdjust" : "CrossAdjust"}</Badge>
        ),
      }
    ],
  },
  {
    title: "Target Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "TargetProcessName", label: "Target Process Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "TargetProcessID", label: "Target Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "TargetProcessImage", label: "Target Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "TargetProcessMD5", label: "Target Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "TargetProcessGuid", label: "Target Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
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
