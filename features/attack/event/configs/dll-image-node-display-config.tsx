"use client"

import { Badge } from "@/shared/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// DllImageLoad事件的Header配置
export const DLL_IMAGE_NODE_HEADER: HeaderConfig = {
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
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ],
}

// DllImageLoad事件的Card配置
export const DLL_IMAGE_NODE_CARD: SectionConfig[] = [
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
]
