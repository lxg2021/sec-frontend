import {
  Activity,
  AlertTriangle,
  BarChart,
  Boxes,
  Computer,
  FilePenLine,
  FileText,
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
} from "lucide-react"

export const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, labelKey: "dashboard", path: "/frame/dashboard" },
  {
    id: "computers",
    icon: Computer,
    labelKey: "computers",
    submenu: [
      { id: "approve", icon: Package, labelKey: "approve", path: "/frame/computers/approve" },
      { id: "agentinfo", icon: Monitor, labelKey: "agentinfo", path: "/frame/assets/host-info" },
    ],
  },
  {
    id: "assets",
    icon: Boxes,
    labelKey: "assets",
    submenu: [
      { id: "hardware", icon: Monitor, labelKey: "hardware", path: "/frame/assets/hardware" },
      { id: "softdetails", icon: Package, labelKey: "softdetails", path: "/frame/assets/software/details" },
    ],
  },
  {
    id: "baseline",
    icon: ShieldCheck,
    labelKey: "baseline",
    submenu: [
      { id: "baselinedashboard", icon: LayoutDashboard, labelKey: "baselinedashboard", path: "/frame/baseline" },
      { id: "baselinecustom", icon: FilePenLine, labelKey: "baselinecustom", path: "/frame/baseline/custom" },
      { id: "baselineconfig", icon: Settings2, labelKey: "baselineconfig", path: "/frame/baseline/rules" },
    ],
  },
  {
    id: "vulnerability",
    icon: AlertTriangle,
    labelKey: "vulnerability",
    path: "/frame/vulnerability",
    submenu: [
      { id: "patchdash", icon: ShieldCheck, labelKey: "patchdash", path: "/frame/vulnerability/dashboard" },
      { id: "patchinstall", icon: Package, labelKey: "patchinstall", path: "/frame/vulnerability/installtask" },
      { id: "patchstatus", icon: BarChart, labelKey: "patchstatus", path: "/frame/vulnerability/taskstatus" },
    ],
  },
  {
    id: "attack",
    icon: Target,
    labelKey: "attack",
    path: "/frame/attack",
    submenu: [
      { id: "attdash", icon: Sword, labelKey: "attdash", path: "/frame/attack/dashboard" },
      { id: "attdrill", icon: Activity, labelKey: "attdrill", path: "/frame/attack/drill" },
      { id: "attpositioning", icon: MapPin, labelKey: "attpositioning", path: "/frame/attack/positioning" },
    ],
  },
  {
    id: "response",
    icon: Shield,
    labelKey: "response",
    path: "/frame/response",
    submenu: [
      { id: "orchestration", icon: Sword, labelKey: "orchestration", path: "/frame/response/orchestration" },
      { id: "dacpolicy", icon: Activity, labelKey: "dacpolicy", path: "/frame/response/dac" },
    ],
  },
  { id: "evidence", icon: Terminal, labelKey: "evidence", path: "/frame/evidence" },
  { id: "reports", icon: FileText, labelKey: "reports", path: "/frame/reports" },
  {
    id: "control",
    icon: Settings,
    labelKey: "control",
    submenu: [
      { id: "sensorconfig", icon: SlidersHorizontal, labelKey: "sensorconfig", path: "/frame/control/sensor" },
      { id: "controltask", icon: Timer, labelKey: "controltask", path: "/frame/control/task" },
    ],
  },
]
