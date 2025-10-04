"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"

// DriverImageLoad事件的Header配置
export const DRIVER_IMAGE_NODE_HEADER: HeaderConfig = {
    title: {
        key: "Image",
    },
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
    ],
}

// DriverImageLoad事件的Card配置
export const DRIVER_IMAGE_NODE_CARD: SectionConfig[] = [
    {
        title: "Driver Information",
        icon: "Server",
        color: "text-blue-600",
        fields: [
            { key: "Image", label: "Driver Path", icon: "FolderOpen", color: "text-gray-600", monospace: true, bold: true },
            { key: "ImageMD5", label: "Driver MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
            {
                key: "Signature",
                label: "Signature Status",
                icon: "Lock",
                color: "text-red-400",
                customRender: (value: number) => (
                    <Badge variant={value === 1 ? "default" : "destructive"}>{value === 1 ? "Signed" : "Unsigned"}</Badge>
                ),
            },
            { key: "SignVendor", label: "Sign Vendor", icon: "Shield", color: "text-red-400" },
        ],
    },
]
