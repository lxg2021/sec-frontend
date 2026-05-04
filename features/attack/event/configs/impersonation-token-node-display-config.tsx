"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

// Header配置
export const IMPERSONATION_TOKEN_NODE_HEADER: HeaderConfig = {
    title: { key: "ProcessName", default: "Unknown Process" },
    badges: [],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ],
}

// Card配置
export const IMPERSONATION_TOKEN_NODE_CARD: SectionConfig[] = [
    {
        title: "Token Operator Type",
        icon: "Activity",
        color: "text-blue-600",
        fields: [
            { key: "TokenFlagDescription", label: "Token Flag Description", icon: "Info", color: "text-red-400", monospace: true },
            { key: "TokenFlag", label: "Token Flag", icon: "Hash", color: "text-gray-500", monospace: true },
        ],
    },
    {
        title: "Operator Token",
        icon: "User",
        color: "text-blue-600",
        fields: [
            {
                key: "OperatorTokenContext",
                label: "Operator Token",
                icon: "User",
                color: "text-gray-600",
                customRender: (value: any) => {
                    if (!value) return "N/A"
                    return (
                        <div className="space-y-2 text-xs">
                            <div><strong>AccountName:</strong> {value.AccountName}</div>
                            <div><strong>SessionID:</strong> {value.SessionID}</div>
                            <div><strong>SID:</strong> {value.SID}</div>
                            <div><strong>TokenType:</strong> {value.TokenType}</div>
                            {value.impersonationlevel && (
                                <div><strong>ImpersonationLevel:</strong> {value.ImpersonationLevel}</div>
                            )}

                            {value.integritylevel && (
                                <div><strong>Integritylevel:</strong> {value.IntegrityLevel}</div>
                            )}
                            <div className="break-all"><strong>Privileges:</strong> {value.Privilege}</div>
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
                key: "TargetTokenContext",
                label: "Target Token",
                icon: "User",
                color: "text-gray-600",
                customRender: (value: any) => {
                    if (!value) return "N/A"
                    return (
                        <div className="space-y-2 text-xs">
                            <div><strong>AccountName:</strong> {value.AccountName}</div>
                            <div><strong>SessionID:</strong> {value.SessionID}</div>
                            <div><strong>SID:</strong> {value.SID}</div>
                            <div><strong>TokenType:</strong> {value.TokenType}</div>
                            {value.impersonationlevel && (
                                <div><strong>Impersonationlevel:</strong> {value.ImpersonationLevel}</div>
                            )}

                            {value.integritylevel && (
                                <div><strong>Integritylevel:</strong> {value.IntegrityLevel}</div>
                            )}
                            <div className="break-all"><strong>Privileges:</strong> {value.Privilege}</div>
                        </div>
                    )
                },
            },
        ],
    },
]
