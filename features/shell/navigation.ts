import {
  Activity,
  AlertTriangle,
  BarChart,
  Boxes,
  Computer,
  FileText,
  HardDrive,
  LayoutDashboard,
  MapPin,
  Monitor,
  Package,
  Settings,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sword,
  Target,
  Terminal,
  Timer,
  Trash2,
} from "lucide-react"

export const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "DASHBOARD", path: "/frame/dashboard" },
  {
    id: "computers",
    icon: Computer,
    label: "主机管理",
    submenu: [
      { id: "agentinfo", icon: Monitor, label: "主机信息", path: "/frame/assets/hardware" },
      { id: "approve", icon: Package, label: "主机审批", path: "/frame/computers/approve" },
    ],
  },
  {
    id: "assets",
    icon: Boxes,
    label: "资产管理",
    submenu: [
      { id: "hardware", icon: HardDrive, label: "硬件资产", path: "/frame/assets/hardware" },
      { id: "softdetails", icon: Package, label: "软件管理", path: "/frame/assets/software/details" },
      { id: "softuninstall", icon: Trash2, label: "软件卸载", path: "/frame/assets/software/uninstall" },
    ],
  },
  {
    id: "baseline",
    icon: ShieldCheck,
    label: "安全基线",
    submenu: [
      { id: "baselinedashboard", icon: LayoutDashboard, label: "基线概览", path: "/frame/baseline" },
      { id: "baselineconfig", icon: Settings2, label: "基线配置", path: "/frame/baseline/rules" },
    ],
  },
  {
    id: "vulnerability",
    icon: AlertTriangle,
    label: "漏洞防护",
    path: "/frame/vulnerability",
    submenu: [
      { id: "patchdash", icon: ShieldCheck, label: "补丁概览", path: "/frame/vulnerability/dashboard" },
      { id: "patchinstall", icon: Package, label: "安装补丁", path: "/frame/vulnerability/installtask" },
      { id: "patchstatus", icon: BarChart, label: "安装状态", path: "/frame/vulnerability/taskstatus" },
    ],
  },
  {
    id: "attack",
    icon: Target,
    label: "攻击溯源",
    path: "/frame/attack",
    submenu: [
      { id: "attdash", icon: Sword, label: "攻击概览", path: "/frame/attack/dashboard" },
      { id: "attdrill", icon: Activity, label: "溯源详情", path: "/frame/attack/drill" },
      { id: "attpositioning", icon: MapPin, label: "数据定位", path: "/frame/attack/positioning" },
    ],
  },
  {
    id: "response",
    icon: Shield,
    label: "处置响应",
    path: "/frame/response",
    submenu: [
      { id: "orchestration", icon: Sword, label: "处置编排", path: "/frame/response/orchestration" },
      { id: "dacpolicy", icon: Activity, label: "DAC控制", path: "/frame/response/dac" },
    ],
  },
  { id: "evidence", icon: Terminal, label: "远程取证", path: "/frame/evidence" },
  { id: "reports", icon: FileText, label: "审计中心", path: "/frame/reports" },
  {
    id: "control",
    icon: Settings,
    label: "控制中心",
    submenu: [
      { id: "sensorconfig", icon: SlidersHorizontal, label: "传感器配置", path: "/frame/control/sensor" },
      { id: "controltask", icon: Timer, label: "任务配置", path: "/frame/control/task" },
    ],
  },
]
