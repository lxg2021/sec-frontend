"use client"

import type { HeaderConfig, SectionConfig } from "@/features/attack/event/config-interfaces"
import { Tags, Clipboard, Key } from "lucide-react"

export const BITS_JOB_NODE_HEADER: HeaderConfig = {
  title: { key: "JobName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

export const BITS_JOB_NODE_CARD: SectionConfig[] = [
  {
    title: "BITS Job Information",
    icon: "Database",
    color: "text-blue-600",
    fields: [
      { key: "JobName", label: "Job Name", icon: "FileText", color: "text-red-400", bold: true },
      { key: "JobId", label: "Job ID", icon: "Fingerprint", color: "text-red-400", monospace: true },
      { key: "JobTypeDesc", label: "Job Type", icon: "Tag", color: "text-red-400" },
      { key: "JobStatusDesc", label: "Job Status", icon: "Tag", color: "text-gray-600" },
      {
        key: "JobFiles",
        label: "Files",
        icon: "List",
        color: "text-gray-600",
        customRender: (files: any[]) => {
          if (!Array.isArray(files) || files.length === 0) return "N/A"
          return (
            <div className="space-y-3">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max break-words"
                >
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Tags className="w-4 h-4 text-red-600" />
                      <span className="text-gray-600">Local Name:</span>
                      <span className="text-red-600 break-all">{f.LocalName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-4 h-4 text-red-400" />
                      <span className="text-gray-600">Remote Name:</span>
                      <span className="text-red-400 break-all">{f.RemoteName}</span>
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
