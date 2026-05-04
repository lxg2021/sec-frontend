"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header 配置
export const CREDENTIALS_NODE_HEADER: HeaderConfig = {
  title: { key: "ProcessName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const CREDENTIALS_NODE_CARD: SectionConfig[] = [
  {
    title: "Credential Information",
    icon: "Info",
    color: "text-blue-600",
    fields: [
      { key: "CredType", label: "Credential Type", icon: "Hash", color: "text-gray-600" },
      { key: "CredDesc", label: "Description", icon: "FileText", color: "text-red-400", monospace: true },
    ],
  },

]
