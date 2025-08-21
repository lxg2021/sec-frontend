"use client"

import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"
import { Badge } from "@/components/ui/badge"
import { Tags, Clipboard, Key } from "lucide-react"

// WmiCreateClass Header配置
export const WMI_CREATE_CLASS_HEADER: HeaderConfig = {
  title: { key: "ClassName" },
  badges: [],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Monitor", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// WmiCreateClass Card配置
export const WMI_CREATE_CLASS_CARD: SectionConfig[] = [
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
        key: "ClassAttributes",
        label: "Attributes",
        icon: "List",
        color: "text-gray-600",
        customRender: (value: any[]) => {
          if (!Array.isArray(value)) return "N/A"

          const base64Attrs = value.filter(attr => attr.isbase64)
          if (base64Attrs.length === 0) return "N/A"

          return (
            <div className="space-y-3">
              {base64Attrs.map((attr, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-red-100 w-max"
                >
                  <div className="space-y-2">
                    {/* Attribute Name */}
                    <div className="flex items-center gap-2">
                      <Tags className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600">attrname:</span>
                      <span className="text-xs text-gray-600">{attr.attrname}</span>
                    </div>

                    {/* Attribute Value */}
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-medium text-gray-600">attrvalue:</span>
                      <span className="text-xs text-red-400">{attr.attrvalue}</span>
                    </div>

                    {/* Base64 */}
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-medium text-gray-600">Base64:</span>
                      <span className="text-xs text-red-400">Yes</span>
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
    title: "Other Information",
    icon: "Info",
    color: "text-gray-600",
    fields: [
      { key: "EventID", label: "Event ID", icon: "Hash", color: "text-gray-500", bold: true },
      { key: "UniqueID", label: "Unique ID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
    ],
  },
]
