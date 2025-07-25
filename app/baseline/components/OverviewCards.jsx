"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export default function OverviewCards() {
  const overviewData = [
    {
      title: "合规率",
      value: "87.5%",
      change: "+2.3%",
      changeType: "positive",
      icon: Shield,
      color: "from-green-500 to-green-600",
      description: "整体安全基线合规率",
    },
    {
      title: "检查总数",
      value: "1,247",
      change: "+15",
      changeType: "neutral",
      icon: CheckCircle,
      color: "from-blue-500 to-blue-600",
      description: "已完成的基线检查项",
    },
    {
      title: "不合规项数",
      value: "156",
      change: "-8",
      changeType: "positive",
      icon: XCircle,
      color: "from-orange-500 to-orange-600",
      description: "需要整改的检查项",
    },
    {
      title: "高风险项数",
      value: "23",
      change: "-3",
      changeType: "positive",
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      description: "高风险安全问题",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {overviewData.map((item, index) => {
        const IconComponent = item.icon
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
                        : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.change}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
