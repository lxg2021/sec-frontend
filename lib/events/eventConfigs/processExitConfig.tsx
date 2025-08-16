"use client"

import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// Header配置
export const PROCESS_EXIT_HEADER: HeaderConfig = {
  title: {
    key: "ProcessName",
  },
  badges: [
    {
      key: "SelfExit",
      customRender: (value: number) => (
        <Badge
          className={value === 1 ? "bg-red-100 text-red-600" : "bg-gray-100 text-black"}
        >
          {value === 1 ? "Terminated" : "Self Exit"}
        </Badge>
      ),
    },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
  ],
}

// Card配置
export const PROCESS_EXIT_CARD: SectionConfig[] = [
  {
    title: "Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "ProcessImage", label: "Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "ProcessGuid", label: "Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true },
      { key: "ProcessMD5", label: "Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
    ],
  },
  {
    title: "Exit Information",
    icon: "Lock",
    color: "text-blue-600",
    fields: [
      {
        key: "SelfExit",
        label: "Exit Type",
        icon: "Info",
        color: "text-gray-600",
        customRender: (value: number) => (
          <Badge
            className={value === 1 ? "bg-red-100 text-red-600" : "bg-gray-100 text-black"}
          >
            {value === 1 ? "Terminated" : "Self Exit"}
          </Badge>
        ),
      },
      { key: "OperatorProcessID", label: "Operator Process ID", icon: "Hash", color: "text-gray-600" },
      {
        key: "OperatorProcessImage",
        label: "Operator Process Path",
        icon: "FolderOpen",
        color: "text-gray-600",
        monospace: true,
        customRender: (value: string) => (value === "NULL" ? <span className="text-gray-400">NULL</span> : value),
      },
      {
        key: "OperatorProcessMD5",
        label: "Operator Process MD5",
        color: "text-gray-500",
        monospace: true,
        customRender: (value: string) => (value === "NULL" ? <span className="text-gray-400">NULL</span> : value),
      },
      {
        key: "OperatorProcessGuid",
        label: "Operator Process GUID",
        icon: "Fingerprint",
        color: "text-gray-500",
        monospace: true,
        customRender: (value: string) => (value === "NULL" ? <span className="text-gray-400">NULL</span> : value),
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
