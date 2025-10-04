import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "../configInterfaces"
import { Clock, Calendar, Timer, IdCard, Tags, Folder, Key, Settings, Fingerprint, FolderOpen } from "lucide-react"

export const TASK_NODE_HEADER: HeaderConfig = {
    title: {
        key: "TaskName",
    },
    badges: [

    ],
    fields: [
        { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
        { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
        {
            key: "User",
            label: "User",
            icon: "User",
            color: "text-gray-600",
        },
    ],
}

export const TASK_NODE_CARD: SectionConfig[] = [
    {
        title: "Task Information",
        icon: "Calendar",
        color: "text-blue-600",
        fields: [
            { key: "TaskName", label: "Task Name", icon: "FileText", bold: true },
            { key: "TaskPath", label: "Task Path", icon: "FolderOpen", monospace: true },
            { key: "Domain", label: "Domain", icon: "Globe" },
            { key: "ServerName", label: "Server Name", icon: "Server" },
        ],
    },
    {
        title: "Task Images",
        icon: "File",
        color: "text-blue-600",
        fields: [
            {
                key: "TaskImageContext",
                label: "Task Images",
                icon: "File",
                customRender: (value: any) => {
                    if (!Array.isArray(value)) return "N/A"
                    return (
                        <div className="space-y-3">
                            {value.map((item, index) => (
                                <div
                                    key={index}
                                    className="border rounded-lg p-3 bg-gradient-to-r from-orange-50 to-amber-50 w-max"
                                >
                                    <div className="space-y-2">
                                        {/* Executable Path */}
                                        <div className="flex items-center gap-2 flex-nowrap">
                                            <FolderOpen className="w-4 h-4 text-gray-500 shrink-0" />
                                            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                                Executable Path:
                                            </span>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {item.Image}
                                            </span>
                                        </div>

                                        {/* MD5 Hash */}
                                        <div className="flex items-center gap-2 flex-nowrap">
                                            <Fingerprint className="w-4 h-4 text-red-400 shrink-0" />
                                            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                                MD5 Hash:
                                            </span>
                                            <span className="text-xs text-red-400 whitespace-nowrap">
                                                {item.ImageMD5}
                                            </span>
                                        </div>

                                        {/* Parameters */}
                                        <div className="flex items-center gap-2 flex-nowrap">
                                            <Settings className="w-4 h-4 text-gray-600 shrink-0" />
                                            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                                Parameters:
                                            </span>
                                            <span className="text-xs text-gray-600 whitespace-nowrap">
                                                {item.Parameters || "None"}
                                            </span>
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
    {
        title: "Task Triggers",
        icon: "Clock",
        color: "text-blue-600",
        fields: [
            {
                key: "TaskTriggerContext",
                label: "Task Triggers",
                icon: "Clock",
                customRender: (value: any) => {
                    if (!Array.isArray(value)) return "N/A"
                    return (
                        <div className="space-y-3">
                            {value.map((item, index) => (
                                <div
                                    key={index}
                                    className="border rounded-lg p-3 bg-gradient-to-r from-orange-50 to-amber-50 w-max"
                                >
                                    <div className="space-y-2">
                                        {/* Trigger Type */}
                                        <div className="flex items-center gap-2">
                                            <Tags className="w-4 h-4 text-red-400" />
                                            <span className="text-xs font-medium text-gray-600">
                                                Trigger Type:
                                            </span>
                                            <span className="text-xs text-red-400">
                                                {item.TrigerType}
                                            </span>
                                        </div>

                                        {/* Start Boundary */}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-600" />
                                            <span className="text-xs font-medium text-gray-600">
                                                Start Boundary:
                                            </span>
                                            <span className="text-xs text-gray-800">
                                                {item.StartBoundary}
                                            </span>
                                        </div>

                                        {/* End Boundary */}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-600" />
                                            <span className="text-xs font-medium text-gray-600">
                                                End Boundary:
                                            </span>
                                            <span className="text-xs text-gray-800">
                                                {item.EndBoundry}
                                            </span>
                                        </div>

                                        {/* Execution Time Limit */}
                                        <div className="flex items-center gap-2">
                                            <Timer className="w-4 h-4 text-gray-600" />
                                            <span className="text-xs font-medium text-gray-600">
                                                Execution Time Limit:
                                            </span>
                                            <span className="text-xs text-gray-800">
                                                {item.ExecutionTimeLimit}
                                            </span>
                                        </div>

                                        {/* Trigger Type */}
                                        {item.trigerid && (
                                            <div className="flex items-center gap-2">
                                                <IdCard className="w-4 h-4 text-purple-600" />
                                                <span className="text-xs font-medium text-gray-600">
                                                    Trigger Type:
                                                </span>
                                                <code className="text-xs font-mono text-gray-800">
                                                    {item.TrigerType}
                                                </code>
                                            </div>
                                        )}
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
