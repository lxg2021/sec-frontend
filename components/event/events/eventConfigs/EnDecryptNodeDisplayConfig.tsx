"use client"

import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

// Header配置
export const ENDDCRYPT_NODE_HEADER: HeaderConfig = {
  title: { key: "ProcessName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card配置
export const ENDDCRYPT_NODE_CARD: SectionConfig[] = [
  {
    title: "Encryption / Decryption Information",
    icon: "Lock",
    color: "text-blue-600",
    fields: [
      { key: "CryptFlag", label: "Crypt Flag", icon: "Lock", color: "text-gray-600" },
      { key: "CryptFlagDescription", label: "Crypt Description", icon: "Lock", color: "text-gray-600" },
    ],
  },
]
