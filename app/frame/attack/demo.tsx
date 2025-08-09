"use client"

import { useState } from "react"
import KibanaDatePicker from "@/components/kibana-date-picker"

interface DateRange {
  startTime: Date
  endTime: Date
}

export default function Demo() {
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null)

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range)
    console.log("Selected range:", range)
  }

  // 添加自定义快捷选项示例
  const customQuickOptions = [
    {
      label: "最近 5 分钟",
      value: "5m",
      getRange: () => {
        const now = new Date()
        return {
          startTime: new Date(now.getTime() - 5 * 60 * 1000),
          endTime: now,
        }
      },
    },
    {
      label: "最近 15 分钟",
      value: "15m",
      getRange: () => {
        const now = new Date()
        return {
          startTime: new Date(now.getTime() - 15 * 60 * 1000),
          endTime: now,
        }
      },
    },
    {
      label: "最近 1 小时",
      value: "1h",
      getRange: () => {
        const now = new Date()
        return {
          startTime: new Date(now.getTime() - 60 * 60 * 1000),
          endTime: now,
        }
      },
    },
    {
      label: "最近 6 小时",
      value: "6h",
      getRange: () => {
        const now = new Date()
        return {
          startTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          endTime: now,
        }
      },
    },
    {
      label: "今天",
      value: "today",
      getRange: () => {
        const now = new Date()
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        return {
          startTime: startOfDay,
          endTime: now,
        }
      },
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Kibana 风格时间选择器</h1>
        <p className="text-muted-foreground">分钟级精度的时间选择，参考 Kibana 设计风格</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">选择时间范围</label>
          <KibanaDatePicker onChange={handleRangeChange}  />
        </div>

        {/* 输出结果展示 */}
        {selectedRange && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold mb-2 text-sm">已选择的时间范围：</h3>
            <div className="space-y-1 text-xs">
              <div>
                <span className="font-medium">开始时间：</span> {selectedRange.startTime.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">结束时间：</span> {selectedRange.endTime.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">持续时间：</span>{" "}
                {Math.round((selectedRange.endTime.getTime() - selectedRange.startTime.getTime()) / 60000)} 分钟
              </div>
            </div>

            <details className="mt-3">
              <summary className="text-xs font-medium cursor-pointer">JSON 输出</summary>
              <pre className="text-xs bg-white p-2 rounded border mt-2 overflow-auto">
                {JSON.stringify(selectedRange, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* 使用示例 */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">功能特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-medium">快速选择</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 最近 5 分钟到 90 天</li>
              <li>• 一键选择</li>
              <li>• 自动刷新功能</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">自定义范围</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 分钟级精度</li>
              <li>• 日历 + 时间选择器</li>
              <li>• 验证规则</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
