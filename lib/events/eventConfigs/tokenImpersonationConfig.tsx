"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import { Tags, Clipboard, User } from "lucide-react"

// Header配置
export const TOKEN_IMPERSONATION_HEADER: HeaderConfig = {
    title: { key: "ProcessName", default: "Unknown Process" },
    badges: [],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ],
}

// Card配置
export const TOKEN_IMPERSONATION_CARD: SectionConfig[] = [
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
        title: "Operator Token",
        icon: "User",
        color: "text-blue-600",
        fields: [
            {
                key: "OperatorToken",
                label: "Operator Token",
                icon: "User",
                color: "text-gray-600",
                customRender: (value: any) => {
                    if (!value) return "N/A"
                    return (
                        <div className="space-y-2 text-xs">
                            <div><strong>Account:</strong> {value.accountname}</div>
                            <div><strong>SessionID:</strong> {value.sessionid}</div>
                            <div><strong>SID:</strong> {value.sid}</div>
                            <div><strong>TokenType:</strong> {value.tokentype}</div>
                            {value.impersonationlevel && (
                                <div><strong>Impersonationlevel:</strong> {value.impersonationlevel}</div>
                            )}

                            {value.integritylevel && (
                                <div><strong>Integritylevel:</strong> {value.integritylevel}</div>
                            )}
                            <div className="break-all"><strong>Privileges:</strong> {value.privilege}</div>
                        </div>
                    )
                },
            },
        ],
    },
    {
        title: "Target Token",
        icon: "User",
        color: "text-blue-600",
        fields: [
            {
                key: "TargetToken",
                label: "Target Token",
                icon: "User",
                color: "text-gray-600",
                customRender: (value: any) => {
                    if (!value) return "N/A"
                    return (
                        <div className="space-y-2 text-xs">
                            <div><strong>Account:</strong> {value.accountname}</div>
                            <div><strong>SessionID:</strong> {value.sessionid}</div>
                            <div><strong>SID:</strong> {value.sid}</div>
                            <div><strong>TokenType:</strong> {value.tokentype}</div>
                            {value.impersonationlevel && (
                                <div><strong>Impersonationlevel:</strong> {value.impersonationlevel}</div>
                            )}

                            {value.integritylevel && (
                                <div><strong>Integritylevel:</strong> {value.integritylevel}</div>
                            )}
                            <div className="break-all"><strong>Privileges:</strong> {value.privilege}</div>
                        </div>
                    )
                },
            },
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
