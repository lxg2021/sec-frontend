"use client"

import { Badge } from "@/shared/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

export const NET_NODE_HEADER: HeaderConfig = {
  title: {
  },
  badges: [
    { key: "Direction", color: "bg-blue-500 text-white" },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-600", monospace: true },
  ],
}

export const NET_NODE_CARD: SectionConfig[] = [
  {
    title: "Network Communication",
    icon: "Radio",
    color: "text-blue-600",
    fields: [
      { key: "Protocol", label: "Protocol", icon: "Globe", color: "text-gray-600", bold: true },
      { key: "Direction", label: "Direction", icon: "ArrowRightLeft", color: "text-gray-600" },
      { key: "SourceIP", label: "Source IP", icon: "Server", color: "text-gray-600", monospace: true },
      { key: "SourcePort", label: "Source Port", icon: "Hash", color: "text-gray-600" },
      { key: "DestinationIP", label: "Destination IP", icon: "Server", color: "text-gray-600", monospace: true },
      { key: "DestinationPort", label: "Destination Port", icon: "Hash", color: "text-gray-600" },
    ],
  },
]
