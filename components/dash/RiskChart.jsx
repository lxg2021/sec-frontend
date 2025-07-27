"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"

export default function RiskChart() {
  const riskData = [
    { level: "低风险", count: 892, color: "from-green-400 to-green-500", percentage: 71.5 },
    { level: "中风险", count: 232, color: "from-yellow-400 to-yellow-500", percentage: 18.6 },
    { level: "高风险", count: 100, color: "from-orange-400 to-orange-500", percentage: 8.0 },
    { level: "严重", count: 23, color: "from-red-400 to-red-500", percentage: 1.9 },
  ]

  const total = riskData.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">风险等级分布</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">按风险等级统计检查项分布</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 饼图模拟 - 缩小尺寸 */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-700"
                />
                {riskData.map((item, index) => {
                  const prevPercentage = riskData.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0)
                  const circumference = 2 * Math.PI * 40
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`
                  const strokeDashoffset = -((prevPercentage / 100) * circumference)

                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      strokeWidth="8"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className={`bg-gradient-to-r ${item.color}`}
                      style={{
                        stroke: index === 0 ? "#10b981" : index === 1 ? "#f59e0b" : index === 2 ? "#f97316" : "#ef4444",
                      }}
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800 dark:text-white">{total}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">总检查项</div>
                </div>
              </div>
            </div>
          </div>

          {/* 图例和统计 - 更紧凑的布局 */}
          <div className="space-y-2">
            {riskData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`}
                    style={{
                      background:
                        index === 0 ? "#10b981" : index === 1 ? "#f59e0b" : index === 2 ? "#f97316" : "#ef4444",
                    }}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.level}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.count} 项</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white min-w-[2.5rem] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
