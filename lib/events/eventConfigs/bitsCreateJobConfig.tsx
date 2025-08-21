"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"


export const BITS_CREATE_JOB_HEADER: HeaderConfig = {
  title: { key: "JobName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

export const BITS_CREATE_JOB_CARD: SectionConfig[] = [
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
    title: "BITS Job Information",
    icon: "Database",
    color: "text-blue-600",
    fields: [
      { key: "JobName", label: "Job Name", icon: "FileText", color: "text-red-400", bold: true },
      { key: "JobId", label: "Job ID", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "JobTypeDesc", label: "Job Type", icon: "Tag", color: "text-red-400" },
      { key: "JobType", label: "Job Type Code", icon: "Tag", color: "text-gray-600" },
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
