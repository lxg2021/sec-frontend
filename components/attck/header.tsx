"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"
import type { AttckData, Severity } from "@/lib/attck-utils"
import { formatDateRange, countsFromSeverityEntries } from "@/lib/attck-utils"
import { Activity, Server, ShieldAlert, AlertTriangle, Clock } from "lucide-react"
import dayjs from "dayjs"

interface HeaderProps {
  data: AttckData
}

const colorMap: Record<Severity, { chip: string; bar: string }> = {
  高: { chip: "bg-red-100 text-red-700", bar: "bg-red-500" },
  中: { chip: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
  低: { chip: "bg-green-100 text-green-700", bar: "bg-green-500" },
}

function renderRange(rangeText: string) {
  try {
    const [startRaw, endRaw] = rangeText.split(" — ");
    if (!startRaw || !endRaw) throw new Error("Invalid time range format");

    const start = dayjs(startRaw).format("YYYY-MM-DD HH:mm");
    const end = dayjs(endRaw).format("YYYY-MM-DD HH:mm");

    return (
      <div className="mt-1 flex flex-col space-y-2 text-sm text-slate-800 dark:text-white">
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
          <span>开始 : {start}</span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
          <span>结束 : {end}</span>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error parsing time range:", error);
    return (
      <div
        className="mt-1 text-sm text-rose-600 dark:text-rose-400 italic"
        title="Invalid time format"
      >
        时间格式错误: {rangeText}
      </div>
    );
  }
}

export default function AttckHeader({ data }: HeaderProps) {
  const rangeText = formatDateRange(data.starttime, data.endtime)
  const sevCounts = countsFromSeverityEntries(data.severity)
  const total = (sevCounts["高"] ?? 0) + (sevCounts["中"] ?? 0) + (sevCounts["低"] ?? 0) || 1

  const segments: { key: Severity; value: number }[] = [
    { key: "高", value: sevCounts["高"] ?? 0 },
    { key: "中", value: sevCounts["中"] ?? 0 },
    { key: "低", value: sevCounts["低"] ?? 0 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 opacity-5 group-hover:opacity-10 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
            ATT&CK 技术
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600">
            <Activity className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">
              {data["attck-counts"]}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 opacity-5 group-hover:opacity-10 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
            受影响主机
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600">
            <Server className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent">
              {data["affected-hosts"]}
            </div>
          </div>
        </CardContent>
      </Card>


      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 opacity-5 group-hover:opacity-10 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
            风险等级
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-red-500">
            <AlertTriangle className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">总计 {total}</div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex mb-2">
            {segments.map((seg) => {
              const widthPct = `${Math.round((seg.value / total) * 100)}%`
              return (
                <div
                  key={seg.key}
                  className={`${colorMap[seg.key].bar}`}
                  style={{ width: widthPct }}
                  title={`${seg.key}: ${seg.value}`}
                />
              )
            })}
          </div>
          <div className="flex items-center justify-evenly w-full">
            {segments.map((seg) => (
              <span
                key={seg.key}
                className={`text-xs px-2 py-0.5 rounded-full ${colorMap[seg.key].chip}`}
                title={`${seg.key}: ${seg.value}`}
              >
                {seg.key} {seg.value}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-200 to-cyan-400 opacity-5 group-hover:opacity-10 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
            检测周期
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600">
            <Clock className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          {renderRange(rangeText)}
        </CardContent>
      </Card>

    </div>
  )
}
