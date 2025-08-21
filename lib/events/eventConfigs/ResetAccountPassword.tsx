"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// Header 配置
export const RESET_ACCOUNT_PASSWORD_HEADER: HeaderConfig = {
  title: { key: "ProcessName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const RESET_ACCOUNT_PASSWORD_CARD: SectionConfig[] = [
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
    title: "Target Account Information",
    icon: "User",
    color: "text-blue-600",
    fields: [
      { key: "TargetUserName", label: "Target User Name", icon: "User", color: "text-gray-600" },
      { key: "TargetDomainName", label: "Target Domain", icon: "Globe", color: "text-gray-600" },
      { key: "TargetSid", label: "Target SID", icon: "Puzzle", color: "text-gray-600", monospace: true },
    ],
  },
  {
    title: "Subject Information",
    icon: "UserCheck",
    color: "text-blue-600",
    fields: [
      { key: "SubjectUserName", label: "Subject User Name", icon: "User", color: "text-gray-600" },
      { key: "SubjectDomainName", label: "Subject Domain", icon: "Globe", color: "text-gray-600" },
      { key: "SubjectUserSid", label: "Subject SID", icon: "Puzzle", color: "text-gray-600", monospace: true },
      { key: "SubjectLogonId", label: "Subject Logon ID", icon: "Hash", color: "text-gray-600", monospace: true },
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
