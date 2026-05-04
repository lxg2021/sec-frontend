"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// DNS事件的Header配置
export const DNS_NODE_HEADER: HeaderConfig = {
  title: {
    key: "Domain",
  },
  badges: [

  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
     { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
  ],
}

// DNS事件的Card配置
export const DNS_NODE_CARD: SectionConfig[] = [
  {
    title: "DNS Query Information",
    icon: "Globe",
    color: "text-blue-600",
    fields: [
      { key: "Domain", label: "Domain", icon: "Globe", color: "text-gray-600", bold: true },
      {
        key: "IPS",
        label: "IPS",
        icon: "Network",
        color: "text-gray-600",
        monospace: true,
        truncate: true,
        maxLength: 80,
        showInPopover: true,
        copyable: true,
      },
    ],
  },
]
