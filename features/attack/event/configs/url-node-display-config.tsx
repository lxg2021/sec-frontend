"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header配置
export const URL_NODE_HEADER: HeaderConfig = {
  title: { key: "ProcessName", default: "Unknown Process" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card配置
export const URL_NODE_CARD: SectionConfig[] = [
  {
    title: "URL Information",
    icon: "Tag",
    color: "text-blue-600",
    fields: [
      { key: "URL", label: "URL", icon: "Link", color:  "text-gray-600" },
    ],
  },
]
