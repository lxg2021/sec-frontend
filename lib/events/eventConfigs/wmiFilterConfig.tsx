"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

export const WMI_FILTER_HEADER: HeaderConfig = {
    title: {
        key: "EventFilterName"
    },
    badges: [],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ]
}

export const WMI_FILTER_CARD: SectionConfig[] = [
    {
        title: "Process Information",
        icon: "Activity",
        color: "text-blue-600",
        fields: [
            { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
            { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
            { key: "ProcessImage", label: "Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
            { key: "ProcessMD5", label: "Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
            { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
        ]
    },
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
    {
        title: "Other Information",
        icon: "Info",
        color: "text-gray-600",
        fields: [
            { key: "EventID", label: "Event ID", icon: "Hash", color: "text-gray-500", bold: true },
            { key: "UniqueID", label: "Unique ID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
        ]
    }
]
