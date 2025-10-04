"use client"

import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

export const WMI_FILTER_NODE_HEADER: HeaderConfig = {
    title: {
        key: "EventFilterName"
    },
    badges: [],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ]
}

export const WMI_FILTER_NODE_CARD: SectionConfig[] = [
    {
        title: "Event Filter Information",
        icon: "Filter",
        color: "text-blue-600",
        fields: [
            { key: "EventFilterName", label: "Filter Name", icon: "Tag", color: "text-gray-600", bold: true },
            { key: "EventFilterClass", label: "Filter Class", icon: "List", color: "text-gray-600" },
            { key: "ServerName", label: "Server Name", icon: "Server", color: "text-gray-600" },
            { key: "User", label: "User", icon: "User", color: "text-gray-600" },
            { key: "Namespace", label: "Namespace", icon: "Folder", color: "text-gray-600" },
            { key: "Query", label: "Query", icon: "Terminal", color: "text-red-400", monospace: true, truncate: true, maxLength: 80, showInPopover: true, copyable: true },
        ]
    },
]
