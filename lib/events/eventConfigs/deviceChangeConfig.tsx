"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// DeviceChange事件的Header配置
export const DEVICE_CHANGE_HEADER: HeaderConfig = {
  title: {
    key: "DeviceDescription",
  },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// DeviceChange事件的Card配置
export const DEVICE_CHANGE_CARD: SectionConfig[] = [
  {
    title: "Device Information",
    icon: "Cpu",
    color: "text-blue-600",
    fields: [
      { key: "DeviceDescription", label: "Device Description", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "DeviceGUID", label: "Device GUID", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "HID", label: "Hardware ID", icon: "Barcode", color: "text-gray-600", monospace: true, truncate: true, maxLength: 100, showInPopover: true, copyable: true },
      { key: "DeviceType", label: "Device Type", icon: "Hash", color: "text-gray-600" },
      { key: "DeviceFlag", label: "Device Flag", icon: "Flag", color: "text-gray-600" },
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
