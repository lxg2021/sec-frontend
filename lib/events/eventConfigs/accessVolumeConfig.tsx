"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import { Hash, FileText, FolderOpen, Activity, Info, HardDrive, Fingerprint, Clock, Shield } from "lucide-react"

// Header 配置
export const ACCESS_VOLUME_HEADER: HeaderConfig = {
  title: { key: "FileName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const ACCESS_VOLUME_CARD: SectionConfig[] = [
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
    title: "Volume Information",
    icon: "HardDrive",
    color: "text-blue-600",
    fields: [
      { key: "FileName", label: "Volume Name", icon: "FolderOpen", color: "text-red-400", monospace: true },
      { key: "AccessType", label: "Access Type", icon: "Lock", color: "text-gray-600" },
      { key: "DriverType", label: "Driver Type", icon: "HardDrive", color: "text-gray-600" },
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
