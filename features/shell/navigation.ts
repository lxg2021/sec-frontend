import {
  Activity,
  AlertTriangle,
  BarChart,
  Box,
  Boxes,
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  Computer,
  FilePenLine,
  FileText,
  LayoutDashboard,
  List,
  Monitor,
  Package,
  Settings,
  Send,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sword,
  Target,
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
      { id: "baselineconfig", icon: Send, labelKey: "baselineconfig", path: "/frame/baseline/dispatch" },
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
      { id: "attdetail", icon: BarChart, labelKey: "attdetail", path: "/frame/attack/detail" },
      { id: "attworkflow", icon: ShieldCheck, labelKey: "attworkflow", path: "/frame/attack/workflow" },
      { id: "attdrill", icon: Activity, labelKey: "attdrill", path: "/frame/attack/drill" },
    ],
  },
  {
    id: "investigation",
    icon: Search,
    labelKey: "investigation",
    submenu: [
      { id: "forensicWorkbench", icon: Monitor, labelKey: "forensicWorkbench", path: "/frame/investigation/collection" },
      { id: "forensicTasks", icon: List, labelKey: "forensicTasks", path: "/frame/investigation/tasks" },
      { id: "forensicArtifacts", icon: Box, labelKey: "forensicArtifacts", path: "/frame/investigation/artifacts" },
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
  {
    id: "aiops",
    icon: BrainCircuit,
    labelKey: "aiops",
    submenu: [
      { id: "aithreat", icon: ChartNoAxesCombined, labelKey: "aithreat", path: "/frame/ai-ops/threat-analysis" },
      { id: "aioperations", icon: Bot, labelKey: "aioperations", path: "/frame/ai-ops/operations" },
    ],
  },
  {
    id: "iocAnalysis",
    icon: Search,
    labelKey: "iocAnalysis",
    submenu: [
      { id: "iocVerification", icon: ShieldCheck, labelKey: "iocVerification", path: "/frame/ioc-analysis/ioc-verification" },
    ],
  },
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
