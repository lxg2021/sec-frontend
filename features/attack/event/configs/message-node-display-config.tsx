"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header配置
export const MESSAGE_HOOK_NODE_HEADER: HeaderConfig = {
  title: { key: "ProcessName", default: "Unknown Process" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card配置
export const MESSAGE_HOOK_NODE_CARD: SectionConfig[] = [
  {
    title: "Message Hook Information",
    icon: "Tag",
    color: "text-blue-600",
    fields: [
      { key: "HookTypeDescription", label: "Hook Type", icon: "Tag", color: "text-red-400" },
      { key: "MessageHookModule", label: "Hook Module", icon: "FolderOpen", color: "text-red-400", monospace: true },
    ],
  },
]
