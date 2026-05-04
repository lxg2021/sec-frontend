"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"

export const ATTACK_NODE_HEADER: HeaderConfig = {
    title: {
    },
    badges: [
    ],
    fields: [
    ],
}

export const ATTACK_NODE_CARD: SectionConfig[] = [
    {
        title: "Attack Information",
        icon: "Shield",
        color: "text-blue-600",
        fields: [
            { key: "ID", label: "ID", icon: "Hash", color: "text-gray-500" },
            { key: "Title", label: "Title", icon: "Type", color: "text-gray-600" },
            { key: "Status", label: "Status", icon: "Flag", color: "text-gray-600" },
            { key: "Author", label: "Author", icon: "User", color: "text-gray-600" },
            { key: "Date", label: "Date", icon: "Calendar", color: "text-gray-600" },
            { key: "Description", label: "Description", icon: "FileText", color: "text-gray-600" },
            {
                key: "References",
                label: "References",
                icon: "Link",
                color: "text-gray-600",
                customRender: (value: any[]) => {
                    if (!Array.isArray(value) || value.length === 0) return "N/A"

                    return (
                        <div className="border rounded-lg p-3 bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="space-y-2">
                                {value.map((ref, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <a
                                            href={ref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:underline"
                                        >
                                            <span className="text-xs">{ref}</span>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                },
            },

            {
                key: "AttTags",
                label: "Tags",
                icon: "Tags",
                color: "text-gray-600",
                customRender: (value: any[]) => {
                    if (!Array.isArray(value) || value.length === 0) return "N/A"

                    return (
                        <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max">
                            <div className="flex flex-col gap-2">
                                {value.map((tag, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center  text-xs font-medium rounded text-red-400"
                                    >
                                        {tag}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )

                },
            },

            {
                key: "Phases",
                label: "Phases",
                icon: "Activity",
                color: "text-gray-600",
                customRender: (value: any[]) => {
                    if (!Array.isArray(value)) return "N/A"

                    return (
                        <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max">
                            <div className="flex flex-wrap gap-2">
                                {value.map((phase, idx) => (
                                    <div
                                        key={idx}
                                         className="flex items-center  text-xs font-medium rounded text-red-400"
                                    >
                                        {phase}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                },
            },

        ],
    },
]
