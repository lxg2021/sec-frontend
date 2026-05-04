"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"
import { Badge } from "@/shared/ui/badge"

// Header 配置
export const REGKEY_NODE_HEADER: HeaderConfig = {
  title: { key: "ObjectName" },
  badges: [
    { key: "Classification", variant: "default" },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card 配置
export const REGKEY_NODE_CARD: SectionConfig[] = [
  {
    title: "Registry Key Information",
    icon: "ListTree",
    color: "text-blue-600",
    fields: [
      { key: "ObjectName", label: "Registry Key", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, maxLength: 50, showInPopover: true, copyable: true },
      { key: "Description", label: "Description", icon: "FileText", color: "text-gray-600" },
      {
        key: "Classification",
        label: "Classification",
        icon: "Tag",
        color: "text-gray-600",
        bold: true,
        customRender: (value: string) => (
          <Badge variant="outline" className="bg-black text-white border-black">
            {value || "N/A"}
          </Badge>
        ),
      },
    ],
  },
]
