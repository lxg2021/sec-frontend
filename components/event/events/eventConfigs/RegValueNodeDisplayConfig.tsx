"use client"

import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"
import { Badge } from "@/components/ui/badge"

// Header 配置
export const REGVALUE_NODE_HEADER: HeaderConfig = {
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
export const REGVALUE_NODE_CARD: SectionConfig[] = [
  {
    title: "Registry Value Information",
    icon: "ListTree",
    color: "text-blue-600",
    fields: [
      { key: "ObjectName", label: "Registry Name", icon: "FolderOpen", color: "text-gray-600", monospace: true, truncate: true, maxLength: 50, showInPopover: true, copyable: true },
      { key: "ObjectValue", label: "Registry Value", icon: "Database", color: "text-gray-600", monospace: true },
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
      { key: "ValueExist", label: "Value Exist", icon: "Info", color: "text-gray-500" },
    ],
  },
]
