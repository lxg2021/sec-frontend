"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header 配置
export const ACCOUNT_GROUP_NODE_HEADER: HeaderConfig = {
  title: { key: "ProcessName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const ACCOUNT_GROUP_NODE_CARD: SectionConfig[] = [
  {
    title: "Account Group Information",
    icon: "User",
    color: "text-blue-600",
    fields: [
      { key: "GroupName", label: "Group Name", icon: "User", color: "text-gray-600" },
      { key: "GroupDomainName", label: "Group Domain", icon: "Globe", color: "text-gray-600" },
      { key: "GroupSid", label: "Group SID", icon: "Puzzle", color: "text-gray-600", monospace: true },
      { key: "SamAccountName", label: "SAM Account Name", icon: "UserPlus", color: "text-gray-600", monospace: true },
    ],
  },
]
