"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header 配置
export const EVENT_NODE_HEADER: HeaderConfig = {
  title: { key: "EventName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const EVENT_NODE_CARD: SectionConfig[] = [
  {
    title: "Event Information",
    icon: "Bell",
    color: "text-blue-600",
    fields: [
      { key: "EventName", label: "Event Name", icon: "FileText", color: "text-gray-600", monospace: true },
    ],
  },
]
