"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"
import { Tags, Clipboard } from "lucide-react"

export const WMI_CONSUMER_NODE_HEADER: HeaderConfig = {
    title: { key: "EventConsumerName" },
    badges: [],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" }
    ]
}

export const WMI_CONSUMER_NODE_CARD: SectionConfig[] = [
    {
        title: "Consumer Information",
        icon: "List",
        color: "text-blue-600",
        fields: [
            { key: "EventConsumerName", label: "Consumer Name", icon: "List", color: "text-gray-600", bold: true },
            { key: "ClassName", label: "Consumer Class", icon: "List", color: "text-gray-600", bold: true },
            { key: "EventConsumerTypeDescription", label: "Consumer Type", icon: "Tag", color: "text-gray-600" },
            { key: "ServerName", label: "Server Name", icon: "Server", color: "text-gray-600" },
            { key: "User", label: "User", icon: "User", color: "text-gray-600" },
            { key: "Namespace", label: "Namespace", icon: "Folder", color: "text-gray-600" },
            {
                key: "EventConsumerContext",
                label: "Context",
                icon: "Code",
                color: "text-purple-600",
                customRender: (context: any) => {
                    if (!context) return "N/A"

                    return (
                        <div className="space-y-3">
                            {/* Script Filename */}
                            {context.scriptfilename && (
                                <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max">
                                    <div className="flex items-center gap-2">
                                        <Tags className="w-4 h-4 text-gray-600" />
                                        <span className="text-xs font-medium text-gray-600">Script Filename:</span>
                                        <span className="text-xs text-red-400">{context.scriptfilename}</span>
                                    </div>
                                </div>
                            )}

                            {/* Script MD5 */}
                            {context.scriptfilemd5 && (
                                <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max">
                                    <div className="flex items-center gap-2">
                                        <Tags className="w-4 h-4 text-red-400" />
                                        <span className="text-xs font-medium text-gray-600">Script MD5:</span>
                                        <span className="text-xs text-red-400">{context.scriptfilemd5}</span>
                                    </div>
                                </div>
                            )}

                            {/* Script Text */}
                            {context.scripttext && (
                                <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max">
                                    <div className="flex items-start gap-2">
                                        <Tags className="w-4 h-4 text-red-400 mt-0.5" />
                                        <span className="text-xs font-medium text-gray-600">Script Text:</span>
                                        <pre className="whitespace-pre-wrap text-xs text-red-400">{context.scripttext}</pre>
                                    </div>
                                </div>
                            )}

                            {/* Scripting Engine */}
                            {context.scriptingengine && (
                                <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max">
                                    <div className="flex items-center gap-2">
                                        <Tags className="w-4 h-4 text-red-600" />
                                        <span className="text-xs font-medium text-gray-600">Scripting Engine:</span>
                                        <span className="text-xs text-red-400">{context.scriptingengine}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            }
        ]
    },
]
