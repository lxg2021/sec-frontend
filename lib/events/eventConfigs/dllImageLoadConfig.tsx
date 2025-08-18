"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// DllImageLoad事件的Header配置
export const DLL_IMAGE_LOAD_HEADER: HeaderConfig = {
    title: {
        key: "Image",
    },
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

// DllImageLoad事件的Card配置
export const DLL_IMAGE_LOAD_CARD: SectionConfig[] = [
    {
        title: "DLL Information",
        icon: "Server",
        color: "text-blue-600",
        fields: [
            { key: "Image", label: "DLL Path", icon: "FolderOpen", color: "text-gray-600", monospace: true, bold: true },
            { key: "ImageMD5", label: "DLL MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
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
            { key: "SignVendor", label: "Sign Vendor", icon: "Shield", color: "text-red-400" },
            { key: "OrgFileName", label: "Original File Name", icon: "FileText", color: "text-gray-600" },
        ],
    },
    {
        title: "Process Information",
        icon: "Activity",
        color: "text-blue-600",
        fields: [
            { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
            { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
            { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
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
