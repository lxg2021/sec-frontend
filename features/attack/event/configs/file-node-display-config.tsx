"use client"
import { Badge } from "@/shared/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"
import { Hash, FileText, FolderOpen, Activity, Info } from "lucide-react"

// Header 配置
export const FILE_NODE_HEADER: HeaderConfig = {
    title: { key: "FileName" },
    badges: [
        {
            key: "Signature",
            customRender: (value: number) => (
                <Badge variant={value === 1 ? "default" : "destructive"}>{value === 1 ? "Signed" : "Unsigned"}</Badge>
            ),
        },
    ],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
        { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
    ],
}

// Card 配置
export const FILE_NODE_CARD: SectionConfig[] = [
    {
        title: "File Information",
        icon: "FileText",
        color: "text-blue-600",
        fields: [
            { key: "FileName", label: "File Name", icon: "FolderOpen", color: "text-gray-600", monospace: true },
            { key: "FileMD5", label: "File MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
            { key: "FileClassDescription", label: "File Class", icon: "Tag", color: "text-gray-600" },
            { key: "FileFormatDescription", label: "File Format", icon: "Tag", color: "text-gray-600" },
            {
                key: "Signature",
                label: "Signature Status",
                icon: "Lock",
                color: "text-red-400",
                customRender: (value: number) => (
                    <Badge variant={value === 1 ? "default" : "destructive"}>{value === 1 ? "Signed" : "Unsigned"}</Badge>
                ),
            },
            { key: "DetectionContent", label: "Detection Content", icon: "FileText", color: "text-red-400", monospace: true },
            { key: "SignVendor", label: "Sign Vendor", icon: "User", color: "text-gray-600" },
            { key: "DriverType", label: "Driver Type", icon: "HardDrive", color: "text-gray-600" },
        ],
    },
]
