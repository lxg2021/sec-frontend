"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AttckData, Severity } from "@/lib/attck-utils"
import { formatDateRange, countsFromSeverityEntries } from "@/lib/attck-utils"
import { Activity, Server } from "lucide-react"

interface HeaderProps {
  data: AttckData
}

const colorMap: Record<Severity, { chip: string; bar: string }> = {
  高: { chip: "bg-red-100 text-red-700", bar: "bg-red-500" },
  中: { chip: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
  低: { chip: "bg-green-100 text-green-700", bar: "bg-green-500" },
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
    <header className="w-full">
      <div className="mb-4">  
        <p className="text-muted-foreground text-sm md:text-base mt-1">
          检测周期：{rangeText}（范围 {data.range}）
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-foreground/80" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">ATT&CK 技术</span>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1 font-medium">
              {data["attck-counts"]}
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-foreground/80" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">受影响主机</span>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1 font-medium">
              {data["affected-hosts"]}
            </Badge>
          </CardContent>
        </Card>

        {/* 替换“阶段（Stages）”为“风险等级” */}
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">风险等级</span>
              <span className="text-xs text-muted-foreground">总计 {total}</span>
            </div>
            {/* Segmented bar */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
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
            {/* Chips */}
            <div className="flex items-center gap-2 flex-wrap">
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
      </div>
    </header>
  )
}
