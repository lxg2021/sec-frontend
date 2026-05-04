"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header 配置
export const ACCOUNT_NODE_HEADER: HeaderConfig = {
  title: { key: "ProcessName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const ACCOUNT_NODE_CARD: SectionConfig[] = [
  {
    title: "Account Information",
    icon: "User",
    color: "text-blue-600",
    fields: [
      { key: "UserName", label: "User Name", icon: "User", color: "text-gray-600" },
      { key: "DomainName", label: "Domain Name", icon: "Globe", color: "text-gray-600" },
      { key: "SamAccountName", label: "Sam Account Name", icon: "Globe", color: "text-gray-600" },
      { key: "Sid", label: "Sid", icon: "Puzzle", color: "text-gray-600", monospace: true },
    ],
  },
]
