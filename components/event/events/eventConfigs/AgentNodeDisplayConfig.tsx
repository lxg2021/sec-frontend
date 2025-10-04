"use client"

import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

// DNS事件的Header配置
export const AGENT_NODE_HEADER: HeaderConfig = {
    title: {
        key: "Domain",
    },
    badges: [

    ],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ],
}

// DNS事件的Card配置
export const AGENT_NODE_CARD: SectionConfig[] = [
    {
        title: "Agent Information",
        icon: "Globe",
        color: "text-blue-600",
        fields: [
            { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
            { key: "Domain", label: "Domain", icon: "Globe", color: "text-gray-600", bold: true },
            { key: "ComputerName", label: "Computer Name", icon: "Globe", color: "text-gray-600", bold: true },
            {
                key: "IPS",
                label: "IPS",
                icon: "Network",
                color: "text-gray-600",
                monospace: true,
                truncate: true,
                maxLength: 80,
                showInPopover: true,
                copyable: true,
            },
        ],
    },
]
