"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// Process Access事件的Header配置
export const PROCESS_ACCESS_HEADER: HeaderConfig = {
  title: {
    key: "ProcessName",
  },
  badges: [

  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Process Access事件的Card配置
export const PROCESS_ACCESS_CARD: SectionConfig[] = [
  {
    title: "Target Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "ProcessImage", label: "Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "ProcessMD5", label: "Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
    ],
  },
  {
    title: "Operator Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "OperatorProcessID", label: "Operator Process ID", icon: "Hash", color: "text-gray-600" },
      {
        key: "OperatorProcessName",
        label: "Operator Process Name",
        icon: "FileText",
        color: "text-gray-600",
        bold: true,
      },
      {
        key: "OperatorProcessImage",
        label: "Operator Process Path",
        icon: "FolderOpen",
        color: "text-gray-600",
        monospace: true,
      },
      {
        key: "OperatorProcessGuid",
        label: "Operator Process GUID",
        icon: "Fingerprint",
        color: "text-gray-500",
        monospace: true,
      },
      { key: "OperatorProcessMD5", label: "Operator Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
    ],
  },
  {
    title: "Access Information",
    icon: "Lock",
    color: "text-gray-600",
    fields: [
      { key: "GrantedAccess", label: "Granted Access", icon: "Lock", color: "text-gray-600", bold: true },
      {
        key: "CallTrace",
        label: "Call Trace",
        icon: "Terminal",
        color: "text-gray-600",
        monospace: true,
        truncate: true,
        maxLength: 100,
        showInPopover: true,
        copyable: true,
      },
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
