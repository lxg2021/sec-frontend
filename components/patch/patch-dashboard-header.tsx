import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, XCircle, Package, Lock, Flame, AlertCircle } from "lucide-react";
import type { PatchSummaryBySystemResponse } from "@/lib/patch-dashboard";
import { SystemType } from "@/lib/patch";

interface PatchDashboardHeaderProps {
  data: PatchSummaryBySystemResponse;
  selectedSystem: string;
}

const systemLabels = {
  [SystemType.WINDOWS]: "Windows",
  [SystemType.MACOS]: "macOS",
  [SystemType.LINUX]: "Linux",
};

interface OverviewItem {
  title: string;
  icon: React.ElementType;
  value: number;
  change: string;
  changeType: "positive" | "negative" | "neutral" | "warning"; // 新增 'warning' 类型
  description: string;
  color: string;
}

export function PatchDashboardHeader({ data, selectedSystem }: PatchDashboardHeaderProps) {
  const { total, summaries } = data;

  const getCurrentData = () => {
    const systemData = summaries.find((s) => s.system === selectedSystem);
    return systemData || total;
  };

  const currentData = getCurrentData();

  const overviewData: OverviewItem[] = [
    {
      title: "补丁总览",
      icon: Package,
      value: currentData.totalPatches,
      change: ``,
      changeType: "neutral",
      description: ``,
      color: "from-blue-500 to-blue-700",
    },
    {
      title: "已安装补丁",
      icon: Lock,
      value: currentData.installedPatches,
      change: `安装率 ${((currentData.installedPatches / currentData.totalPatches) * 100).toFixed(1)}%`,
      changeType: "positive",
      description: "",
      color: "from-green-500 to-green-700",
    },
    {
      title: "未安装补丁",
      icon: Flame,
      value: currentData.uninstalledPatches,
      change: `未安装率 ${((currentData.uninstalledPatches / currentData.totalPatches) * 100).toFixed(1)}%`,
      changeType: "negative",
      description: "",
      color: "from-red-500 to-red-700",
    },
    {
      title: "安装失败",
      icon: AlertCircle,
      value: currentData.failedPatches,
      change: `失败率 ${((currentData.failedPatches / currentData.totalPatches) * 100).toFixed(1)}%`,
      changeType: "warning",
      description: "",
      color: "from-orange-400 to-orange-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">补丁概览 - {systemLabels[selectedSystem as SystemType]}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewData.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-5 group-hover:opacity-10 transition-opacity`}
              />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color}`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{item.value}</div>
                  <div
                    className={`text-xs font-medium ${
                      item.changeType === "positive"
                        ? "text-green-600 dark:text-green-400"
                        : item.changeType === "negative"
                        ? "text-red-600 dark:text-red-400"
                        : item.changeType === "warning"
                        ? "text-orange-500 dark:text-orange-400" 
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {item.change}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
