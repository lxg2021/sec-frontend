"use client"

import type { HeaderConfig, SectionConfig } from "@/components/event/events/configInterfaces"
import { Tags, Clipboard, Key } from "lucide-react"

// WmiCreateClass Header配置
export const WMI_CLASS_NODE_HEADER: HeaderConfig = {
  title: { key: "ClassName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// WmiCreateClass Card配置
export const WMI_CLASS_NODE_CARD: SectionConfig[] = [
  {
    title: "Class Information",
    icon: "Database",
    color: "text-blue-600",
    fields: [
      { key: "ClassName", label: "Class Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "ClassPath", label: "Class Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "SuperClassName", label: "Super Class Name", icon: "FileText", color: "text-gray-600" },
      { key: "Namespace", label: "Namespace", icon: "Folder", color: "text-gray-600" },
      { key: "ServerName", label: "Server Name", icon: "Server", color: "text-gray-600" },
      { key: "User", label: "User", icon: "User", color: "text-gray-600" },
    ],
  },
  {
    title: "Class Attributes",
    icon: "List",
    color: "text-blue-600",
    fields: [
      {
        key: "WmiAttrs",
        label: "Attributes",
        icon: "List",
        color: "text-gray-600",
        customRender: (value: any[]) => {
          if (!Array.isArray(value)) return "N/A"

          return (
            <div className="space-y-3">
              {value.map((attr, idx) => {
                const isBase64 = attr.IsBase64
                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 w-max ${isBase64
                        ? "bg-gradient-to-r from-red-50 to-red-100"
                        : "bg-gradient-to-r from-gray-50 to-gray-100"
                      }`}
                  >
                    <div className="space-y-2">
                      {/* Attribute Name */}
                      <div className="flex items-center gap-2">
                        <Tags className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-600">attrname:</span>
                        <span className="text-xs text-gray-600">{attr.AttrName}</span>
                      </div>

                      {/* Attribute Value */}
                      <div className="flex items-center gap-2">
                        <Clipboard
                          className={`w-4 h-4 ${isBase64 ? "text-red-400" : "text-gray-600"}`}
                        />
                        <span className="text-xs font-medium text-gray-600">attrvalue:</span>
                        <span className={`text-xs ${isBase64 ? "text-red-400" : "text-gray-600"}`}>
                          {attr.AttrValue}
                        </span>
                      </div>

                      {/* Base64 Indicator */}
                      <div className="flex items-center gap-2">
                        <Key
                          className={`w-4 h-4 ${isBase64 ? "text-red-400" : "text-gray-600"}`}
                        />
                        <span className="text-xs font-medium text-gray-600">Base64:</span>
                        <span className={`text-xs ${isBase64 ? "text-red-400" : "text-gray-600"}`}>
                          {isBase64 ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        },
      },
    ],
  },
]
