"use client"
import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// Header 配置
export const FILE_MOVE_HEADER: HeaderConfig = {
    title: { key: "NewFileName" },
    badges: [
        {
            key: "Signature",
            customRender: (value: number) => (
                <Badge variant={value === 1 ? "default" : "destructive"}>
                    {value === 1 ? "Signed" : "Unsigned"}
                </Badge>
            ),
        },
    ],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ],
}

// Card 配置
export const FILE_MOVE_CARD: SectionConfig[] = [
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
        ],
    },
    {
        title: "File Information",
        icon: "FileText",
        color: "text-blue-600",
        fields: [
            { key: "FileName", label: "Original File Name", icon: "FolderOpen", color: "text-gray-600", monospace: true },
            { key: "NewFileName", label: "New File Path", icon: "FolderOpen", color: "text-blue-600", monospace: true },
            { key: "FileMD5", label: "File MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
            { key: "FileClassDescription", label: "File Class", icon: "Tag", color: "text-gray-600" },
            { key: "FileFormatDescription", label: "File Format", icon: "Tag", color: "text-gray-600" },
            {
                key: "Signature",
                label: "Signature Status",
                icon: "Lock",
                color: "text-red-400",
                customRender: (value: number) => (
                    <Badge variant={value === 1 ? "default" : "destructive"}>
                        {value === 1 ? "Signed" : "Unsigned"}
                    </Badge>
                ),
            },
            { key: "SignVendor", label: "Sign Vendor", icon: "User", color: "text-gray-600" },
            { key: "DriverType", label: "Driver Type", icon: "HardDrive", color: "text-gray-600" },
        ],
    },
    {
        title: "Other Information",
        icon: "Info",
        color: "text-gray-600",
        fields: [
            { key: "EventID", label: "Event ID", icon: "Hash", color: "text-gray-500", bold: true },
            { key: "UniqueID", label: "Unique ID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
        ],
    },
]
