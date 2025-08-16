import { Badge } from "@/components/ui/badge"
import type { HeaderConfig, SectionConfig } from "@/lib/events/configInterfaces"

// Header配置
export const PROCESS_CREATE_HEADER: HeaderConfig = {
  title: {
    key: "ProcessName",
  },
  badges: [
    {
      key: "Signature",
      customRender: (value: number) => (
        <Badge variant={value === 1 ? "default" : "destructive"}>{value === 1 ? "Signed" : "Unsigned"}</Badge>
      ),
    },
  ],
  fields: [
    { key: "AgentID", label: "Agent ID", icon: "Shield", color: "text-gray-500" },
    { key: "UserID", label: "User ID", icon: "Shield", color: "text-gray-500" },
    { key: "Time", label: "Event Time", icon: "Clock", color: "text-gray-600" },
    { key: "Session", label: "Session", icon: "Info", color: "text-gray-600" },
  ],
}

// Card配置
export const PROCESS_CREATE_CARD: SectionConfig[] = [
  {
    title: "Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "ProcessName", label: "Process Name", icon: "FileText", color: "text-gray-600", bold: true },
      { key: "ProcessID", label: "Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "ProcessImage", label: "Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true },
      { key: "ProcessCommandLine", label: "Command Line", icon: "Terminal", color: "text-gray-600", monospace: true },
      { key: "OrgFileName", label: "Original Filename", icon: "FileText", color: "text-gray-600" },
      { key: "ProcessGUID", label: "Process GUID", icon: "Fingerprint", color: "text-gray-600", monospace: true },
      { key: "ProcessMD5", label: "Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
    ],
  },
  {
    title: "Parent Process Information",
    icon: "Activity",
    color: "text-blue-600",
    fields: [
      { key: "ParentProcessID", label: "Parent Process ID", icon: "Hash", color: "text-gray-600" },
      { key: "ParentProcessImage", label: "Parent Process Path", icon: "FolderOpen", color: "text-gray-600", monospace: true, },
      { key: "ParentProcessCommandLine", label: "Parent Command Line", icon: "Terminal", color: "text-gray-600", monospace: true, },
      { key: "ParentProcessGUID", label: "Parent Process GUID", icon: "Fingerprint", color: "text-gray-500", monospace: true, },
      { key: "ParentProcessMD5", label: "Parent Process MD5", icon: "Fingerprint", color: "text-red-400", monospace: true },
    ],
  },
  {
    title: "Security Information",
    icon: "Lock",
    color: "text-blue-600",
    fields: [
      {
        key: "Signature",
        label: "Signature Status",
        icon: "Lock",
        color: "text-red-400",
        customRender: (value: number) => (
          <Badge variant={value === 1 ? "default" : "destructive"}>{value === 1 ? "Signed" : "Unsigned"}</Badge>
        ),
      },
      { key: "SignVendor", label: "Sign Vendor", icon: "Shield", color: "text-red-400" },
      { key: "DriverType", label: "Driver Type", icon: "Info", color: "text-gray-600" },
      {
        key: "RTLO",
        label: "RTLO",
        icon: "Eye",
        color: "text-red-400",
        customRender: (value: number) => <Badge variant={value === 0 ? "secondary" : "destructive"}>{value}</Badge>,
      },
      {
        key: "ShowWindowFlag",
        label: "Show Window",
        icon: "EyeOff",
        color: "text-red-400",
        customRender: (value: number) => <Badge variant={value === 0 ? "secondary" : "default"}>{value}</Badge>,
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
