"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"
import { Tags, Clipboard, Key, Code, Terminal, Hash } from "lucide-react"

// WmiExecute Header配置
export const WMI_EXECUTE_NODE_HEADER: HeaderConfig = {
    title: { key: "ProcessName", default: "WMI Execute" },
    badges: [],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    ],
}

// WmiExecute Card配置
export const WMI_EXECUTE_NODE_CARD: SectionConfig[] = [
    {
        title: "WMI Execution Info",
        icon: "Code",
        color: "text-blue-600",
        fields: [
            { key: "ServerName", label: "Server Name", icon: "Server", color: "text-gray-600" },
            { key: "User", label: "User", icon: "User", color: "text-gray-600" },
            { key: "Namespace", label: "Namespace", icon: "Folder", color: "text-gray-600" },
            { key: "ClassName", label: "Class Name", icon: "FileText", color: "text-red-400" },
            { key: "MethodName", label: "Method Name", icon: "Tag", color: "text-red-400" },
            {
                key: "Parameters",
                label: "Method Parameters",
                icon: "List",
                color: "text-gray-600",
                customRender: (params: any[]) => {
                    if (!Array.isArray(params) || params.length === 0) return "N/A"
                    return (
                        <div className="space-y-3">
                            {params.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 max-w-full break-words"
                                >
                                    <div className="space-y-2">
                                        {/* Parameter Name */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Tags className="w-4 h-4 text-red-400 flex-shrink-0" />
                                            <span className="text-xs font-medium text-gray-600">Parameter Name:</span>
                                            <span className="text-xs text-red-400 break-all">{p.ParameterName}</span>
                                        </div>

                                        {/* Parameter Value */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Clipboard className="w-4 h-4 text-red-400 flex-shrink-0" />
                                            <span className="text-xs font-medium text-gray-600">Parameter Value:</span>
                                            <span className="text-xs text-red-400 break-all">{p.ParameterValue}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                },
            },
        ],
    },
]
